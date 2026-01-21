import React, { useState, useEffect } from 'react';
import { 
  Plus, X, Upload, Send, User, Loader2, ImageIcon, 
  Camera, CheckCircle2, Clock, AlertCircle 
} from 'lucide-react';
import { communityAPI } from '../../api/auth.service';
import toast from 'react-hot-toast';

export default function ResidentGallery() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ caption: '' });
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const res = await communityAPI.getGallery(); 
      // Ensure we are pulling the data correctly from your backend response
      setPhotos(res.data.data || []); 
    } catch (err) {
      toast.error("Could not load community gallery");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return toast.error("Please select at least one photo");

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('caption', formData.caption.trim());
      selectedFiles.forEach(file => data.append('photos', file));

      await communityAPI.uploadToGallery(data);
      toast.success("Photos uploaded for approval!");
      
      setShowModal(false);
      setFormData({ caption: '' });
      setSelectedFiles([]);
      fetchGallery(); 
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Status Badge Component for Gallery
  const StatusBadge = ({ status }) => {
    const configs = {
      approved: { color: "bg-emerald-500/90", icon: <CheckCircle2 size={10} />, label: "Live" },
      pending: { color: "bg-amber-500/90", icon: <Clock size={10} />, label: "Pending" },
      rejected: { color: "bg-red-500/90", icon: <AlertCircle size={10} />, label: "Rejected" }
    };

    const config = configs[status] || configs.pending;

    return (
      <span className={`${config.color} backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 uppercase tracking-tighter shadow-sm`}>
        {config.icon} {config.label}
      </span>
    );
  };

  return (
    <div className="p-6 md:p-10 bg-slate-50 min-h-screen">
      
      {/* HEADER SECTION */}
      <div className="bg-blue-600 rounded-3xl p-8 md:p-12 mb-10 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl shadow-blue-100">
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight flex items-center justify-center md:justify-start gap-3">
            <Camera size={36} /> Community Moments
          </h1>
          <p className="text-blue-100 mt-2 font-medium">Capturing the life and spirit of the neighborhood.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-lg"
        >
          <Plus size={20} strokeWidth={3} /> UPLOAD PHOTOS
        </button>
      </div>

      {/* GALLERY GRID */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
          <p className="text-slate-400 font-medium">Developing photos...</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {photos.length > 0 ? (
            photos.map((photo) => (
              <div 
                key={photo.id} 
                className="relative break-inside-avoid bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 group"
              >
                {/* Image Section */}
                <img 
                  src={photo.image_path} 
                  className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-700" 
                  alt={photo.caption} 
                />

                {/* Status Badge fetched from DB status column */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <StatusBadge status={photo.status} />
                </div>

                {/* Overlay Info on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                  <p className="text-white text-sm font-semibold mb-2 line-clamp-2 italic">"{photo.caption}"</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm">
                      <User size={12} />
                    </div>
                    <span className="text-[11px] font-bold text-white/90">{photo.residents?.full_name || 'Resident'}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-24 bg-white rounded-3xl border border-dashed border-slate-300">
               <ImageIcon size={48} className="mx-auto text-slate-200 mb-4" />
               <p className="text-slate-400 font-semibold">No community photos yet. Be the first to share!</p>
            </div>
          )}
        </div>
      )}

      {/* --- UPLOAD POPUP MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden p-8 md:p-10 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Share a Moment</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Upload to community gallery</p>
              </div>
              <button onClick={() => !submitting && setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="flex w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-10 flex-col items-center justify-center cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all group">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="text-blue-600" size={28} />
                  </div>
                  <span className="text-sm font-bold text-slate-600">
                    {selectedFiles.length > 0 ? `${selectedFiles.length} Photos Selected` : "Click or drop photos here"}
                  </span>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">JPEG, PNG up to 10 photos</p>
                  <input type="file" multiple className="hidden" accept="image/*" onChange={e => setSelectedFiles(Array.from(e.target.files))} />
                </label>
              </div>

              <div className="space-y-1.5">
                <input 
                  required className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                  placeholder="Add a short caption..." 
                  value={formData.caption} 
                  onChange={e => setFormData({...formData, caption: e.target.value})}
                />
              </div>

              <button 
                disabled={submitting || selectedFiles.length === 0}
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 disabled:bg-slate-200 transition-all shadow-xl shadow-blue-200 mt-4"
              >
                {submitting ? <Loader2 className="animate-spin" size={20} /> : <>Upload Now <Send size={18} /></>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}