import React, { useState, useEffect } from 'react';
import { 
  Plus, X, Upload, ShoppingBag, Clock, CheckCircle2, 
  AlertCircle, User, Phone, ImageOff 
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

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await communityAPI.getMarketplace();
      setItems(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load marketplace listings");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    const loadingToast = toast.loading("Uploading your listing...");

    try {
      await communityAPI.createMarketplaceItem(data);
      toast.success("Listing submitted for approval!", { id: loadingToast });
      setShowModal(false);
      setFormData({ item_name: '', price: '', category: '', description: '', contact_no: '' });
      setSelectedFile(null);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed.", { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  // Status Badge Logic
  const StatusBadge = ({ status }) => {
    const configs = {
      approved: { color: "bg-emerald-500", icon: <CheckCircle2 size={10} />, label: "Live" },
      pending: { color: "bg-amber-500", icon: <Clock size={10} />, label: "Pending" },
      rejected: { color: "bg-red-500", icon: <AlertCircle size={10} />, label: "Rejected" }
    };

    const config = configs[status] || configs.pending;

    return (
      <span className={`${config.color} text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 uppercase tracking-wider`}>
        {config.icon} {config.label}
      </span>
    );
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl p-8 mb-10 text-white flex justify-between items-center shadow-xl">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
            <ShoppingBag /> Marketplace
          </h1>
          <p className="text-blue-100">Buy and sell within the community</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all flex items-center gap-2">
          <Plus size={20} /> SELL SOMETHING
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 font-medium">Loading items...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all relative group">
              {/* FETCHED STATUS FROM DB */}
              <div className="absolute top-3 left-3 z-10">
                <StatusBadge status={item.status} />
              </div>

              <div className="w-full h-48 bg-slate-100 flex items-center justify-center overflow-hidden">
                {item.image_path ? (
                  <img 
                    src={item.image_path} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    alt={item.item_name}
                  />
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
                    <User size={12} className="text-slate-300" /> {item.residents?.full_name || 'Resident'}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-500">
                    <Phone size={12} /> {item.contact_no}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL remains largely the same but ensures categories are passed as strings */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase">List an Item</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:border-indigo-300 transition-colors">
                <input type="file" id="file" className="hidden" onChange={e => setSelectedFile(e.target.files[0])} />
                <label htmlFor="file" className="cursor-pointer flex flex-col items-center">
                  <Upload className="text-indigo-500 mb-2" />
                  <span className="text-xs font-bold text-slate-500">
                    {selectedFile ? selectedFile.name : "Upload Item Photo (Optional)"}
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
                
                <input placeholder="Category (e.g. Toys)" className="w-full p-3 bg-slate-50 rounded-xl border focus:ring-2 ring-indigo-500 outline-none transition-all" 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})} />
              </div>

              <input required placeholder="Contact Number" className="w-full p-3 bg-slate-50 rounded-xl border focus:ring-2 ring-indigo-500 outline-none transition-all" 
                value={formData.contact_no}
                onChange={e => setFormData({...formData, contact_no: e.target.value})} />

              <textarea required placeholder="Brief description..." className="w-full p-3 bg-slate-50 rounded-xl border h-24 focus:ring-2 ring-indigo-500 outline-none transition-all resize-none" 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})} />

              <button disabled={submitting} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-indigo-700 disabled:bg-slate-300 shadow-lg shadow-indigo-100 transition-all flex justify-center items-center">
                {submitting ? <Clock className="animate-spin mr-2" size={18} /> : "Submit Listing"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}