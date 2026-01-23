import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { carnivalAPI } from '../../api/auth.service';
import { 
  ArrowLeft, Send, FileText, Clock, AlertTriangle, 
  ExternalLink, IndianRupee, Info, Gavel, MapPin, 
  Calendar, CheckSquare, Layers, Tent, PlusCircle, CircleDollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CarnivalBidSubmissionPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('details'); 
  const [event, setEvent] = useState(null);
  const [existingBid, setExistingBid] = useState(null);
  const [downloadUrls, setDownloadUrls] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [eventRes, bidRes] = await Promise.all([
          carnivalAPI.getActiveCarnivals(),
          carnivalAPI.getMyBidStatus(id)
        ]);
        
        const currentEvent = eventRes.data.data.find(e => e.id === id);
        setEvent(currentEvent);

        if (bidRes.data && bidRes.data.bid) {
          setExistingBid(bidRes.data.bid);
          setDownloadUrls(bidRes.data.downloadUrls);
        }
      } catch (err) {
        console.error("Sync error", err);
        toast.error("Failed to sync event data");
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [id]);

const handleFormSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Safety check for files
    const techFile = formData.get('technical_doc');
    const finFile = formData.get('financial_doc');

    if (!techFile || techFile.size === 0 || !finFile || finFile.size === 0) {
      return toast.error("Please upload both Technical and Financial documents");
    }

    formData.append('carnival_id', id);

    setSubmitting(true);
    const loadToast = toast.loading("Uploading bid documents...");
    
    try {
      const response = await carnivalAPI.submitCarnivalBid(formData);
      
      if (response.data.success) {
        toast.success("Bid submitted successfully!", { id: loadToast });
        // Small delay before reload to let user see success
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      console.error("Submission Error Details:", err.response?.data);
      const errorMessage = err.response?.data?.message || "Submission failed. Please check file sizes.";
      toast.error(errorMessage, { id: loadToast });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse text-2xl">SYNCHRONIZING...</div>;

  return (
    <div className="p-8 bg-neutral-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate(-1)} className="mb-8 flex items-center gap-2 font-black uppercase text-xs hover:gap-4 transition-all">
          <ArrowLeft size={16}/> Back to List
        </button>

        {/* HEADER SECTION */}
        <div className="mb-10">
          <div className="flex justify-between items-end flex-wrap gap-6">
            <div>
                <h1 className="text-6xl font-black uppercase italic tracking-tighter mb-4">{event?.event_title}</h1>
                <div className="flex flex-wrap gap-4">
                    <span className="bg-black text-white px-4 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-2">
                        <Tent size={12}/> {event?.total_stalls} Total Stalls
                    </span>
                    <span className="bg-yellow-400 text-black px-4 py-1 rounded-full text-[10px] font-black uppercase">
                        Available: {event?.available_stalls ?? event?.total_stalls}
                    </span>
                    <div className="flex items-center gap-2 text-neutral-500 font-bold uppercase text-xs"><MapPin size={14}/> {event?.location || 'Community Grounds'}</div>
                </div>
            </div>
            {/* Status Indicator */}
            <div className="bg-white border-4 border-black p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-[10px] font-black uppercase opacity-40">Application Deadline</p>
                <p className="text-xl font-black text-red-500">{event?.bid_deadline ? new Date(event.bid_deadline).toLocaleDateString('en-IN', {day: '2-digit', month: 'short'}) : 'OPEN'}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 bg-neutral-200 p-2 rounded-[2rem] w-fit border-4 border-black">
          <button onClick={() => setActiveTab('details')} className={`px-8 py-3 rounded-full font-black uppercase text-xs transition-all ${activeTab === 'details' ? 'bg-black text-white' : ''}`}>Details & Pricing</button>
          <button onClick={() => setActiveTab('bidding')} className={`px-8 py-3 rounded-full font-black uppercase text-xs transition-all ${activeTab === 'bidding' ? 'bg-yellow-400 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : ''}`}>
            {existingBid ? 'My Bid Status' : 'Submit Application'}
          </button>
        </div>

        {activeTab === 'details' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* 1. Core Timeline & Basic Price */}
            <div className="grid md:grid-cols-3 gap-6">
              <DetailCard label="Event Date" value={new Date(event?.event_date).toLocaleDateString()} icon={<Calendar size={20}/>} />
              <DetailCard label="Deadline" value={event?.bid_deadline ? new Date(event.bid_deadline).toLocaleDateString() : 'No Deadline'} icon={<Clock size={20}/>} />
              <DetailCard label="Base Price" value={`₹${event?.base_stall_price}`} icon={<IndianRupee size={20}/>} color="text-green-600" />
            </div>

            {/* 2. Expanded Financial Breakdown */}
            <div className="bg-white border-4 border-black rounded-[3rem] p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="text-2xl font-black uppercase italic mb-8 flex items-center gap-3">
                    <CircleDollarSign size={28}/> Commercial Terms
                </h3>
                <div className="grid md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <div className="flex justify-between items-center p-6 bg-neutral-50 border-2 border-black rounded-2xl">
                            <div>
                                <p className="font-black uppercase text-[10px] text-neutral-400">Primary Stall (10x10)</p>
                                <p className="text-2xl font-black">₹{event?.base_stall_price}</p>
                            </div>
                            <Tent size={32} className="opacity-20"/>
                        </div>
                        <div className="flex justify-between items-center p-6 bg-yellow-50 border-2 border-black rounded-2xl">
                            <div>
                                <p className="font-black uppercase text-[10px] text-yellow-700">Extra Stall Price</p>
                                <p className="text-2xl font-black">₹{event?.extra_stall_price || 'N/A'}</p>
                            </div>
                            <PlusCircle size={32} className="text-yellow-600"/>
                        </div>
                    </div>

                    <div className="bg-black text-white p-8 rounded-[2rem] flex flex-col justify-center">
                        <h4 className="font-black uppercase text-sm mb-2 text-yellow-400">Estimated Total (Min)</h4>
                        <p className="text-4xl font-black italic mb-4">₹{event?.base_stall_price}</p>
                        <p className="text-[10px] font-bold opacity-70 leading-relaxed uppercase">
                            *This is the base bidding price. Your final bid amount should include your proposed overheads and profit margins.
                        </p>
                    </div>
                </div>
            </div>

            {/* 3. Guidelines & Mandatory */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="p-8 bg-blue-50 border-4 border-black rounded-3xl">
                    <h4 className="font-black uppercase text-sm mb-4 flex items-center gap-2"><CheckSquare size={18}/> Stall Guidelines</h4>
                    <ul className="space-y-2 text-sm font-bold">
                        <li>• Standard Unit: 10x10 sqft waterproof pagoda</li>
                        <li>• Lighting: 2 LED points + 1 Power socket (5A)</li>
                        <li>• Furniture: 1 Table + 2 Chairs provided</li>
                        <li>• Setup Window: Event start - 6 Hours</li>
                    </ul>
                </div>
                <div className="p-8 bg-red-50 border-4 border-black rounded-3xl">
                    <h4 className="font-black uppercase text-sm mb-4 flex items-center gap-2"><AlertTriangle size={18}/> Mandatory Requirements</h4>
                    <ul className="space-y-2 text-sm font-bold">
                        <li>• FSSAI License upload (For Food Stalls)</li>
                        <li>• Fire Safety: 1 portable extinguisher per stall</li>
                        <li>• Waste: Biodegradable packaging ONLY</li>
                        <li>• Identity: Staff must wear issued ID tags</li>
                    </ul>
                </div>
            </div>
          </div>
        ) : (
          <div className="w-full">
            {existingBid ? (
              <div className="bg-white border-4 border-black rounded-[3rem] overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                 <div className={`p-10 border-b-4 border-black ${getStatusStyles(existingBid.status).bg}`}>
                    <h2 className="text-4xl font-black uppercase italic">Bid Status: {existingBid.status}</h2>
                 </div>
                 <div className="p-10 space-y-8">
                    <div className="grid md:grid-cols-2 gap-6">
                        <DetailCard label="Your Amount" value={`₹${existingBid.bid_amount}`} icon={<IndianRupee/>}/>
                        <DetailCard label="Applied On" value={new Date(existingBid.created_at).toLocaleDateString()} icon={<Clock/>}/>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase mb-4 opacity-50">Submitted Documents</p>
                        <div className="flex flex-wrap gap-4">
                            <DocLink label="Technical Plan" url={downloadUrls?.technical}/>
                            <DocLink label="Financial Quote" url={downloadUrls?.financial}/>
                        </div>
                    </div>
                 </div>
              </div>
            ) : (
              <div className="bg-white border-4 border-black rounded-[3rem] p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                <form onSubmit={handleFormSubmit} className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase ml-2">Your Proposed Bid Amount (₹)</label>
                        <input type="number" name="bid_amount" placeholder={`Minimum ₹${event?.base_stall_price}`} min={event?.base_stall_price} required className="w-full p-5 bg-neutral-50 border-4 border-black rounded-2xl font-black" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase ml-2">Stall Category</label>
                        <select name="proposal_description" required className="w-full p-5 bg-neutral-50 border-4 border-black rounded-2xl font-bold appearance-none">
                            <option value="">Select Category</option>
                            <option value="Food & Beverages">Food & Beverages</option>
                            <option value="Handicrafts/Retail">Handicrafts/Retail</option>
                            <option value="Games/Activities">Games/Activities</option>
                            <option value="Promotional/Brand">Promotional/Brand</option>
                        </select>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase ml-2">Technical Proposal (PDF)</label>
                        <input type="file" name="technical_doc" accept=".pdf" required className="w-full p-4 border-4 border-black rounded-2xl font-bold text-xs" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase ml-2">Financial Breakdown (PDF/XLS)</label>
                        <input type="file" name="financial_doc" accept=".pdf,.xlsx,.xls" required className="w-full p-4 border-4 border-black rounded-2xl font-bold text-xs" />
                    </div>
                  </div>
                  <button type="submit" disabled={submitting} className="w-full bg-yellow-400 text-black py-8 rounded-3xl border-4 border-black font-black text-2xl hover:bg-black hover:text-white transition-all">
                    {submitting ? 'UPLOADING...' : 'CONFIRM & SUBMIT BID'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-components
const DetailCard = ({ label, value, icon, color = "text-black" }) => (
  <div className="bg-white p-6 rounded-3xl border-4 border-black flex items-center gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
    <div className="bg-neutral-100 p-3 rounded-xl border-2 border-black shrink-0">{icon}</div>
    <div>
      <p className="text-[10px] font-black uppercase text-neutral-400 leading-none mb-1">{label}</p>
      <p className={`text-lg font-black uppercase italic ${color}`}>{value}</p>
    </div>
  </div>
);

const DocLink = ({ label, url }) => (
  <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-6 py-4 bg-white border-4 border-black rounded-2xl font-black text-sm hover:bg-black hover:text-white transition-all">
    <FileText size={18}/> {label} <ExternalLink size={14}/>
  </a>
);

const getStatusStyles = (status) => {
    if (status === 'APPROVED') return { bg: 'bg-green-400' };
    if (status === 'REJECTED') return { bg: 'bg-red-400' };
    return { bg: 'bg-blue-400' };
};