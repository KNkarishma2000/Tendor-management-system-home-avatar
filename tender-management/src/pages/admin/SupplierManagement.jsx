import React, { useState, useEffect } from 'react';
import { adminAPI, vendorAPI } from '../../api/auth.service';
import toast, { Toaster } from 'react-hot-toast';
import { 
  Users, Search, CheckCircle, XCircle, Clock, Building2, 
  Phone, Mail, FileText, Download, Landmark, ShieldCheck, 
  ChevronRight, AlertTriangle, Star, X, MapPin, Briefcase, ArrowLeft
} from 'lucide-react';

const SupplierDirectory = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState({ status: '', id: '' });

  // Rating States
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [isRatingLoading, setIsRatingLoading] = useState(false);
  const [ratingData, setRatingData] = useState({ rating: 5, feedback: '', tender_id: '' });
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await adminAPI.getAllSuppliers();
      setSuppliers(response.data.data);
    } catch (error) {
      toast.error("Failed to load directory");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id) => {
    try {
      const response = await adminAPI.getSupplierDetails(id);
      setSelectedSupplier(response.data.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      toast.error("Failed to load supplier details");
    }
  };

  const handleUpdateStatus = async () => {
    const { status, id } = pendingAction;
    const loadingToast = toast.loading(`Updating...`);
    try {
      const adminId = JSON.parse(localStorage.getItem('user'))?.id;
      await adminAPI.approveSupplier(id, { 
        status, admin_id: adminId, 
        remarks: `Supplier ${status.toLowerCase()} by admin.` 
      });
      toast.success(`Supplier ${status.toLowerCase()}!`, { id: loadingToast });
      setIsModalOpen(false);
      fetchSuppliers();
      handleViewDetails(id); 
    } catch (error) {
      toast.error("Update failed", { id: loadingToast });
    }
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    setIsRatingLoading(true);
    try {
      await vendorAPI.rateVendor({
        supplier_id: selectedSupplier.id,
        rating: ratingData.rating,
        feedback: ratingData.feedback
      });
      toast.success("Rating submitted!");
      setShowRatingModal(false);
      setRatingData({ rating: 5, feedback: '', tender_id: '' });
    } catch (error) {
      toast.error("Failed to rate");
    } finally {
      setIsRatingLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-50 text-green-700 border-green-100';
      case 'REJECTED': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-yellow-50 text-yellow-700 border-yellow-100';
    }
  };

  // --- HELPER TO GET BANK DATA SAFELY ---
 const getBankDetail = (field) => {
    if (!selectedSupplier) return 'N/A';
    
    // 1. Check if we flattened it in the backend (bank_details)
    // 2. Check the raw array (supplier_financials[0])
    const financial = selectedSupplier.bank_details || selectedSupplier.supplier_financials?.[0];
    
    // Ensure the field exists on that object
    return financial && financial[field] ? financial[field] : 'N/A';
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      <Toaster position="top-right" />

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-black mb-4">Are you sure?</h3>
            <div className="flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 rounded-2xl bg-gray-100 font-bold">Cancel</button>
              <button onClick={handleUpdateStatus} className="flex-1 py-4 rounded-2xl bg-black text-white font-bold">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setShowRatingModal(false)} className="absolute top-8 right-8 text-gray-400"><X /></button>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-black tracking-tighter uppercase">Vendor Rating</h3>
              <p className="text-gray-500 font-bold">How was your experience with {selectedSupplier?.company_name}?</p>
            </div>

            <form onSubmit={handleRatingSubmit} className="space-y-6">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRatingData({...ratingData, rating: star})}
                    className="transition-transform active:scale-90"
                  >
                    <Star 
                      size={40} 
                      className={`${(hoverRating || ratingData.rating) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} transition-colors`} 
                    />
                  </button>
                ))}
              </div>

              <textarea 
                required
                className="w-full bg-gray-50 border-none rounded-2xl p-5 font-bold h-32 focus:ring-2 ring-yellow-400"
                placeholder="Describe their performance..."
                onChange={(e) => setRatingData({...ratingData, feedback: e.target.value})}
              />

              <button 
                type="submit" 
                disabled={isRatingLoading}
                className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:opacity-90"
              >
                {isRatingLoading ? "Processing..." : "Submit Review"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 pt-10">
        
        {!selectedSupplier ? (
          <div className="animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
              <div>
                <h1 className="text-5xl font-black tracking-tighter text-neutral-900 flex items-center gap-4">
                  <ShieldCheck className="w-12 h-12 text-yellow-500" />
                  DIRECTORY
                </h1>
                <p className="text-neutral-500 font-bold mt-1 uppercase tracking-widest text-xs">Verified Ecosystem Partners</p>
              </div>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Search companies..." 
                  className="w-full pl-14 pr-6 py-5 bg-white rounded-[2rem] border-none shadow-sm font-bold focus:ring-2 ring-yellow-400"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suppliers
                .filter(s => s.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((s) => (
                  <div 
                    key={s.id}
                    onClick={() => handleViewDetails(s.id)}
                    className="p-8 bg-white rounded-[2.5rem] border-2 border-transparent hover:border-yellow-400 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex items-center justify-between"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-neutral-50 rounded-2xl flex items-center justify-center group-hover:bg-yellow-100 transition-colors">
                        <Building2 className="text-neutral-400 group-hover:text-yellow-700" size={32} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-neutral-900">{s.company_name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${getStatusStyle(s.status)}`}>{s.status}</span>
                          <span className="text-neutral-400 text-xs font-bold flex items-center gap-1"><MapPin size={12}/> {s.pan}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="text-neutral-200 group-hover:text-yellow-500 group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="animate-in slide-in-from-right duration-500 max-w-5xl mx-auto">
            <button 
              onClick={() => setSelectedSupplier(null)}
              className="mb-8 flex items-center gap-2 font-black uppercase text-xs tracking-widest text-neutral-400 hover:text-black transition-colors"
            >
              <ArrowLeft size={16} /> Back to Directory
            </button>

            <div className="bg-white rounded-[4rem] shadow-2xl border border-gray-100 overflow-hidden">
              <div className="bg-neutral-900 p-12 text-white flex flex-col md:flex-row justify-between items-end gap-8">
                <div className="flex-1">
                  <div className="w-20 h-20 bg-yellow-400 rounded-3xl flex items-center justify-center mb-8 rotate-3 shadow-lg shadow-yellow-400/20">
                    <Briefcase size={40} className="text-black" />
                  </div>
                  <h2 className="text-5xl font-black tracking-tighter leading-tight">{selectedSupplier.company_name}</h2>
                  <div className="flex flex-wrap gap-4 mt-4">
                    <p className="text-neutral-400 font-bold flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10"><Mail size={16}/> {selectedSupplier.users?.email}</p>
                    <p className="text-neutral-400 font-bold flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10"><Phone size={16}/> {selectedSupplier.contact_phone}</p>
                  </div>
                </div>
                <div className={`px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest border-2 ${getStatusStyle(selectedSupplier.status)}`}>
                  {selectedSupplier.status}
                </div>
              </div>

              <div className="p-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
                
                <div className="space-y-10">
                  <section>
                    <h4 className="text-[10px] font-black uppercase text-neutral-400 tracking-[0.2em] mb-6">Contact Manager</h4>
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                        <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center font-black text-xl mb-4">
                            {selectedSupplier.contact_person_name?.charAt(0) || <Users size={24}/>}
                        </div>
                        <p className="font-black text-xl">{selectedSupplier.contact_person_name || 'Not Provided'}</p>
                        <p className="text-neutral-500 font-bold mt-1 uppercase text-xs tracking-wider">Authorized Signatory</p>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-neutral-400 tracking-[0.2em]">Identification</h4>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="p-4 bg-gray-50 rounded-2xl"><p className="text-[10px] text-gray-400 font-black uppercase">PAN</p><p className="font-bold">{selectedSupplier.pan}</p></div>
                        <div className="p-4 bg-gray-50 rounded-2xl"><p className="text-[10px] text-gray-400 font-black uppercase">GSTIN</p><p className="font-bold">{selectedSupplier.gstin}</p></div>
                    </div>
                  </section>
                </div>

                <div className="lg:col-span-2 space-y-10">
                  <section>
                    <h4 className="text-[10px] font-black uppercase text-neutral-400 tracking-[0.2em] mb-6">Banking Credentials</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border-2 border-gray-100 p-6 rounded-3xl">
                            <Landmark className="text-yellow-600 mb-4" size={24} />
                            <p className="text-sm font-bold text-gray-500">Primary Bank</p>
                            {/* Updated logic to fetch from Bank Table correctly */}
                            <p className="font-black text-lg">{getBankDetail('bank_name')}</p>
                        </div>
                        <div className="border-2 border-gray-100 p-6 rounded-3xl">
                            <ShieldCheck className="text-yellow-600 mb-4" size={24} />
                            <p className="text-sm font-bold text-gray-500">Account Number</p>
                            <p className="font-mono font-black text-lg">{getBankDetail('bank_account_no')}</p>
                        </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[10px] font-black uppercase text-neutral-400 tracking-[0.2em] mb-6">Verification Documents</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedSupplier.supplier_documents?.length > 0 ? (
                          selectedSupplier.supplier_documents.map(doc => (
                            <a key={doc.id} href={doc.download_url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-6 bg-yellow-50/30 rounded-[2rem] border-2 border-yellow-100 hover:bg-yellow-100 transition-all group">
                                <div className="flex items-center gap-4">
                                    <FileText className="text-yellow-700" />
                                    <span className="text-sm font-black text-yellow-900">{doc.document_type}</span>
                                </div>
                                <Download size={20} className="text-yellow-600 group-hover:scale-125 transition-transform" />
                            </a>
                          ))
                        ) : (
                          <p className="text-gray-400 font-bold italic">No documents uploaded.</p>
                        )}
                    </div>
                  </section>
                </div>
              </div>

              <div className="p-12 bg-neutral-50 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="max-w-md text-center md:text-left">
                  <h3 className="font-black text-xl mb-1">Administrative Actions</h3>
                  <p className="text-sm text-gray-500 font-bold">Review this profile to enable tender participation and ranking.</p>
                </div>

                <div className="flex flex-wrap justify-center gap-4">
                  {selectedSupplier.status === 'PENDING' ? (
                    <>
                      <button 
                        onClick={() => {setPendingAction({status: 'APPROVED', id: selectedSupplier.id}); setIsModalOpen(true)}} 
                        className="px-10 py-5 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all"
                      >
                        Approve Profile
                      </button>
                      <button 
                        onClick={() => {setPendingAction({status: 'REJECTED', id: selectedSupplier.id}); setIsModalOpen(true)}} 
                        className="px-10 py-5 bg-white border-2 border-red-100 text-red-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-50 transition-all"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <>
                      {selectedSupplier.status === 'APPROVED' && (
                        <button 
                          onClick={() => setShowRatingModal(true)}
                          className="px-12 py-5 bg-yellow-400 text-black rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 hover:shadow-2xl hover:bg-yellow-500 transition-all"
                        >
                          <Star className="fill-black" size={18} /> Rate Performance
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierDirectory;