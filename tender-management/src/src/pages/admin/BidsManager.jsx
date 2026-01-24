import React, { useState, useEffect } from 'react';
import { Lock, CheckCircle, FileText, IndianRupee, Trophy, Download, AlertTriangle, Loader2, X, Phone, Mail, MapPin, Building2, User, ExternalLink, ShieldCheck } from 'lucide-react';
import { evaluationAPI, BiddingTenderAPI, adminAPI } from '../../api/auth.service';
import toast from 'react-hot-toast';

export default function BidsManager({ tenderId, tenderStatus }) {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scoringBid, setScoringBid] = useState(null);
  const [awardConfirmBid, setAwardConfirmBid] = useState(null);
  const [scoreData, setScoreData] = useState({ score: '', remarks: '' });
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

 const fetchBids = async () => {
  try {
    setLoading(true);

    if (!tenderId) return;

    const res = await BiddingTenderAPI.getComparison(tenderId);

    setBids(res?.data?.qualified_bids || []);
  } catch (err) {
    console.error("Fetch Bids Error:", err);
    toast.error("Failed to refresh bids list");
  } finally {
    setLoading(false);
  }
};


  useEffect(() => { 
    if (tenderId) fetchBids(); 
  }, [tenderId]);

 const handleViewSupplier = async (supplierId) => {
  try {
    setLoadingProfile(true);
    const res = await adminAPI.getSupplierDetails(supplierId);
    console.log("Full Supplier API Response:", res.data); // <--- ADD THIS
    setSelectedSupplier(res.data.data || res.data);
  } catch (err) {
    toast.error("Failed to load supplier profile");
  } finally {
    setLoadingProfile(false);
  }
};

  // Logic to prevent multiple awards or awarding closed tenders
  const isTenderLocked = tenderStatus === 'AWARDED' || bids.some(bid => bid.status === 'WON');

  const handleDownloadDirect = (url) => {
    if (!url) return toast.error("File link missing");
    window.open(url, '_blank');
  };

  const handleScoreSubmit = async () => {
    if (!scoreData.score) return toast.error("Please enter a score");
    setIsSubmitting(true);
    try {
      await evaluationAPI.submitScore({ 
        bid_id: scoringBid, 
        score: Number(scoreData.score), // Ensure score is a number
        remarks: scoreData.remarks 
      });
      toast.success("Evaluation submitted!");
      setScoringBid(null);
      setScoreData({ score: '', remarks: '' });
      fetchBids();
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

 const processAward = async () => {
  if (isSubmitting || !awardConfirmBid) return;
  
  const bidId = awardConfirmBid.id;
  const loadingToast = toast.loading("Confirming Winner...");

  try {
    setIsSubmitting(true);
    const res = await BiddingTenderAPI.awardWinner(tenderId, bidId);
    
    if (res.data.success) {
      toast.success("Tender Awarded Successfully!", { id: loadingToast });
      
      // --- OPTIMISTIC UPDATE START ---
      // Manually update the local bids array so the UI changes instantly
      setBids(prevBids => prevBids.map(bid => {
        if (bid.id === bidId) {
          return { ...bid, status: 'WON' };
        }
        return { ...bid, status: 'LOST' };
      }));
      // --- OPTIMISTIC UPDATE END ---

      setAwardConfirmBid(null);
      
      // Still fetch fresh data to ensure everything is synced with DB
      await fetchBids(); 
    }
  } catch (err) {
    const errorMsg = err.response?.data?.message || "Awarding failed.";
    toast.error(errorMsg, { id: loadingToast });
  } finally {
    setIsSubmitting(false);
  }
};
  const StatusBadge = ({ status }) => {
    const styles = {
      SUBMITTED: "bg-blue-50 text-blue-600 border-blue-100",
      TECH_QUALIFIED: "bg-green-50 text-green-600 border-green-100",
      WON: "bg-yellow-50 text-yellow-700 border-yellow-200",
      LOST: "bg-neutral-50 text-neutral-400 border-neutral-100",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${styles[status] || styles.SUBMITTED}`}>
        {status?.replace('_', ' ')}
      </span>
    );
  };

  if (loading && bids.length === 0) return <div className="p-20 text-center font-black animate-pulse uppercase tracking-widest text-neutral-400">Loading Qualified Bids...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2.5rem] p-10 border border-neutral-100 shadow-sm">
        <h3 className="text-2xl font-black text-neutral-900 mb-8 flex items-center gap-3 italic">
          <Trophy className="text-yellow-500" /> Bidders Comparison
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase text-neutral-400 border-b border-neutral-50">
                <th className="pb-6">Supplier Info</th>
                <th className="pb-6">Status</th>
                <th className="pb-6 text-center">Technical</th>
                <th className="pb-6 text-center">Financials</th>
                <th className="pb-6 text-right">Decision</th>
              </tr>
            </thead>
            <tbody>
              {bids.map((bid) => (
                <tr key={bid.id} className="group border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                  <td className="py-6">
                    <button 
                      onClick={() => handleViewSupplier(bid.supplier_id)}
                      className="font-black text-sm text-neutral-800 uppercase hover:text-blue-600 transition-colors text-left flex items-center gap-1"
                    >
                      {bid.suppliers?.company_name} <ExternalLink size={12} className="opacity-0 group-hover:opacity-100" />
                    </button>
                    <p className="text-[10px] text-neutral-400 font-bold">ID: {String(bid.id).slice(0, 8)}</p>
                  </td>
                  <td className="py-6"><StatusBadge status={bid.status} /></td>
                  <td className="py-6 text-center">
                    <button onClick={() => handleDownloadDirect(bid.docs?.technicalUrl)} className="text-blue-600 hover:underline text-[10px] font-black uppercase flex items-center justify-center gap-1 mx-auto">
                      <Download size={12} /> Tech Doc
                    </button>
                  </td>
                  <td className="py-6 text-center">
                    {['TECH_QUALIFIED', 'WON', 'LOST'].includes(bid.status) ? (
                      <button onClick={() => handleDownloadDirect(bid.docs?.financialUrl)} className="text-green-600 font-black text-sm flex items-center justify-center gap-1 hover:underline mx-auto">
                        <IndianRupee size={12} /> {bid.bid_financials?.[0]?.total_amount?.toLocaleString() || '0'}
                      </button>
                    ) : (
                      <div className="flex flex-col items-center text-neutral-300">
                        <Lock size={14} />
                        <span className="text-[8px] font-black">LOCKED</span>
                      </div>
                    )}
                  </td>
                  <td className="py-6 text-right">
                    {!isTenderLocked ? (
                      <div className="flex justify-end gap-2">
                        {bid.status === 'SUBMITTED' && (
                          <button onClick={() => setScoringBid(bid.id)} className="bg-black text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase">Score</button>
                        )}
                        {bid.status === 'TECH_QUALIFIED' && (
                          <button onClick={() => setAwardConfirmBid({ id: bid.id, name: bid.suppliers?.company_name })} className="bg-green-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-green-100">Award</button>
                        )}
                      </div>
                    ) : (
                       <span className={bid.status === 'WON' ? "text-green-600 font-black text-xs flex items-center gap-1 justify-end" : "text-neutral-300 text-[10px] font-black italic"}>
                         {bid.status === 'WON' ? <><CheckCircle size={14} /> WINNER</> : "CLOSED"}
                       </span>
                    )}
                  </td>
                </tr>
              ))}
              {bids.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-neutral-400 text-xs font-bold uppercase">No qualified bids found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS (Supplier Profile, Scoring, Awarding) - Logic remains identical but uses updated processAward */}
      {/* ... [Rest of your modal JSX code remains the same] ... */}
      {/* --- FULL SUPPLIER DETAILS SIDEBAR --- */}
      {selectedSupplier && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex justify-end">
          <div className="bg-white h-full max-w-lg w-full shadow-2xl p-8 overflow-y-auto animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter">Supplier Profile</h2>
                <p className="text-[10px] font-bold text-neutral-400">VERIFIED PARTNER PROGRAM</p>
              </div>
              <button onClick={() => setSelectedSupplier(null)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-8 flex-1">
              {/* Profile Card */}
              <div className="bg-neutral-900 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
                 <Building2 className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10" />
                 <p className="text-[10px] font-black text-white/50 uppercase mb-1">Company Entity</p>
                 <h3 className="text-xl font-black uppercase mb-4 leading-tight">{selectedSupplier.company_name}</h3>
                 <div className="space-y-2 relative z-10">
                    <div className="flex items-center gap-2 text-xs font-medium text-white/80">
                      <Mail size={14} /> {selectedSupplier.users?.email}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-white/80">
                      <Phone size={14} /> {selectedSupplier.phone_number || 'No contact provided'}
                    </div>
                 </div>
              </div>

              {/* Identity & Tax */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                  <p className="text-[10px] font-black text-neutral-400 uppercase mb-1">GSTIN</p>
                  <p className="text-sm font-bold text-neutral-800">{selectedSupplier.gstin || 'N/A'}</p>
                </div>
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                  <p className="text-[10px] font-black text-neutral-400 uppercase mb-1">PAN</p>
                  <p className="text-sm font-bold text-neutral-800">{selectedSupplier.pan || 'N/A'}</p>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-neutral-400 uppercase flex items-center gap-2">
                  <MapPin size={12} /> Registered Address
                </p>
                <div className="p-4 bg-neutral-50 rounded-2xl text-sm font-medium leading-relaxed">
                  {selectedSupplier.registered_address}
                </div>
              </div>

              {/* Bank Details */}
              {selectedSupplier.supplier_financials?.[0] && (
                <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100">
                  <p className="text-[10px] font-black text-blue-600 uppercase mb-4 tracking-widest flex items-center gap-2">
                    <ShieldCheck size={14} /> Verified Bank Account
                  </p>
                  <div className="grid grid-cols-2 gap-y-4">
                    <div>
                      <p className="text-[9px] font-bold text-blue-400 uppercase">Bank</p>
                      <p className="text-sm font-black text-neutral-800">{selectedSupplier.supplier_financials[0].bank_name}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-blue-400 uppercase">IFSC Code</p>
                      <p className="text-sm font-black text-neutral-800">{selectedSupplier.supplier_financials[0].ifsc_code}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[9px] font-bold text-blue-400 uppercase">Account Number</p>
                      <p className="text-lg font-black tracking-widest text-neutral-900">{selectedSupplier.supplier_financials[0].bank_account_no}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Documents Section */}
            {/* Documents Section */}
<div className="space-y-4">
  <p className="text-[10px] font-black text-neutral-400 uppercase flex items-center gap-2">
    <FileText size={12} /> Verification Vault
  </p>
  <div className="space-y-2">
    {/* Use optional chaining and check if it's an array */}
    {selectedSupplier.supplier_documents && selectedSupplier.supplier_documents.length > 0 ? (
      selectedSupplier.supplier_documents.map((doc, idx) => (
        <div key={idx} className="flex items-center justify-between p-4 bg-white border border-neutral-100 rounded-2xl hover:bg-neutral-50 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
              <FileText size={18} />
            </div>
            <div>
              <p className="text-xs font-black uppercase leading-none">
                {/* Fallback to 'Document' if type is missing */}
                {doc.document_type ? doc.document_type.replace(/_/g, ' ') : `Document ${idx + 1}`}
              </p>
              <p className="text-[10px] text-neutral-400 font-bold tracking-tight">
                {doc.file_name || 'Standard Verification'}
              </p>
            </div>
          </div>
          
          {/* THE BUTTON: Ensure we use download_url generated by backend */}
          <button 
            onClick={() => window.open(doc.download_url, '_blank')}
            className="p-2 hover:bg-white rounded-lg text-neutral-400 hover:text-blue-600 transition-colors shadow-sm border border-transparent hover:border-neutral-200"
          >
            <Download size={18} />
          </button>
        </div>
      ))
    ) : (
      <div className="flex flex-col items-center justify-center py-8 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
         <AlertTriangle size={24} className="text-neutral-300 mb-2" />
         <p className="text-xs italic text-neutral-400 text-center">No documents uploaded by supplier</p>
      </div>
    )}
  
                </div>
              </div>
            </div>

            <button 
              onClick={() => setSelectedSupplier(null)}
              className="w-full mt-8 py-4 bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-neutral-800 transition-colors"
            >
              Close Profile
            </button>
          </div>
        </div>
      )}
      {/* Ensure you use the updated processAward in your confirmation button */}
      {awardConfirmBid && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl text-center">
            <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-yellow-600" size={40} />
            </div>
            <h4 className="text-xl font-black mb-2 uppercase">Finalize Award?</h4>
            <p className="text-neutral-500 text-sm mb-8 font-medium">
              Awarding tender to <span className="text-black font-black underline italic">{awardConfirmBid.name}</span>.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={processAward} 
                disabled={isSubmitting}
                className="w-full py-4 bg-green-600 text-white rounded-2xl font-black uppercase text-xs hover:bg-green-700 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : "Confirm Award"}
              </button>
              <button onClick={() => setAwardConfirmBid(null)} disabled={isSubmitting} className="w-full py-4 bg-neutral-100 text-neutral-600 rounded-2xl font-black uppercase text-xs">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}