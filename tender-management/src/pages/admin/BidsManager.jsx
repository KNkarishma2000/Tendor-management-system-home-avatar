import React, { useState, useEffect } from 'react';
import { Lock, CheckCircle, FileText, IndianRupee, Trophy, Download, AlertTriangle, Loader2 } from 'lucide-react';
import { evaluationAPI, BiddingTenderAPI } from '../../api/auth.service';
import toast from 'react-hot-toast';

export default function BidsManager({ tenderId, tenderStatus }) {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // Prevents duplicate clicks
  const [scoringBid, setScoringBid] = useState(null); 
  const [awardConfirmBid, setAwardConfirmBid] = useState(null); 
  const [scoreData, setScoreData] = useState({ score: '', remarks: '' });

  const fetchBids = async () => {
    try {
      setLoading(true);
      const res = await BiddingTenderAPI.getComparison(tenderId);
      const bidsData = res.data.qualified_bids || res.data.data || [];
      setBids(bidsData);
    } catch (err) {
      toast.error("Failed to refresh bids list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBids(); }, [tenderId]);

  // Check if the tender is already awarded to hide buttons globally
  const isAnyBidAwarded = bids.some(bid => bid.status === 'WON');

  const handleDownload = async (bidId, type) => {
    const loadingToast = toast.loading("Preparing download...");
    try {
      const res = type === 'tech' 
        ? await evaluationAPI.downloadTechnicalPDF(bidId)
        : await evaluationAPI.downloadFinancialPDF(bidId);

      const link = document.createElement('a');
      link.href = res.data.download_url;
      link.setAttribute('download', ''); 
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Download started", { id: loadingToast });
    } catch (err) {
      toast.error(err.response?.data?.message || "Download failed", { id: loadingToast });
    }
  };

  const handleViewTech = async (bidId) => {
    try {
      const res = await evaluationAPI.viewTechnicalPDF(bidId);
      window.open(res.data.view_url, '_blank');
    } catch (err) { toast.error("File access denied"); }
  };

  const handleScoreSubmit = async () => {
    if (!scoreData.score) return toast.error("Please enter a score");
    
    setIsSubmitting(true);
    try {
      await evaluationAPI.submitScore({ bid_id: scoringBid, ...scoreData });
      toast.success("Technical evaluation submitted!");
      setScoringBid(null);
      setScoreData({ score: '', remarks: '' });
      fetchBids();
    } catch (err) { 
      toast.error("Evaluation submission failed"); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const processAward = async () => {
    if (isSubmitting) return; // Block double clicks

    const bidId = awardConfirmBid.id;
    const loadingToast = toast.loading("Processing Final Award...");
    
    try {
      setIsSubmitting(true);
      await BiddingTenderAPI.awardWinner(tenderId, bidId);
      
      toast.success("Tender Awarded Successfully!", { id: loadingToast });
      setAwardConfirmBid(null); 
      fetchBids(); // This will refresh list and hide all "Award" buttons
    } catch (err) { 
      toast.error(err.response?.data?.message || "Awarding process failed", { id: loadingToast }); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      SUBMITTED: "bg-blue-50 text-blue-600 border-blue-100",
      TECH_QUALIFIED: "bg-green-50 text-green-600 border-green-100",
      TECH_REJECTED: "bg-red-50 text-red-600 border-red-100",
      WON: "bg-yellow-50 text-yellow-700 border-yellow-200",
      LOST: "bg-neutral-50 text-neutral-400 border-neutral-100",
    };

    return (
      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${styles[status] || styles.SUBMITTED}`}>
        {status?.replace('_', ' ')}
      </span>
    );
  };

  if (loading && bids.length === 0) return <div className="p-20 text-center font-black animate-pulse">LOADING BIDS...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2.5rem] p-10 border border-neutral-100 shadow-sm">
        <h3 className="text-2xl font-black text-neutral-900 mb-8 flex items-center gap-3">
          <Trophy className="text-yellow-500" /> Bidders Comparison
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase text-neutral-400 border-b border-neutral-50">
                <th className="pb-6">Supplier Info</th>
                <th className="pb-6">Evaluation Status</th>
                <th className="pb-6 text-center">Technical</th>
                <th className="pb-6 text-center">Financials</th>
                <th className="pb-6 text-right">Decision</th>
              </tr>
            </thead>
            <tbody>
              {bids.map((bid) => (
                <tr key={bid.id} className="group border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors">
                  <td className="py-6">
                    <p className="font-black text-sm text-neutral-800 uppercase">{bid.suppliers?.company_name || 'Unknown'}</p>
                    <p className="text-[10px] text-neutral-400 font-bold">ID: {bid.id.slice(0, 8)}</p>
                  </td>

                  <td className="py-6">
                    <StatusBadge status={bid.status} />
                  </td>

                  <td className="py-6 text-center">
                    {bid.technical_evaluations?.[0] ? (
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-black text-blue-600">{bid.technical_evaluations[0].score}/100</span>
                        <button onClick={() => handleDownload(bid.id, 'tech')} className="text-[9px] font-bold uppercase text-neutral-400 hover:text-black">Download PDF</button>
                      </div>
                    ) : (
                      <button onClick={() => handleViewTech(bid.id)} className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-blue-600 hover:underline">
                        <FileText size={14}/> Review PDF
                      </button>
                    )}
                  </td>

                  <td className="py-6 text-center">
                    {['TECH_QUALIFIED', 'WON', 'LOST'].includes(bid.status) ? (
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-black text-green-600 flex items-center gap-1">
                          <IndianRupee size={12}/> {bid.bid_financials?.[0]?.total_amount?.toLocaleString() || '0'}
                        </span>
                        <button onClick={() => handleDownload(bid.id, 'fin')} className="text-[9px] font-black text-neutral-400 uppercase mt-1 flex items-center gap-1">
                          <Download size={10}/> Financial PDF
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-neutral-300 opacity-50">
                        <Lock size={16}/>
                        <span className="text-[9px] font-black uppercase mt-1 italic">Locked</span>
                      </div>
                    )}
                  </td>

                  <td className="py-6 text-right">
                    {/* BUTTON LOGIC: Hide all actions if Tender is already WON by someone */}
                    {!isAnyBidAwarded ? (
                      <>
                        {bid.status === 'SUBMITTED' && (
                          <button onClick={() => setScoringBid(bid.id)} className="bg-black text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800">
                            Score Bid
                          </button>
                        )}
                        {bid.status === 'TECH_QUALIFIED' && (
                          <button 
                            onClick={() => setAwardConfirmBid({id: bid.id, name: bid.suppliers?.company_name})} 
                            className="bg-green-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 shadow-lg shadow-green-200"
                          >
                            Award Tender
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {bid.status === 'WON' ? (
                          <div className="text-green-600 flex items-center justify-end gap-1 font-black text-xs uppercase">
                            <CheckCircle size={14}/> Confirmed Winner
                          </div>
                        ) : (
                          <span className="text-neutral-400 text-[10px] font-black uppercase italic">Not Selected</span>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TECHNICAL EVALUATION MODAL */}
      {scoringBid && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-10 max-w-md w-full shadow-2xl">
            <h4 className="text-2xl font-black mb-6 uppercase tracking-tighter">Technical Evaluation</h4>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-neutral-400 mb-2 block tracking-widest">Score (0 - 100)</label>
                <input 
                  type="number" 
                  disabled={isSubmitting}
                  className="w-full bg-neutral-50 border border-neutral-200 p-4 rounded-2xl font-black text-lg focus:outline-none focus:ring-2 ring-black"
                  placeholder="Enter Score"
                  value={scoreData.score}
                  onChange={(e) => setScoreData({...scoreData, score: e.target.value})}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setScoringBid(null)} disabled={isSubmitting} className="flex-1 py-4 font-black uppercase text-xs tracking-widest hover:bg-neutral-100 rounded-2xl">Cancel</button>
                <button onClick={handleScoreSubmit} disabled={isSubmitting} className="flex-1 py-4 bg-neutral-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Submit Evaluation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AWARD CONFIRMATION POPUP */}
      {awardConfirmBid && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl border border-neutral-100 text-center animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-yellow-600" size={40} />
            </div>
            <h4 className="text-xl font-black mb-2 uppercase tracking-tight">Finalize Award?</h4>
            <p className="text-neutral-500 text-sm mb-8 font-medium">
              You are awarding this tender to <span className="text-black font-black underline">{awardConfirmBid.name}</span>.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={processAward} 
                disabled={isSubmitting}
                className="w-full py-4 bg-green-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-green-700 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : "Yes, Confirm Award"}
              </button>
              <button 
                onClick={() => setAwardConfirmBid(null)} 
                disabled={isSubmitting}
                className="w-full py-4 bg-neutral-100 text-neutral-600 rounded-2xl font-black uppercase text-xs tracking-widest"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}