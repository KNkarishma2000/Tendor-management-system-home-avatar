import React, { useState, useEffect } from 'react';
import { 
  Loader2, ArrowLeft, X, Eye, Clock, Ban, CheckCircle, 
  UserCheck
} from 'lucide-react';
import { authResidentAPI, communityAPI } from '../../api/auth.service';
import toast from 'react-hot-toast';

export default function ResidentManagement() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedResident, setSelectedResident] = useState(null);
  const [activeTab, setActiveTab] = useState('BLOG'); 
  const [residentContent, setResidentContent] = useState({ blogs: [], items: [], gallery: [] });
  const [contentLoading, setContentLoading] = useState(false);
  const [viewingItem, setViewingItem] = useState(null); 

  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    try {
      setLoading(true);
      const res = await authResidentAPI.getAllResidents(); 
      setResidents(res.data.data || []);
    } catch (error) {
      toast.error("Failed to load resident directory");
    } finally {
      setLoading(false);
    }
  };

  const handleViewResident = async (resident) => {
    setSelectedResident(resident);
    setContentLoading(true);
    try {
      const res = await communityAPI.getPendingContent();
      const { blogs, items, gallery } = res.data.pending;
      
      setResidentContent({
        blogs: (blogs || []).filter(b => b.resident_id === resident.id),
        items: (items || []).filter(i => i.resident_id === resident.id),
        gallery: (gallery || []).filter(g => g.resident_id === resident.id)
      });
    } catch (error) {
      // Ignore if no content found
    } finally {
      setContentLoading(false);
    }
  };

  // --- UPDATED: RESIDENT ACTIONS (CORRECTED) ---
  const handleResidentAction = async (id, actionType) => {
    try {
      // 1. Prepare the correct payload for the backend
      // Backend expects: { action: 'APPROVE' } or { action: 'REJECT' }
      const actionToSend = actionType === 'approve' ? 'APPROVE' : 'REJECT';
      
      // 2. Optimistic UI Update (Update the local state immediately)
      const optimisticStatus = actionType === 'approve' ? 'APPROVED' : 'REJECTED';
      setSelectedResident(prev => ({ ...prev, status: optimisticStatus }));

      // 3. API Call
      // IMPORTANT: Changed key from 'status' to 'action' to match backend controller
      await authResidentAPI.approveResident(id, { action: actionToSend });
      
      toast.success(`Resident ${optimisticStatus === 'APPROVED' ? 'Approved' : 'Rejected'}`);

      // 4. Refresh the main list
      fetchResidents();
    } catch (error) {
      console.error(error);
      toast.error(`Failed to ${actionType} resident`);
      fetchResidents(); // Revert on error
    }
  };

  const handleModerate = async (id, type, status) => {
    try {
      // status: true/false for content moderation
      await communityAPI.moderateContent({ id, type, status });
      toast.success(`${type} ${status ? 'Approved' : 'Rejected'}`);
      setViewingItem(null); 
      handleViewResident(selectedResident); 
    } catch (error) {
      toast.error("Moderation action failed");
    }
  };

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="animate-spin text-yellow-400 w-12 h-12" />
    </div>
  );

  return (
    <div className="relative p-6">
      
      {/* 1. PREVIEW MODAL */}
      {viewingItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-8 overflow-y-auto flex-1">
              <div className="flex justify-between items-start mb-6">
                <div>
                   <h2 className="text-2xl font-black text-neutral-900 leading-tight">
                    {viewingItem.title || viewingItem.item_name || viewingItem.caption}
                  </h2>
                </div>
                <button onClick={() => setViewingItem(null)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                  <X size={24} className="text-neutral-400" />
                </button>
              </div>

              <div className="space-y-6">
                {(viewingItem.image_path || (viewingItem.images && viewingItem.images.length > 0)) && (
                   <div className="rounded-3xl overflow-hidden bg-neutral-100 aspect-video flex items-center justify-center border border-neutral-100">
                      <img 
                        src={viewingItem.image_path || viewingItem.images?.[0]} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                   </div>
                )}
                {(viewingItem.content || viewingItem.description) && (
                  <div className="bg-neutral-50 p-6 rounded-3xl">
                    <p className="text-neutral-700 font-medium leading-relaxed whitespace-pre-line">
                        {viewingItem.content || viewingItem.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
            {viewingItem.status?.toUpperCase() !== 'APPROVED' && viewingItem.status?.toUpperCase() !== 'REJECTED' && (
              <div className="p-6 bg-neutral-50 border-t border-neutral-100 flex gap-4">
                <button onClick={() => handleModerate(viewingItem.id, viewingItem.type, true)} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-200">
                  <CheckCircle size={20} /> APPROVE CONTENT
                </button>
                <button onClick={() => handleModerate(viewingItem.id, viewingItem.type, false)} className="flex-1 bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2">
                  <Ban size={20} /> REJECT CONTENT
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. MAIN VIEW */}
      {selectedResident ? (
        <div className="animate-in slide-in-from-right duration-300">
           <button onClick={() => setSelectedResident(null)} className="flex items-center gap-2 text-neutral-400 hover:text-black font-bold mb-6">
             <ArrowLeft size={20} /> BACK TO DIRECTORY
           </button>
           
           <div className="bg-white rounded-[2.5rem] p-8 border border-neutral-100 shadow-sm mb-8">
             <div className="flex flex-col md:flex-row justify-between items-start gap-6">
               <div className="flex-1">
                 {/* Status Badge */}
                 <span className={`inline-block px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest mb-3 ${
                    selectedResident.status?.toUpperCase() === 'APPROVED' ? 'bg-green-100 text-green-700' :
                    selectedResident.status?.toUpperCase() === 'REJECTED' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                 }`}>
                    {selectedResident.status?.toUpperCase() === 'APPROVED' && <CheckCircle className="inline w-3 h-3 mr-1 -mt-0.5"/>}
                    {selectedResident.status?.toUpperCase() === 'REJECTED' && <Ban className="inline w-3 h-3 mr-1 -mt-0.5"/>}
                    {selectedResident.status || 'PENDING'}
                 </span>
                 
                 <h1 className="text-4xl font-black text-neutral-900 mb-2">{selectedResident.full_name}</h1>
                 <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-500 font-bold">
                   <span>Unit: <span className="text-neutral-900">{selectedResident.block} - {selectedResident.flat_no}</span></span>
                   <span>•</span>
                   <span>{selectedResident.email}</span>
                   <span>•</span>
                   <span>{selectedResident.phone_number}</span>
                 </div>
               </div>

               {/* --- ACTION BUTTONS --- */}
               <div className="flex gap-3 w-full md:w-auto">
                  {/* APPROVE BUTTON */}
                  {selectedResident.status?.toUpperCase() !== 'APPROVED' && (
                    <button 
                      onClick={() => handleResidentAction(selectedResident.id, 'approve')}
                      className="flex-1 md:flex-none bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wide transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2"
                    >
                      <UserCheck size={20} /> Approve
                    </button>
                  )}

                  {/* REJECT BUTTON */}
                  {selectedResident.status?.toUpperCase() !== 'REJECTED' && (
                    <button 
                      onClick={() => handleResidentAction(selectedResident.id, 'reject')}
                      className="flex-1 md:flex-none bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-wide transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                    >
                      <Ban size={20} /> Reject
                    </button>
                  )}
               </div>
             </div>

             <div className="h-px bg-neutral-100 my-8"></div>

             {/* TABS */}
             <div className="flex gap-8 border-b border-neutral-100">
                {['BLOG', 'MARKETPLACE', 'GALLERY'].map((tab) => {
                  const key = tab === 'BLOG' ? 'blogs' : tab === 'MARKETPLACE' ? 'items' : 'gallery';
                  return (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 font-black text-sm relative transition-colors ${activeTab === tab ? 'text-black' : 'text-neutral-400'}`}>
                      {tab} ({residentContent[key]?.length || 0})
                      {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-1 bg-yellow-400 rounded-full" />}
                    </button>
                  )
                })}
             </div>

             <div className="py-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeTab === 'BLOG' && residentContent.blogs.map(blog => (
                   <ContentCard key={blog.id} title={blog.title} sub={blog.content} status={blog.status} onReview={() => setViewingItem({...blog, type: 'BLOG'})} />
                ))}
                {activeTab === 'MARKETPLACE' && residentContent.items.map(item => (
                   <ContentCard key={item.id} title={item.item_name} sub={`₹${item.price}`} status={item.status} onReview={() => setViewingItem({...item, type: 'MARKETPLACE'})} />
                ))}
                {activeTab === 'GALLERY' && residentContent.gallery.map(img => (
                   <ContentCard key={img.id} title={img.caption || "Gallery Image"} sub="Image Submission" status={img.status} onReview={() => setViewingItem({...img, type: 'GALLERY'})} />
                ))}
                
                {residentContent[activeTab === 'BLOG' ? 'blogs' : activeTab === 'MARKETPLACE' ? 'items' : 'gallery'].length === 0 && (
                  <div className="col-span-2 py-20 text-center bg-neutral-50 rounded-[2rem] border-2 border-dashed border-neutral-100">
                    <p className="text-neutral-400 font-bold uppercase tracking-widest text-xs">No content found.</p>
                  </div>
                )}
             </div>
           </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-neutral-100 overflow-hidden shadow-sm">
           <table className="w-full text-left">
             <thead>
               <tr className="border-b border-neutral-50">
                 <th className="px-8 py-6 text-[10px] font-black uppercase text-neutral-400">Resident Name</th>
                 <th className="px-8 py-6 text-[10px] font-black uppercase text-neutral-400">Unit Number</th>
                 <th className="px-8 py-6 text-[10px] font-black uppercase text-neutral-400 text-right">Action</th>
               </tr>
             </thead>
             <tbody>
               {residents.map(res => (
                 <tr key={res.id} onClick={() => handleViewResident(res)} className="group hover:bg-neutral-50 transition-colors cursor-pointer border-b border-neutral-50">
                   <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-neutral-900 group-hover:text-yellow-600 transition-colors">{res.full_name}</span>
                        {/* Status Badge in Table */}
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                             res.status?.toUpperCase() === 'APPROVED' ? 'bg-green-100 text-green-700' :
                             res.status?.toUpperCase() === 'REJECTED' ? 'bg-red-100 text-red-600' : 
                             'bg-yellow-100 text-yellow-700'
                          }`}>
                            {res.status || 'Pending'}
                          </span>
                      </div>
                   </td>
                   <td className="px-8 py-6 font-bold text-neutral-400 uppercase text-xs">{res.block}-{res.flat_no}</td>
                   <td className="px-8 py-6 text-right font-black text-neutral-300 group-hover:text-black">VIEW PROFILE →</td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      )}
    </div>
  );
}

const ContentCard = ({ title, sub, status, onReview }) => {
  const s = status?.toUpperCase();
  const isPending = s !== 'APPROVED' && s !== 'REJECTED';
  const getStatusStyles = () => {
    if (s === 'APPROVED') return 'bg-green-100 text-green-700 border-green-200';
    if (s === 'REJECTED') return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  };

  return (
    <div 
      className="p-5 border border-neutral-100 rounded-3xl bg-white flex justify-between items-center group hover:border-yellow-200 hover:shadow-md transition-all cursor-pointer" 
      onClick={onReview}
    >
      <div className="max-w-[65%]">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-black text-neutral-900 truncate uppercase text-sm tracking-tight">{title}</h4>
          <span className={`flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-black border ${getStatusStyles()}`}>
            {s === 'APPROVED' ? <CheckCircle size={10} /> : s === 'REJECTED' ? <Ban size={10} /> : <Clock size={10} />} {status}
          </span>
        </div>
        <p className="text-xs text-neutral-400 line-clamp-1 font-medium">{sub}</p>
      </div>
      
      {isPending ? (
        <button className="flex items-center gap-2 bg-yellow-400 px-4 py-2.5 rounded-xl text-[10px] font-black text-black shadow-sm hover:bg-black hover:text-white transition-all uppercase tracking-widest">
          <Eye size={14} /> Review
        </button>
        ) : (
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Processed</span>
          <span className="text-[8px] font-bold text-neutral-400">Click to View</span>
        </div>
      )}
    </div>
  );
};
