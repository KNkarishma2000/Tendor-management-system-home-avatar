const express = require('express');
const router = express.Router();
const multer = require('multer');
const { submitBid } = require('../controllers/bidController');
const { protect, authorize } = require('../middleware/authMiddleware'); // Import protection

const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadFields = upload.fields([
  { name: 'technical_bid', maxCount: 1 },
  { name: 'financial_bid', maxCount: 1 }
]);

// Protect the route: Only logged-in SUPPLIERS can submit
router.post('/submit', protect, authorize('SUPPLIER'), uploadFields, submitBid);

module.exports = router;