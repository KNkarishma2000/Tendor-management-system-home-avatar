// backend/routes/tenders.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer(); // Memory storage for Supabase
const { 
    createTender, 
    getAllTenders, 
    uploadTenderDocuments 
} = require('../controllers/tenderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Standard Tender Routes
router.post('/', protect, adminOnly, createTender); 
router.get('/', getAllTenders); 

// NEW: Document Upload Route
// URL: POST http://localhost:5000/api/tenders/upload/:tender_id
router.post(
    '/upload/:tender_id', 
    protect, 
    adminOnly, 
    upload.single('file'), // 'file' is the key you will use in Thunder Client
    uploadTenderDocuments
);

module.exports = router;