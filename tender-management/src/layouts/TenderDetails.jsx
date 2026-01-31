import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, FileText, ShieldCheck, Download, 
  IndianRupee, Calendar, Clock, TrendingUp, 
  UserCheck, ListChecks, LockKeyhole, ArrowRight, Sparkles
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
    <div className="h-screen flex items-center justify-center font-serif italic text-[#a88d5e] animate-pulse tracking-widest bg-[#fbfbfb]">
      Reviewing Archive...
    </div>
  );

  const timeline = Array.isArray(tender?.tender_timeline) 
    ? tender.tender_timeline[0] 
    : (tender?.tender_timeline || {});

  const eligibility = Array.isArray(tender?.tender_eligibility_criteria)
    ? tender.tender_eligibility_criteria[0]
    : (tender?.tender_eligibility_criteria || {});

  const documents = tender?.tender_documents || [];

  return (
    <div className="min-h-screen bg-[#fbfbfb]">
      <Header activePage="tenders" />

      {/* REFINED HEADER SECTION */}
      <section className="pt-48 pb-16 px-6 bg-[#1f1b16] border-b border-[#a88d5e]/20">
        <div className="max-w-7xl mx-auto">
          <button 
            onClick={() => navigate('/tenders')} 
            className="group flex items-center gap-3 text-[#a88d5e] font-bold text-[10px] uppercase tracking-[0.3em] mb-12 transition-all"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-2 transition-transform" /> 
            Back to Opportunities
          </button>

          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="space-y-4 max-w-3xl">
              <div className="flex items-center gap-3">
                <span className="text-[#a88d5e] bg-[#a88d5e]/10 px-3 py-1 text-[9px] font-bold uppercase tracking-widest border border-[#a88d5e]/20">
                  {tender?.status}
                </span>
                <span className="text-gray-500 font-mono text-[10px] tracking-widest uppercase">
                  Ref: TNR-{id.substring(0, 8)}
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-serif italic text-white leading-tight">
                {tender?.title}
              </h1>
            </div>

            <div className="bg-white/5 border border-white/10 p-8 text-center md:text-left min-w-[280px]">
              <p className="text-[#a88d5e] text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Estimated Value</p>
              <p className="text-3xl font-serif text-white italic">
                ₹{parseFloat(tender?.budget_estimate || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto p-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* LEFT COLUMN: PRIMARY INFO */}
          <div className="lg:col-span-8 space-y-20">
            
            {/* Overview */}
            <section className="prose prose-neutral max-w-none">
              <h4 className="text-[#a88d5e] text-[11px] font-bold uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                <span className="w-8 h-[1px] bg-[#a88d5e]"></span> Executive Summary
              </h4>
              <p className="text-xl font-serif italic text-[#1f1b16] leading-relaxed mb-10">
                {tender?.description}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 py-12 border-y border-gray-100">
                <DetailBox label="EMD Deposit" value={`₹${parseFloat(tender?.emd_amount || 0).toLocaleString()}`} icon={<ShieldCheck size={18}/>} />
                <DetailBox label="Work Duration" value={tender?.delivery_timeline} icon={<Clock size={18}/>} />
                <DetailBox label="Bid Validity" value={`${tender?.bid_validity_days} Days`} icon={<Calendar size={18}/>} />
              </div>
            </section>

            {/* Scope of Work */}
            <section>
              <h4 className="text-[#a88d5e] text-[11px] font-bold uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                <span className="w-8 h-[1px] bg-[#a88d5e]"></span> Scope of Work
              </h4>
              <div className="bg-white border border-gray-100 p-10 font-light leading-relaxed text-gray-600 whitespace-pre-line shadow-sm italic font-serif">
                {tender?.scope_of_work}
              </div>
            </section>

            {/* Eligibility & Weightage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8">
              <div className="bg-[#1f1b16] p-10">
                <h3 className="text-[#a88d5e] text-[11px] font-bold uppercase tracking-[0.3em] mb-10 flex items-center gap-2">
                  <UserCheck size={16}/> Mandatory Criteria
                </h3>
                <div className="space-y-8">
                  <EligibilityRow label="Experience" value={`${eligibility?.min_experience_years || 0} Years`} />
                  <EligibilityRow label="Annual Turnover" value={`₹${parseFloat(eligibility?.min_turnover || 0).toLocaleString()}+`} />
                  <div className="pt-6 border-t border-white/5">
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-3">Technical Certifications</p>
                    <p className="text-sm font-serif italic text-gray-300">
                      {eligibility?.required_certifications || "Standard industry ISO/Safety certifications required."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-100 p-10 shadow-sm">
                <h3 className="text-[#1f1b16] text-[11px] font-bold uppercase tracking-[0.3em] mb-10 flex items-center gap-2">
                  <TrendingUp size={16} className="text-[#a88d5e]"/> Evaluation Matrix
                </h3>
                <div className="space-y-10">
                  <WeightBar label="Technical Score" weight={tender?.technical_weightage} />
                  <WeightBar label="Commercial Proposal" weight={tender?.price_weightage} />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: SIDEBAR ACTIONS */}
          <div className="lg:col-span-4 space-y-12">
            
            {/* CTA Box */}
            <section className="bg-[#a88d5e] p-10 text-white relative overflow-hidden group">
              <div className="relative z-10">
                <Sparkles className="mb-4 text-white/50" size={24} />
                <h3 className="text-2xl font-serif italic mb-4">Submit Proposal</h3>
                <p className="text-white/80 text-sm font-light mb-8 leading-relaxed">
                  Join our ecosystem of premium suppliers. Ensure all technical documents are ready before submission.
                </p>
                <button 
                  onClick={() => navigate('/supplier-login')}
                  className="w-full bg-[#1f1b16] text-[#a88d5e] py-5 font-bold text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-white hover:text-[#1f1b16] transition-all duration-500"
                >
                  Apply Now <ArrowRight size={14} />
                </button>
              </div>
            </section>

            {/* Timelines */}
            <div className="bg-white border border-gray-100 p-10 shadow-sm">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-10 pb-4 border-b border-gray-50">Critical Dates</h3>
              <div className="space-y-10">
                <TimelineItem label="Clarification End" date={timeline?.clarification_deadline} />
                <TimelineItem label="Submission Close" date={timeline?.submission_deadline} isLast />
                <TimelineItem label="Announcement" date={timeline?.opening_date} />
              </div>
            </div>

            {/* Documentation */}
            <div className="bg-white border border-gray-100 p-10 shadow-sm">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#1f1b16] mb-8 flex items-center gap-2">
                <Download size={14} className="text-[#a88d5e]" /> Annexures
              </h3>
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div 
                    key={doc.id} 
                    onClick={() => handleDownload(doc.file_path)} 
                    className="group flex items-center justify-between p-4 border-b border-gray-50 hover:bg-gray-50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <FileText size={18} className="text-gray-300 group-hover:text-[#a88d5e] transition-colors" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">{doc.document_type}</span>
                    </div>
                    <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-[#a88d5e]"/>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// REFINED SUB-COMPONENTS
const DetailBox = ({ label, value, icon }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 text-[#a88d5e]">
      {icon}
      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">{label}</span>
    </div>
    <p className="text-lg font-serif italic text-[#1f1b16]">{value || 'N/A'}</p>
  </div>
);

const EligibilityRow = ({ label, value }) => (
  <div className="flex justify-between items-center group">
    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-[#a88d5e] transition-colors">{label}</span>
    <span className="text-sm font-serif italic text-white">{value}</span>
  </div>
);

const WeightBar = ({ label, weight }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-end">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
      <span className="text-2xl font-serif italic text-[#1f1b16]">{weight}%</span>
    </div>
    <div className="w-full h-[1px] bg-gray-100 relative">
      <div className="absolute top-0 left-0 h-full bg-[#a88d5e]" style={{ width: `${weight}%` }}></div>
    </div>
  </div>
);

const TimelineItem = ({ label, date }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  
  return (
    <div className="relative pl-8 border-l border-gray-100 py-1">
      <div className="absolute -left-[5px] top-2 w-[9px] h-[9px] rounded-full bg-[#a88d5e]"></div>
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-serif italic text-[#1f1b16]">
        {formatDate(date) || <span className="text-gray-300 italic">TBA</span>}
      </p>
    </div>
  );
};