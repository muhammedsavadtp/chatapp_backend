const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    avatar: { type: String },
    name: { type: String, required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
});

module.exports = mongoose.model('Group', groupSchema);