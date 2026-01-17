const express = require('express');
const router = express.Router();
const { createMilestones } = require('../controllers/milestoneController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Define milestone setup route
router.post('/setup', protect, adminOnly, createMilestones);

module.exports = router;