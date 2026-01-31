import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicTenderAPI } from '../api/auth.service';
import { Calendar, ArrowRight, FileText, Search, ShieldCheck } from 'lucide-react';
import Header from '../pages/components/Header';
import Footer from '../pages/components/Footer';

export default function PublicTenderList() {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // State for Header
  const [activePage, setActivePage] = useState('tenders');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadTenders = async () => {
      try {
        const res = await publicTenderAPI.getTenders();
        setTenders(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch tenders");
      } finally {
        setLoading(false);
      }
    };
    loadTenders();
  }, []);

  const filteredTenders = tenders.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="h-screen flex items-center justify-center font-serif italic text-[#a88d5e] animate-pulse tracking-widest bg-[#fbfbfb]">
      Opening Archive...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fbfbfb]">
      <Header 
        activePage={activePage} 
        setActivePage={setActivePage} 
        isMobileMenuOpen={isMobileMenuOpen} 
        setIsMobileMenuOpen={setIsMobileMenuOpen} 
      />

      {/* LUXURY HERO SECTION */}
      <section className="pt-48 pb-20 px-6 bg-[#1f1b16] text-center border-b border-[#a88d5e]/20">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <ShieldCheck size={16} className="text-[#a88d5e]" />
            <span className="text-[#a88d5e] font-bold uppercase text-[10px] tracking-[0.4em] block">
              Procurement Portal
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif italic text-white leading-tight">
            HomeAvatar <span className="text-[#a88d5e]">Opportunities</span>
          </h1>
          <div className="w-12 h-[1px] bg-[#a88d5e] mx-auto my-8"></div>
          
          {/* Refined Search Bar */}
          <div className="relative max-w-lg mx-auto mt-12">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Search active tenders..." 
              className="w-full bg-white/5 border-b border-white/10 py-4 pl-12 pr-4 text-white font-light focus:outline-none focus:border-[#a88d5e] transition-all placeholder:text-gray-600"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* TENDER LISTING */}
      <main className="max-w-6xl mx-auto px-6 py-24">
        
        {/* Table Header - Editorial Style */}
        <div className="hidden md:grid grid-cols-12 px-8 mb-8 text-[11px] font-bold uppercase tracking-[0.2em] text-[#a88d5e]">
          <div className="col-span-6">Opportunity Description</div>
          <div className="col-span-3">Closing Date</div>
          <div className="col-span-3 text-right">Value & Action</div>
        </div>

        {/* Tender Rows */}
        <div className="space-y-6">
          {filteredTenders.map((tender) => (
            <div 
              key={tender.id}
              onClick={() => navigate(`/tenders/${tender.id}`)}
              className="group relative grid grid-cols-1 md:grid-cols-12 items-center bg-white border border-gray-100 p-8 md:px-10 md:py-8 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:-translate-y-1 cursor-pointer overflow-hidden"
            >
              {/* Gold Accent Bar on hover */}
              <div className="absolute left-0 top-0 h-full w-[2px] bg-[#a88d5e] scale-y-0 group-hover:scale-y-100 transition-transform duration-500"></div>

              {/* Title & Status */}
              <div className="col-span-6 flex items-start gap-6">
                <div className="w-12 h-12 border border-gray-100 text-[#a88d5e] flex items-center justify-center shrink-0 group-hover:bg-[#1f1b16] group-hover:border-[#1f1b16] transition-all duration-500">
                  <FileText size={20} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-xl font-serif italic text-[#1f1b16] mb-2 leading-tight">
                    {tender.title}
                  </h3>
                  <div className="flex items-center gap-3">
                   
                    <span className="text-[9px] px-3 py-1 bg-[#a88d5e]/10 text-[#a88d5e] rounded-full font-bold uppercase tracking-widest">
                      {tender.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deadline */}
              <div className="col-span-3 mt-6 md:mt-0 flex flex-col">
                <span className="text-[9px] text-gray-400 uppercase tracking-widest mb-1">Submission Deadline</span>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Calendar size={14} className="text-[#a88d5e]" />
                  <span>
                    {(() => {
                      const timelineData = Array.isArray(tender.tender_timeline) 
                        ? tender.tender_timeline[0] 
                        : tender.tender_timeline;
                      const dateStr = timelineData?.submission_deadline;
                      const d = new Date(dateStr);
                      return d instanceof Date && !isNaN(d) 
                        ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                        : "To be announced";
                    })()}
                  </span>
                </div>
              </div>

              {/* Budget & Button */}
              <div className="col-span-3 mt-6 md:mt-0 text-right flex flex-col items-end gap-3">
                <span className="text-lg font-serif italic text-[#1f1b16]">
                  ₹{parseFloat(tender.budget_estimate).toLocaleString('en-IN')}
                </span>
                <button className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#a88d5e] group-hover:text-[#1f1b16] transition-all">
                  View Proposal <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform duration-500" />
                </button>
              </div>
            </div>
          ))}

          {filteredTenders.length === 0 && (
            <div className="py-32 text-center border border-dashed border-gray-200">
              <p className="font-serif italic text-gray-400 text-lg uppercase tracking-widest">No matching opportunities found</p>
            </div>
          )}
        </div>

        {/* Contact Note */}
        <div className="mt-20 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">
                Direct inquiries regarding HomeAvatar procurement to the administration office.
            </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}