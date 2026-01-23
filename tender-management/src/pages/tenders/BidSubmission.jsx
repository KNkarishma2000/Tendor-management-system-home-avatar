import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BiddingTenderAPI } from '../../api/auth.service';
import { 
  CheckCircle, FileText, UploadCloud, Download, Clock,
  ExternalLink, ShieldAlert, ArrowLeft, Send, AlertTriangle 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function BidSubmissionPage() {
  const { id } = useParams(); // Tender ID
  const navigate = useNavigate();
const [deadline, setDeadline] = useState(null);
  // --- STATE ---
  const [existingBid, setExistingBid] = useState(null);
  const [downloadUrls, setDownloadUrls] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // --- AUTH/VERIFICATION CHECK ---
  const userStatus = localStorage.getItem('userStatus') || 'PENDING';
  const isVerified = userStatus.toUpperCase() === 'APPROVED';

useEffect(() => {
  const checkStatus = async () => {
    try {
      const res = await BiddingTenderAPI.checkMyBidStatus(id);
      if (res.data.bid) {
        setExistingBid(res.data.bid);
        setDownloadUrls(res.data.downloadUrls);
      }
      setDeadline(res.data.deadline); // Store the deadline from backend
    } catch (err) {
      console.error("Status check failed", err);
    } finally {
      setLoading(false);
    }
  };
  checkStatus();
}, [id]);
const isDeadlinePassed = deadline ? new Date() > new Date(deadline) : false;

  // --- FORM HANDLING ---
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!isVerified) return toast.error("Account not verified. Approval required.");

    const formData = new FormData(e.target);

    // 1. FRONTEND VALIDATION (Prevents empty network requests)
    const techFile = formData.get('technical_bid');
    const finFile = formData.get('financial_bid');
    const emdFile = formData.get('emd_proof');
    const amount = formData.get('total_amount');
    const warranty = formData.get('warranty_details');

    if (!techFile.name || !finFile.name || !emdFile.name) {
      return toast.error("All 3 documents (Technical, Financial, EMD) are required!");
    }
    if (!amount || amount <= 0) {
      return toast.error("Please enter a valid Bid Amount.");
    }
    if (warranty.length < 10) {
      return toast.error("Please provide more detail in the Warranty section.");
    }

    // 2. DATA PREPARATION (Matching Backend expectation)
    formData.append('tender_id', id);
    formData.append('supplier_id', localStorage.getItem('userId'));
    formData.append('no_deviation', 'true'); // Required by your backend declaration logic
    formData.append('terms_accepted', 'true'); // Required by your backend declaration logic

    setSubmitting(true);
    const loadToast = toast.loading("Verifying deadline and uploading package...");

    try {
      await BiddingTenderAPI.submitBid(formData);
      toast.success("Complete bid package submitted successfully!", { id: loadToast });
      
      // Small delay so user sees the success message before reload
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Submission failed";
      
      // Specific Toast messages based on your Backend Logic
      if (err.response?.status === 403) {
        toast.error("DEADLINE PASSED: This tender is no longer accepting bids.", { id: loadToast });
      } else if (err.response?.status === 400) {
        toast.error(`FIELD ERROR: ${errorMsg}`, { id: loadToast });
      } else {
        toast.error(errorMsg, { id: loadToast });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center font-black animate-pulse tracking-widest text-neutral-400 italic text-xl">
          CONNECTING TO SECURE GATEWAY...
        </div>
      </div>
    );
  }
// --- VIEW: DEADLINE PASSED (Add this before the Submission Form return) ---
if (isDeadlinePassed && !existingBid) {
  return (
    <div className="max-w-3xl mx-auto p-10">
      <div className="bg-white border-4 border-black rounded-[2.5rem] p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center">
        <Clock size={60} className="mx-auto mb-6 text-red-500" />
        <h1 className="text-3xl font-black uppercase italic mb-4">Tender Closed</h1>
        <p className="text-neutral-600 font-bold text-lg mb-8 leading-relaxed max-w-md mx-auto">
          The submission window for this tender closed on: <br/>
          <span className="text-black bg-yellow-300 px-2 font-black">
            {new Date(deadline).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}
          </span>
        </p>
        <button onClick={() => navigate(-1)} className="bg-black text-white px-10 py-4 rounded-2xl font-black hover:bg-neutral-800 transition-all border-2 border-black">
            GO BACK
        </button>
      </div>
    </div>
  );
}
  // --- VIEW: ALREADY SUBMITTED ---
  if (existingBid) {
    const statusStyle = getStatusConfig(existingBid.status);
    return (
      <div className="max-w-4xl mx-auto p-10">
        <div className="bg-white border-4 border-black rounded-[2.5rem] p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-5">
              <div className="bg-green-100 text-green-600 p-4 rounded-full border-2 border-black">
                <CheckCircle size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-black uppercase italic">Bid Status</h1>
                <p className="text-neutral-400 font-bold uppercase tracking-widest text-xs">REF: {id.substring(0, 12)}</p>
              </div>
            </div>
            <div className={`${statusStyle.bg} ${statusStyle.text} px-8 py-3 border-2 border-black rounded-full font-black text-sm uppercase tracking-widest`}>
              {statusStyle.label}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <StatusCard label="Current Evaluation" value={existingBid.status} highlight />
            <StatusCard label="Quoted Amount" value={`₹${existingBid.bid_financials?.[0]?.total_amount?.toLocaleString('en-IN') || '0'}`} />
            <StatusCard label="Submission Date" value={new Date(existingBid.submitted_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} />
            <StatusCard label="Warranty Terms" value={existingBid.bid_common_documents?.[0]?.warranty_details || 'N/A'} />
          </div>

          <div className="p-8 bg-neutral-50 rounded-[2rem] border-2 border-black">
            <p className="text-[10px] font-black uppercase text-neutral-400 mb-6 tracking-widest italic">Encrypted Document Access</p>
            <div className="flex flex-wrap gap-4">
              <FileBadge label="Technical Proposal" url={downloadUrls?.technical} />
              <FileBadge label="Financial Quote" url={downloadUrls?.financial} />
              <FileBadge label="EMD Receipt" url={downloadUrls?.emd} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW: UNVERIFIED ---
  if (!isVerified) {
    return (
      <div className="max-w-3xl mx-auto p-10">
        <div className="bg-white border-4 border-black rounded-[2.5rem] p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center">
          <ShieldAlert size={60} className="mx-auto mb-6 text-yellow-500" />
          <h1 className="text-3xl font-black uppercase italic mb-4">Verification Locked</h1>
          <p className="text-neutral-600 font-bold text-lg mb-8 leading-relaxed max-w-md mx-auto">
            Your supplier credentials are under review. You will gain bidding access once the <span className="text-black underline decoration-yellow-400 decoration-4">ADMIN APPROVES</span> your profile.
          </p>
          <button onClick={() => navigate(-1)} className="bg-black text-white px-10 py-4 rounded-2xl font-black hover:bg-yellow-400 hover:text-black transition-all border-2 border-black">
             RETURN TO DASHBOARD
          </button>
        </div>
      </div>
    );
  }

  // --- VIEW: SUBMISSION FORM ---
  return (
    <div className="max-w-5xl mx-auto p-10">
      <div className="bg-white border-4 border-black rounded-[2.5rem] p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-5xl font-black uppercase italic tracking-tighter">Submit Bid</h1>
            <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs mt-2">Tender Ref: {id}</p>
          </div>
          <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-2xl flex items-center gap-3 max-w-xs">
            <AlertTriangle className="text-yellow-600 shrink-0" size={20} />
            <p className="text-[10px] font-bold text-yellow-800 leading-tight">By submitting, you agree to all terms, conditions, and no-deviation clauses.</p>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-10">
          <div className="grid md:grid-cols-2 gap-10">
            {/* File Upload Section */}
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-400 mb-4">1. Document Package</h3>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase ml-1">Technical Proposal (PDF Only)</label>
                <input type="file" name="technical_bid" required accept=".pdf" className="w-full p-4 bg-neutral-50 rounded-xl border-2 border-black font-bold text-xs" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase ml-1">Financial Quote (PDF Only)</label>
                <input type="file" name="financial_bid" required accept=".pdf" className="w-full p-4 bg-neutral-50 rounded-xl border-2 border-black font-bold text-xs" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase ml-1">EMD Payment Receipt</label>
                <input type="file" name="emd_proof" required accept=".pdf,image/*" className="w-full p-4 bg-neutral-50 rounded-xl border-2 border-black font-bold text-xs" />
              </div>
            </div>

            {/* Details Section */}
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-400 mb-4">2. Financials & Support</h3>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase ml-1">Total Bid Amount (Inclusive of GST)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-neutral-400">₹</span>
                  <input type="number" name="total_amount" required placeholder="0.00" className="w-full p-4 pl-8 bg-white rounded-xl border-2 border-black font-black text-xl" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase ml-1">Warranty & After-Sales Support</label>
                <textarea name="warranty_details" required placeholder="Describe warranty period, onsite support terms, etc." className="w-full p-4 bg-white rounded-xl border-2 border-black font-bold text-sm h-32 resize-none" />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            className="w-full bg-yellow-400 text-black py-8 rounded-3xl border-4 border-black font-black text-2xl flex items-center justify-center gap-4 hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all disabled:opacity-50"
          >
            {submitting ? "ENCRYPTING & UPLOADING..." : "FINALIZE SUBMISSION"}
            {!submitting && <Send size={28} />}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

const FileBadge = ({ label, url }) => (
  <a 
    href={url} 
    target="_blank" 
    rel="noopener noreferrer"
    className="flex items-center gap-3 px-6 py-4 bg-white border-2 border-black rounded-2xl text-[10px] font-black uppercase hover:bg-yellow-400 transition-all group"
  >
    <FileText size={18} className="text-neutral-400 group-hover:text-black"/> 
    <span>{label}</span>
    <ExternalLink size={14} className="ml-2 opacity-30 group-hover:opacity-100"/>
  </a>
);

const StatusCard = ({ label, value, highlight }) => (
  <div className={`p-8 rounded-[2rem] border-2 border-black ${highlight ? 'bg-black text-white shadow-[6px_6px_0px_0px_rgba(253,224,71,1)]' : 'bg-neutral-50'}`}>
    <p className={`text-[10px] font-black uppercase mb-2 ${highlight ? 'text-yellow-400' : 'text-neutral-500'}`}>{label}</p>
    <p className="text-xl font-black truncate uppercase tracking-tight">{value}</p>
  </div>
);

const getStatusConfig = (status) => {
  const s = status?.toUpperCase();

  switch (s) {
    case 'WON': 
    case 'AWARDED': 
      return { 
        bg: 'bg-green-400', 
        text: 'text-black', 
        label: '🏆 BID AWARDED' 
      };
    
    case 'TECH_QUALIFIED': 
      return { 
        bg: 'bg-blue-400', 
        text: 'text-white', 
        label: 'TECH QUALIFIED' 
      };

    case 'SUBMITTED':
      return { 
        bg: 'bg-yellow-400', 
        text: 'text-black', 
        label: 'BID SUBMITTED' 
      };

    case 'LOST': 
    case 'REJECTED': 
      return { 
        bg: 'bg-red-400', 
        text: 'text-white', 
        label: 'NOT SELECTED' 
      };

    case 'PENDING':
    default: 
      return { 
        bg: 'bg-black', 
        text: 'text-white', 
        label: status || 'UNDER EVALUATION' 
      };
  }
};
