import React, { useState, useEffect } from 'react';
import { 
  Plus, X, Upload, ShoppingBag, Clock, CheckCircle2, 
  AlertCircle, User, Phone, ImageOff, ShieldAlert,
  LayoutList, UserCircle, ShieldCheck, Trash2, AlertTriangle
} from 'lucide-react';
import { communityAPI } from '../../api/auth.service';
import toast from 'react-hot-toast';

export default function ResidentMarketplace() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ 
    item_name: '', price: '', category: '', description: '', contact_no: '' 
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [viewMode, setViewMode] = useState('all');

  // ✅ New state for Custom Delete Popup
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ✅ Auth Logic
  const userStatus = localStorage.getItem('userStatus'); 
  const userRole = localStorage.getItem('userRole'); 
  const isAdmin = userRole === 'ADMIN';
  const isApproved = userStatus === 'APPROVED' || isAdmin;

  // ✅ Effect: Force 'all' for Admins and fetch
  useEffect(() => { 
    if (isAdmin && viewMode === 'mine') {
      setViewMode('all');
    }
    fetchItems(); 
  }, [viewMode, isAdmin]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setItems([]); 

      if (viewMode === 'mine' && !isAdmin) {
        const res = await communityAPI.getMySubmissions();
        const myItems = res.data?.data?.marketplace || [];
        setItems(myItems);
      } else {
        const res = await communityAPI.getPublicMarketplace();
        const actualData = res.data?.data || res.data || [];
        setItems(Array.isArray(actualData) ? actualData : []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load marketplace listings");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Trigger Delete Popup
  const triggerDeleteRequest = (e, itemId) => {
    e.stopPropagation(); 
    setDeleteId(itemId);
  };

  // ✅ Final Delete Execution
  const handleFinalDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await communityAPI.deleteContent({ id: deleteId, type: 'MARKETPLACE' });
      toast.success("Listing removed successfully");
      setDeleteId(null);
      fetchItems(); // Refresh the list
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete item");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenModal = () => {
    if (!isApproved) {
      toast.error("Account verification required to list items.", { icon: '⏳' });
      return;
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const data = new FormData();
    data.append('item_name', formData.item_name);
    data.append('price', formData.price);
    data.append('category', formData.category || 'General');
    data.append('description', formData.description);
    data.append('contact_no', formData.contact_no);
    
    if (selectedFile) {
      data.append('image_path', selectedFile); 
    }

    setSubmitting(true);
    const loadingToast = toast.loading(isAdmin ? "Publishing listing..." : "Uploading your listing...");

    try {
      await communityAPI.createMarketplaceItem(data);
      toast.success(isAdmin ? "Listing published instantly!" : "Listing submitted for review!", { id: loadingToast });
      
      setShowModal(false);
      setFormData({ item_name: '', price: '', category: '', description: '', contact_no: '' });
      setSelectedFile(null);
      
      if (isAdmin) setViewMode('all');
      else setViewMode('mine');
      
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed.", { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  const StatusBadge = ({ status }) => {
    if (!status) return null;
    const configs = {
      approved: { color: "bg-emerald-500", icon: <CheckCircle2 size={10} />, label: "Live" },
      pending: { color: "bg-amber-500", icon: <Clock size={10} />, label: "Pending" },
      rejected: { color: "bg-red-500", icon: <AlertCircle size={10} />, label: "Rejected" }
    };
    const config = configs[status] || configs.pending;
    return (
      <span className={`${config.color} text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 uppercase tracking-wider shadow-sm`}>
        {config.icon} {config.label}
      </span>
    );
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      
      {!isApproved && !isAdmin && (
        <div className="mb-6 bg-white border-l-4 border-amber-500 p-4 rounded-xl shadow-sm flex items-center gap-4 animate-in slide-in-from-top duration-500">
          <div className="bg-amber-100 p-2 rounded-full">
            <ShieldAlert className="text-amber-600" size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Pending Verification</p>
            <p className="text-xs text-slate-500 font-medium">Your account is being reviewed. Listing items is restricted.</p>
          </div>
        </div>
      )}

      {/* --- HEADER SECTION --- */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl p-8 mb-10 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl">
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-black uppercase tracking-tight flex items-center justify-center md:justify-start gap-3">
            <ShoppingBag /> 
            {isAdmin ? 'Marketplace' : (viewMode === 'all' ? 'Marketplace' : 'My Listings')}
          </h1>
          <p className="text-blue-100 mt-1">
            {isAdmin ? 'Manage community trade and listings' : (viewMode === 'all' ? 'Buy and sell within the community' : 'Manage your items for sale')}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
            {!isAdmin && (
              <div className="bg-white/10 p-1 rounded-xl flex backdrop-blur-sm border border-white/20">
                  <button onClick={() => setViewMode('all')} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg transition-all ${viewMode === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-indigo-100 hover:bg-white/10'}`}>
                    <LayoutList size={16} /> All
                  </button>
                  <button onClick={() => setViewMode('mine')} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg transition-all ${viewMode === 'mine' ? 'bg-white text-indigo-600 shadow-sm' : 'text-indigo-100 hover:bg-white/10'}`}>
                    <UserCircle size={16} /> My Items
                  </button>
              </div>
            )}

            <button onClick={handleOpenModal} className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg whitespace-nowrap ${isApproved ? 'bg-white text-indigo-600 hover:bg-blue-50' : 'bg-indigo-400/50 text-indigo-100 cursor-not-allowed shadow-none'}`}>
                <Plus size={20} /> {isAdmin ? 'ADD ITEM' : 'SELL ITEM'}
            </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 font-medium flex flex-col items-center gap-3">
          <Clock className="animate-spin text-indigo-500" />
          Loading marketplace...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all relative group">
                
                {/* ✅ DELETE BUTTON ON HOVER */}
                {(isAdmin || viewMode === 'mine') && (
                  <button 
                    onClick={(e) => triggerDeleteRequest(e, item.id)}
                    className="absolute top-3 right-3 z-20 p-2.5 bg-white/90 backdrop-blur-md text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white shadow-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                )}

                <div className="absolute top-3 left-3 z-10">
                  <StatusBadge status={item.status} />
                </div>

                <div className="w-full h-48 bg-slate-100 flex items-center justify-center overflow-hidden">
                  {item.image_path ? (
                    <img src={item.image_path} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.item_name}/>
                  ) : (
                    <div className="flex flex-col items-center text-slate-300">
                      <ImageOff size={40} strokeWidth={1.5} />
                      <span className="text-[10px] uppercase font-bold mt-2">No Image</span>
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-slate-800 line-clamp-1">{item.item_name}</h3>
                    <span className="text-indigo-600 font-black">₹{item.price}</span>
                  </div>
                  <p className="text-indigo-400 text-[10px] mb-2 font-bold uppercase tracking-widest">{item.category}</p>
                  <p className="text-slate-500 text-xs mb-4 line-clamp-2 min-h-[32px]">{item.description}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${!item.resident_id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {!item.resident_id ? <ShieldCheck size={12} /> : <User size={12} />}
                      </div>
                      {viewMode === 'mine' ? 'You' : (!item.resident_id ? 'Admin' : (item.residents?.full_name || 'Resident'))}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-500">
                      <Phone size={12} /> {item.contact_no}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
              <ShoppingBag className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-slate-400 font-medium">
                  {viewMode === 'mine' ? "You haven't listed anything yet." : "No items listed yet."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ✅ DELETE CONFIRMATION POPUP */}
      {deleteId && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-200 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-500" size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Remove Listing?</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              This item will be permanently removed from the marketplace feed.
            </p>
            
            <div className="flex flex-col gap-3">
              <button 
                disabled={isDeleting}
                onClick={handleFinalDelete}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-100 disabled:bg-slate-300"
              >
                {isDeleting ? <Clock className="animate-spin" size={20} /> : "Delete Listing"}
              </button>
              <button 
                disabled={isDeleting}
                onClick={() => setDeleteId(null)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl font-bold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase">{isAdmin ? 'Admin Listing' : 'List an Item'}</h2>
              <button onClick={() => !submitting && setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:border-indigo-300 transition-colors">
                <input type="file" id="file" className="hidden" onChange={e => setSelectedFile(e.target.files[0])} />
                <label htmlFor="file" className="cursor-pointer flex flex-col items-center">
                  <Upload className="text-indigo-500 mb-2" />
                  <span className="text-xs font-bold text-slate-500">
                    {selectedFile ? selectedFile.name : "Upload Item Photo"}
                  </span>
                </label>
              </div>

              <input required placeholder="Item Name" className="w-full p-3 bg-slate-50 rounded-xl border focus:ring-2 ring-indigo-500 outline-none transition-all" 
                value={formData.item_name}
                onChange={e => setFormData({...formData, item_name: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-4">
                <input required type="number" placeholder="Price (₹)" className="w-full p-3 bg-slate-50 rounded-xl border focus:ring-2 ring-indigo-500 outline-none transition-all" 
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})} />
                
                <input placeholder="Category" className="w-full p-3 bg-slate-50 rounded-xl border focus:ring-2 ring-indigo-500 outline-none transition-all" 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})} />
              </div>

              <input required placeholder="Contact Number" className="w-full p-3 bg-slate-50 rounded-xl border focus:ring-2 ring-indigo-500 outline-none transition-all" 
                value={formData.contact_no}
                onChange={e => setFormData({...formData, contact_no: e.target.value})} />

              <textarea required placeholder="Description..." className="w-full p-3 bg-slate-50 rounded-xl border h-24 focus:ring-2 ring-indigo-500 outline-none transition-all resize-none" 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})} />

              <button disabled={submitting} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-indigo-700 disabled:bg-slate-300 shadow-lg transition-all flex justify-center items-center">
                {submitting ? <Clock className="animate-spin mr-2" size={18} /> : (isAdmin ? "Publish Now" : "Submit Listing")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}