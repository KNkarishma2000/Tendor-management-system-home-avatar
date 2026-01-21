import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BiddingTenderAPI } from '../../api/auth.service';
import { 
  CheckCircle, FileText, UploadCloud, Download, 
  ExternalLink, ShieldAlert, ArrowLeft, Send 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function BidSubmissionPage() {
  const { id } = useParams(); // Tender ID
  const navigate = useNavigate();

  // --- STATE ---
  const [existingBid, setExistingBid] = useState(null);
  const [downloadUrls, setDownloadUrls] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // --- AUTH/VERIFICATION CHECK ---
  // We get this from localStorage which was set during Login
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
      } catch (err) {
        console.error("Status check failed", err);
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, [id]);

  // --- FORM HANDLING (For new submissions) ---
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!isVerified) return toast.error("Account not verified");

    const formData = new FormData(e.target);
    formData.append('tender_id', id);
    formData.append('supplier_id', localStorage.getItem('userId'));

    setSubmitting(true);
    const loadToast = toast.loading("Submitting your bid package...");

    try {
      await BiddingTenderAPI.submitBid(formData);
      toast.success("Bid submitted successfully!", { id: loadToast });
      window.location.reload(); // Refresh to show the "Existing Bid" view
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed", { id: loadToast });
    } finally {
      setSubmitting(false);
    }
  };

  // --- RENDER LOGIC ---

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center font-black animate-pulse tracking-widest text-neutral-400">
          VALIDATING SESSION...
        </div>
      </div>
    );
  }

  // CASE 1: USER HAS ALREADY SUBMITTED A BID
  if (existingBid) {
    const statusStyle = getStatusConfig(existingBid.status);
    return (
      <div className="max-w-4xl mx-auto p-10">
        <div className="bg-white border-2 border-black rounded-[2.5rem] p-12 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 text-green-600 p-3 rounded-full">
                <CheckCircle size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-black uppercase italic">Bid Details</h1>
                <p className="text-neutral-500 font-bold">Ref ID: {id.substring(0, 8)}...</p>
              </div>
            </div>
            <div className={`${statusStyle.bg} ${statusStyle.text} px-6 py-2 rounded-full font-black text-xs tracking-widest`}>
              {statusStyle.label}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatusCard label="Current Status" value={existingBid.status} highlight />
            <StatusCard label="Total Quote" value={`₹${existingBid.bid_financials?.[0]?.total_amount?.toLocaleString() || '0'}`} />
            <StatusCard label="Submitted On" value={new Date(existingBid.submitted_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} />
            <StatusCard label="Warranty" value={existingBid.bid_common_documents?.[0]?.warranty_details || 'N/A'} />
          </div>

          <div className="mt-10 p-8 bg-neutral-50 rounded-[2rem] border-2 border-dashed border-neutral-200">
            <p className="text-[10px] font-black uppercase text-neutral-400 mb-6 tracking-widest">Your Uploaded Documents</p>
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

  // CASE 2: USER IS NOT VERIFIED (Show Locked Screen)
  if (!isVerified) {
    return (
      <div className="max-w-3xl mx-auto p-10">
        <div className="bg-white border-2 border-black rounded-[2.5rem] p-12 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] text-center">
          <div className="bg-yellow-100 text-yellow-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={40} />
          </div>
          <h1 className="text-3xl font-black uppercase italic mb-4">Verification Pending</h1>
          <p className="text-neutral-600 font-bold text-lg mb-8 leading-relaxed">
            Your supplier profile is currently awaiting admin approval. 
            You will be able to submit bids once your account is <span className="text-black underline">VERIFIED</span>.
          </p>
          <button 
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-2xl font-black hover:scale-105 transition-all"
          >
            <ArrowLeft size={18} /> RETURN TO TENDERS
          </button>
        </div>
      </div>
    );
  }

  // CASE 3: VERIFIED USER, NO BID YET (Show Submission Form)
  return (
    <div className="max-w-4xl mx-auto p-10">
      <div className="bg-white border-2 border-black rounded-[2.5rem] p-12 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="text-4xl font-black uppercase italic mb-2">Submit Bid</h1>
        <p className="text-neutral-500 font-bold mb-10">Tender Ref: {id}</p>

        <form onSubmit={handleFormSubmit} className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-neutral-400">Technical Proposal (PDF)</label>
              <input type="file" name="technical_bid" required accept=".pdf" className="w-full p-4 bg-neutral-50 rounded-xl border-2 border-neutral-100 font-bold text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-neutral-400">Financial Quote (PDF)</label>
              <input type="file" name="financial_bid" required accept=".pdf" className="w-full p-4 bg-neutral-50 rounded-xl border-2 border-neutral-100 font-bold text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-neutral-400">EMD Payment Proof</label>
              <input type="file" name="emd_proof" required accept=".pdf,image/*" className="w-full p-4 bg-neutral-50 rounded-xl border-2 border-neutral-100 font-bold text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-neutral-400">Total Bid Amount (INR)</label>
              <input type="number" name="total_amount" required placeholder="0.00" className="w-full p-4 bg-neutral-50 rounded-xl border-2 border-neutral-100 font-bold" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            className="w-full bg-yellow-400 text-black py-6 rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:bg-black hover:text-white transition-all disabled:opacity-50"
          >
            {submitting ? "UPLOADING..." : "FINAL SUBMISSION"}
            {!submitting && <Send size={24} />}
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
    className="flex items-center gap-3 px-5 py-3 bg-white border-2 border-black rounded-xl text-[10px] font-black uppercase hover:bg-yellow-400 transition-all group"
  >
    <FileText size={16} className="text-neutral-400 group-hover:text-black"/> 
    <span>{label}</span>
    <ExternalLink size={14} className="ml-2 opacity-30 group-hover:opacity-100"/>
  </a>
);

const StatusCard = ({ label, value, highlight }) => (
  <div className={`p-6 rounded-2xl border-2 ${highlight ? 'bg-black text-white border-black' : 'bg-neutral-50 border-neutral-100'}`}>
    <p className={`text-[10px] font-black uppercase mb-1 ${highlight ? 'text-neutral-400' : 'text-neutral-500'}`}>{label}</p>
    <p className="text-lg font-black truncate">{value}</p>
  </div>
);

const getStatusConfig = (status) => {
  switch (status) {
    case 'AWARDED': return { bg: 'bg-green-500', text: 'text-white', label: 'Accepted / Awarded' };
    case 'REJECTED': return { bg: 'bg-red-500', text: 'text-white', label: 'Not Qualified' };
    case 'TECH_QUALIFIED': return { bg: 'bg-blue-500', text: 'text-white', label: 'Technical Qualified' };
    default: return { bg: 'bg-black', text: 'text-white', label: status };
  }
};