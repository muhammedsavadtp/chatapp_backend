const { default: mongoose } = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const Group = require('../models/Group');

// exports.getMessages = async (req, res) => {
//     const { recipientId } = req.params;
//     try {
//         const messages = await Message.find({
//             $or: [
//                 { sender: req.user.id, recipient: recipientId },
//                 { sender: recipientId, recipient: req.user.id },
//             ],
//         })
//             .populate('sender', 'username')
//             .sort({ timestamp: 1 });
//         res.json(messages);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };


// exports.getMessages = async (req, res) => {
//     try {
//         const { id } = req.params; // Could be userId or groupId
//         const currentUserId = req.user.id;

//         console.log(`Fetching messages for ID: ${id}, User: ${currentUserId}`);

//         // Ensure ID is treated as a string for comparison
//         const isGroup = await Group.findById(id);
//         let messages;

//         if (isGroup) {
//             messages = await Message.find({ group: id })
//                 .populate("sender", "username name profilePicture status lastSeen")
//                 .sort({ timestamp: 1 });
//             console.log(`Group chat query: { group: ${id} }, Found: ${messages.length}`);
//         } else {
//             messages = await Message.find({
//                 $or: [
//                     { sender: currentUserId, recipient: id },
//                     { sender: id, recipient: currentUserId },
//                 ],
//             })
//                 .populate("sender", "username name profilePicture status lastSeen")
//                 .populate("recipient", "username name profilePicture status lastSeen")
//                 .sort({ timestamp: 1 });
//             console.log(`Personal chat query: { sender: ${currentUserId}, recipient: ${id} } OR vice versa, Found: ${messages.length}`);
//         }

//         if (messages.length === 0) {
//             console.log("No messages found in database for this ID.");
//         }

//         res.json(messages);
//     } catch (error) {
//         console.error("Error in getMessages:", error);
//         res.status(500).json({ error: error.message });
//     }
// };

exports.getMessages = async (req, res) => {
    try {
        const { id } = req.params; // Could be userId or groupId
        const currentUserId = req.user.id;

        console.log(`Fetching messages for ID: ${id}, User: ${currentUserId}`);

        // Check if ID is a group
        const isGroup = await Group.findById(id);
        let messages;

        if (isGroup) {
            messages = await Message.find({ group: id })
                .populate("sender", "username name profilePicture status lastSeen")
                .sort({ timestamp: 1 });
            console.log(`Group chat query: { group: ${id} }, Found: ${messages.length}`);
        } else {
            messages = await Message.find({
                $or: [
                    { sender: currentUserId, recipient: id },
                    { sender: id, recipient: currentUserId },
                ],
            })
                .populate("sender", "username name profilePicture status lastSeen")
                .populate("recipient", "username name profilePicture status lastSeen")
                .sort({ timestamp: 1 });
            console.log(`Personal chat query: { sender: ${currentUserId}, recipient: ${id} } OR vice versa, Found: ${messages.length}`);
        }

        if (messages.length === 0) {
            console.log("No messages found in database for this ID.");
            // Debug: Check all messages for this ID
            const allMessages = await Message.find({
                $or: [{ sender: id }, { recipient: id }, { group: id }],
            });
            console.log(`All messages involving ${id}:`, allMessages);
        }

        res.json(messages);
    } catch (error) {
        console.error("Error in getMessages:", error);
        res.status(500).json({ error: error.message });
    }
};
exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        res.json({ fileUrl: `/uploads/${req.file.filename}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// exports.getUserChats = async (req, res) => {
//     try {
//         // Fetch the authenticated user's document with populated contacts
//         const currentUser = await User.findById(req.user.id)
//             .populate('contacts', 'username name profilePicture status lastSeen');

//         if (!currentUser || !currentUser.contacts) {
//             return res.json([]); // No contacts yet
//         }

//         // Fetch all messages involving the user for last message and unread count
//         const messages = await Message.find({
//             $or: [{ sender: req.user.id }, { recipient: req.user.id }],
//         })
//             .populate('sender', 'username name profilePicture status lastSeen')
//             .populate('recipient', 'username name profilePicture status lastSeen')
//             .sort({ timestamp: -1 });

//         // Map contacts to chat objects
//         const chats = {};
//         currentUser.contacts.forEach(contact => {
//             const contactId = contact._id.toString();

//             // Find the latest message with this contact (if any), with null checks
//             const latestMessage = messages.find(msg =>
//                 msg.sender && msg.recipient && (
//                     (msg.sender._id.toString() === contactId && msg.recipient._id.toString() === req.user.id) ||
//                     (msg.recipient._id.toString() === contactId && msg.sender._id.toString() === req.user.id)
//                 )
//             );

//             // Calculate unread count with null checks
//             const unreadCount = messages.filter(m =>
//                 m.recipient?._id?.toString() === req.user.id &&
//                 m.sender?._id?.toString() === contactId &&
//                 !m.read
//             ).length;

//             chats[contactId] = {
//                 id: contactId,
//                 name: contact.name || contact.username || 'Unknown',
//                 avatar: contact.profilePicture || '/api/placeholder/40/40',
//                 status: contact.status || 'offline',
//                 lastSeen: contact.lastSeen ? new Date(contact.lastSeen).toLocaleString() : 'N/A',
//                 lastMessage: latestMessage ? (latestMessage.content || (latestMessage.fileUrl ? 'File' : '')) : 'No messages yet',
//                 time: latestMessage ? latestMessage.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
//                 unread: unreadCount,
//             };
//         });

//         res.json(Object.values(chats));
//     } catch (error) {
//         console.error('Error in getUserChats:', error);
//         res.status(500).json({ error: error.message });
//     }
// };


exports.getUserChats = async (req, res) => {
    try {
        // Fetch the authenticated user's document with populated contacts
        const currentUser = await User.findById(req.user.id)
            .populate('contacts', 'username name profilePicture status lastSeen');

        if (!currentUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Fetch all groups where the user is a member
        const groups = await Group.find({ members: req.user.id })
            .populate('members', 'username name profilePicture status lastSeen');

        // Fetch all messages involving the user (personal and group)
        const messages = await Message.find({
            $or: [{ sender: req.user.id }, { recipient: req.user.id }, { group: { $in: groups.map(g => g._id) } },],
        })
            .populate('sender', 'username name profilePicture status lastSeen')
            .populate('recipient', 'username name profilePicture status lastSeen')
            .sort({ timestamp: -1 });

        // Map personal chats
        const chats = {};
        if (currentUser.contacts) {
            currentUser.contacts.forEach(contact => {
                const contactId = contact._id.toString();

                // Find the latest message for this contact
                const latestMessage = messages.find(msg =>
                    msg.sender && msg.recipient && (
                        (msg.sender._id.toString() === contactId && msg.recipient._id.toString() === req.user.id) ||
                        (msg.recipient._id.toString() === contactId && msg.sender._id.toString() === req.user.id)
                    )
                );

                // Calculate unread count for personal messages
                const unreadCount = messages.filter(m =>
                    m.recipient?._id?.toString() === req.user.id &&
                    m.sender?._id?.toString() === contactId &&
                    !m.read
                ).length;

                chats[contactId] = {
                    id: contactId,
                    name: contact.name || contact.username || 'Unknown',
                    avatar: contact.profilePicture || '/api/placeholder/40/40',
                    status: contact.status || 'offline',
                    lastSeen: contact.lastSeen ? new Date(contact.lastSeen).toISOString() : undefined,
                    lastMessage: latestMessage ? (latestMessage.content || (latestMessage.fileUrl ? 'File' : '')) : 'No messages yet',
                    time: latestMessage ? latestMessage.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                    unread: unreadCount,
                    type: 'personal', // Explicitly set as personal chat
                };
            });
        }

        // Map group chats
        groups.forEach(group => {
            const groupId = group._id.toString();

            // Find the latest message for this group
            const latestMessage = messages.find(msg =>
                msg.group && msg.group._id.toString() === groupId
            );

            // Calculate unread count for group messages
            const unreadCount = messages.filter(m =>
                m.group?._id?.toString() === groupId &&
                m.recipient?._id?.toString() !== req.user.id && // Exclude messages sent by the user
                !m.read
            ).length;

            chats[groupId] = {
                id: groupId,
                name: group.name || 'Unnamed Group',
                avatar: group.avatar || '/api/placeholder/40/40',
                status: 'group', // Status for groups can be a special value or omitted
                lastSeen: undefined, // Not applicable for groups
                lastMessage: latestMessage ? (latestMessage.content || (latestMessage.fileUrl ? 'File' : '')) : 'No messages yet',
                time: latestMessage ? latestMessage.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                unread: unreadCount,
                type: 'group', // Explicitly set as group chat
                members: group.members.map(member => ({
                    _id: member._id.toString(),
                    name: member.name || member.username || 'Unknown',
                    avatar: member.profilePicture || '/api/placeholder/40/40',
                    status: member.status || 'offline',
                    lastSeen: member.lastSeen ? new Date(member.lastSeen).toISOString() : undefined,
                })),
            };
        });

        res.json(Object.values(chats));
    } catch (error) {
        console.error('Error in getUserChats:', error);
        res.status(500).json({ error: error.message });
    }
};
exports.sendMessage = async (req, res) => {
    const { recipientId, content, fileUrl } = req.body;
    try {
        const message = new Message({
            sender: req.user.id,
            recipient: recipientId,
            content,
            fileUrl,
            status: 'Delivered', // Set initial status
        });
        await message.save();

        // Populate sender for response
        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'username name profilePicture');

        // Emit via socket.io
        const io = req.app.get('io'); // Assuming io is set in server.js
        io.to(recipientId).emit('receiveMessage', populatedMessage);

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: error.message });
    }
};

// exports.getMessages = async (req, res) => {
//     const { recipientId } = req.params;
//     try {
//         const messages = await Message.find({
//             $or: [
//                 { sender: req.user.id, recipient: recipientId },
//                 { sender: recipientId, recipient: req.user.id },
//             ],
//         })
//             .populate('sender', 'username name profilePicture')
//             .sort({ timestamp: 1 });

//         // Calculate unread count
//         const unreadCount = messages.filter(m => 
//             m.recipient.toString() === req.user.id && m.status === 'Delivered'
//         ).length;

//         res.json({ messages, unreadCount });
//     } catch (error) {
//         console.error('Error fetching messages:', error);
//         res.status(500).json({ error: error.message });
//     }
// };

exports.getMessages = async (req, res) => {
    try {
        const { id } = req.params; // Could be userId or groupId
        const currentUserId = req.user.id;

        // Check if the ID corresponds to a group
        const isGroup = await Group.findById(id);
        let messages;

        if (isGroup) {
            // Group chat: fetch messages where group field matches id
            messages = await Message.find({ group: id })
                .populate("sender", "username name profilePicture status lastSeen")
                .sort({ timestamp: 1 });
        } else {
            // Personal chat: fetch messages between current user and the recipient
            messages = await Message.find({
                $or: [
                    { sender: currentUserId, recipient: id },
                    { sender: id, recipient: currentUserId },
                ],
            })
                .populate("sender", "username name profilePicture status lastSeen")
                .populate("recipient", "username name profilePicture status lastSeen")
                .sort({ timestamp: 1 });
        }

        console.log(`Fetched ${messages.length} messages for ID ${id} (${isGroup ? "group" : "personal"})`);
        res.json(messages);
    } catch (error) {
        console.error("Error in getMessages:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.markMessagesAsRead = async (req, res) => {
    const { recipientId } = req.body;

    console.log('Request Body:', req.body);
    console.log('recipientId:', recipientId);
    console.log('req.user.id:', req.user.id);

    try {
        // Convert to ObjectId if valid
        const recipientObjectId = mongoose.Types.ObjectId.isValid(recipientId)
            ? new mongoose.Types.ObjectId(recipientId)
            : recipientId;
        const userObjectId = mongoose.Types.ObjectId.isValid(req.user.id)
            ? new mongoose.Types.ObjectId(req.user.id)
            : req.user.id;

        const query = {
            sender: recipientObjectId,
            recipient: userObjectId,
            status: 'Delivered',
        };
        console.log('Query:', JSON.stringify(query, null, 2));

        // Check matching messages
        const matchingMessages = await Message.find(query);
        console.log('Matching Messages Before Update:', matchingMessages.length, matchingMessages);

        // Update messages
        const updatedMessages = await Message.updateMany(
            query,
            { $set: { status: 'Read', read: true } } // Explicitly set both fields
        );
        console.log('Update Result:', updatedMessages);

        // Fetch updated messages
        const updated = await Message.find({
            $or: [
                { sender: userObjectId, recipient: recipientObjectId },
                { sender: recipientObjectId, recipient: userObjectId },
            ],
        }).populate('sender', 'username name profilePicture');
        console.log('Fetched Updated Messages:', updated.length);

        // Emit update via Socket.IO
        const io = req.app.get('io');
        if (io) {
            io.to(req.user.id).emit('messagesRead', { recipientId, messages: updated });
            io.to(recipientId).emit('messagesRead', { recipientId: req.user.id, messages: updated });
            console.log('Socket.IO event emitted to:', req.user.id, recipientId);
        } else {
            console.warn('Socket.IO instance not found. Real-time updates skipped.');
        }

        res.json({ message: 'Messages marked as read', modifiedCount: updatedMessages.modifiedCount });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.forwardMessage = async (req, res) => {
    const { messageId, recipientId } = req.body;
    try {
        const originalMessage = await Message.findById(messageId);
        if (!originalMessage) {
            return res.status(404).json({ error: 'Message not found' });
        }

        const forwardedMessage = new Message({
            sender: req.user.id,
            recipient: recipientId,
            content: originalMessage.content,
            fileUrl: originalMessage.fileUrl,
            status: 'Delivered',
        });
        await forwardedMessage.save();

        const populatedMessage = await Message.findById(forwardedMessage._id)
            .populate('sender', 'username name profilePicture');

        const io = req.app.get('io');
        io.to(recipientId).emit('receiveMessage', populatedMessage);

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error('Error forwarding message:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getAllContacts = async (req, res) => {
    try {
        // Fetch all users except the current user
        const allUsers = await User.find({ _id: { $ne: req.user.id } })
            .select('username name profilePicture status lastSeen');

        // Fetch messages to enrich with last message and unread count
        const messages = await Message.find({
            $or: [{ sender: req.user.id }, { recipient: req.user.id }],
        })
            .populate('sender', 'username name profilePicture status lastSeen')
            .populate('recipient', 'username name profilePicture status lastSeen')
            .sort({ timestamp: -1 });

        const chats = allUsers.map(contact => {
            const contactId = contact._id.toString();
            const latestMessage = messages.find(msg =>
                (msg.sender._id.toString() === contactId && msg.recipient._id.toString() === req.user.id) ||
                (msg.recipient._id.toString() === contactId && msg.sender._id.toString() === req.user.id)
            );
            const unreadCount = messages.filter(m =>
                m.recipient?._id?.toString() === req.user.id &&
                m.sender?._id?.toString() === contactId &&
                !m.read
            ).length;

            return {
                id: contactId,
                name: contact.name || contact.username || 'Unknown',
                avatar: contact.profilePicture || '/api/placeholder/40/40',
                status: contact.status || 'offline',
                lastSeen: contact.lastSeen ? new Date(contact.lastSeen).toLocaleString() : 'N/A',
                lastMessage: latestMessage ? (latestMessage.content || (latestMessage.fileUrl ? 'File' : '')) : 'No messages yet',
                time: latestMessage ? latestMessage.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
                unread: unreadCount,
            };
        });

        res.json(chats);
    } catch (error) {
        console.error('Error in getAllContacts:', error);
        res.status(500).json({ error: error.message });
    }
};




