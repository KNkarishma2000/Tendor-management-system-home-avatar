const express = require('express');
const router = express.Router();
const multer = require('multer');
const adminCtrl = require('../controllers/adminCommunityController');
const resCtrl = require('../controllers/residentFeatureController');
const { protect, authorize } = require('../middleware/authMiddleware');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- 1. PUBLIC ROUTES (Main Website - No Token Required) ---
// These only show "is_approved: true" content
router.get('/my-submissions', protect, resCtrl.getMySubmissions);
router.get('/blogs/public', resCtrl.getApprovedBlogs);
router.get('/marketplace/public', resCtrl.getPublicMarketplace);
router.get('/gallery/public', resCtrl.getPublicGallery);
router.get('/blogs/public/:id', resCtrl.getBlogDetails);
// --- 2. RESIDENT DASHBOARD ROUTES (Requires Token) ---
// Gallery: Upload and View All (Approved/Pending/Rejected)
router.post('/gallery', protect, authorize('RESIDENT'), upload.array('photos', 10), resCtrl.uploadToGallery);
router.get('/gallery/feed', protect, authorize('RESIDENT'), resCtrl.getResidentGallery);

// Blogs: Create and View All Feed
router.post('/blogs', protect, authorize('RESIDENT'), upload.array('images', 5), resCtrl.createBlog);
router.get('/blogs/all', protect, resCtrl.getAllBlogs);

// Marketplace: Create and View Full Feed
router.post('/marketplace', protect, authorize('RESIDENT'), upload.single('image_path'), resCtrl.listMarketplaceItem);
// Change this line:
router.get('/marketplace/feed', protect, resCtrl.getResidentMarketplaceFeed);

// Shared Viewing
router.get('/carnivals', protect, adminCtrl.getAllCarnivals);
router.get('/notices', protect, adminCtrl.getAllNotices);
router.get('/carnivals/public', adminCtrl.getAllCarnivals);
router.get('/notices/public', adminCtrl.getAllNotices);
// --- 3. ADMIN ONLY ROUTES ---
router.post('/carnivals', protect, authorize('ADMIN'), adminCtrl.createCarnival);
router.post('/notices', protect, authorize('ADMIN'), adminCtrl.createNotice);
router.put('/moderate', protect, authorize('ADMIN'), resCtrl.moderateContent);
router.get('/admin/pending-content', protect, authorize('ADMIN'), resCtrl.getPendingContent);
router.delete('/notices/:id', protect, authorize('ADMIN'), adminCtrl.deleteNotice);
router.delete('/carnivals/:id', protect, authorize('ADMIN'), adminCtrl.deleteCarnival);

module.exports = router;