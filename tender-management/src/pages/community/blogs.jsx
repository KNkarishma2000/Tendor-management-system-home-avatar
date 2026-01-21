import React, { useState, useEffect } from 'react';
import { 
  PenTool, X, Upload, Send, User, Loader2, BookOpen, 
  Calendar, ChevronRight, Image as ImageIcon, ArrowLeft 
} from 'lucide-react';
import { communityAPI } from '../../api/auth.service';
import toast from 'react-hot-toast';

export default function ResidentBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const res = await communityAPI.getBlogs();
      const actualBlogs = res.data?.data || res.data || [];
      setBlogs(Array.isArray(actualBlogs) ? actualBlogs : []);
    } catch (err) {
      toast.error("Could not load community stories");
    } finally {
      setLoading(false);
    }
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
      toast.success("Story submitted for approval!");
      
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

  // Helper to render Status Badge UI
  const StatusBadge = ({ status }) => {
    const configs = {
      pending: "bg-amber-50 text-amber-700 border-amber-100",
      approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
      rejected: "bg-red-50 text-red-700 border-red-100"
    };
    
    const labels = {
      pending: "Pending",
      approved: "Live",
      rejected: "Rejected"
    };

    return (
      <span className={`${configs[status] || configs.pending} text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider`}>
        {labels[status] || "Pending"}
      </span>
    );
  };

  // --- FULL BLOG DETAIL VIEW ---
  if (selectedBlog) {
    return (
      <div className=" md:p-1 min-h-screen animate-in fade-in duration-500">
        <button 
          onClick={() => setSelectedBlog(null)}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-800 font-medium mb-8 transition-all text-sm group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> BACK TO FEED
        </button>

        <article className="space-y-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                <User size={20} />
              </div>
              <div className="text-sm">
                <p className="font-bold text-slate-900">{selectedBlog.residents?.full_name || 'Resident'}</p>
                <p className="text-slate-500 flex items-center gap-2">
                  {new Date(selectedBlog.created_at).toLocaleDateString()}
                  <span>•</span>
                  1 min read
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
               {/* Detail View Status Badge */}
               <StatusBadge status={selectedBlog.status} />
               <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-3 py-1 rounded uppercase tracking-widest">
                 Story
               </span>
            </div>
          </div>

          

          <div className="w-full rounded-2xl overflow-hidden bg-slate-50 shadow-sm">
            {selectedBlog.images && selectedBlog.images.length > 0 ? (
              <img 
                src={selectedBlog.images[0]} 
                className="w-full h-auto object-cover max-h-[500px]" 
                alt="Story Featured" 
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-200">
                <ImageIcon size={64} strokeWidth={1} />
              </div>
            )}
          </div>
<div className="text-center md:text-left mb-1">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight uppercase">
              {selectedBlog.title}
            </h1>
          </div>
          <div className=" mx-auto pt-3">
            <div className="prose prose-slate prose-lg max-w-none">
              <p className="text-slate-700 text-lg leading-relaxed whitespace-pre-wrap font-light">
                {selectedBlog.content}
              </p>
            </div>
            
            {selectedBlog.images && selectedBlog.images.length > 1 && (
              <div className="grid grid-cols-2 gap-4 mt-12">
                {selectedBlog.images.slice(1).map((img, idx) => (
                  <div key={idx} className="rounded-xl overflow-hidden h-64 bg-slate-100">
                     <img src={img} className="w-full h-full object-cover" alt={`Gallery ${idx}`} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookOpen className="text-blue-600" size={28} /> Community Feed
          </h1>
          <p className="text-slate-500 font-medium mt-1">Updates and stories shared by your neighborhood.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all flex items-center gap-2 text-sm"
        >
          <PenTool size={16} /> Write a Story
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
          <p className="text-slate-400 text-sm font-medium tracking-wide">Loading community stories...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {blogs.length > 0 ? (
            blogs.map((blog) => (
              <div 
                key={blog.id} 
                onClick={() => setSelectedBlog(blog)}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col md:flex-row group"
              >
                <div className="w-full md:w-72 h-48 md:h-56 shrink-0 relative overflow-hidden bg-slate-100">
                  {blog.images && blog.images.length > 0 ? (
                    <img src={blog.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon size={32} /></div>
                  )}
                  
                  {/* Floating Status Badge on Card */}
                  <div className="absolute top-3 left-3">
                    <StatusBadge status={blog.status} />
                  </div>
                </div>

                <div className="p-6 md:p-8 flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">{blog.title}</h3>
                      <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 shrink-0"><Calendar size={12} /> {new Date(blog.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-4">{blog.content}</p>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 border border-slate-100"><User size={14} /></div>
                      <span className="text-xs font-semibold text-slate-700">{blog.residents?.full_name || 'Resident'}</span>
                    </div>
                    <span className="text-blue-600 text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read more <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-24 bg-white rounded-3xl border border-slate-200">
               <BookOpen size={48} className="mx-auto text-slate-200 mb-4" />
               <p className="text-slate-400 font-semibold">No stories have been shared yet.</p>
            </div>
          )}
        </div>
      )}

      {/* --- MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden p-8 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <PenTool className="text-blue-600" size={20} /> Share a Story
              </h2>
              <button onClick={() => !submitting && setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Title</label>
                <input 
                  required className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="Enter a title..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Content</label>
                <textarea 
                  required rows="4" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                  placeholder="Tell your neighbors something..." value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Photo</label>
                <label className="flex w-full bg-slate-50 border border-dashed border-slate-300 rounded-xl p-6 flex-col items-center justify-center cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all group">
                  <Upload className="text-slate-400 group-hover:text-blue-600 mb-2" size={20} />
                  <span className="text-xs font-semibold text-slate-500">
                    {selectedFiles.length > 0 ? `${selectedFiles.length} Photos Selected` : "Click to upload photos"}
                  </span>
                  <input type="file" multiple className="hidden" accept="image/*" onChange={e => setSelectedFiles(Array.from(e.target.files))} />
                </label>
              </div>

              <button 
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:bg-slate-200 transition-all shadow-lg shadow-blue-100 mt-2"
              >
                {submitting ? <Loader2 className="animate-spin" size={18} /> : <>Post Story <Send size={16} /></>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );

}



