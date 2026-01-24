import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, FileText, ShieldCheck, Download, 
  IndianRupee, Calendar, Clock, TrendingUp, 
  UserCheck, AlertCircle, ListChecks, Trophy
} from 'lucide-react';
import { tenderAdminAPI } from '../../api/auth.service'; 
import toast from 'react-hot-toast';
import BidsManager from './BidsManager'; // Ensure this is imported

export default function TenderDetails({ isSupplierView = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [tender, setTender] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTenderData = async () => {
    try {
      setLoading(true);
      const tenderRes = await tenderAdminAPI.getAllTenders();
      const allTenders = tenderRes.data.data || [];
      const foundTender = allTenders.find(t => String(t.id) === String(id));
      setTender(foundTender);
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Error loading tender data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchTenderData(); 
  }, [id]);

  const handleDownload = async (path) => {
    try {
      const res = await tenderAdminAPI.getTenderFileUrl(path);
      if (res.data.success) {
        window.open(res.data.url, '_blank');
      }
    } catch (error) {
      toast.error("Could not retrieve file link");
    }
  };

  const timeline = Array.isArray(tender?.tender_timeline) 
    ? tender.tender_timeline[0] : tender?.tender_timeline || null;

  const eligibility = Array.isArray(tender?.tender_eligibility_criteria) 
    ? tender.tender_eligibility_criteria[0] : tender?.tender_eligibility_criteria || null;

  const documents = tender?.tender_documents || [];

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      <p className="font-black uppercase tracking-widest text-xs">Loading Architecture...</p>
    </div>
  );

  return (
    <div className={`${!isSupplierView ? 'bg-[#FAFAFA] min-h-screen p-6 md:p-1' : ''}`}>
      
      {/* HEADER & TAB NAVIGATION - Only show if NOT supplier view */}
      {!isSupplierView && (
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-neutral-400 hover:text-black font-black text-xs uppercase tracking-widest transition-all">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
          </button>

          <div className="flex bg-white p-1.5 rounded-[1.5rem] border border-neutral-200 shadow-sm">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-black text-white shadow-lg' : 'text-neutral-400 hover:text-black'}`}
            >
              <ListChecks size={14}/> Tender Overview
            </button>
            <button 
              onClick={() => setActiveTab('bids')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'bids' ? 'bg-black text-white shadow-lg' : 'text-neutral-400 hover:text-black'}`}
            >
              <Trophy size={14}/> Bidders & Comparison
            </button>
          </div>

          <div className="flex gap-3">
            <span className="px-4 py-2 bg-white border border-neutral-200 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm">
              ID: {id.slice(0, 8)}...
            </span>
            <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm ${tender?.status === 'DRAFT' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
              {tender?.status}
            </span>
          </div>
        </div>
      )}

      {/* CONDITIONAL CONTENT */}
      {(isSupplierView || activeTab === 'overview') ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
          <div className="lg:col-span-8 space-y-8">
            <section className="bg-white rounded-[2rem] p-10 border border-neutral-100 shadow-sm relative overflow-hidden">
              <h1 className="text-4xl font-black text-neutral-900 mb-4 tracking-tight">{tender?.title}</h1>
              <p className="text-neutral-500 font-medium text-lg mb-8 max-w-2xl">{tender?.description}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-8 border-y border-neutral-50">
                <DetailBox label="Budget" value={`₹${tender?.budget_estimate?.toLocaleString()}`} icon={<IndianRupee size={14}/>} color="text-green-600" />
                <DetailBox label="EMD" value={`₹${tender?.emd_amount?.toLocaleString()}`} icon={<ShieldCheck size={14}/>} color="text-blue-600" />
                <DetailBox label="Timeline" value={tender?.delivery_timeline} icon={<Clock size={14}/>} />
                <DetailBox label="Validity" value={`${tender?.bid_validity_days} Days`} icon={<Calendar size={14}/>} />
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                  <h4 className="flex items-center gap-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4"><FileText size={14}/> Scope of Work</h4>
                  <div className="bg-neutral-50 p-6 rounded-2xl text-sm leading-relaxed text-neutral-600 border border-neutral-100">{tender?.scope_of_work}</div>
                </div>
                <div>
                  <h4 className="flex items-center gap-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4"><AlertCircle size={14}/> Penalty Clauses</h4>
                  <div className="bg-red-50/30 p-6 rounded-2xl text-sm leading-relaxed text-red-900/70 border border-red-100">{tender?.penalty_clauses}</div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-neutral-900 rounded-[2rem] p-8 text-white">
                <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-yellow-400 flex items-center gap-2"><UserCheck size={18}/> Eligibility Criteria</h3>
                <div className="space-y-4">
                  <EligibilityRow label="Exp. Required" value={`${eligibility?.min_experience_years || 0} Years`} />
                  <EligibilityRow label="Min. Turnover" value={`₹${eligibility?.min_turnover?.toLocaleString() || 0}`} />
                  <div className="pt-4 border-t border-white/10 mt-4">
                    <p className="text-[10px] font-black text-neutral-500 uppercase mb-2">Required Certifications</p>
                    <p className="text-sm font-bold text-neutral-200">{eligibility?.required_certifications || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-8 border border-neutral-100 shadow-sm">
                <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-neutral-900 flex items-center gap-2"><TrendingUp size={18} className="text-blue-500"/> Evaluation Weightage</h3>
                <div className="space-y-6">
                   <WeightBar label="Technical Score" weight={tender?.technical_weightage} color="bg-blue-500" />
                   <WeightBar label="Financial (L1) Score" weight={tender?.price_weightage} color="bg-green-500" />
                </div>
              </div>
            </section>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-[2rem] p-8 border border-neutral-100 shadow-sm">
              <h3 className="font-black text-sm uppercase tracking-widest mb-8 border-b pb-4">Tender Deadlines</h3>
              <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-neutral-100">
                <TimelineItem label="Clarification Deadline" date={timeline?.clarification_deadline} color="bg-amber-400" />
                <TimelineItem label="Submission Deadline" date={timeline?.submission_deadline} color="bg-red-500" />
                <TimelineItem label="Technical Opening" date={timeline?.opening_date} color="bg-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 border border-neutral-100 shadow-sm">
               <h3 className="font-black text-sm uppercase tracking-widest mb-6">Attachments</h3>
               <div className="space-y-3">
                 {documents.length > 0 ? documents.map((doc) => (
                   <div key={doc.id} onClick={() => handleDownload(doc.file_path)} className="group flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-transparent hover:border-black transition-all cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm group-hover:bg-yellow-400">
                          <FileText size={16}/>
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-tighter">{doc.document_type}</span>
                      </div>
                      <Download size={16} className="text-neutral-300 group-hover:text-black"/>
                   </div>
                 )) : <p className="text-xs text-neutral-400 italic">No files uploaded.</p>}
               </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <BidsManager tenderId={id} tenderStatus={tender?.status} />
        </div>
      )}
    </div>
  );
}

// Sub-components (DetailBox, EligibilityRow, WeightBar, TimelineItem) remain exactly the same as your original code
const DetailBox = ({ label, value, icon, color = "text-neutral-900" }) => (
  <div>
    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-1">{icon} {label}</p>
    <p className={`text-lg font-black tracking-tight ${color}`}>{value}</p>
  </div>
);

const EligibilityRow = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{label}</span>
    <span className="text-sm font-black text-neutral-100">{value}</span>
  </div>
);

const WeightBar = ({ label, weight, color }) => (
  <div>
    <div className="flex justify-between text-[10px] font-black uppercase mb-2">
      <span>{label}</span>
      <span>{weight}%</span>
    </div>
    <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${weight}%` }}></div>
    </div>
  </div>
);

const TimelineItem = ({ label, date, color }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const displayDate = formatDate(date);
  return (
    <div className="relative pl-8">
      <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white shadow-sm ${color}`}></div>
      <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-black text-neutral-800">{displayDate || 'Pending'}</p>
    </div>
  );
};