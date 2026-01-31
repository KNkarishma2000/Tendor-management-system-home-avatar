import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, FileText, ShieldCheck, Download, 
  IndianRupee, Calendar, Clock, TrendingUp, 
  UserCheck, AlertCircle, ListChecks, LockKeyhole, ArrowRight
} from 'lucide-react';
import { publicTenderAPI, tenderAdminAPI } from '../api/auth.service'; 
import Header from '../pages/components/Header';
import Footer from '../pages/components/Footer';
import toast from 'react-hot-toast';

export default function PublicTenderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tender, setTender] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    const fetchTender = async () => {
      try {
        setLoading(true);
        const res = await publicTenderAPI.getTenderDetails(id);
        // Debugging: Check your console to see the exact structure
        console.log("Tender Data from DB:", res.data.data);
        setTender(res.data.data);
      } catch (error) {
        toast.error("Tender details not found");
        navigate('/tenders');
      } finally {
        setLoading(false);
      }
    };
    fetchTender(); 
  }, [id, navigate]);

  const handleDownload = async (path) => {
    try {
      const res = await tenderAdminAPI.getTenderFileUrl(path);
      if (res.data.success) {
        window.open(res.data.url, '_blank');
      }
    } catch (error) {
      toast.error("Please login to download official documents");
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center font-black animate-pulse text-xl uppercase italic">
      Opening Tender File...
    </div>
  );

  /** * DATA MAPPING FIX:
   * Based on your Supabase screenshot, tender_timeline is a related table.
   * If your API uses Supabase's standard join, it will be an array.
   */
  const timeline = Array.isArray(tender?.tender_timeline) 
    ? tender.tender_timeline[0] 
    : (tender?.tender_timeline || {});

  const eligibility = Array.isArray(tender?.tender_eligibility_criteria)
    ? tender.tender_eligibility_criteria[0]
    : (tender?.tender_eligibility_criteria || {});

  const documents = tender?.tender_documents || [];

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Header activePage="tenders" />

      <main className="max-w-7xl mx-auto p-6 pt-32 pb-20">
        <button 
          onClick={() => navigate('/tenders')} 
          className="group flex items-center gap-2 text-neutral-400 hover:text-black font-black text-xs uppercase tracking-widest mb-8 transition-all"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to All Tenders
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-8 space-y-8">
            <section className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-neutral-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <span className="px-4 py-1.5 bg-yellow-400 text-neutral-900 rounded-full text-[10px] font-black uppercase">
                  {tender?.status}
                </span>
                <span className="text-neutral-400 font-bold text-xs uppercase tracking-widest">
                  ID: {id.substring(0, 8)}
                </span>
              </div>

              {/* FIXED: Smaller Title Size */}
              <h1 className="text-2xl md:text-4xl font-black text-neutral-900 mb-6 tracking-tight leading-tight">
                {tender?.title}
              </h1>

              <p className="text-neutral-500 font-medium text-lg mb-10 leading-relaxed">
                {tender?.description}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-10 border-y border-neutral-50">
                <DetailBox label="Est. Budget" value={`₹${parseFloat(tender?.budget_estimate || 0).toLocaleString()}`} icon={<IndianRupee size={14}/>} color="text-green-600" />
                <DetailBox label="EMD Amount" value={`₹${parseFloat(tender?.emd_amount || 0).toLocaleString()}`} icon={<ShieldCheck size={14}/>} color="text-blue-600" />
                <DetailBox label="Work Timeline" value={tender?.delivery_timeline} icon={<Clock size={14}/>} />
                <DetailBox label="Bid Validity" value={`${tender?.bid_validity_days} Days`} icon={<Calendar size={14}/>} />
              </div>

              <div className="mt-10">
                <h4 className="flex items-center gap-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4">
                  <ListChecks size={14} className="text-yellow-500"/> Detailed Scope of Work
                </h4>
                <div className="bg-neutral-50 p-8 rounded-[2rem] text-sm md:text-base leading-relaxed text-neutral-600 border border-neutral-100 whitespace-pre-line">
                  {tender?.scope_of_work}
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-neutral-900 rounded-[2.5rem] p-10 text-white">
                <h3 className="text-sm font-black uppercase tracking-widest mb-8 text-yellow-400 flex items-center gap-2">
                  <UserCheck size={20}/> Eligibility
                </h3>
                <div className="space-y-6">
                  <EligibilityRow label="Experience" value={`${eligibility?.min_experience_years || 0} Years`} />
                  <EligibilityRow label="Annual Turnover" value={`₹${parseFloat(eligibility?.min_turnover || 0).toLocaleString()}+`} />
                  <div className="pt-6 border-t border-white/10">
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3">Required Certs</p>
                    <p className="text-sm font-bold text-neutral-200 italic leading-relaxed">
                      {eligibility?.required_certifications || "Standard industry certifications apply."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-10 border border-neutral-100">
                <h3 className="text-sm font-black uppercase tracking-widest mb-8 text-neutral-900 flex items-center gap-2">
                  <TrendingUp size={20} className="text-blue-500"/> Scoring Matrix
                </h3>
                <div className="space-y-8">
                  <WeightBar label="Technical Capability" weight={tender?.technical_weightage} color="bg-blue-500" />
                  <WeightBar label="Financial Proposal" weight={tender?.price_weightage} color="bg-emerald-500" />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-4 space-y-8">
            <section className="bg-yellow-400 rounded-[2.5rem] p-8 shadow-xl shadow-yellow-100 relative overflow-hidden group">
               <div className="relative z-10">
                <h3 className="text-2xl font-black text-neutral-900 mb-2 italic">Interested?</h3>
                <p className="text-neutral-800 font-bold text-sm mb-8 opacity-80">
                  Registered suppliers can submit technical and financial bids.
                </p>
                <button 
                  onClick={() => navigate('/supplier-login')}
                  className="w-full bg-neutral-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3"
                >
                  Apply for Tender <ArrowRight size={16} />
                </button>
              </div>
              <LockKeyhole size={120} className="absolute -bottom-10 -right-10 text-neutral-900/5 -rotate-12" />
            </section>

            {/* KEY DEADLINES SECTION */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-neutral-100 shadow-sm">
              <h3 className="font-black text-sm uppercase tracking-widest mb-8 border-b border-neutral-50 pb-4">Key Deadlines</h3>
              <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-neutral-50">
                <TimelineItem 
                    label="Query Deadline" 
                    date={timeline?.clarification_deadline} 
                    color="bg-amber-400" 
                />
                <TimelineItem 
                    label="Submission Closes" 
                    date={timeline?.submission_deadline} 
                    color="bg-red-500" 
                />
                <TimelineItem 
                    label="Bid Opening" 
                    date={timeline?.opening_date} 
                    color="bg-emerald-500" 
                />
              </div>
            </div>

            {/* DOCUMENTS SECTION */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-neutral-100 shadow-sm">
                <h3 className="font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Download size={16} /> Documents
                </h3>
                <div className="space-y-3">
                  {documents.length > 0 ? documents.map((doc) => (
                    <div 
                      key={doc.id} 
                      onClick={() => handleDownload(doc.file_path)} 
                      className="group flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-transparent hover:border-neutral-900 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-yellow-400 group-hover:text-neutral-900 transition-colors">
                          <FileText size={16}/>
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-tighter text-neutral-600">{doc.document_type}</span>
                      </div>
                      <ArrowRight size={14} className="text-neutral-300 group-hover:text-black group-hover:translate-x-1 transition-all"/>
                    </div>
                  )) : (
                    <div className="text-center py-4 text-neutral-400 text-xs font-bold italic">
                      No public documents available.
                    </div>
                  )}
                </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// SUB-COMPONENTS
const DetailBox = ({ label, value, icon, color = "text-neutral-900" }) => (
  <div>
    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-1">{icon} {label}</p>
    <p className={`text-lg font-black tracking-tight ${color}`}>{value || 'N/A'}</p>
  </div>
);

const EligibilityRow = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{label}</span>
    <span className="text-sm font-black text-white">{value}</span>
  </div>
);

const WeightBar = ({ label, weight, color }) => (
  <div>
    <div className="flex justify-between text-[10px] font-black uppercase mb-2">
      <span className="text-neutral-500">{label}</span>
      <span className="text-neutral-900">{weight}%</span>
    </div>
    <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${weight}%` }}></div>
    </div>
  </div>
);

// UPDATED TIMELINE ITEM
const TimelineItem = ({ label, date, color }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null; // Catch invalid dates
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  
  const displayDate = formatDate(date);
  
  return (
    <div className="relative pl-8">
      <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white shadow-md ${color}`}></div>
      <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-black text-neutral-800">
        {displayDate || <span className="text-neutral-300 italic">To be announced</span>}
      </p>
    </div>
  );
};