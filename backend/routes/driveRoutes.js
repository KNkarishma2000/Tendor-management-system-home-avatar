const express = require('express');
const router = express.Router();
const { 
  searchDriveFiles, 
  processAttendanceSync, 
  getAttendanceHistory ,
  processRawDataToExcel, // <--- Import this
  getRawDataHistory,
  processInvoiceExtraction,
  getInvoiceHistory,
 processBankSync,
   getBankHistory,
   processReconciliation,
   getReconciliationHistory,
   processZohoVsElemensor,    // <--- IMPORT THIS
  getZohoVsElemensorHistory
} = require('../controllers/drive.controller');

// Search Drive Files
router.get('/search', searchDriveFiles);

// Process and Save Attendance (The one that calls n8n)
router.post('/attendance-process', processAttendanceSync);

// Fetch permanent history from DB
router.get('/attendance-history', getAttendanceHistory);
router.post('/raw-data-process', processRawDataToExcel);

// New: Fetch Raw Data export history
router.get('/raw-data-history', getRawDataHistory);
// 4. INVOICE FOLDER EXTRACTOR (NEW)
// Route to trigger the n8n Invoice extraction webhook
router.post('/invoice-extract', processInvoiceExtraction);
// --- Purchase Reconciliation ---
router.post('/reconciliation-process', processReconciliation);
router.get('/reconciliation-history', getReconciliationHistory);

// --- Bank & POS Sync (Change the URLs here) ---
router.post('/bank-sync-process', processBankSync); // Changed URL
router.get('/bank-sync-history', getBankHistory);   // Changed URL
router.get('/invoice-history', getInvoiceHistory);
// 7. Zoho vs Elemensor Mapping (The 30-min process)
router.post('/zoho-elemensor-process', processZohoVsElemensor);
router.get('/zoho-elemensor-history', getZohoVsElemensorHistory);
module.exports = router;