const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer(); // Memory storage for Supabase
const { awardTender, finalizeAward, getQualifiedBids } = require('../controllers/awardController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Existing Award routes
router.get('/comparison/:tender_id', protect, adminOnly, getQualifiedBids);
router.post('/award-winner', protect, adminOnly, awardTender);

// NEW: Finalize Award with LOI and Contract Upload
// Uses multer to handle 'loi_file' and 'contract_file' fields
router.put('/finalize/:award_id', 
    protect, 
    adminOnly, 
    upload.fields([
        { name: 'loi_file', maxCount: 1 }, 
        { name: 'contract_file', maxCount: 1 }
    ]), 
    finalizeAward
);

module.exports = router;