import axios from 'axios';

const API_BASE_URL = 'http://palegreen-rhinoceros-358698.hostingersite.com/api'; // Change to your production URL later

// Create an instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Required for cookies/sessions
});

// Request Interceptor: Automatically attach Token if it exists in localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- API CATEGORIES ---
// --- CARNIVAL MANAGEMENT API ---
export const carnivalAPI = {
  // Public/Supplier: Get list of upcoming carnivals
  getActiveCarnivals: () => apiClient.get('/carnival/active'),
getCarnivalBidsAdmin: (id) => apiClient.get(`/carnival/admin/details/${id}`),
  
  // Admin: Get specific supplier full info for the popup
  getSupplierBrief: (id) => apiClient.get(`/admin/suppliers/${id}`),
  // Supplier: Submit a bid for a carnival stall
  // formData should contain: carnival_id, supplier_id, bid_amount, proposal_description, technical_doc, financial_doc
  submitCarnivalBid: (formData) => apiClient.post('/carnival/submit-bid', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Supplier: Check if they already bid and get status
  getMyBidStatus: (carnivalId) => apiClient.get(`/carnival/my-status/${carnivalId}`),

  // Admin: Update bid status (Approve/Reject)
  updateBidStatus: (bidId, status) => apiClient.put('/carnival/update-status', { bid_id: bidId, status }),
};
export const authAPI = {
  sendSupplierOTP: (data) => apiClient.post('/auth/send-supplier-otp', data),
  // Unified Login (Email or Flat No)
  login: (credentials) => apiClient.post('/auth/login', credentials),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),

  // ✅ NEW: Reset Password (Verify OTP & Update)
  resetPassword: (data) => apiClient.post('/auth/reset-password', data),
  // Resident Specific Login
 
  
  // Register basic user
register: (formData) => apiClient.post('/auth/register', formData),
  
  // Register Supplier (Full Profile)
  // Correct (Handles files and multi-table data)
registerSupplier: (formData) => apiClient.post('/auth/register-supplier', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
}),
  
  // Logout and clear session
  logout: () => apiClient.post('/auth/logout'),
  
  // Refresh access token
  refreshToken: () => apiClient.post('/auth/refresh-token'),
};

export const adminAPI = {
  // Approve or Reject a Supplier
  getAllSuppliers: () => apiClient.get('/admin/suppliers'),

  // NEW: Fetch full profile, financials, and signed doc URLs
  getSupplierDetails: (id) => apiClient.get(`/admin/suppliers/${id}`),

  // Existing approveSupplier
 
 approveSupplier: (supplierId, data) => 
    apiClient.put(`/admin/approve-supplier/${supplierId}`, data),
    
  // Award a tender to a specific bidder
  awardTender: (tenderId, winningBidId) => 
    apiClient.post('/awards/award-winner', { tender_id: tenderId, winning_bid_id: winningBidId }),

  // Finalize award with file uploads (LOI & Contract)
  // Note: For files, we use FormData
  finalizeAward: (awardId, formData) => 
    apiClient.put(`/award/finalize/${awardId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
};
export const supportAPI = {
  // For Residents/Suppliers to send messages
  sendQuery: (message) => apiClient.post('/chatsupport/send', { message }),

  // For Admin to see a list of users who messaged (Optional, depends on controller logic)
  getAdminInbox: () => apiClient.get('/chatsupport/admin/inbox'),

  // For both to get chat history
  getChatHistory: (userId = null) => {
    // If userId is passed, it uses the Admin-specific history route
    const url = userId ? `/chatsupport/admin/history/${userId}` : '/chatsupport/history';
    return apiClient.get(url);
  },

  // For Admin to reply
  adminReply: (targetUserId, message) => 
    apiClient.post('/chatsupport/admin/reply', { target_user_id: targetUserId, message }),
};
export const tenderAPI = {
  // Get all qualified bids for a specific tender
  getQualifiedBids: (tenderId) => apiClient.get(`/award/qualified-bids/${tenderId}`),
  
};
// --- COMMUNITY & RESIDENT FEATURES ---

export const communityAPI = {
  createMarketplaceItem: (formData) => apiClient.post('/community/marketplace', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteContent: (data) => apiClient.delete('/community/delete-content', { data }),
  deleteCarnival: (id) => apiClient.delete(`/community/carnivals/${id}`),
  createNotice: (data) => apiClient.post('/community/notices', data),
  getMySubmissions: () => apiClient.get('/community/my-submissions'),
  getAllBlogs: () => apiClient.get('/community/blogs/all'),
getNotices: () => apiClient.get('/community/notices/public'),
getBlogDetails: (id) => apiClient.get(`/community/blogs/public/${id}`),
  // Rename this or add the alias so the component can find it
  getApprovedBlogs: () => apiClient.get('/community/blogs/public'), 
  createBlog: (formData) => apiClient.post('/community/blogs', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  createCarnival: (formData) => apiClient.post('/community/carnivals', formData),
  // Keep the old one if other components use it, or just use the one above
  getBlogs: () => apiClient.get('/community/blogs/public'),

  getPublicMarketplace: () => apiClient.get('/community/marketplace/public'),
  getPublicGallery: () => apiClient.get('/community/gallery/public'),
  getCarnivals: () => apiClient.get('/community/carnivals/public'),   // ✅ ADD THIS

  getMarketplace: () => apiClient.get('/community/marketplace/feed'),
  getGallery: () => apiClient.get('/community/gallery/feed'),
deleteNotice: (id) => apiClient.delete(`/community/notices/${id}`),
  uploadToGallery: (formData) => apiClient.post('/community/gallery', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  getPendingContent: () => apiClient.get('/community/admin/pending-content'),
  moderateContent: (moderationData) => apiClient.put('/community/moderate', moderationData),
};

export const BiddingTenderAPI = {
  // 1. Supplier: Submit a full Bid package
  // data should be a FormData object containing technical_bid, financial_bid, emd_proof, etc.
 submitBid: (formData) => apiClient.post('/bids/submit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
getAllMyBids: () => apiClient.get('/bids/my-bids'),
  // 2. Admin: Get all tech-qualified bids for comparison (L1 identification)
  getComparison: (tenderId) => apiClient.get(`/awards/comparison/${tenderId}`),

  // 3. Admin: Award Tender to a winner
  awardWinner: (tenderId, winningBidId) => 
    apiClient.post('/awards/award-winner', { tender_id: tenderId, winning_bid_id: winningBidId }),
checkMyBidStatus: (tenderId) => apiClient.get(`/bids/my-status/${tenderId}`),
  // 4. Admin: Finalize Award (Upload LOI and Contract)
  // formData must contain 'loi_file' and 'contract_file'
  finalizeAward: (awardId, formData) => 
    apiClient.put(`/awards/finalize/${awardId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
};
// --- EVALUATION & PROJECT MANAGEMENT ---

export const evaluationAPI = {
  // 1. Get a signed URL to open the technical PDF safely
  viewTechnicalPDF: (bidId) => apiClient.get(`/evaluations/view-tech/${bidId}`),

  // 2. Submit score (automatically updates status to QUALIFIED or REJECTED)
  submitScore: (data) => apiClient.post('/evaluations/score-tech', data),
// ADD THESE TWO NEW METHODS FOR DOWNLOADING
  downloadTechnicalPDF: (bid_id) => apiClient.get(`/evaluations/download-tech/${bid_id}`),
  downloadFinancialPDF: (bid_id) => apiClient.get(`/evaluations/download-fin/${bid_id}`),
  // 3. Unlock and view Financials (Only works if status is TECH_QUALIFIED)
  viewFinancials: (bidId) => apiClient.get(`/evaluations/view-fin/${bidId}`),
};

export const projectAPI = {
  // Milestones
  setupMilestones: (tenderId, milestones) => 
    apiClient.post('/milestones/setup', { tender_id: tenderId, milestones }),

  // Payments
  recordPayment: (paymentData) => apiClient.post('/payments/record', paymentData),
};
// --- USER & AUTHENTICATION ---
// --- USER & AUTHENTICATION ---
// --- USER & AUTHENTICATION ---
export const authResidentAPI = {
  // Resident Registration
  registerResident: (data) => apiClient.post('/residents/register', data),
  
  // FIX: Ensure this path matches how you mounted the router in server.js
  sendOTP: (email) => apiClient.post('/residents/send-resident-otp', { email }),
  
  // ... rest of the code remains the same
  registerSupplier: (formData) => apiClient.post('/suppliers/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  getAllResidents: () => apiClient.get('/residents/all'), 
  getPendingResidents: () => apiClient.get('/residents/pending'),
  approveResident: (id, actionData) => apiClient.put(`/residents/approve/${id}`, actionData),
  deleteResident: (id) => apiClient.delete(`/residents/delete/${id}`),
};
// --- TENDER & PROCUREMENT MANAGEMENT ---
// Inside your auth.service.js, update tenderAdminAPI to this:
export const tenderAdminAPI = {
  createTender: (formData) => apiClient.post('/tenders', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // ADD THIS LINE - This was the missing piece causing the redirect

  uploadTenderDocuments: (tenderId, formData) => 
    apiClient.post(`/tenders/upload/${tenderId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  updateTender: (id, formData) => apiClient.put(`/tenders/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  deleteTender: (id) => apiClient.delete(`/tenders/${id}`),
 getTenderFileUrl: (path, fileName) => 
    apiClient.get('/tenders/download', { 
      params: { path, fileName } 
    }),

  getTenderById: (id) => apiClient.get(`/tenders/${id}`),
  getAllTenders: () => apiClient.get('/tenders'),
};
// --- VENDOR PERFORMANCE ---

export const vendorAPI = {
  // Post to /vendors/rate (Matches your backend router)
  rateVendor: (ratingData) => apiClient.post('/vendors/rate', ratingData),
  
  // Get history to show stars in the UI
  getVendorPerformance: (supplierId) => apiClient.get(`/vendors/performance/${supplierId}`),
};
// Add this or update tenderAdminAPI
export const publicTenderAPI = {
  // Anyone can call these
  getTenders: () => apiClient.get('/tenders'),
  getTenderDetails: (id) => apiClient.get(`/tenders/${id}`),
};
// --- FINANCE & DOCUMENT MANAGEMENT API ---
// --- FINANCE & DOCUMENT MANAGEMENT API ---
export const financeAPI = {
  processUpdatedAttendance: (data) => 
    apiClient.post('/drive/updated-attendance-process', data),

  // ✅ NEW: Fetch history for the updated attendance table
  getUpdatedAttendanceHistory: () => 
    apiClient.get('/drive/updated-attendance-history'),
  searchDrive: (searchTerm) => 
    apiClient.get('/drive/search', { params: { searchTerm } }),

  // Existing Attendance Sync
  processAttendanceSync: (data) => 
    apiClient.post('/drive/attendance-process', data),

  getAttendanceHistory: () => 
    apiClient.get('/drive/attendance-history'),

  // ✅ NEW: Process Raw Data (NEFT/POS/MyGate) to a single Excel
  // data should contain: { filename, neft_file, pos_file, mygate_file }
  processRawDataToExcel: (data) => 
    apiClient.post('/drive/raw-data-process', data),

  // ✅ NEW: Fetch the Raw Data export history for the "Attendance Sheets" table
  getRawDataHistory: () => 
    apiClient.get('/drive/raw-data-history'),
  // ✅ NEW: Invoice Extractor Routes
  // data should contain: { folder_name, folder_url }
  processInvoiceExtraction: (data) => 
    apiClient.post('/drive/invoice-extract', data),

  // Fetches history from 'invoice_extractions' table
  getInvoiceHistory: () => 
    apiClient.get('/drive/invoice-history'),
 // 1. Purchase Reconciliation
  processReconciliation: (data) => 
    apiClient.post('/drive/reconciliation-process', data),
  getReconciliationHistory: () => 
    apiClient.get('/drive/reconciliation-history'),

  // 2. Bank & POS Sync (Update these to match the new routes)
  processBankSync: (data) => 
    apiClient.post('/drive/bank-sync-process', data), // Matches new route

  getBankHistory: () => 
    apiClient.get('/drive/bank-sync-history'),
  // 6. ✅ NEW: Zoho vs Elemensor Mapping (30-min Process)
  processZohoVsElemensor: (data) => 
    apiClient.post('/drive/zoho-elemensor-process', data),
    
  getZohoVsElemensorHistory: () => 
    apiClient.get('/drive/zoho-elemensor-history'), // Matches new rout
};
// --- SUPPLIER SELF-SERVICE API ---
export const supplierAPI = {
  // Fetch own profile details for the "Edit Profile" page
  getProfile: () => apiClient.get('/suppliers/me'),

  // Update profile details (Handles text fields and file uploads)
  // formData should be a FormData() object
  updateProfile: (formData) => apiClient.put('/suppliers/update-profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};
export default apiClient;






