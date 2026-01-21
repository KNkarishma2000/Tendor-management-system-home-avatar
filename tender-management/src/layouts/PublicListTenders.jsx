import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicTenderAPI } from '../api/auth.service';
import { Calendar, ArrowRight, FileText, Search } from 'lucide-react';
import Header from '../pages/components/Header'; // Ensure path is correct
import Footer from '../pages/components/Footer'; // Ensure path is correct

export default function PublicTenderList() {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // State to manage active link in Header (if your Header uses it)
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
    <div className="h-screen flex items-center justify-center font-black animate-pulse text-xl uppercase italic">
      Loading Open Tenders...
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* 1. Header with required props */}
      <Header 
        activePage={activePage} 
        setActivePage={setActivePage} 
        isMobileMenuOpen={isMobileMenuOpen} 
        setIsMobileMenuOpen={setIsMobileMenuOpen} 
      />

      {/* 2. Main Content Wrapper - Added pt-32 to account for fixed header */}
      <main className="max-w-6xl mx-auto p-6 pt-32 pb-20">
        
        {/* Header Title Area */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Live Tenders</h1>
            <p className="text-neutral-500 font-bold">Public procurement & opportunities</p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input 
              type="text"
              placeholder="Search by title..."
              className="w-full pl-12 pr-4 py-3 bg-neutral-100 border-none rounded-2xl font-bold text-sm focus:ring-2 focus:ring-yellow-400 outline-none transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table Header (Hidden on small screens) */}
        <div className="hidden md:grid grid-cols-12 px-8 mb-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">
          <div className="col-span-5">Tender Details</div>
          <div className="col-span-3">Deadline</div>
          <div className="col-span-2">Estimate</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        {/* Tender Rows */}
        <div className="space-y-3">
          {filteredTenders.map((tender) => (
            <div 
              key={tender.id}
              onClick={() => navigate(`/tenders/${tender.id}`)}
              className="group grid grid-cols-1 md:grid-cols-12 items-center bg-white border border-neutral-100 p-4 md:px-8 md:py-6 rounded-3xl hover:border-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer"
            >
              {/* Title & Type */}
              <div className="col-span-5 flex items-center gap-4">
                <div className="w-10 h-10 bg-neutral-900 text-white rounded-xl flex items-center justify-center shrink-0">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="font-black text-neutral-900 group-hover:underline leading-tight">
                    {tender.title}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-black uppercase mt-1 inline-block">
                    {tender.status}
                  </span>
                </div>
              </div>

              {/* Deadline */}
              <div className="col-span-3 mt-4 md:mt-0 flex items-center gap-2">
                <Calendar size={14} className="text-neutral-400" />
                <span className="text-sm font-bold text-neutral-600">
                  {new Date(tender.tender_timeline?.[0]?.submission_deadline).toLocaleDateString('en-IN', {
                     day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </span>
              </div>

              {/* Budget */}
              <div className="col-span-2 mt-2 md:mt-0">
                <span className="text-sm font-black text-neutral-900">
                  ₹{parseFloat(tender.budget_estimate).toLocaleString()}
                </span>
              </div>

              {/* Action */}
              <div className="col-span-2 mt-4 md:mt-0 text-right">
                <button className="inline-flex items-center gap-2 bg-neutral-100 group-hover:bg-black group-hover:text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase transition-colors">
                  View Details <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}

          {filteredTenders.length === 0 && (
            <div className="py-20 text-center border-2 border-dashed border-neutral-200 rounded-[2rem]">
              <p className="text-neutral-400 font-bold italic">No tenders matching your search.</p>
            </div>
          )}
        </div>
      </main>

      {/* 3. Footer */}
      <Footer />
    </div>
  );
}