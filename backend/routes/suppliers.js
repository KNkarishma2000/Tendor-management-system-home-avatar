const express = require('express');
const router = express.Router();
const multer = require('multer');
const supplierController = require('../controllers/supplierController');

// Configure multer to hold files in memory temporarily
const upload = multer({ storage: multer.memoryStorage() });

// Use upload.any() to accept all files sent via form-data
router.post('/register', upload.any(), supplierController.registerSupplierProfile);
const { protect } = require('../middleware/authMiddleware'); // Assuming you have an auth middleware

router.put(
  '/update-profile', 
  protect,           // Ensures only the logged-in supplier can access this
  upload.any(),      // Handles new/updated document uploads
  supplierController.updateSupplierProfile
);
// Add this route to your existing routes file
router.get(
  '/me', 
  protect, 
  supplierController.getSupplierProfile
);
module.exports = router;