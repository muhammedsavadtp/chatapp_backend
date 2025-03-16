const express = require('express');
const { searchUsers, addContact, updateProfile, getUserProfile, getContacts } = require('../controllers/userController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();

router.get('/search', auth, searchUsers);
router.post('/add-contact', auth, addContact);
router.get('/profile', auth, getUserProfile);
router.put('/profile', auth, upload?.single('profilePicture'), updateProfile);
router.get('/contacts', auth, getContacts);


module.exports = router;