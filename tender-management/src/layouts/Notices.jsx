import React, { useState, useEffect } from 'react';
import { communityAPI } from '../api/auth.service';
import Header from '../pages/components/Header';
import Footer from '../pages/components/Footer';
import { Bell, Calendar, ChevronRight, Search, Megaphone, X, AlertCircle, Info, Users, PartyPopper } from 'lucide-react';

// Configuration to map Backend Keywords to Frontend Icons and Labels
const TYPE_MAP = {
  ALERT: { label: 'Alert', icon: AlertCircle, color: 'bg-red-100 text-red-600', border: 'border-red-200' },
  INFO: { label: 'Info', icon: Info, color: 'bg-blue-100 text-blue-600', border: 'border-blue-200' },
  MEETING: { label: 'Meeting', icon: Users, color: 'bg-purple-100 text-purple-600', border: 'border-purple-200' },
  EVENT: { label: 'Event', icon: PartyPopper, color: 'bg-orange-100 text-orange-600', border: 'border-orange-200' }
};

const Notices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [selectedNotice, setSelectedNotice] = useState(null);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true);
        const res = await communityAPI.getNotices();
        // Standardizing data access
        const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
        setNotices(data);
      } catch (error) {
        console.error("Error fetching notices:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, []);

  // Filter Logic using the exact keywords from your Admin panel
  const filteredNotices = filter === 'All' 
    ? notices 
    : notices.filter(n => n.notice_type === filter.toUpperCase());

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-neutral-500 font-bold">Loading Bulletin Board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans">
      <Header />
      
      <main className="pt-32 pb-20 px-4 max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-yellow-400 p-2 rounded-xl">
              <Megaphone className="w-6 h-6 text-neutral-900" />
            </div>
            <span className="font-black uppercase tracking-[0.2em] text-xs text-neutral-400">Bulletin Board</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-neutral-900 tracking-tighter">
            Community <br/> <span className="text-yellow-500">Notices.</span>
          </h1>
        </div>

        {/* Filters - Updated to match ALERT, INFO, MEETING, EVENT */}
        <div className="flex gap-2 mb-10 overflow-x-auto pb-2 scrollbar-hide">
          {['All', 'Alert', 'Info', 'Meeting', 'Event'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-6 py-2.5 rounded-full text-sm font-black transition-all border whitespace-nowrap ${
                filter === tab 
                ? 'bg-neutral-900 text-white border-neutral-900 shadow-lg scale-105' 
                : 'bg-white text-neutral-500 border-neutral-100 hover:border-neutral-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Notice List */}
        <div className="space-y-4">
          {filteredNotices.length > 0 ? (
            filteredNotices.map((notice) => {
              const config = TYPE_MAP[notice.notice_type] || TYPE_MAP.INFO;
              const Icon = config.icon;

              return (
                <div 
                  key={notice.id} 
                  onClick={() => setSelectedNotice(notice)}
                  className="group bg-white border border-neutral-100 p-6 md:p-8 rounded-[2.5rem] hover:shadow-2xl hover:shadow-neutral-200/50 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${config.color}`}>
                        <Icon size={12} />
                        {notice.notice_type}
                      </span>
                      <div className="flex items-center gap-1.5 text-neutral-400 font-bold text-xs">
                        <Calendar size={12} />
                        {new Date(notice.display_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <h3 className="text-2xl font-black text-neutral-900 mb-2 group-hover:text-yellow-600 transition-colors">
                      {notice.title}
                    </h3>
                    <p className="text-neutral-500 font-medium leading-relaxed max-w-2xl line-clamp-1">
                      {notice.content}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-neutral-50 flex items-center justify-center group-hover:bg-yellow-400 transition-colors">
                        <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-neutral-900" />
                     </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-24 bg-neutral-50 rounded-[3rem] border-2 border-dashed border-neutral-200">
               <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Search className="w-6 h-6 text-neutral-300" />
              </div>
              <p className="text-neutral-900 font-black text-xl mb-1">Quiet on the front!</p>
              <p className="text-neutral-400 font-bold uppercase text-xs tracking-widest">No {filter} notices found</p>
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedNotice(null)}></div>
          
          <div className="relative bg-white w-full max-w-2xl rounded-[3rem] p-8 md:p-12 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelectedNotice(null)} className="absolute top-8 right-8 p-2 hover:bg-neutral-100 rounded-full transition-colors">
              <X className="w-6 h-6 text-neutral-400" />
            </button>
            
            <div className="mb-6">
              <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4 inline-block ${TYPE_MAP[selectedNotice.notice_type]?.color || TYPE_MAP.INFO.color}`}>
                {selectedNotice.notice_type}
              </span>
              <h2 className="text-4xl font-black text-neutral-900 tracking-tight leading-tight mb-4">
                {selectedNotice.title}
              </h2>
              <div className="flex items-center gap-2 text-neutral-400 font-bold text-sm">
                <Calendar size={16} />
                {new Date(selectedNotice.display_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>

            <div className="h-px bg-neutral-100 w-full mb-8"></div>
            
            <div className="prose prose-neutral max-w-none">
              <p className="text-neutral-600 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                {selectedNotice.content}
              </p>
            </div>

            <button 
              onClick={() => setSelectedNotice(null)}
              className="mt-12 w-full bg-neutral-900 text-white py-5 rounded-2xl font-black hover:bg-yellow-400 hover:text-neutral-900 transition-all active:scale-95 shadow-lg"
            >
              GOT IT
            </button>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default Notices;