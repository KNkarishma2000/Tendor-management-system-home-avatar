const express = require('express');
const router = express.Router();
const multer = require('multer');
const { submitBid,getMyBidStatus,getAllMyBids } = require('../controllers/bidController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Configure multer to store files in memory for processing
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * Updated Upload Configuration
 * Added 'emd_proof' to handle the EMD file required by Table 5 (bid_common_documents)
 */
const uploadFields = upload.fields([
  { name: 'technical_bid', maxCount: 1 },
  { name: 'financial_bid', maxCount: 1 },
  { name: 'emd_proof', maxCount: 1 } // Added for EMD Proof as per schema
]);

/**
 * Route: POST /api/bids/submit
 * Logic: 
 * 1. 'protect' ensures the user is logged in
 * 2. 'authorize' ensures only suppliers can bid
 * 3. 'uploadFields' parses the multi-part/form-data files
 * 4. 'submitBid' handles the database insertion for 5 tables
 */
router.post(
  '/submit', 
  protect, 
  authorize('SUPPLIER'), 
  uploadFields, 
  submitBid
);
router.get('/my-status/:tender_id', protect, getMyBidStatus);
// Correct: use the destructured function name directly
router.get('/my-bids', protect, getAllMyBids);
module.exports = router;