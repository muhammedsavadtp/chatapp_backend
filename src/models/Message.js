const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Null for group messages
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },   // Null for private messages
    content: { type: String },
    fileUrl: { type: String },
    timestamp: { type: Date, default: Date.now },
    status: { type: String, enum: ['Delivered', 'Read'], default: 'Delivered' }, // New field
    read: { type: Boolean, default: false },
});

module.exports = mongoose.model('Message', messageSchema);