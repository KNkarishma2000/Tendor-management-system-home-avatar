import React, { useState, useEffect } from 'react';
import { 
  Loader2, Eye, Clock, CheckCircle, Ban, User, 
  X, MapPin, Phone, Briefcase, FileText, Image as ImageIcon 
} from 'lucide-react';
import { communityAPI } from '../../api/auth.service';
import toast from 'react-hot-toast';

export default function ContentModeration() {
  const [allContent, setAllContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING'); 
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const res = await communityAPI.getPendingContent();
      const { blogs, items, gallery } = res.data.pending;
      
      const combined = [
        ...(blogs || []).map(b => ({ ...b, type: 'BLOG' })),
        ...(items || []).map(i => ({ ...i, type: 'MARKETPLACE' })),
        ...(gallery || []).map(g => ({ ...g, type: 'GALLERY' }))
      ];
      setAllContent(combined);
    } catch (error) {
      toast.error("Failed to load content feed");
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (id, type, status) => {
    try {
      await communityAPI.moderateContent({ id, type, status });
      toast.success(`${type} ${status ? 'Approved' : 'Rejected'}`);
      setSelectedItem(null);
      fetchContent();
    } catch (error) {
      toast.error("Moderation action failed");
    }
  };

  const filteredContent = allContent.filter(item => 
    filter === 'ALL' ? true : item.status?.toUpperCase() === filter
  );

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="animate-spin text-yellow-400 w-12 h-12" />
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-black text-neutral-900 tracking-tight">Approvals Queue</h1>
          <p className="text-neutral-500 font-bold">Review community posts, marketplace items, and gallery photos</p>
        </div>
        
        <div className="flex bg-neutral-100 p-1.5 rounded-2xl border border-neutral-200">
          {['PENDING', 'APPROVED', 'REJECTED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all tracking-widest ${
                filter === f ? 'bg-white text-black shadow-sm' : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* GRID FEED */}
    {/* GRID FEED */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {filteredContent.length > 0 ? filteredContent.map((item) => (
    <div key={`${item.type}-${item.id}`} className="group bg-white border border-neutral-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
      
      {/* Top Row: Type & Status */}
      <div className="flex justify-between items-start mb-4">
        <div className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${
          item.type === 'BLOG' ? 'bg-blue-50 text-blue-600' : 
          item.type === 'MARKETPLACE' ? 'bg-green-50 text-green-600' : 'bg-purple-50 text-purple-600'
        }`}>
          {item.type}
        </div>
        <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest flex items-center gap-1">
          <Clock size={12}/> {item.status}
        </span>
      </div>

      {/* Content Title */}
      <h3 className="text-xl font-black text-neutral-900 line-clamp-1 mb-2">
        {item.title || item.item_name || "Gallery Submission"}
      </h3>
      
      {/* Resident Details (Clean Version) */}
      <div className="mt-auto pt-4 border-t border-neutral-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-neutral-900 rounded-2xl flex items-center justify-center shrink-0">
            <User size={18} className="text-yellow-400" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-black text-neutral-900 truncate uppercase tracking-tight">
              {item.resident_name || 'Unknown Resident'}
            </p>
            <p className="text-[11px] font-bold text-neutral-400 flex items-center gap-1">
              <MapPin size={10} className="text-red-400"/> 
              Unit {item.block} — {item.flat_no}
            </p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button 
        onClick={() => setSelectedItem(item)}
        className="w-full mt-5 py-4 bg-neutral-100 text-neutral-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-yellow-400 transition-all"
      >
        Review Details
      </button>
    </div>
  )) : (
    <div className="col-span-full py-20 text-center bg-neutral-50 rounded-[3rem] border-2 border-dashed border-neutral-200">
       <Clock className="mx-auto text-neutral-300 mb-4" size={48} />
       <p className="text-neutral-400 font-black uppercase tracking-widest">No {filter.toLowerCase()} items found</p>
    </div>
  )}
</div>
      

      {/* DETAIL MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-8 pb-4 flex justify-between items-start">
              <div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-black rounded-lg uppercase tracking-widest">
                  Reviewing {selectedItem.type}
                </span>
                <h2 className="text-3xl font-black text-neutral-900 mt-2 leading-tight">
                  {selectedItem.title || selectedItem.item_name || selectedItem.caption || "Untitled Submission"}
                </h2>
              </div>
              <button onClick={() => setSelectedItem(null)} className="p-3 hover:bg-neutral-100 rounded-full transition-colors">
                <X size={24} className="text-neutral-400" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-8 pt-0 overflow-y-auto flex-1 no-scrollbar">
              <div className="space-y-6">
                {/* Content Image */}
                {(selectedItem.image_path || (selectedItem.images && selectedItem.images.length > 0)) && (
                   <div className="rounded-[2rem] overflow-hidden bg-neutral-100 aspect-video border border-neutral-100 shadow-inner">
                      <img 
                        src={selectedItem.image_path || selectedItem.images?.[0]} 
                        alt="Submission" 
                        className="w-full h-full object-cover"
                      />
                   </div>
                )}

                {/* Submitter Info Box */}
                <div className="grid grid-cols-2 gap-4 bg-neutral-50 p-6 rounded-[2rem] border border-neutral-100">
                   <div className="flex items-center gap-3">
                      <User className="text-yellow-500" size={20}/>
                      <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase">Resident</p>
                        <p className="font-bold text-sm">{selectedItem.resident_name}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <MapPin className="text-red-500" size={20}/>
                      <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase">Location</p>
                        <p className="font-bold text-sm">Unit {selectedItem.block}-{selectedItem.flat_no}</p>
                      </div>
                   </div>
                </div>

                {/* Main Body Content */}
                <div className="bg-white border border-neutral-100 p-8 rounded-[2rem]">
                  {selectedItem.type === 'BLOG' ? (
                    <div 
                      className="text-neutral-700 leading-relaxed ql-editor"
                      dangerouslySetInnerHTML={{ __html: selectedItem.content }}
                    />
                  ) : (
                    <div className="space-y-4">
                      {selectedItem.price && (
                        <p className="text-2xl font-black text-green-600">₹{selectedItem.price}</p>
                      )}
                      <p className="text-neutral-700 font-medium leading-relaxed whitespace-pre-line">
                        {selectedItem.content || selectedItem.description || selectedItem.caption || "No description provided."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            {selectedItem.status?.toUpperCase() === 'PENDING' && (
              <div className="p-8 bg-neutral-50 border-t border-neutral-100 flex gap-4">
                <button 
                  onClick={() => handleModerate(selectedItem.id, selectedItem.type, true)} 
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-5 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-100 uppercase tracking-widest text-xs"
                >
                  <CheckCircle size={18} /> Approve Content
                </button>
                <button 
                  onClick={() => handleModerate(selectedItem.id, selectedItem.type, false)} 
                  className="flex-1 bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 py-5 rounded-2xl font-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                >
                  <Ban size={18} /> Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}