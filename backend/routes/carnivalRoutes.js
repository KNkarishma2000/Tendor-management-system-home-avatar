const express = require('express');
const router = express.Router();
const carnivalCtrl = require('../controllers/carnivalBidController');
const { protect, authorize } = require('../middleware/authMiddleware');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// 1. Submit Bid (Supplier Only)
// Expects: 'technical_doc' and 'financial_doc' files
router.post('/submit-bid', 
  protect, 
  authorize('SUPPLIER'), 
  upload.fields([{ name: 'technical_doc', maxCount: 1 }, { name: 'financial_doc', maxCount: 1 }]), 
  carnivalCtrl.submitCarnivalBid
);
router.get('/active', carnivalCtrl.getActiveCarnivals);

// 2. Check My Bid Status (Supplier Only)
router.get('/my-status/:carnival_id', 
  protect, 
  authorize('SUPPLIER'), 
  carnivalCtrl.getMyCarnivalBidStatus
);

// 3. Admin: Update Status (Approve/Reject)
router.put('/update-status', 
  protect, 
  authorize('ADMIN'), 
  carnivalCtrl.updateCarnivalBidStatus
);
// ... existing imports ...

// 1. Admin: Get details of one specific carnival + all its submitted bids
router.get('/admin/details/:id', 
  protect, 
  authorize('ADMIN'), 
  carnivalCtrl.getCarnivalBidsForAdmin
);

// 2. Admin: Update Status (Approve/Reject) - Already in your code
router.put('/update-status', 
  protect, 
  authorize('ADMIN'), 
  carnivalCtrl.updateCarnivalBidStatus
);

// ... rest of the file
module.exports = router;