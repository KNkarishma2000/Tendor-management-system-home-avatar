import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BiddingTenderAPI } from '../../api/auth.service';
import { CheckCircle, FileText, UploadCloud, Download, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BidSubmissionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [existingBid, setExistingBid] = useState(null);
  const [downloadUrls, setDownloadUrls] = useState(null); // Added for files
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await BiddingTenderAPI.checkMyBidStatus(id);
        if (res.data.bid) {
          setExistingBid(res.data.bid);
          setDownloadUrls(res.data.downloadUrls); // Store the signed URLs
        }
      } catch (err) {
        console.error("Status check failed");
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, [id]);

  // Helper function to color-code the status
  const getStatusConfig = (status) => {
    switch (status) {
      case 'AWARDED': return { bg: 'bg-green-500', text: 'text-white', label: 'Accepted / Awarded' };
      case 'REJECTED': return { bg: 'bg-red-500', text: 'text-white', label: 'Not Qualified' };
      case 'TECH_QUALIFIED': return { bg: 'bg-blue-500', text: 'text-white', label: 'Technical Qualified' };
      default: return { bg: 'bg-black', text: 'text-white', label: status };
    }
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse">VALIDATING SESSION...</div>;

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
                <p className="text-neutral-500 font-bold">Ref ID: {id.substring(0,8)}...</p>
              </div>
            </div>
            {/* Dynamic Status Badge */}
            <div className={`${statusStyle.bg} ${statusStyle.text} px-6 py-2 rounded-full font-black text-xs tracking-widest`}>
              {statusStyle.label}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatusCard label="Current Status" value={existingBid.status} highlight />
            <StatusCard label="Total Quote" value={`₹${existingBid.bid_financials?.[0]?.total_amount?.toLocaleString() || '0'}`} />
            {/* Fixed Date Field */}
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
            <p className="mt-4 text-[9px] font-bold text-neutral-400">* Links expire in 60 minutes for security.</p>
          </div>
        </div>
      </div>
    );
  }

  // ... (Return Submission Form remains the same)
}

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