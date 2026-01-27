const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { protect, adminOnly } = require('../middleware/authMiddleware'); 

// --- USER & STAFF ROUTES ---
// This handles Residents, Suppliers, Accountants, and MC Members
router.post('/send', protect, chatController.sendUserQuery);
router.get('/history', protect, chatController.getChatHistory);

// --- ADMIN SPECIFIC ROUTES ---
// Admin Inbox: To see the list of everyone who has messaged
router.get('/admin/inbox', protect, adminOnly, chatController.getAdminInbox);

// Admin Reply: To send a message back to a specific user
router.post('/admin/reply', protect, adminOnly, chatController.adminReply);

// Admin History: To view the full conversation of a specific user
router.get('/admin/history/:userId', protect, adminOnly, chatController.getChatHistory);

module.exports = router;