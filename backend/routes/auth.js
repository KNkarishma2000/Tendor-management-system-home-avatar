// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  registerSupplier, 
  refreshToken, 
  logout 
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/register-supplier', registerSupplier);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

module.exports = router;