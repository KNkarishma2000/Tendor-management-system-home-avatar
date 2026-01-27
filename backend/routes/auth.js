// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { 
  register, 
  login, 
  registerSupplier, 
  refreshToken,
  sendSupplierOTP,
  residentLogin,
  logout, 
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
router.post('/register', protect, adminOnly, register);
router.post('/login', login);

router.post('/register-supplier', upload.any(), registerSupplier);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
// New Password Reset Routes
router.post('/send-supplier-otp', sendSupplierOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
module.exports = router;