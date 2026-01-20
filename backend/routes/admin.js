// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const { 
    approveSupplier,
    getAllSuppliers, 
    getSupplierDetails
} = require('../controllers/adminController');

// IMPORT THESE MIDDLEWARES
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Dashboard: Get simple list of all suppliers
router.get('/suppliers', protect, adminOnly, getAllSuppliers);

// Profile: Get full details, financials, and document links for one supplier
router.get('/suppliers/:supplier_id', protect, adminOnly, getSupplierDetails);

// Action: Approve or Reject a supplier
router.put('/approve-supplier/:supplier_id', protect, adminOnly, approveSupplier);

module.exports = router;