const express = require('express');
const {
    createGroup,
    getGroupMessages,
    getUserCreatedGroups,
    getUserJoinedGroups,
    addGroupMembers,
    updateGroupName,
    deleteGroup,
    removeGroupMember,
    addGroupAdmin,
} = require('../controllers/groupController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, createGroup);
router.get('/messages/:groupId', auth, getGroupMessages);
router.get('/created', auth, getUserCreatedGroups);
router.get('/joined', auth, getUserJoinedGroups);
router.post('/:groupId/members', auth, addGroupMembers);
router.put('/:groupId/name', auth, updateGroupName); // New: Edit group name
router.delete('/:groupId', auth, deleteGroup); // New: Delete group
router.delete('/:groupId/members/:memberId', auth, removeGroupMember); // New: Remove member
router.post('/:groupId/admins', auth, addGroupAdmin); // New: Add admin

module.exports = router;