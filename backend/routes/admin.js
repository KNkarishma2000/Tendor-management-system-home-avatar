// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const { approveSupplier } = require('../controllers/adminController');

// Route for approving/rejecting suppliers
router.put('/approve-supplier/:supplier_id', approveSupplier);

module.exports = router;