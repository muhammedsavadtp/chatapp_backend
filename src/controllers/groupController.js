const Group = require("../models/Group");
const Message = require("../models/Message");
const User = require("../models/User");
// const mongoose = require("mongoose");

exports.createGroup = async (req, res) => {
  const { name, memberIds } = req.body;
  try {
    // Combine creator's ID with memberIds and deduplicate
    const allMemberIds = [req.user.id, ...memberIds.map((id) => id.toString())];
    const uniqueMemberIds = [...new Set(allMemberIds)]; // Remove duplicates

    // Validate that all member IDs exist
    const validMembers = await User.find({ _id: { $in: uniqueMemberIds } });
    if (validMembers.length !== uniqueMemberIds.length) {
      return res
        .status(400)
        .json({ error: "One or more member IDs are invalid" });
    }

    const group = new Group({
      name,
      members: uniqueMemberIds,
      admins: [req.user.id], // Creator is an admin by default
      createdBy: req.user.id,
    });
    await group.save();
    const populatedGroup = await Group.findById(group._id)
      .populate("members", "username name profilePicture status lastSeen")
      .populate("admins", "username name");
    res.status(201).json(populatedGroup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getGroupMessages = async (req, res) => {
  const { groupId } = req.params;
  try {
    const messages = await Message.find({ group: groupId })
      .populate("sender", "username name profilePicture status lastSeen")
      .sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserCreatedGroups = async (req, res) => {
  try {
    const groups = await Group.find({ createdBy: req.user.id })
      .populate("members", "username name profilePicture status lastSeen")
      .populate("admins", "username name")
      .populate("lastMessage", "content timestamp");
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserJoinedGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id })
      .populate("members", "username name profilePicture status lastSeen")
      .populate("admins", "username name")
      .populate("lastMessage", "content timestamp");
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
    if (!group.admins.includes(req.user.id)) {
      return res.status(403).json({ error: "Only admins can add members" });
    }

    const existingMembers = group.members.map((id) => id.toString());
    const newMembers = memberIds.map((id) => id.toString());

    // Combine and deduplicate
    const updatedMembers = [...new Set([...existingMembers, ...newMembers])];

    group.members = updatedMembers;

    await group.save();
    const updatedGroup = await Group.findById(groupId)
      .populate("members", "username name profilePicture status lastSeen")
      .populate("admins", "username name");
    res.json(updatedGroup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateGroupName = async (req, res) => {
  const { groupId } = req.params;
  const { name } = req.body;
  try {
    const group = await Group.findById(groupId);
    if (!group.admins.includes(req.user.id)) {
      return res.status(403).json({ error: "Only admins can edit group name" });
    }
    group.name = name;
    await group.save();
    const updatedGroup = await Group.findById(groupId)
      .populate("members", "username name profilePicture status lastSeen")
      .populate("admins", "username name");
    res.json(updatedGroup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteGroup = async (req, res) => {
  const { groupId } = req.params;
  try {
    const group = await Group.findById(groupId);
    if (group.createdBy.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Only the creator can delete the group" });
    }
    await Group.deleteOne({ _id: groupId });
    await Message.deleteMany({ group: groupId }); // Delete group messages
    res.json({ message: "Group deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.removeGroupMember = async (req, res) => {
  const { groupId, memberId } = req.params;
  try {
    const group = await Group.findById(groupId);
    if (!group.admins.includes(req.user.id)) {
      return res.status(403).json({ error: "Only admins can remove members" });
    }
    if (group.createdBy.toString() === memberId) {
      return res.status(403).json({ error: "Cannot remove the group creator" });
    }
    group.members = group.members.filter((m) => m.toString() !== memberId);
    group.admins = group.admins.filter((a) => a.toString() !== memberId); // Remove admin privilege 
    await group.save();
    const updatedGroup = await Group.findById(groupId)
      .populate("members", "username name profilePicture status lastSeen")
      .populate("admins", "username name");
    res.json(updatedGroup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addGroupAdmin = async (req, res) => {
  const { groupId } = req.params;
  const { memberId } = req.body;
  try {
    const group = await Group.findById(groupId);
    if (!group.admins.includes(req.user.id)) {
      return res
        .status(403)
        .json({ error: "Only admins can add other admins" });
    }
    if (!group.members.includes(memberId)) {
      return res
        .status(400)
        .json({ error: "User must be a group member to be an admin" });
    }
    if (!group.admins.includes(memberId)) {
      group.admins.push(memberId);
      await group.save();
    }
    const updatedGroup = await Group.findById(groupId)
      .populate("members", "username name profilePicture status lastSeen")
      .populate("admins", "username name");
    res.json(updatedGroup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
