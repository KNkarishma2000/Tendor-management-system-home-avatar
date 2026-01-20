// backend/routes/evaluations.js
const express = require('express');
const router = express.Router();
const { 
  viewTechnicalBid, 
  downloadTechnicalBid,  // Added this
  downloadFinancialBid,
  submitTechnicalScore, 
  viewFinancialBid 
} = require('../controllers/evaluationController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All evaluation steps require ADMIN role
router.get('/view-tech/:bid_id', protect, authorize('ADMIN'), viewTechnicalBid);
router.post('/score-tech', protect, authorize('ADMIN'), submitTechnicalScore);
router.get('/view-fin/:bid_id', protect, authorize('ADMIN'), viewFinancialBid);
router.get('/download-tech/:bid_id', protect, authorize('ADMIN'), downloadTechnicalBid);
router.get('/download-fin/:bid_id', protect, authorize('ADMIN'), downloadFinancialBid);  // Reuse viewFinancialBid or create downloadFinancialBid
module.exports = router;