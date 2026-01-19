import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, FileText, Users, ShieldCheck, 
  Download, Loader2, Eye, Calendar, IndianRupee
} from 'lucide-react';
// Updated to use your service names
import { tenderAdminAPI, evaluationAPI, BiddingTenderAPI } from '../../api/auth.service'; 
import toast from 'react-hot-toast';

export default function TenderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tender, setTender] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenderAndBids();
  }, [id]);

  const fetchTenderAndBids = async () => {
    try {
      setLoading(true);
      // 1. Fetch Tender Details (Now includes embedded documents)
      const tenderRes = await tenderAdminAPI.getAllTenders();
      const foundTender = tenderRes.data.data.find(t => t.id === id);
      setTender(foundTender);

      // 2. Fetch Bids for this tender
      const bidsRes = await BiddingTenderAPI.getComparison(id);
      setBids(bidsRes.data.data || []);
    } catch (error) {
      toast.error("Error loading tender data");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle Tender Document Downloads (NIT/BOQ)
  const handleDownloadTenderDoc = async (filePath) => {
    try {
      const res = await tenderAdminAPI.getTenderFileUrl(filePath);
      if (res.data.url) {
        window.open(res.data.url, '_blank');
      }
    } catch (error) {
      toast.error("Could not generate download link");
    }
  };

  // Function to handle Bid Document Viewing (Tech/Fin)
  const handleViewBidDoc = async (bidId, type) => {
    try {
      const res = type === 'tech' 
        ? await evaluationAPI.viewTechnicalPDF(bidId) 
        : await evaluationAPI.viewFinancials(bidId);
      
      window.open(res.data.view_url || res.data.url, '_blank');
    } catch (error) {
      toast.error(error.response?.data?.message || "Access Denied");
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <Loader2 className="animate-spin text-yellow-500 w-12 h-12" />
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-neutral-400 hover:text-black font-black text-xs mb-8 uppercase tracking-widest transition-all">
        <ArrowLeft size={16} /> Back to Management
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Info Card */}
          <div className="bg-white rounded-[2.5rem] p-10 border border-neutral-100 shadow-sm">
            <div className="flex justify-between items-start mb-8">
              <div>
                <span className="px-3 py-1 bg-yellow-400 text-black rounded-full text-[10px] font-black uppercase tracking-widest">
                  {tender?.status}
                </span>
                <h1 className="text-4xl font-black text-neutral-900 mt-4 leading-tight">{tender?.title}</h1>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 py-8 border-y border-neutral-50">
              <div>
                <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-1">Estimated Budget</p>
                <p className="text-xl font-black text-neutral-900">₹{parseFloat(tender?.budget_estimate).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-1">Timeline</p>
                <p className="text-xl font-black text-neutral-900">{tender?.delivery_timeline}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-1">Tech Weightage</p>
                <p className="text-xl font-black text-neutral-900">{tender?.technical_weightage}%</p>
              </div>
            </div>

            <div className="mt-8">
              <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-3">Scope of Work</h4>
              <p className="text-neutral-600 font-medium leading-relaxed">{tender?.scope_of_work}</p>
            </div>
          </div>

          {/* DOCUMENT SECTION: This is what you specifically asked for */}
          <div className="bg-neutral-50 rounded-[2.5rem] p-10 border border-neutral-100">
            <h3 className="text-xl font-black text-neutral-900 mb-6 flex items-center gap-3">
              <FileText className="text-yellow-500" /> Tender Documents (NIT/BOQ)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tender?.tender_documents?.length > 0 ? (
                tender.tender_documents.map((doc) => (
                  <button 
                    key={doc.id}
                    onClick={() => handleDownloadTenderDoc(doc.file_path)}
                    className="flex items-center justify-between p-5 bg-white rounded-2xl border border-neutral-100 hover:border-neutral-900 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-neutral-50 text-neutral-400 rounded-xl group-hover:bg-yellow-400 group-hover:text-black transition-all">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="font-black text-neutral-800 text-xs uppercase tracking-tight">{doc.document_type}</p>
                        <p className="text-[10px] text-neutral-400 font-bold">Click to Download PDF</p>
                      </div>
                    </div>
                    <Download size={18} className="text-neutral-300 group-hover:text-neutral-900" />
                  </button>
                ))
              ) : (
                <div className="col-span-2 text-center py-6 bg-white/50 rounded-2xl border border-dashed border-neutral-200">
                   <p className="text-neutral-400 font-bold text-sm italic">No technical documents attached to this tender.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Bidding Activity */}
        <div className="space-y-6">
          <div className="bg-neutral-900 rounded-[2.5rem] p-8 text-white min-h-[500px] shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-sm uppercase tracking-widest">Received Bids</h3>
              <div className="bg-yellow-400 text-black text-[10px] font-black px-2 py-1 rounded-md">
                {bids.length} TOTAL
              </div>
            </div>

            <div className="space-y-4">
              {bids.length > 0 ? bids.map((bid) => (
                <div key={bid.id} className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-yellow-400/30 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-black text-sm tracking-tight text-white uppercase">{bid.suppliers?.company_name || "Supplier"}</p>
                      <p className="text-[10px] text-neutral-500 font-black tracking-widest uppercase mt-1">{bid.status}</p>
                    </div>
                    {bid.status === 'TECH_QUALIFIED' && <CheckCircle size={16} className="text-green-400" />}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-6">
                    <button 
                      onClick={() => handleViewBidDoc(bid.id, 'tech')}
                      className="flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white text-white hover:text-black rounded-xl text-[10px] font-black transition-all"
                    >
                      <Eye size={14} /> TECH
                    </button>
                    <button 
                      disabled={bid.status !== 'TECH_QUALIFIED'}
                      onClick={() => handleViewBidDoc(bid.id, 'fin')}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black transition-all ${
                        bid.status === 'TECH_QUALIFIED' 
                        ? 'bg-yellow-400 text-black hover:bg-white' 
                        : 'bg-neutral-800 text-neutral-600 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <ShieldCheck size={14} /> FIN
                    </button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-20 border border-white/5 rounded-[2rem] border-dashed">
                  <p className="text-neutral-500 font-bold text-xs italic px-6 uppercase tracking-widest">Waiting for submissions</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}