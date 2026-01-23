// backend/routes/tenders.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer(); // Memory storage for Supabase

const { 
    createTender, 
    getAllTenders, 
    getTenderById,      // Add this
    updateTender,      // Add this
    deleteTender,
    getTenderFileUrl,
    uploadTenderDocuments 
} = require('../controllers/tenderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// UPDATED: Now accepts up to 5 files with the field name 'tender_documents'
router.get('/download', protect, getTenderFileUrl);
router.get('/', getAllTenders); 
router.get('/:id', getTenderById);
router.post(
    '/', 
    protect, 
    adminOnly, 
    upload.array('tender_documents', 5), 
    createTender
); 



router.get('/:id', protect, getTenderById);

// NEW: Update route (Edit)
// We use .array() again in case the user wants to upload new files during editing
router.put('/:id', protect, adminOnly, upload.array('tender_documents', 5), updateTender);

// NEW: Delete route
router.delete('/:id', protect, adminOnly, deleteTender);
// Keep this for adding documents to existing tenders later if needed
router.post(
    '/upload/:tender_id', 
    protect, 
    adminOnly, 
    upload.single('tender_document'), 
    uploadTenderDocuments
);

module.exports = router;