const express = require('express');
const router = express.Router();
const multer = require('multer');
const adminCtrl = require('../controllers/adminCommunityController');
const resCtrl = require('../controllers/residentFeatureController');
const { protect, authorize } = require('../middleware/authMiddleware');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- 1. PUBLIC ROUTES ---
router.get('/my-submissions', protect, resCtrl.getMySubmissions);
router.get('/blogs/public', resCtrl.getApprovedBlogs);
router.get('/marketplace/public', resCtrl.getPublicMarketplace);
router.get('/gallery/public', resCtrl.getPublicGallery);
router.get('/blogs/public/:id', resCtrl.getBlogDetails);

// --- 2. SHARED DASHBOARD ROUTES (Admin & Resident) ---

// Gallery: Admin & Resident can upload
router.post('/gallery', protect, authorize('RESIDENT', 'ADMIN'), upload.array('photos', 10), resCtrl.uploadToGallery);
router.get('/gallery/feed', protect, resCtrl.getResidentGallery);

// Blogs: Admin & Resident can post
router.post('/blogs', protect, authorize('RESIDENT', 'ADMIN'), upload.array('images', 5), resCtrl.createBlog);
router.get('/blogs/all', protect, resCtrl.getAllBlogs);

// Marketplace: Admin & Resident can list
router.post('/marketplace', protect, authorize('RESIDENT', 'ADMIN'), upload.single('image_path'), resCtrl.listMarketplaceItem);
router.get('/marketplace/feed', protect, resCtrl.getResidentMarketplaceFeed);

// Events & Notices Viewing
router.get('/carnivals', protect, adminCtrl.getAllCarnivals);
router.get('/notices', protect, adminCtrl.getAllNotices);
router.get('/carnivals/public', adminCtrl.getAllCarnivals);
router.get('/notices/public', adminCtrl.getAllNotices);

// --- 3. ADMIN ONLY ROUTES ---

// Notice/Carnival Management (Removed MC)
router.post('/carnivals', protect, authorize('ADMIN'), adminCtrl.createCarnival);
router.post('/notices', protect, authorize('ADMIN'), adminCtrl.createNotice);

// Content Moderation (Removed MC)
router.put('/moderate', protect, authorize('ADMIN'), resCtrl.moderateContent);
router.get('/admin/pending-content', protect, authorize('ADMIN'), resCtrl.getPendingContent);
// Shared Deletion (Security logic handled in Controller)
router.delete('/delete-content', protect, authorize('RESIDENT', 'ADMIN'), resCtrl.deleteContent);
// Deletion
router.delete('/notices/:id', protect, authorize('ADMIN'), adminCtrl.deleteNotice);
router.delete('/carnivals/:id', protect, authorize('ADMIN'), adminCtrl.deleteCarnival);

module.exports = router;