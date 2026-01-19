const express = require('express');
const router = express.Router();
const multer = require('multer');
const supplierController = require('../controllers/supplierController');

// Configure multer to hold files in memory temporarily
const upload = multer({ storage: multer.memoryStorage() });

// Use upload.any() to accept all files sent via form-data
router.post('/register', upload.any(), supplierController.registerSupplierProfile);

module.exports = router;