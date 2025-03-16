const Message = require("../models/Message");
const User = require("../models/User");
const Group = require("../models/Group");
const mongoose = require("mongoose");

exports.getMessages = async (req, res) => {
  try {
    const { recipientId } = req.params; // Could be userId or groupId
    const currentUserId = req.user.id;

    console.log(
      `Fetching messages for ID: ${recipientId}, User: ${currentUserId}`
    );

    // Check if the ID corresponds to a group
    const isGroup = await Group.findById(recipientId);
    let messages;

    if (isGroup) {
      // Fetch group messages
      messages = await Message.find({ group: recipientId })
        .populate("sender", "username name profilePicture status lastSeen")
        .sort({ timestamp: 1 });
      // console.log(`Group chat query: { group: ${recipientId} }, Found: ${messages.length}`);
    } else {
      // Fetch personal messages
      messages = await Message.find({
        $or: [
          { sender: currentUserId, recipient: recipientId },
          { sender: recipientId, recipient: currentUserId },
        ],
      })
        .populate("sender", "username name profilePicture status lastSeen")
        .populate("recipient", "username name profilePicture status lastSeen")
        .sort({ timestamp: 1 });
      // console.log(`Personal chat query: { sender: ${currentUserId}, recipient: ${recipientId} } OR vice versa, Found: ${messages.length}`);
    }

    if (messages.length === 0) {
      // console.log('No messages found in database for this ID.');
    }

    res.json(messages);
  } catch (error) {
    console.error("Error in getMessages:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    res.json({ fileUrl: `/uploads/${req.file.filename}` });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getUserChats = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id).populate(
      "contacts",
      "username name profilePicture status lastSeen"
    );

    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const groups = await Group.find({ members: req.user.id }).populate(
      "members",
      "username name profilePicture status lastSeen"
    );

    const messages = await Message.find({
      $or: [
        { sender: req.user.id },
        { recipient: req.user.id },
        { group: { $in: groups.map((g) => g._id) } },
      ],
    })
      .populate("sender", "username name profilePicture status lastSeen")
      .populate("recipient", "username name profilePicture status lastSeen")
      .sort({ timestamp: -1 });

    const chats = {};

    // Map personal chats
    if (currentUser.contacts) {
      currentUser.contacts.forEach((contact) => {
        const contactId = contact._id.toString();
        const latestMessage = messages.find(
          (msg) =>
            msg.sender &&
            msg.recipient &&
            ((msg.sender._id.toString() === contactId &&
              msg.recipient._id.toString() === req.user.id) ||
              (msg.recipient._id.toString() === contactId &&
                msg.sender._id.toString() === req.user.id))
        );
        const unreadCount = messages.filter(
          (m) =>
            m.recipient?._id?.toString() === req.user.id &&
            m.sender?._id?.toString() === contactId &&
            !m.read
        ).length;

        chats[contactId] = {
          id: contactId,
          name: contact.name || contact.username || "Unknown",
          avatar: contact.profilePicture || "/api/placeholder/40/40",
          status: contact.status || "offline",
          lastSeen: contact.lastSeen
            ? new Date(contact.lastSeen).toISOString()
            : undefined,
          lastMessage: latestMessage
            ? latestMessage.content || (latestMessage.fileUrl ? "File" : "")
            : "No messages yet",
          time: latestMessage
            ? latestMessage.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
          unread: unreadCount,
          type: "personal",
        };
      });
    }

    // Map group chats
    groups.forEach((group) => {
      const groupId = group._id.toString();
      const latestMessage = messages.find(
        (msg) => msg.group && msg.group._id.toString() === groupId
      );
      const unreadCount = messages.filter(
        (m) =>
          m.group?._id?.toString() === groupId &&
          m.recipient?._id?.toString() !== req.user.id &&
          !m.read
      ).length;

      chats[groupId] = {
        id: groupId,
        name: group.name || "Unnamed Group",
        avatar: group.avatar || "/api/placeholder/40/40",
        status: "group",
        lastSeen: undefined,
        lastMessage: latestMessage
          ? latestMessage.content || (latestMessage.fileUrl ? "File" : "")
          : "No messages yet",
        time: latestMessage
          ? latestMessage.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
        unread: unreadCount,
        type: "group",
        members: group.members.map((member) => ({
          _id: member._id.toString(),
          name: member.name || member.username || "Unknown",
          avatar: member.profilePicture || "/api/placeholder/40/40",
          status: member.status || "offline",
          lastSeen: member.lastSeen
            ? new Date(member.lastSeen).toISOString()
            : undefined,
        })),
      };
    });

    res.json(Object.values(chats));
  } catch (error) {
    console.error("Error in getUserChats:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAllContacts = async (req, res) => {
  try {
    const allUsers = await User.find({ _id: { $ne: req.user.id } }).select(
      "username name profilePicture status lastSeen"
    );

    const messages = await Message.find({
      $or: [{ sender: req.user.id }, { recipient: req.user.id }],
    })
      .populate("sender", "username name profilePicture status lastSeen")
      .populate("recipient", "username name profilePicture status lastSeen")
      .sort({ timestamp: -1 });

    const chats = allUsers.map((contact) => {
      const contactId = contact._id.toString();
      const latestMessage = messages.find(
        (msg) =>
          (msg.sender._id.toString() === contactId &&
            msg.recipient._id.toString() === req.user.id) ||
          (msg.recipient._id.toString() === contactId &&
            msg.sender._id.toString() === req.user.id)
      );
      const unreadCount = messages.filter(
        (m) =>
          m.recipient?._id?.toString() === req.user.id &&
          m.sender?._id?.toString() === contactId &&
          !m.read
      ).length;

      return {
        id: contactId,
        name: contact.name || contact.username || "Unknown",
        avatar: contact.profilePicture || "/api/placeholder/40/40",
        status: contact.status || "offline",
        lastSeen: contact.lastSeen
          ? new Date(contact.lastSeen).toISOString()
          : undefined,
        lastMessage: latestMessage
          ? latestMessage.content || (latestMessage.fileUrl ? "File" : "")
          : "No messages yet",
        time: latestMessage
          ? latestMessage.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
        unread: unreadCount,
      };
    });

    res.json(chats);
  } catch (error) {
    console.error("Error in getAllContacts:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.markMessagesAsRead = async (req, res) => {
  const { recipientId } = req.body;

  try {
    const recipientObjectId = mongoose.Types.ObjectId.isValid(recipientId)
      ? new mongoose.Types.ObjectId(recipientId)
      : recipientId;
    const userObjectId = mongoose.Types.ObjectId.isValid(req.user.id)
      ? new mongoose.Types.ObjectId(req.user.id)
      : req.user.id;

    const updatedMessages = await Message.updateMany(
      {
        sender: recipientObjectId,
        recipient: userObjectId,
        status: "Delivered",
      },
      { $set: { status: "Read", read: true } }
    );

    const messages = await Message.find({
      $or: [
        { sender: userObjectId, recipient: recipientObjectId },
        { sender: recipientObjectId, recipient: userObjectId },
      ],
    }).populate("sender", "username name profilePicture");

    const io = req.app.get("io");
    if (io) {
      io.to(req.user.id).emit("messagesRead", { recipientId, messages });
      io.to(recipientId).emit("messagesRead", {
        recipientId: req.user.id,
        messages,
      });
    }

    res.json({
      message: "Messages marked as read",
      modifiedCount: updatedMessages.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.forwardMessage = async (req, res) => {
  const { messageId, recipientId } = req.body;
  try {
    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) {
      return res.status(404).json({ error: "Message not found" });
    }

    const forwardedMessage = new Message({
      sender: req.user.id,
      recipient: recipientId,
      content: originalMessage.content,
      fileUrl: originalMessage.fileUrl,
      status: "Delivered",
    });
    await forwardedMessage.save();

    const populatedMessage = await Message.findById(
      forwardedMessage._id
    ).populate("sender", "username name profilePicture");

    const io = req.app.get("io");
    io.to(recipientId).emit("receiveMessage", populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("Error forwarding message:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getMessages: exports.getMessages,
  uploadFile: exports.uploadFile,
  getUserChats: exports.getUserChats,
  getAllContacts: exports.getAllContacts,
  markMessagesAsRead: exports.markMessagesAsRead,
  forwardMessage: exports.forwardMessage,
};
