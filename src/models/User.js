const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    bio: { type: String, default: '' },
    password: { type: String, required: true },
    profilePicture: { type: String, default: '' },
    contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['online', 'offline'], default: 'offline' }, // Optional
    lastSeen: { type: Date },
});

module.exports = mongoose.model('User', userSchema);