const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.set('io', io);

const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

app.use('/auth', require('./routes/authRoutes'));
app.use('/user', require('./routes/userRoutes'));
app.use('/chat', require('./routes/chatRoutes'));
app.use('/group', require('./routes/groupRoutes'));

const Message = require('./models/Message');
const Group = require('./models/Group');
const User = require('./models/User');

const onlineUsers = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', async (userId) => {
        socket.userId = userId;
        socket.join(userId);
        onlineUsers.set(userId, socket.id);
        await User.findByIdAndUpdate(userId, { status: 'online' });
        io.emit('userStatus', { userId, status: 'online' });
        console.log(`User ${userId} joined personal room`);
    });

    socket.on('joinGroup', (groupId) => {
        socket.join(groupId);
        console.log(`User ${socket.userId} joined group ${groupId}`);
    });

    socket.on('sendMessage', async ({ recipientId, content, fileUrl }) => {
        try {
            const message = await Message.create({
                sender: socket.userId,
                recipient: recipientId,
                content,
                fileUrl,
                timestamp: new Date(),
            });
            const populatedMessage = await Message.findById(message._id)
                .populate('sender', 'username name profilePicture status lastSeen');
            io.to(recipientId).emit('receiveMessage', populatedMessage);
            socket.emit('receiveMessage', populatedMessage);
            const messages = await Message.find({
                $or: [
                    { sender: socket.userId, recipient: recipientId },
                    { sender: recipientId, recipient: socket.userId },
                ],
            });
            io.to(recipientId).emit('messagesRead', { recipientId, messages });
        } catch (error) {
            console.error('Error sending personal message:', error);
            socket.emit('error', { message: error.message });
        }
    });

    socket.on('sendGroupMessage', async ({ groupId, content, fileUrl }) => {
        try {
            const group = await Group.findById(groupId);
            if (!group) throw new Error('Group not found');
            if (!group.members.includes(socket.userId)) throw new Error('User not in group');

            const message = await Message.create({
                sender: socket.userId,
                group: groupId,
                content,
                fileUrl,
                timestamp: new Date(),
            });
            const populatedMessage = await Message.findById(message._id)
                .populate('sender', 'username name profilePicture status lastSeen');
            await Group.findByIdAndUpdate(groupId, { lastMessage: message._id });
            io.to(groupId).emit('receiveGroupMessage', populatedMessage);
        } catch (error) {
            console.error('Error sending group message:', error);
            socket.emit('error', { message: error.message });
        }
    });

    socket.on('typing', ({ recipientId, groupId }) => {
        if (recipientId) {
            io.to(recipientId).emit('userTyping', { senderId: socket.userId });
        } else if (groupId) {
            io.to(groupId).emit('userTyping', { senderId: socket.userId, groupId });
        }
    });

    socket.on('stopTyping', ({ recipientId, groupId }) => {
        if (recipientId) {
            io.to(recipientId).emit('userStoppedTyping', { senderId: socket.userId });
        } else if (groupId) {
            io.to(groupId).emit('userStoppedTyping', { senderId: socket.userId, groupId });
        }
    });

    socket.on('disconnect', async () => {
        if (socket.userId) {
            onlineUsers.delete(socket.userId);
            await User.findByIdAndUpdate(socket.userId, {
                status: 'offline',
                lastSeen: new Date(),
            });
            io.emit('userStatus', { userId: socket.userId, status: 'offline' });
        }
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));