// backend/routes/evaluations.js
const express = require('express');
const router = express.Router();
const { 
  viewTechnicalBid, 
  submitTechnicalScore, 
  viewFinancialBid 
} = require('../controllers/evaluationController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All evaluation steps require ADMIN role
router.get('/view-tech/:bid_id', protect, authorize('ADMIN'), viewTechnicalBid);
router.post('/score-tech', protect, authorize('ADMIN'), submitTechnicalScore);
router.get('/view-fin/:bid_id', protect, authorize('ADMIN'), viewFinancialBid);

module.exports = router;