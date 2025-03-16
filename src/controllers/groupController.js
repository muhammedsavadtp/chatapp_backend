const Group = require('../models/Group');
const Message = require('../models/Message');


exports.createGroup = async (req, res) => {
    const { name, memberIds } = req.body;
    try {
        const group = new Group({ name, members: [req.user.id, ...memberIds], createdBy: req.user.id });
        await group.save();
        res.status(201).json(group);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getGroupMessages = async (req, res) => {
    const { groupId } = req.params;
    try {
        const messages = await Message.find({ group: groupId })
            .populate('sender', 'username')
            .sort({ timestamp: 1 });
        res.json(messages);
      
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getUserCreatedGroups = async (req, res) => {
    try {
        const groups = await Group.find({ createdBy: req.user.id })
            .populate('members', 'username')
            .populate('lastMessage', 'content timestamp');
        res.json(groups);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getUserJoinedGroups = async (req, res) => {
    try {
        const groups = await Group.find({ members: req.user.id })
            .populate('members', 'username')
            .populate('lastMessage', 'content timestamp');
        res.json(groups);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.addGroupMembers = async (req, res) => {
    const { groupId } = req.params;
    const { memberIds } = req.body;
    try {
        const group = await Group.findById(groupId);
        if (group.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Only the creator can add members' });
        }
        group.members = [...new Set([...group.members, ...memberIds])]; // Avoid duplicates
        await group.save();
        res.json(group);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};