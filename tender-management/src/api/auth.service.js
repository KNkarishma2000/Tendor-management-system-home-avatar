import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api'; // Change to your production URL later

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

export const authAPI = {
  // Unified Login (Email or Flat No)
  login: (credentials) => apiClient.post('/auth/login', credentials),
  
  // Resident Specific Login
 
  
  // Register basic user
  register: (userData) => apiClient.post('/auth/register', userData),
  
  // Register Supplier (Full Profile)
  registerSupplier: (supplierData) => apiClient.post('/auth/register-supplier', supplierData),
  
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
    apiClient.post('/award/award-tender', { tender_id: tenderId, winning_bid_id: winningBidId }),

  // Finalize award with file uploads (LOI & Contract)
  // Note: For files, we use FormData
  finalizeAward: (awardId, formData) => 
    apiClient.put(`/award/finalize/${awardId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

export const tenderAPI = {
  // Get all qualified bids for a specific tender
  getQualifiedBids: (tenderId) => apiClient.get(`/award/qualified-bids/${tenderId}`),
  
};
// --- COMMUNITY & RESIDENT FEATURES ---

export const communityAPI = {
  // Carnivals
  getCarnivals: () => apiClient.get('/community/carnivals'),
  createCarnival: (data) => apiClient.post('/community/carnivals', data),

  // Notices
  getNotices: () => apiClient.get('/community/notices'),
  createNotice: (data) => apiClient.post('/community/notices', data),
deleteNotice: (id) => apiClient.delete(`/community/notices/${id}`),
  // Blogs (Resident Content)
  getBlogs: () => apiClient.get('/community/blogs/approved'),
  createBlog: (formData) => apiClient.post('/community/blogs', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Marketplace
  getMarketplace: () => apiClient.get('/community/marketplace/approved'),
  createMarketplaceItem: (formData) => apiClient.post('/community/marketplace', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Admin Moderation
  getPendingContent: () => apiClient.get('/community/admin/pending-content'),
  moderateContent: (moderationData) => apiClient.put('/community/moderate', moderationData),
};
export const BiddingTenderAPI = {
  // 1. Supplier: Submit a full Bid package
  // data should be a FormData object containing technical_bid, financial_bid, emd_proof, etc.
  submitBid: (formData) => apiClient.post('/bids/submit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // 2. Admin: Get all tech-qualified bids for comparison (L1 identification)
  getComparison: (tenderId) => apiClient.get(`/awards/comparison/${tenderId}`),

  // 3. Admin: Award Tender to a winner
  awardWinner: (tenderId, winningBidId) => 
    apiClient.post('/awards/award-winner', { tender_id: tenderId, winning_bid_id: winningBidId }),

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
export const authResidentAPI = {
  // Resident Registration
  registerResident: (data) => apiClient.post('/residents/register', data),
  
  // Supplier Registration (with files)
  registerSupplier: (formData) => apiClient.post('/suppliers/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Admin Management
  // Added this to fetch the full list for your directory
  getAllResidents: () => apiClient.get('/residents/all'), 

  getPendingResidents: () => apiClient.get('/residents/pending'),
  
  approveResident: (id, actionData) => apiClient.put(`/residents/approve/${id}`, actionData),

  // --- NEW: DELETE RESIDENT ---
  // Matches the backend route: router.delete('/delete/:resident_id'...)
  deleteResident: (id) => apiClient.delete(`/residents/delete/${id}`),
};
// --- TENDER & PROCUREMENT MANAGEMENT ---
// Inside your auth.service.js, update tenderAdminAPI to this:
export const tenderAdminAPI = {
  createTender: (formData) => apiClient.post('/tenders', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // ADD THIS LINE - This was the missing piece causing the redirect
  getTenderById: (id) => apiClient.get(`/tenders/${id}`), 

  uploadTenderDocuments: (tenderId, formData) => 
    apiClient.post(`/tenders/upload/${tenderId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  updateTender: (id, formData) => apiClient.put(`/tenders/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  deleteTender: (id) => apiClient.delete(`/tenders/${id}`),
  getTenderFileUrl: (path) => apiClient.get(`/tenders/download`, { params: { path } }),
  getAllTenders: () => apiClient.get('/tenders'),
};
// --- VENDOR PERFORMANCE ---

export const vendorAPI = {
  // Admin: Rate a vendor after project completion
  rateVendor: (ratingData) => apiClient.post('/vendors/rate', ratingData),
  
  // Potential future helper: Get vendor history
  getVendorPerformance: (supplierId) => apiClient.get(`/vendors/performance/${supplierId}`),
};
export default apiClient;