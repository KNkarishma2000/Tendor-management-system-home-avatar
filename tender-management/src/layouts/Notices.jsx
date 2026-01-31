import React, { useState, useEffect } from 'react';
import { communityAPI } from '../api/auth.service';
import Header from '../pages/components/Header'; // Fixed path based on your Header file
import Footer from '../pages/components/Footer';
import { Calendar, ChevronRight, X, Search, Sparkles } from 'lucide-react';

const TYPE_MAP = {
  ALERT: { label: 'Urgent', color: 'text-red-500 bg-red-50/50' },
  INFO: { label: 'Briefing', color: 'text-[#a88d5e] bg-[#a88d5e]/5' },
  MEETING: { label: 'Assembly', color: 'text-purple-500 bg-purple-50/50' },
  EVENT: { label: 'Social', color: 'text-orange-500 bg-orange-50/50' }
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

  const filteredNotices = filter === 'All' 
    ? notices 
    : notices.filter(n => n.notice_type === filter.toUpperCase());

  if (loading) return (
    <div className="h-screen flex items-center justify-center font-serif italic text-[#a88d5e] animate-pulse tracking-widest bg-[#fbfbfb]">
      Gathering Communications...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fbfbfb]">
      <Header />
      
      {/* MOBILE OPTIMIZED HERO */}
      <section className="pt-32 pb-12 md:pt-48 md:pb-20 px-6 bg-[#1f1b16] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-[#a88d5e]/5 rounded-full blur-3xl"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="flex items-center justify-center gap-2 md:gap-3 mb-4 md:mb-6">
            <Sparkles size={14} className="text-[#a88d5e]" />
            <span className="text-[#a88d5e] font-bold uppercase text-[8px] md:text-[10px] tracking-[0.3em] md:tracking-[0.5em]">
              The HomeAvatar Gazette
            </span>
            <Sparkles size={14} className="text-[#a88d5e]" />
          </div>
          
          <h1 className="text-3xl md:text-7xl font-serif italic text-white leading-tight mb-6 md:mb-8">
            Community <span className="text-[#a88d5e]">Bulletins</span>
          </h1>
          
          <div className="w-12 md:w-16 h-[1px] bg-[#a88d5e]/40 mx-auto mb-8 md:mb-12"></div>

          {/* Scrollable Filters for Mobile */}
          <div className="flex justify-start md:justify-center gap-6 overflow-x-auto pb-4 scrollbar-hide px-2">
            {['All', 'Alert', 'Info', 'Meeting', 'Event'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] transition-all relative pb-2 whitespace-nowrap ${
                  filter === tab ? 'text-[#a88d5e]' : 'text-gray-500 hover:text-white'
                }`}
              >
                {tab}
                {filter === tab && (
                  <div className="absolute bottom-0 left-0 w-full h-[1px] bg-[#a88d5e]"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* RESPONSIVE NOTICE LISTING */}
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-12 md:py-24">
        <div className="grid grid-cols-1 gap-4 md:gap-8">
          {filteredNotices.length > 0 ? (
            filteredNotices.map((notice) => {
              const config = TYPE_MAP[notice.notice_type] || TYPE_MAP.INFO;
              
              return (
                <div 
                  key={notice.id} 
                  onClick={() => setSelectedNotice(notice)}
                  className="group relative bg-white border border-gray-100 p-6 md:p-10 transition-all hover:shadow-md cursor-pointer flex flex-col md:flex-row gap-4 md:gap-8 items-start md:items-center justify-between"
                >
                  <div className="flex-1 space-y-3 md:space-y-4 w-full">
                    <div className="flex items-center justify-between md:justify-start gap-4">
                      <span className={`px-2 py-0.5 text-[8px] md:text-[9px] font-bold uppercase tracking-widest border border-current ${config.color}`}>
                        {config.label}
                      </span>
                      <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <Calendar size={12} className="text-[#a88d5e]" />
                        {new Date(notice.display_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <h3 className="text-xl md:text-3xl font-serif italic text-[#1f1b16] leading-tight">
                      {notice.title}
                    </h3>
                    
                    <p className="text-gray-500 text-sm md:text-base font-light line-clamp-2 md:line-clamp-1 italic font-serif">
                      {notice.content}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-end w-full md:w-auto gap-4">
                    <span className="hidden md:inline text-[10px] font-bold uppercase tracking-widest text-[#a88d5e] opacity-0 group-hover:opacity-100 transition-all">
                      Read Entry
                    </span>
                    <div className="w-10 h-10 md:w-12 md:h-12 border border-gray-100 flex items-center justify-center group-hover:bg-[#1f1b16] transition-all">
                      <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-gray-300 group-hover:text-[#a88d5e]" />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 md:py-32 border border-dashed border-gray-200">
              <Search className="w-8 h-8 md:w-10 md:h-10 text-gray-200 mx-auto mb-4 md:mb-6" strokeWidth={1} />
              <p className="font-serif italic text-gray-400 text-sm md:text-lg tracking-widest uppercase">The archive is silent</p>
            </div>
          )}
        </div>
      </main>

      {/* MOBILE COMPATIBLE MODAL */}
      {selectedNotice && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-[#1f1b16]/95 backdrop-blur-md" onClick={() => setSelectedNotice(null)}></div>
          
          <div className="relative bg-white w-full max-w-2xl p-6 md:p-16 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelectedNotice(null)} className="absolute top-4 right-4 md:top-8 md:right-8 text-gray-400 hover:text-[#1f1b16]">
              <X size={24} strokeWidth={1} />
            </button>
            
            <div className="mb-6 md:mb-10 text-center">
              <span className={`px-4 py-1 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] mb-4 md:mb-6 inline-block ${TYPE_MAP[selectedNotice.notice_type]?.color || TYPE_MAP.INFO.color}`}>
                {selectedNotice.notice_type}
              </span>
              <h2 className="text-2xl md:text-5xl font-serif italic text-[#1f1b16] leading-tight mb-4 md:mb-6">
                {selectedNotice.title}
              </h2>
              <div className="flex items-center justify-center gap-2 text-gray-400 font-bold text-[9px] md:text-[10px] uppercase tracking-[0.2em]">
                <Calendar size={12} className="text-[#a88d5e]" />
                {new Date(selectedNotice.display_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>

            <div className="prose prose-neutral max-w-none">
              <p className="text-gray-600 text-sm md:text-lg leading-relaxed whitespace-pre-wrap font-serif italic">
                {selectedNotice.content}
              </p>
            </div>

            <button 
              onClick={() => setSelectedNotice(null)}
              className="mt-8 md:mt-16 w-full border border-[#1f1b16] py-4 md:py-5 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-[#1f1b16] hover:text-white transition-all"
            >
              Acknowledge Bulletin
            </button>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default Notices;