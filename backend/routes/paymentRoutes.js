const express = require('express');
const router = express.Router();
const { recordPayment } = require('../controllers/paymentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Route to record a new payment (Admin only)
router.post('/record', protect, adminOnly, recordPayment);

module.exports = router;