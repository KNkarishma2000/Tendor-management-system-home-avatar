import React, { useState, useEffect } from 'react';
import { 
  Plus, X, Upload, Send, User, Loader2, ImageIcon, 
  Camera, CheckCircle2, Clock, AlertCircle, ShieldAlert,
  LayoutList, UserCircle, ShieldCheck, Trash2, AlertTriangle
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
  const [viewMode, setViewMode] = useState('all');

  // ✅ New state for Custom Delete Popup
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const userStatus = localStorage.getItem('userStatus'); 
  const userRole = localStorage.getItem('userRole'); 
  const isAdmin = userRole === 'ADMIN';
  const isApproved = userStatus === 'APPROVED' || isAdmin;

  useEffect(() => {
    if (isAdmin && viewMode === 'mine') {
      setViewMode('all');
    }
    fetchGallery();
  }, [viewMode, isAdmin]);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      setPhotos([]); 
      if (viewMode === 'mine' && !isAdmin) {
        const res = await communityAPI.getMySubmissions();
        setPhotos(res.data?.data?.gallery || []);
      } else {
        const res = await communityAPI.getPublicGallery(); 
        setPhotos(res.data?.data || []);
      }
    } catch (err) {
      toast.error("Could not load gallery");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Trigger Delete Popup
  const triggerDeleteRequest = (e, photoId) => {
    e.stopPropagation(); 
    setDeleteId(photoId);
  };

  // ✅ Handle Deletion
  const handleFinalDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await communityAPI.deleteContent({ id: deleteId, type: 'GALLERY' });
      toast.success("Moment removed from gallery");
      setDeleteId(null);
      fetchGallery();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete photo");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenModal = () => {
    if (!isApproved) {
      toast.error("Verification required to share photos.", { icon: '⏳' });
      return;
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || selectedFiles.length === 0) return;

    setSubmitting(true);
    const loadingToast = toast.loading(isAdmin ? "Publishing..." : "Uploading...");

    try {
      const data = new FormData();
      data.append('caption', formData.caption.trim());
      selectedFiles.forEach(file => data.append('photos', file));

      await communityAPI.uploadToGallery(data);
      toast.success(isAdmin ? "Published!" : "Submitted for review!", { id: loadingToast });
      setShowModal(false);
      setFormData({ caption: '' });
      setSelectedFiles([]);
      isAdmin ? setViewMode('all') : setViewMode('mine');
      fetchGallery(); 
    } catch (err) {
      toast.error("Upload failed", { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  const StatusBadge = ({ status }) => {
    if (!status) return null;
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
    <div className="md:p-2 bg-slate-50 min-h-screen">
      {!isApproved && !isAdmin && (
        <div className="mb-8 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 text-amber-800 shadow-sm">
          <ShieldAlert className="shrink-0 text-amber-600" size={22} />
          <div className="text-sm font-medium">
            <p className="font-bold">Gallery Access Restricted</p>
            <p className="opacity-80">Account verification is required to upload new photos.</p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-blue-600 rounded-3xl p-8 md:p-12 mb-10 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl shadow-blue-100">
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight flex items-center justify-center md:justify-start gap-3">
            <Camera size={36} /> 
            {isAdmin ? 'Community Moments' : (viewMode === 'all' ? 'Community Moments' : 'My Photos')}
          </h1>
          <p className="text-blue-100 mt-2 font-medium italic opacity-90">
            {isAdmin ? 'Official gallery management console.' : (viewMode === 'all' ? 'Capturing the life and spirit of our neighborhood.' : 'Manage your uploaded snapshots.')}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
            {!isAdmin && (
              <div className="bg-blue-700/50 p-1 rounded-xl flex shadow-inner backdrop-blur-sm">
                  <button onClick={() => setViewMode('all')} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg transition-all ${viewMode === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-blue-100 hover:text-white hover:bg-white/10'}`}>
                    <LayoutList size={16} /> All
                  </button>
                  <button onClick={() => setViewMode('mine')} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg transition-all ${viewMode === 'mine' ? 'bg-white text-blue-600 shadow-sm' : 'text-blue-100 hover:text-white hover:bg-white/10'}`}>
                    <UserCircle size={16} /> My Photos
                  </button>
              </div>
            )}

            <button onClick={handleOpenModal} className={`px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-lg whitespace-nowrap ${isApproved ? 'bg-white text-blue-600 hover:bg-blue-50 hover:scale-105 active:scale-95' : 'bg-blue-400 text-blue-100 cursor-not-allowed shadow-none'}`}>
                <Plus size={20} strokeWidth={3} /> {isAdmin ? 'ADD PHOTOS' : 'UPLOAD'}
            </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
          <p className="text-slate-400 font-medium">Developing photos...</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {photos.length > 0 ? photos.map((photo) => (
            <div key={photo.id} className="relative break-inside-avoid bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 group">
              <img src={photo.image_path} className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" alt={photo.caption} />
              
              {/* ✅ DELETE BUTTON ON HOVER */}
              {(isAdmin || viewMode === 'mine') && (
                <button 
                  onClick={(e) => triggerDeleteRequest(e, photo.id)}
                  className="absolute top-3 right-3 z-20 p-2.5 bg-white/90 backdrop-blur-md text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white shadow-lg"
                >
                  <Trash2 size={16} />
                </button>
              )}

              <div className="absolute top-3 left-3 flex gap-2"><StatusBadge status={photo.status} /></div>
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                <p className="text-white text-sm font-semibold mb-3 line-clamp-2 italic">"{photo.caption}"</p>
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white backdrop-blur-sm ${!photo.resident_id ? 'bg-blue-600' : 'bg-white/20'}`}>
                    {!photo.resident_id ? <ShieldCheck size={12} /> : <User size={12} />}
                  </div>
                  <span className="text-[11px] font-bold text-white/90 uppercase tracking-tighter">
                      {viewMode === 'mine' ? 'Your Post' : (!photo.resident_id ? 'Admin' : (photo.residents?.full_name || 'Resident'))}
                  </span>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center">
              <ImageIcon size={48} className="text-slate-200 mb-4" />
              <p className="text-slate-400 font-bold">The gallery is currently empty.</p>
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
            <h3 className="text-2xl font-black text-slate-900 mb-2">Delete Photo?</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              Are you sure you want to remove this moment from the community gallery? This cannot be undone.
            </p>
            
            <div className="flex flex-col gap-3">
              <button 
                disabled={isDeleting}
                onClick={handleFinalDelete}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-100"
              >
                {isDeleting ? <Loader2 className="animate-spin" size={20} /> : "Yes, Delete Photo"}
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

      {/* UPLOAD MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 md:p-10 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{isAdmin ? 'Official Upload' : 'Share a Moment'}</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Add to community gallery</p>
              </div>
              <button onClick={() => !submitting && setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <label className="flex w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-10 flex-col items-center justify-center cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all group">
                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="text-blue-600" size={24} />
                </div>
                <span className="text-sm font-bold text-slate-600 text-center">
                  {selectedFiles.length > 0 ? `${selectedFiles.length} Photos Ready` : "Drop your photos here"}
                </span>
                <input type="file" multiple className="hidden" accept="image/*" onChange={e => setSelectedFiles(Array.from(e.target.files))} />
              </label>

              <input required className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-sm font-medium focus:border-blue-500 outline-none transition-all"
                placeholder="What's happening in this photo?" 
                value={formData.caption} 
                onChange={e => setFormData({...formData, caption: e.target.value})}
              />

              <button disabled={submitting || selectedFiles.length === 0} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 disabled:bg-slate-200 transition-all shadow-xl shadow-blue-200 mt-4">
                {submitting ? <Loader2 className="animate-spin" size={20} /> : <>{isAdmin ? 'Publish' : 'Upload'} <Send size={18} /></>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}