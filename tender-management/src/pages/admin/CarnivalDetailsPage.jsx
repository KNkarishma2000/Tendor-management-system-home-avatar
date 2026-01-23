import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { carnivalAPI, adminAPI } from '../../api/auth.service';
import { 
  Users, FileText, CheckCircle, XCircle, Building2, 
  Phone, Mail, ArrowLeft, Download, ExternalLink, MapPin 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CarnivalAdminDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await carnivalAPI.getCarnivalBidsAdmin(id);
      setData(res.data.data);
    } catch (err) {
      toast.error("Error fetching carnival details");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bidId, status) => {
    try {
      await carnivalAPI.updateBidStatus(bidId, status);
      toast.success(`Bid ${status} successfully`);
      fetchDetails(); // Refresh list to update status and send email
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const openSupplierPopup = async (supplierId) => {
    try {
      const res = await adminAPI.getSupplierDetails(supplierId);
      setSelectedSupplier(res.data.data);
    } catch (err) {
      toast.error("Could not load supplier profile");
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center font-black text-2xl animate-pulse">
      LOADING CARNIVAL DATA...
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Back Button & Header */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 font-black uppercase text-sm mb-6 hover:text-yellow-600 transition-colors"
      >
        <ArrowLeft size={18} /> Back to Carnivals
      </button>

      <div className="bg-neutral-900 text-white p-10 rounded-[3rem] shadow-2xl mb-10 relative overflow-hidden">
        <div className="relative z-10">
          <span className="bg-yellow-400 text-black px-4 py-1 rounded-full text-[10px] font-black uppercase mb-4 inline-block">
            Event Management
          </span>
          <h1 className="text-5xl font-black uppercase italic italic">{data?.event_title}</h1>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-8 border-t border-white/10 pt-8">
            <Stat label="Total Stalls" value={data?.total_stalls} />
            <Stat label="Base Price" value={`₹${data?.base_stall_price}`} />
            <Stat label="Extra Stall" value={`₹${data?.extra_stall_price}`} />
            <Stat label="Bids Received" value={data?.carnival_bids?.length} />
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-black mb-6 uppercase flex items-center gap-3">
        <Users size={28} className="text-yellow-500" /> Submitted Bids
      </h2>

      {/* Bids List */}
      <div className="space-y-4">
        {data?.carnival_bids?.length === 0 ? (
          <div className="bg-neutral-50 border-2 border-dashed border-neutral-200 p-12 rounded-[2rem] text-center font-bold text-neutral-400">
            No bids submitted for this event yet.
          </div>
        ) : (
          data?.carnival_bids?.map((bid) => (
            <div key={bid.id} className="bg-white border-2 border-neutral-100 p-6 rounded-[2.5rem] flex flex-wrap items-center justify-between hover:shadow-xl hover:shadow-neutral-100 transition-all">
              <div className="flex items-center gap-6">
                <div className="bg-yellow-50 p-4 rounded-2xl text-yellow-600">
                  <Building2 size={32} />
                </div>
                <div>
                  <button 
                    onClick={() => openSupplierPopup(bid.suppliers.id)}
                    className="text-xl font-black hover:text-yellow-600 flex items-center gap-2 group"
                  >
                    {bid.suppliers.company_name} 
                    <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <p className="text-sm font-bold text-neutral-400 uppercase">
                    Submitted: {new Date(bid.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-12">
                <div className="text-right">
                  <p className="text-[10px] font-black text-neutral-300 uppercase">Bid Amount</p>
                  <p className="font-black text-xl text-green-600">₹{bid.bid_amount}</p>
                </div>

                <div className="flex gap-2">
                  <DocButton url={bid.techUrl} label="Tech Doc" />
                  <DocButton url={bid.finUrl} label="Financial Doc" />
                </div>

                <div className="flex items-center gap-3 border-l pl-8 border-neutral-100">
                   <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border-2 ${
                     bid.status === 'APPROVED' ? 'bg-green-50 border-green-200 text-green-600' : 
                     bid.status === 'REJECTED' ? 'bg-red-50 border-red-200 text-red-600' : 
                     'bg-yellow-50 border-yellow-200 text-yellow-600'
                   }`}>
                     {bid.status}
                   </div>
                   
                   <div className="flex gap-1">
                     <button 
                        disabled={bid.status === 'APPROVED'}
                        onClick={() => handleStatusUpdate(bid.id, 'APPROVED')} 
                        className="p-2 bg-neutral-900 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-30"
                     >
                        <CheckCircle size={18} />
                     </button>
                     <button 
                        disabled={bid.status === 'REJECTED'}
                        onClick={() => handleStatusUpdate(bid.id, 'REJECTED')} 
                        className="p-2 bg-neutral-100 text-neutral-400 rounded-lg hover:bg-red-600 hover:text-white transition-colors disabled:opacity-30"
                     >
                        <XCircle size={18} />
                     </button>
                   </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Supplier Profile Popup */}
      {selectedSupplier && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 relative animate-in zoom-in duration-300">
            <button 
              onClick={() => setSelectedSupplier(null)} 
              className="absolute top-8 right-8 text-neutral-400 hover:text-black font-black"
            >
              CLOSE [X]
            </button>
            
            <h3 className="text-3xl font-black mb-8 italic uppercase text-neutral-900">Supplier Identity</h3>
            
            <div className="grid grid-cols-2 gap-8 mb-10">
              <InfoItem icon={<Building2 />} label="Company" value={selectedSupplier.company_name} />
              <InfoItem icon={<Users />} label="Contact Person" value={selectedSupplier.contact_person} />
              <InfoItem icon={<Mail />} label="Official Email" value={selectedSupplier.users?.email} />
              <InfoItem icon={<Phone />} label="Contact Number" value={selectedSupplier.phone_number} />
            </div>

            <div className="bg-neutral-50 p-6 rounded-3xl border border-neutral-100">
              <h4 className="text-xs font-black uppercase text-neutral-400 mb-4">Registration Proofs</h4>
              <div className="flex gap-4">
                <a href={selectedSupplier.gst_doc_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-neutral-200 font-bold text-sm hover:border-yellow-400">
                  <FileText className="text-yellow-500" size={16}/> GST Certificate
                </a>
                <a href={selectedSupplier.pan_doc_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-neutral-200 font-bold text-sm hover:border-yellow-400">
                  <FileText className="text-yellow-500" size={16}/> PAN Card
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components for cleaner code
function Stat({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">{label}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}

function DocButton({ url, label }) {
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noreferrer"
      className="flex items-center gap-2 px-4 py-2 bg-neutral-50 rounded-xl border border-neutral-100 text-[10px] font-black uppercase hover:bg-neutral-900 hover:text-white transition-all"
    >
      <Download size={14} /> {label}
    </a>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="flex gap-4">
      <div className="text-yellow-500 mt-1">{icon}</div>
      <div>
        <p className="text-[10px] font-black uppercase text-neutral-400">{label}</p>
        <p className="font-bold text-neutral-900">{value || 'Not Provided'}</p>
      </div>
    </div>
  );
}