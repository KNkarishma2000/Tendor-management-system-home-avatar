import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, X, Loader2, 
  AlertCircle, Info, Users, Calendar, Trash 
} from 'lucide-react';
// FIX: Ensure this matches the file name where your apiClient and communityAPI are defined
import { communityAPI } from '../../api/auth.service'; 
import toast from 'react-hot-toast';

const TYPE_CONFIG = {
  ALERT: { icon: AlertCircle, color: 'bg-red-50 text-red-500' },
  INFO: { icon: Info, color: 'bg-blue-50 text-blue-500' },
  MEETING: { icon: Users, color: 'bg-purple-50 text-purple-500' },
  EVENT: { icon: Calendar, color: 'bg-orange-50 text-orange-500' }
};

export default function NoticeManagement() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // Stores ID of notice to delete
  
  const [formData, setFormData] = useState({
    title: '',
    notice_type: 'INFO',
    display_date: '',
    content: ''
  });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await communityAPI.getNotices();
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setNotices(data);
    } catch (error) {
      toast.error("Failed to load notices");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await communityAPI.deleteNotice(deleteConfirm);
      toast.success("Notice deleted successfully");
      setDeleteConfirm(null);
      fetchNotices();
    } catch (error) {
      toast.error("Could not delete notice");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await communityAPI.createNotice(formData);
      toast.success("Notice posted successfully");
      setIsModalOpen(false);
      setFormData({ title: '', notice_type: 'INFO', display_date: '', content: '' });
      fetchNotices();
    } catch (error) {
      toast.error("Failed to post notice");
    }
  };

  const formatNoticeDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase();
  };

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="animate-spin text-yellow-400 w-12 h-12" />
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 uppercase tracking-tight">Manage Notices</h1>
          <p className="text-neutral-400 font-bold text-sm">Broadcast updates to all residents.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-neutral-800 transition-all shadow-lg"
        >
          <Plus size={18} />
          NEW NOTICE
        </button>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-neutral-100 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-50">
              <th className="px-8 py-6 text-[10px] font-black uppercase text-neutral-400 tracking-widest">Type</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase text-neutral-400 tracking-widest">Title</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase text-neutral-400 tracking-widest text-center">Date</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase text-neutral-400 tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {notices.map((notice) => {
              const config = TYPE_CONFIG[notice.notice_type] || TYPE_CONFIG.INFO;
              const Icon = config.icon;

              return (
                <tr key={notice.id} className="group hover:bg-neutral-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${config.color}`}>
                      <Icon size={12} />
                      {notice.notice_type}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="font-black text-neutral-800">{notice.title}</div>
                    <div className="text-[11px] text-neutral-400 font-bold line-clamp-1">{notice.content}</div>
                  </td>
                  <td className="px-8 py-6 text-center text-sm font-bold text-neutral-500">
                    {formatNoticeDate(notice.display_date)}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => setDeleteConfirm(notice.id)}
                      className="p-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* DELETE CONFIRMATION POPUP */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash size={32} />
            </div>
            <h3 className="text-xl font-black text-neutral-900 mb-2">Are you sure?</h3>
            <p className="text-neutral-500 font-bold text-sm mb-8">This notice will be permanently removed from the resident dashboard.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-6 py-3 rounded-xl font-black text-sm bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-all"
              >
                CANCEL
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 px-6 py-3 rounded-xl font-black text-sm bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg shadow-red-200"
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MODAL (Same as before) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm">
           <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl relative animate-in zoom-in-95 duration-200">
             {/* ... Form Content ... */}
             <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-neutral-400 p-2 hover:bg-neutral-100 rounded-full"><X size={20} /></button>
             <h2 className="text-2xl font-black text-neutral-900 mb-8">New Notice</h2>
             <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Title</label>
                  <input required type="text" className="w-full bg-neutral-50 border-none rounded-2xl px-6 py-4 font-bold text-neutral-800"
                    value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder='eg. water tank cleaning'/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Type</label>
                    <select className="w-full bg-neutral-50 border-none rounded-2xl px-6 py-4 font-bold text-neutral-800"
                      value={formData.notice_type} onChange={(e) => setFormData({...formData, notice_type: e.target.value})}>
                      <option value="ALERT">Alert</option>
                      <option value="INFO">Info</option>
                      <option value="MEETING">Meeting</option>
                      <option value="EVENT">Event</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Notice Date</label>
                    <input required type="date" className="w-full bg-neutral-50 border-none rounded-2xl px-6 py-4 font-bold text-neutral-800"
                      value={formData.display_date} onChange={(e) => setFormData({...formData, display_date: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Content Details</label>
                  <textarea rows="3" className="w-full bg-neutral-50 border-none rounded-2xl px-6 py-4 font-bold text-neutral-800"
                    value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} placeholder='eg. some important details'/>
                </div>
                <button type="submit" className="w-full bg-neutral-900 text-white py-5 rounded-2xl font-black text-sm hover:bg-neutral-800 transition-all shadow-xl mt-4">
                  POST NOTICE
                </button>
             </form>
           </div>
        </div>
      )}
    </div>
  );
}