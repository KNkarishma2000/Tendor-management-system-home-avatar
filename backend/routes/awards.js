const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer(); 
// Match the function name in your controller exactly: getComparison
const { awardTender, finalizeAward, getComparison } = require('../controllers/awardController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Use the corrected function name here
router.get('/comparison/:tender_id', protect, adminOnly, getComparison);

router.post('/award-winner', protect, adminOnly, awardTender);

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