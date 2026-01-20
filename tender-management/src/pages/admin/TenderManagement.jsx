import React, { useState, useEffect } from 'react';
import { 
  Plus, FileText, Loader2, X, Info,
  Trash2, Edit3, ChevronRight, AlertTriangle 
} from 'lucide-react';
import { tenderAdminAPI } from '../../api/auth.service';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function TenderManagement() {
  const navigate = useNavigate();
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for Delete Confirmation Popup
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchTenders();
  }, []);

  const fetchTenders = async () => {
    try {
      setLoading(true);
      const res = await tenderAdminAPI.getAllTenders();
      setTenders(res.data.data || []);
    } catch (error) {
      toast.error("Failed to load tenders");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    
    setIsDeleting(true);
    const toastId = toast.loading("Processing deletion...");
    
    try {
      await tenderAdminAPI.deleteTender(deleteId);
      toast.success("Tender deleted permanently", { id: toastId });
      setTenders(prev => prev.filter(t => t.id !== deleteId));
      setDeleteId(null); // Close modal
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed", { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="animate-spin text-yellow-400 w-12 h-12" />
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500 p-4">
      {/* HEADER SECTION */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 uppercase tracking-tight italic">Tender Tracking</h1>
          <p className="text-neutral-400 font-bold text-sm">Manage vendor bids and contracts.</p>
        </div>
        <button 
          onClick={() => navigate('/admin/tenders/create')}
          className="flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-2xl font-black text-xs hover:bg-neutral-800 transition-all shadow-xl shadow-neutral-200"
        >
          <Plus size={16} />
          CREATE NEW TENDER
        </button>
      </header>

      {/* TENDER LIST */}
      <div className="space-y-4">
        {tenders.map((tender) => (
          <div 
            key={tender.id}
            onClick={() => navigate(`/admin/tenders/${tender.id}`)}
            className="group bg-white p-6 rounded-[2rem] border border-neutral-100 flex items-center justify-between hover:shadow-xl hover:shadow-neutral-100 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="font-black text-neutral-800 text-lg leading-tight">{tender.title}</h3>
                <p className="text-neutral-400 font-bold text-[10px] mt-1 uppercase tracking-wider">ID: {tender.id.substring(0,8).toUpperCase()}</p>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-right hidden sm:block">
                <div className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-1">Estimate</div>
                <div className="font-black text-neutral-900 italic">₹{parseFloat(tender.budget_estimate).toLocaleString()}</div>
              </div>

              <div className="flex items-center gap-2 border-l border-neutral-100 pl-6">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/admin/tenders/edit/${tender.id}`);
                  }}
                  className="p-3 text-neutral-400 hover:bg-neutral-900 hover:text-white rounded-xl transition-all"
                >
                  <Edit3 size={18} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(tender.id); // Triggers the custom popup
                  }}
                  className="p-3 text-neutral-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <ChevronRight className="text-neutral-200" size={20} />
            </div>
          </div>
        ))}
      </div>

      {/* --- CUSTOM DELETE POPUP --- */}
      {deleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} />
            </div>
            
            <h2 className="text-2xl font-black text-neutral-900 mb-2">Delete Tender?</h2>
            <p className="text-neutral-400 font-bold text-sm mb-8 italic">
              This action is permanent and will remove all associated documents and timelines.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setDeleteId(null)}
                className="py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-neutral-400 hover:bg-neutral-50 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                disabled={isDeleting}
                className="py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-100 flex items-center justify-center gap-2"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}