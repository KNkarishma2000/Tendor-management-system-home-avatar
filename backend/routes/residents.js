const express = require('express');
const router = express.Router();
const residentController = require('../controllers/residentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const residentFeatures = require('../controllers/residentFeatureController');
// PUBLIC
router.post('/register', residentController.registerResident);

// ADMIN ONLY
router.get('/all', protect, authorize('ADMIN'), residentController.getAllResidents);
router.get('/pending', protect, authorize('ADMIN'), residentController.getPendingResidents);
router.put('/approve/:resident_id', protect, authorize('ADMIN'), residentController.approveResident);
// Add this line to your existing admin routes
router.delete('/delete/:resident_id', protect, authorize('ADMIN'), residentController.deleteResident);
module.exports = router;