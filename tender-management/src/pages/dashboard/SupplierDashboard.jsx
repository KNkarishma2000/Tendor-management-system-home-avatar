import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Gavel, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  Search,
  TrendingUp,
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tenderAdminAPI, communityAPI } from '../../api/auth.service'; 

export default function SupplierDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeTenders: 0,
    myBids: 0,
    wonTenders: 0,
    pendingReviews: 0
  });
  const [tenders, setTenders] = useState([]);
  const [myRecentBids, setMyRecentBids] = useState([]);

  useEffect(() => {
  const loadSupplierData = async () => {
    try {
      setLoading(true);
      
      const [tendersRes, bidsRes] = await Promise.all([
        tenderAdminAPI.getAllTenders(), 
        communityAPI.getNotices() 
      ]);

      // 1. SAFE DATA EXTRACTION
      // Often Axios data is nested: tendersRes.data.data
      const allTenders = Array.isArray(tendersRes?.data) 
        ? tendersRes.data 
        : (tendersRes?.data?.data || []);

      // 2. SAFE FILTERING
      // Ensure allTenders is an array before calling .filter
      const activeTenders = allTenders.filter(t => 
        t && t.status && t.status.toLowerCase() === 'published'
      );
      
      setStats({
        activeTenders: activeTenders.length,
        myBids: 12, 
        wonTenders: 3,
        pendingReviews: 5
      });

      setTenders(activeTenders.slice(0, 5));
      
      // ... rest of your code
    } catch (error) {
      console.error("Error loading supplier dashboard:", error);
    } finally {
      setLoading(false);
    }
  };
  loadSupplierData();
}, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-700">
      {/* Header Section */}
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 tracking-tight">
            SUPPLIER <span className="text-blue-600">PORTAL</span>
          </h1>
          <p className="text-neutral-500 font-bold italic">Bidding, Contracts, and Opportunities.</p>
        </div>
        <button 
          onClick={() => navigate('/supplier/bids')}
          className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <Search size={18} /> EXPLORE TENDERS
        </button>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard icon={FileText} label="Open Tenders" value={stats.activeTenders} sub="New Opportunities" bg="bg-blue-50" color="text-blue-600" />
        <StatCard icon={Gavel} label="Total Bids" value={stats.myBids} sub="Submitted by you" bg="bg-purple-50" color="text-purple-600" />
        <StatCard icon={CheckCircle2} label="Contracts Won" value={stats.wonTenders} sub="Active Projects" bg="bg-green-50" color="text-green-600" />
        <StatCard icon={Clock} label="Pending" value={stats.pendingReviews} sub="Evaluation Stage" bg="bg-orange-50" color="text-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Section: Available Tenders */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-neutral-400">Tender Board</h2>
            <div className="h-px flex-1 bg-neutral-100 mx-4"></div>
          </div>

          {tenders.map((tender) => (
            <div key={tender.id} className="bg-white border border-neutral-100 rounded-[2rem] p-6 hover:shadow-xl transition-all duration-500 group">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                      REF: {tender.tender_number || 'TND-2026'}
                    </span>
                    <span className="text-xs font-bold text-neutral-400 flex items-center gap-1">
                      <Clock size={14} /> Ends: {new Date(tender.submission_deadline).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-neutral-900 mb-2 group-hover:text-blue-600 transition-colors uppercase">
                    {tender.title}
                  </h3>
                  <p className="text-neutral-500 text-sm font-medium line-clamp-2 mb-4">
                    {tender.description}
                  </p>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1 text-[11px] font-black text-neutral-400">
                      <TrendingUp size={14} className="text-green-500" /> EST. BUDGET: ₹{tender.budget_estimation}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <button 
                    onClick={() => navigate(`/supplier/tenders/${tender.id}`)}
                    className="w-full md:w-auto bg-neutral-900 text-white px-8 py-4 rounded-2xl font-black text-xs hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                  >
                    VIEW & BID <ExternalLink size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar: Status & Bids */}
        <div className="space-y-8">
          <div className="bg-[#1A1A1A] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
            <h3 className="text-lg font-black uppercase tracking-tighter mb-6 flex items-center gap-2">
              <Gavel className="text-blue-400" size={20} /> Application Status
            </h3>
            <div className="space-y-6 relative z-10">
              {myRecentBids.map((bid) => (
                <div key={bid.id} className="group cursor-pointer border-b border-white/5 pb-4 last:border-0">
                  <h4 className="font-bold text-sm group-hover:text-blue-400 transition-colors mb-2 truncate">
                    {bid.title}
                  </h4>
                  <div className="flex justify-between items-center">
                    <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase ${
                      bid.status === 'Awarded' ? 'bg-green-500 text-white' : 
                      bid.status === 'Rejected' ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-blue-400'
                    }`}>
                      {bid.status}
                    </span>
                    <span className="text-xs font-bold text-neutral-500">₹{bid.price}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 bg-white/5 hover:bg-white/10 py-4 rounded-2xl font-bold text-sm transition-all border border-white/5">
              View All Applications
            </button>
          </div>

          <div className="bg-yellow-400 rounded-[2.5rem] p-8 text-black shadow-xl shadow-yellow-400/20">
            <h3 className="text-xl font-black mb-2 flex items-center gap-2 uppercase tracking-tighter">
              Bidding Guide
            </h3>
            <p className="font-bold text-sm opacity-70 mb-6 italic">Ensure all technical documents are signed before submission.</p>
            <button className="bg-black text-white px-6 py-3 rounded-xl font-black text-xs uppercase hover:bg-neutral-800 transition-all">
              Download Docs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ icon: Icon, label, value, sub, bg, color }) => (
  <div className={`${bg} p-6 rounded-[2rem] border border-white/50 hover:shadow-lg transition-all cursor-pointer group`}>
    <div className={`p-3 rounded-2xl bg-white w-fit mb-4 shadow-sm group-hover:scale-110 transition-transform ${color}`}>
      <Icon size={24} />
    </div>
    <div className="text-3xl font-black text-neutral-900">{value}</div>
    <div className="text-xs font-black text-neutral-400 uppercase tracking-widest">{label}</div>
    <div className="mt-1 text-[10px] font-bold text-neutral-400 italic">{sub}</div>
  </div>

);
