import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Calendar, 
  Search, 
  Loader2, 
  Bell, 
  Info,
  Clock 
} from 'lucide-react';
import { communityAPI } from '../../api/auth.service';
import toast from 'react-hot-toast';

export default function ResidentNotices() {
  const [notices, setNotices] = useState([]);
  const [filteredNotices, setFilteredNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchNotices();
  }, []);

  // Filter logic when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredNotices(notices);
    } else {
      const lowerTerm = searchTerm.toLowerCase();
      const filtered = notices.filter(n => 
        n.title?.toLowerCase().includes(lowerTerm) || 
        n.content?.toLowerCase().includes(lowerTerm)
      );
      setFilteredNotices(filtered);
    }
  }, [searchTerm, notices]);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await communityAPI.getNotices();
      const data = res.data?.data || res.data || [];
      setNotices(data);
      setFilteredNotices(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load notices");
    } finally {
      setLoading(false);
    }
  };

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Date N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className=" md:p-2 bg-slate-50 min-h-screen">
      
      {/* --- Header Section --- */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 mb-10 text-white shadow-xl shadow-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-black uppercase tracking-tight flex items-center justify-center md:justify-start gap-3">
              <Megaphone className="text-yellow-400" size={32} /> Noticeboard
            </h1>
            <p className="text-slate-400 mt-1 font-medium">Official announcements and updates from the society management.</p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border-none rounded-xl bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 backdrop-blur-sm transition-all"
              placeholder="Search notices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* --- Content Area --- */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="animate-spin text-slate-400 mb-4" size={32} />
          <p className="text-slate-400 font-medium">Fetching updates...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredNotices.length > 0 ? (
            filteredNotices.map((notice) => (
              <div 
                key={notice.id} 
                className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden"
              >
                {/* Decorative top border */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-amber-500"></div>

                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <Calendar size={14} />
                    {formatDate(notice.created_at)}
                  </div>
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight flex items-center gap-1">
                     <Bell size={10} /> Official
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors">
                  {notice.title}
                </h3>

                <div className="prose prose-slate prose-sm max-w-none">
                  <p className="text-slate-500 leading-relaxed whitespace-pre-wrap">
                    {notice.content}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                         <Info size={16} className="text-slate-400" />
                      </div>
                      <span className="text-xs font-bold text-slate-400">Management Team</span>
                   </div>
                   <div className="text-[10px] text-slate-300 font-bold flex items-center gap-1">
                      <Clock size={10} /> Posted recently
                   </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-24 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell size={32} className="text-slate-300" />
              </div>
              <h3 className="text-slate-800 font-bold text-lg">No notices found</h3>
              <p className="text-slate-500 text-sm mt-1">
                {searchTerm ? "Try adjusting your search terms." : "The noticeboard is currently empty."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}