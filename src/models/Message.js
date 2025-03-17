const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },  
    content: { type: String },
    fileUrl: { type: String },
    timestamp: { type: Date, default: Date.now },
    status: { type: String, enum: ['Delivered', 'Read'], default: 'Delivered' },
    read: { type: Boolean, default: false }, 
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

module.exports = mongoose.model('Message', messageSchema);