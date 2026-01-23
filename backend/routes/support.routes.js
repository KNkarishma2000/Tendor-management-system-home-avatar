const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');

// Import the correct names from your auth middleware
const { protect, adminOnly } = require('../middleware/authMiddleware'); 

// --- USER ROUTES (Residents & Suppliers) ---
// Using 'protect' instead of 'verifyToken'
router.post('/send', protect, chatController.sendUserQuery);
router.get('/history', protect, chatController.getChatHistory);

// --- ADMIN ROUTES ---
// Using 'protect' and 'adminOnly' instead of 'isAdmin'
router.post('/admin/reply', protect, adminOnly, chatController.adminReply);
router.get('/admin/history/:userId', protect, adminOnly, chatController.getChatHistory);
// Add this line to your ADMIN ROUTES section
router.get('/admin/inbox', protect, adminOnly, chatController.getAdminInbox);
module.exports = router;