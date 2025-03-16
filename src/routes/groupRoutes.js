const express = require('express');
const { createGroup, getGroupMessages, getUserCreatedGroups, getUserJoinedGroups, addGroupMembers } = require('../controllers/groupController');
const auth = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, createGroup);
router.get('/messages/:groupId', auth, getGroupMessages);
router.get('/created', auth, getUserCreatedGroups); 
router.get('/joined', auth, getUserJoinedGroups);  
router.post('/:groupId/members', auth, addGroupMembers);

module.exports = router;