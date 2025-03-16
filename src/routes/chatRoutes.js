const express = require('express');
const { getMessages, uploadFile, getUserChats, getAllContacts, markMessagesAsRead, forwardMessage } = require('../controllers/chatController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();

router.get('/messages/:recipientId', auth, getMessages);
router.post('/upload', auth, upload.single('file'), uploadFile);
router.get('/user-chats', auth, getUserChats);
router.get('/all-contacts', auth, getAllContacts);
router.put('/messages/read', auth, markMessagesAsRead); 
router.post('/messages/forward', auth, forwardMessage); 

module.exports = router;