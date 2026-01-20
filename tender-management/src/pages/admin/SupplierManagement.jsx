import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../api/auth.service';
import toast, { Toaster } from 'react-hot-toast'; // Import Toast
import { 
  Users, Search, CheckCircle, XCircle, Clock, Building2, 
  Phone, Mail, FileText, Download, Landmark, ShieldCheck, 
  ChevronRight, AlertTriangle 
} from 'lucide-react';

const SupplierDirectory = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState({ status: '', id: '' });

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
    } catch (error) {
      toast.error("Failed to load supplier details");
    }
  };

  // Triggered when user clicks Approve or Reject button
  const confirmUpdateStatus = (status, id) => {
    setPendingAction({ status, id });
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    const { status, id } = pendingAction;
    const loadingToast = toast.loading(`Updating to ${status}...`);
    
    try {
      // 1. Retrieve the stored user object
      const storedUser = localStorage.getItem('user');
      
      // 2. Parse the JSON string into an object
      const adminUser = storedUser ? JSON.parse(storedUser) : null;
      
      // 3. Extract the ID (backend expects admin_id)
      const adminId = adminUser?.id;

      if (!adminId) {
        toast.error("Admin ID not found. Please log in again.", { id: loadingToast });
        return;
      }

      // 4. Send the request with admin_id in the body
      await adminAPI.approveSupplier(id, { 
        status: status,
        admin_id: adminId, // This satisfies the backend requirement
        remarks: `Supplier ${status.toLowerCase()} by administrator.` 
      });

      toast.success(`Supplier ${status.toLowerCase()} successfully!`, { id: loadingToast });
      setIsModalOpen(false);
      
      // Refresh Data
      fetchSuppliers();
      handleViewDetails(id);
    } catch (error) {
      console.error("Approval Error:", error);
      const message = error.response?.data?.message || "Update failed";
      toast.error(message, { id: loadingToast });
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-700 border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50   ">
      <Toaster position="top-right" />
      
      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-6 mx-auto">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="text-2xl font-black text-center text-neutral-900 mb-2">Confirm Action</h3>
            <p className="text-neutral-500 text-center font-medium mb-8">
              Are you sure you want to mark this supplier as <span className="font-bold text-neutral-900">{pendingAction.status}</span>?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-4 rounded-2xl bg-neutral-100 font-bold text-neutral-600 hover:bg-neutral-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateStatus}
                className={`flex-1 py-4 rounded-2xl font-black text-white transition-all ${pendingAction.status === 'APPROVED' ? 'bg-neutral-900' : 'bg-red-600'}`}
              >
                Yes, {pendingAction.status === 'APPROVED' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header and main layout remains the same... */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-neutral-900 tracking-tight flex items-center gap-3">
              <ShieldCheck className="w-10 h-10 text-yellow-500" />
              Supplier Directory
            </h1>
            <p className="text-neutral-500 font-bold mt-2">Verify and manage ecosystem partners.</p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by company or PAN..."
              className="pl-12 pr-6 py-4 bg-white border-none rounded-2xl shadow-sm w-full md:w-80 focus:ring-2 focus:ring-yellow-400 font-medium"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* List Section */}
        <div className="lg:col-span-7 space-y-4">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-24 bg-neutral-200 rounded-[2rem]"></div>)}
            </div>
          ) : (
            suppliers
              .filter(s => s.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((supplier) => (
                <div 
                  key={supplier.id}
                  onClick={() => handleViewDetails(supplier.id)}
                  className={`p-6 rounded-[2rem] bg-white border-2 transition-all cursor-pointer group flex items-center justify-between
                    ${selectedSupplier?.id === supplier.id ? 'border-yellow-400 shadow-lg' : 'border-transparent hover:border-neutral-200 shadow-sm'}`}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-neutral-100 rounded-2xl flex items-center justify-center group-hover:bg-yellow-100 transition-colors">
                      <Building2 className="w-7 h-7 text-neutral-600 group-hover:text-yellow-700" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-neutral-800">{supplier.company_name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`px-3 py-0.5 rounded-full text-[10px] font-black border ${getStatusStyle(supplier.status)}`}>
                          {supplier.status}
                        </span>
                        <span className="text-neutral-400 text-xs font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(supplier.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={`w-6 h-6 text-neutral-300 transition-transform ${selectedSupplier?.id === supplier.id ? 'rotate-90 text-yellow-500' : ''}`} />
                </div>
              ))
          )}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-5">
          {selectedSupplier ? (
            <div className="bg-white rounded-[3rem] shadow-xl border border-neutral-100 sticky top-28 overflow-hidden animate-in slide-in-from-right duration-500">
              <div className="bg-neutral-900 p-8 text-white">
                <h2 className="text-2xl font-black mb-2">{selectedSupplier.company_name}</h2>
                <p className="text-neutral-400 font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" /> {selectedSupplier.users?.email}
                </p>
              </div>

              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {/* Information Sections remain the same */}
                <section>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-4">Contact Person</h4>
                  <div className="bg-neutral-50 p-4 rounded-2xl">
                    <p className="font-black text-neutral-800">{selectedSupplier.contact_person_name}</p>
                    <p className="text-neutral-500 font-bold flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4" /> {selectedSupplier.contact_phone}
                    </p>
                  </div>
                </section>

                <section className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">PAN Number</h4>
                    <p className="font-bold text-neutral-700">{selectedSupplier.pan}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">GSTIN</h4>
                    <p className="font-bold text-neutral-700">{selectedSupplier.gstin}</p>
                  </div>
                </section>

                {/* Financials and Documents as before */}
                <section className="border-t border-neutral-100 pt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Landmark className="w-5 h-5 text-yellow-600" />
                    <h3 className="font-black text-neutral-900">Financial Details</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-neutral-500 font-bold">Bank</span> <span className="font-black">{selectedSupplier.supplier_financials?.[0]?.bank_name}</span></div>
                    <div className="flex justify-between"><span className="text-neutral-500 font-bold">A/C No</span> <span className="font-mono font-bold">{selectedSupplier.supplier_financials?.[0]?.bank_account_no}</span></div>
                  </div>
                </section>

                <section className="border-t border-neutral-100 pt-8">
                  <h3 className="font-black text-neutral-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-yellow-600" /> Verified Documents
                  </h3>
                  <div className="space-y-3">
                    {selectedSupplier.supplier_documents?.map((doc) => (
                      <a key={doc.id} href={doc.download_url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-yellow-50 rounded-2xl border border-yellow-100 hover:bg-yellow-100 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg"><FileText className="w-4 h-4 text-yellow-700" /></div>
                          <span className="text-sm font-black text-yellow-900">{doc.document_type}</span>
                        </div>
                        <Download className="w-4 h-4 text-yellow-600 group-hover:scale-110 transition-transform" />
                      </a>
                    ))}
                  </div>
                </section>
              </div>

              {/* Action Bar */}
              <div className="p-6 bg-neutral-50 border-t border-neutral-100">
                {selectedSupplier.status === 'PENDING' ? (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => confirmUpdateStatus('APPROVED', selectedSupplier.id)}
                      className="flex-1 bg-neutral-900 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all active:scale-95"
                    >
                      <CheckCircle className="w-4 h-4 text-green-400" /> Approve Profile
                    </button>
                    <button 
                      onClick={() => confirmUpdateStatus('REJECTED', selectedSupplier.id)}
                      className="px-6 py-4 rounded-2xl bg-white border border-neutral-200 text-red-600 font-black text-sm hover:bg-red-50 transition-all active:scale-95"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <div className={`p-4 rounded-2xl border flex items-center justify-center gap-3 font-black text-sm ${getStatusStyle(selectedSupplier.status)}`}>
                    {selectedSupplier.status === 'APPROVED' ? <ShieldCheck className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    Verification {selectedSupplier.status}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] border-4 border-dashed border-neutral-200 rounded-[3rem] flex flex-col items-center justify-center text-center p-10">
              <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mb-4"><Users className="w-10 h-10 text-neutral-300" /></div>
              <h3 className="text-xl font-black text-neutral-400">Select a supplier to view <br/> full profile and documents</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierDirectory;