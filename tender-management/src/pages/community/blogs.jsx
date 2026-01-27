import React, { useState, useEffect } from 'react';
import { 
  PenTool, X, Upload, Send, User, Loader2, BookOpen, 
  ChevronRight, Image as ImageIcon, ArrowLeft, ShieldAlert,
  LayoutList, UserCircle, ShieldCheck, Trash2, AlertTriangle
} from 'lucide-react';
import { communityAPI } from '../../api/auth.service';
import toast from 'react-hot-toast';

// ✅ Rich Text Editor Imports
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export default function ResidentBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [viewMode, setViewMode] = useState('all');

  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const userStatus = localStorage.getItem('userStatus'); 
  const userRole = localStorage.getItem('userRole'); 
  const isAdmin = userRole === 'ADMIN';
  const isApproved = userStatus === 'APPROVED' || isAdmin;

  // ✅ Quill Editor Toolbar Configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['clean']
    ],
  };

  useEffect(() => {
    if (isAdmin && viewMode === 'mine') {
      setViewMode('all');
    }
    fetchBlogs();
  }, [viewMode, isAdmin]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      let res;
      if (viewMode === 'mine' && !isAdmin) {
        res = await communityAPI.getMySubmissions();
        const myBlogs = res.data?.data?.blogs || []; 
        setBlogs(myBlogs);
      } else {
        res = await communityAPI.getBlogs();
        const actualBlogs = res.data?.data || res.data || [];
        setBlogs(Array.isArray(actualBlogs) ? actualBlogs : []);
      }
    } catch (err) {
      toast.error("Could not load stories");
    } finally {
      setLoading(false);
    }
  };

  const triggerDeleteRequest = (e, blogId) => {
    e.stopPropagation(); 
    setDeleteId(blogId);
  };

  const handleFinalDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await communityAPI.deleteContent({ id: deleteId, type: 'BLOG' });
      toast.success("Blog deleted successfully");
      setDeleteId(null);
      fetchBlogs();
      if (selectedBlog?.id === deleteId) setSelectedBlog(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete blog");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenModal = () => {
    if (!isApproved) {
      toast.error("Account verification required sharing stories.", { icon: '⏳' });
      return;
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('title', formData.title.trim());
      data.append('content', formData.content.trim()); 
      selectedFiles.forEach(file => data.append('images', file));

      await communityAPI.createBlog(data);
      toast.success(isAdmin ? "Blog published!" : "Story submitted!");
      setShowModal(false);
      setFormData({ title: '', content: '' });
      setSelectedFiles([]);
      fetchBlogs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post blog");
    } finally {
      setSubmitting(false);
    }
  };

  const StatusBadge = ({ status }) => {
    if (!status) return null;
    const configs = {
      pending: "bg-amber-50 text-amber-700 border-amber-100",
      approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
      rejected: "bg-red-50 text-red-700 border-red-100"
    };
    const labels = { pending: "Pending", approved: "Live", rejected: "Rejected" };
    return (
      <span className={`${configs[status] || configs.pending} text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider`}>
        {labels[status] || "Pending"}
      </span>
    );
  };

  // --- DETAILED VIEW ---
  if (selectedBlog) {
    return (
      <div className="p-4 md:p-10 min-h-screen animate-in fade-in duration-500 ">
        {/* Custom Styling Injection for Rich Text */}
        <style>{`
          .blog-content h1 { font-size: 2.25rem; font-weight: 800; color: #0f172a; margin-top: 2rem; margin-bottom: 1rem; line-height: 1.2; }
          .blog-content h2 { font-size: 1.875rem; font-weight: 700; color: #1e293b; margin-top: 1.75rem; margin-bottom: 0.75rem; }
          .blog-content h3 { font-size: 1.5rem; font-weight: 600; color: #334155; margin-top: 1.5rem; margin-bottom: 0.5rem; }
          .blog-content p { margin-bottom: 1.25rem; line-height: 1.8; color: #475569; }
          .blog-content ul { list-style-type: disc; margin-left: 1.5rem; margin-bottom: 1.25rem; color: #475569; }
          .blog-content ol { list-style-type: decimal; margin-left: 1.5rem; margin-bottom: 1.25rem; color: #475569; }
          .blog-content li { margin-bottom: 0.5rem; padding-left: 0.5rem; }
          .blog-content blockquote { border-left: 4px solid #3b82f6; padding-left: 1rem; font-style: italic; color: #64748b; margin: 1.5rem 0; }
          .blog-content strong { font-weight: 700; color: #0f172a; }
        `}</style>

        <div className="flex justify-between items-center mb-12">
            <button onClick={() => setSelectedBlog(null)} className="flex items-center gap-2 text-slate-400 hover:text-slate-800 font-medium transition-all text-sm group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> BACK TO FEED
            </button>
            
            {(isAdmin || viewMode === 'mine') && (
                <button 
                    onClick={(e) => triggerDeleteRequest(e, selectedBlog.id)}
                    className="flex items-center gap-2 text-red-500 hover:text-red-700 font-bold text-xs uppercase tracking-widest"
                >
                    <Trash2 size={16} /> Delete Story
                </button>
            )}
        </div>

      <article className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${!selectedBlog.resident_id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                { !selectedBlog.resident_id ? <ShieldCheck size={20} /> : <User size={20} /> }
              </div>
              <div className="text-sm">
                <p className="font-bold text-slate-900">{!selectedBlog.resident_id ? 'Administrator' : (selectedBlog.residents?.full_name || 'Resident')}</p>
                <p className="text-slate-500">{new Date(selectedBlog.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <StatusBadge status={selectedBlog.status} />
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight">{selectedBlog.title}</h1>
          
          {selectedBlog.images?.length > 0 && (
            <div className="w-full rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/10">
               <img src={selectedBlog.images[0]} className="w-full h-auto object-cover max-h-[600px]" alt="Cover" />
            </div>
          )}

          {/* ✅ RENDER STYLED HTML CONTENT */}
          <div className="blog-content pt-4">
            <div 
              className="ql-editor !p-0"
              dangerouslySetInnerHTML={{ __html: selectedBlog.content }} 
            />
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 bg-slate-50 min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <BookOpen className="text-blue-600" size={32} /> 
            Community <span className="text-blue-600">Feed</span>
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Stories and updates from our residents</p>
        </div>
        
        <div className="flex items-center gap-4">
            {!isAdmin && (
              <div className="bg-white p-1.5 rounded-2xl border border-slate-200 flex shadow-sm">
                  <button onClick={() => setViewMode('all')} className={`px-5 py-2 text-sm font-bold rounded-xl transition-all ${viewMode === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>All</button>
                  <button onClick={() => setViewMode('mine')} className={`px-5 py-2 text-sm font-bold rounded-xl transition-all ${viewMode === 'mine' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-50'}`}>My Stories</button>
              </div>
            )}
            <button onClick={handleOpenModal} className={`px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 text-sm transition-all shadow-xl hover:scale-105 active:scale-95 ${isApproved ? 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                <PenTool size={18} /> WRITE STORY
            </button>
        </div>
      </div>

      {!isApproved && !isAdmin && (
        <div className="mb-10 bg-white border-l-4 border-amber-400 p-6 rounded-2xl shadow-sm flex items-center gap-4 animate-pulse">
          <ShieldAlert className="shrink-0 text-amber-500" size={28} />
          <div>
            <p className="font-bold text-slate-900">Verification Required</p>
            <p className="text-slate-500 text-sm">Your account is currently under review. You'll be able to post once approved.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
          <p className="text-slate-400 font-bold animate-pulse">Fetching the latest stories...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {blogs.length > 0 ? blogs.map((blog) => (
            <div key={blog.id} onClick={() => setSelectedBlog(blog)} className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-500 flex flex-col md:flex-row group cursor-pointer relative p-3">
              
              {(isAdmin || viewMode === 'mine') && (
                <button onClick={(e) => triggerDeleteRequest(e, blog.id)} className="absolute top-6 right-6 z-10 p-3 bg-white/80 backdrop-blur-md border border-slate-100 text-red-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white shadow-xl">
                  <Trash2 size={18} />
                </button>
              )}

              <div className="w-full md:w-80 h-64 md:h-72 shrink-0 rounded-[2rem] overflow-hidden bg-slate-100 relative">
                {blog.images?.length > 0 ? (
                  <img src={blog.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Blog" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon size={40} strokeWidth={1} /></div>
                )}
                <div className="absolute top-4 left-4"><StatusBadge status={blog.status} /></div>
              </div>

              <div className="p-8 flex flex-col justify-between flex-1">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 group-hover:text-blue-600 transition-colors uppercase leading-tight line-clamp-2">{blog.title}</h3>
                  <p className="text-slate-500 text-base line-clamp-3 mt-4 leading-relaxed font-medium">
                    {blog.content.replace(/<[^>]*>?/gm, '')}
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-50">
                   <div className="flex items-center gap-3 font-bold text-slate-700 bg-slate-50 px-4 py-2 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                        <User size={16} />
                      </div>
                      <span className="text-sm">{!blog.resident_id ? 'System Admin' : (blog.residents?.full_name || 'Resident')}</span>
                   </div>
                   <span className="text-blue-600 text-sm font-black flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                      CONTINUE READING <ChevronRight size={18} />
                   </span>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
               <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                 <BookOpen size={40} className="text-slate-200" />
               </div>
               <h3 className="text-xl font-bold text-slate-800">No stories found</h3>
               <p className="text-slate-400 mt-2 font-medium">Be the first to share something with the community!</p>
            </div>
          )}
        </div>
      )}

      {/* DELETE MODAL (Same as before) */}
      {deleteId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 text-center animate-in zoom-in duration-300 shadow-2xl">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-500" size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Delete Story?</h3>
            <p className="text-slate-500 font-medium mb-10">This will remove the post permanently for everyone.</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleFinalDelete} disabled={isDeleting} className="w-full bg-red-500 text-white py-4.5 rounded-2xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-100 disabled:opacity-50">
                {isDeleting ? <Loader2 className="animate-spin" /> : "YES, DELETE IT"}
              </button>
              <button onClick={() => setDeleteId(null)} className="w-full bg-slate-100 text-slate-600 py-4.5 rounded-2xl font-bold hover:bg-slate-200 transition-all">Go Back</button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl p-10 overflow-y-auto max-h-[95vh] animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  <PenTool className="text-blue-600" /> Share a Story
                </h2>
                <p className="text-slate-500 text-sm font-medium">Your story will inspire others in the community.</p>
              </div>
              <button onClick={() => !submitting && setShowModal(false)} className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Blog Title</label>
                <input required className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4 px-6 outline-none focus:border-blue-500/50 focus:bg-white transition-all text-lg font-bold" placeholder="Give your story a catchy title..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Write Content</label>
                {/* ✅ IMPROVED RICH TEXT EDITOR STYLING */}
                <div className="bg-white rounded-[1.5rem] overflow-hidden border-2 border-slate-50 focus-within:border-blue-500/50 transition-all">
                  <ReactQuill 
                    theme="snow"
                    modules={modules}
                    placeholder="Tell your story... Use headings and lists to make it readable!"
                    value={formData.content}
                    onChange={(val) => setFormData({...formData, content: val})}
                    className="min-h-[250px] text-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Cover Image</label>
                <label className="flex w-full bg-blue-50/30 border-2 border-dashed border-blue-100 rounded-[2rem] p-10 flex-col items-center cursor-pointer hover:bg-blue-50 transition-all group">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-xl shadow-blue-900/5 mb-4 group-hover:scale-110 transition-transform">
                    <Upload size={28} />
                  </div>
                  <span className="text-sm font-black text-blue-600 uppercase tracking-wider">{selectedFiles.length > 0 ? `${selectedFiles.length} Photos Selected` : "Select Cover Photo"}</span>
                  <input type="file" multiple className="hidden" accept="image/*" onChange={e => setSelectedFiles(Array.from(e.target.files))} />
                </label>
              </div>

              <button disabled={submitting} className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black text-lg hover:bg-blue-700 transition-all flex justify-center items-center gap-3 shadow-2xl shadow-blue-200 active:scale-[0.98]">
                {submitting ? <Loader2 className="animate-spin" size={24} /> : <>PUBLISH STORY <Send size={20} /></>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}