const express = require('express');
const router = express.Router();
const multer = require('multer'); // IMPORTED MULTER
const adminCtrl = require('../controllers/adminCommunityController');
const resCtrl = require('../controllers/residentFeatureController');
const { protect, authorize } = require('../middleware/authMiddleware');

// --- MULTER SETUP ---
// Using memoryStorage so files are available as buffers for Supabase upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- ADMIN ONLY ROUTES ---
router.post('/carnivals', protect, authorize('ADMIN'), adminCtrl.createCarnival);
router.post('/notices', protect, authorize('ADMIN'), adminCtrl.createNotice);
router.put('/moderate', protect, authorize('ADMIN'), resCtrl.moderateContent);
// Add these lines in the --- ADMIN ONLY ROUTES --- section
router.delete('/notices/:id', protect, authorize('ADMIN'), adminCtrl.deleteNotice);
router.delete('/carnivals/:id', protect, authorize('ADMIN'), adminCtrl.deleteCarnival);
// --- RESIDENT ROUTES ---
// Added 'upload' here as well because Blogs and Marketplace also need to handle images
router.post(
  '/blogs', 
  protect, 
  authorize('RESIDENT'), 
  upload.array('images', 5), // Field name 'images', max 5 files
  resCtrl.createBlog
);

router.post(
  '/marketplace', 
  protect, 
  authorize('RESIDENT'), 
  upload.single('image_path'), // Field name 'image_path'
  resCtrl.listMarketplaceItem
);

// --- PUBLIC/RESIDENT VIEWING ---
router.get('/blogs/approved',  resCtrl.getApprovedBlogs);
router.get('/marketplace/approved',  resCtrl.getMarketplaceFeed);
router.get('/gallery/approved',  resCtrl.getApprovedGallery);

router.get('/admin/pending-content', protect, authorize('ADMIN'), resCtrl.getPendingContent);

// --- SHARED/VIEWER ROUTES ---
router.get('/marketplace-feed', protect, resCtrl.getMarketplaceFeed);

// Gallery Upload (Multiple photos allowed)
router.post(
  '/gallery', 
  protect, 
  authorize('RESIDENT'), 
  upload.array('photos', 10), // Field name 'photos', max 10 files
  resCtrl.uploadToGallery
);

// Public Gallery View


// --- VIEWING ROUTES (Open to all authenticated users) ---
router.get('/carnivals',  adminCtrl.getAllCarnivals);
router.get('/notices',  adminCtrl.getAllNotices);

module.exports = router;