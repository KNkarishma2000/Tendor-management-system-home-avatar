const express = require('express');
const router = express.Router();
const { rateVendor } = require('../controllers/vendorController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Route to rate vendor performance (Only for Admins/Evaluators)
router.post('/rate', protect, adminOnly, rateVendor);

module.exports = router;