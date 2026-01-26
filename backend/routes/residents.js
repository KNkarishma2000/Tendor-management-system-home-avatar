// backend/routes/residents.js
const express = require('express');
const router = express.Router();
const residentController = require('../controllers/residentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// PUBLIC
router.post('/register', residentController.registerResident);

// FIX: Changed authController to residentController
router.post('/send-resident-otp', residentController.sendResidentOTP); 

// ADMIN ONLY
router.get('/all', protect, authorize('ADMIN'), residentController.getAllResidents);
router.get('/pending', protect, authorize('ADMIN'), residentController.getPendingResidents);
router.put('/approve/:resident_id', protect, authorize('ADMIN'), residentController.approveResident);
router.delete('/delete/:resident_id', protect, authorize('ADMIN'), residentController.deleteResident);

module.exports = router;