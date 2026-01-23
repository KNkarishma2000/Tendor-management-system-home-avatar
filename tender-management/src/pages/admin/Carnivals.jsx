import React, { useState, useEffect } from 'react';
import { Tent, Plus, Calendar, BadgePercent, Users, Loader2, Clock, Trash2, AlertTriangle, X } from 'lucide-react'; 
import { communityAPI } from '../../api/auth.service';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Carnivals() {
  const navigate = useNavigate();
  const [carnivals, setCarnivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null); // Track ID for popup

  const [formData, setFormData] = useState({
    event_title: '',
    event_date: '',
    bid_deadline: '',
   total_stalls: 20,         // Match your input defaultValue
  base_stall_price: 2000,   // Match your input defaultValue
  extra_stall_price: 1500
  });

  useEffect(() => {
    fetchCarnivals();
  }, []);

  const fetchCarnivals = async () => {
    try {
      setLoading(true);
      const res = await communityAPI.getCarnivals();
      setCarnivals(res.data.data || []);
    } catch (error) {
      toast.error("Failed to load carnivals");
    } finally {
      setLoading(false);
    }
  };

  const processDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      setIsDeleting(true);
      const res = await communityAPI.deleteCarnival(deleteConfirmId);
      if (res.data.success) {
        toast.success("Carnival deleted successfully");
        setCarnivals(prev => prev.filter(item => item.id !== deleteConfirmId));
        setDeleteConfirmId(null); // Close popup
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(formData.bid_deadline) >= new Date(formData.event_date)) {
      return toast.error("Bid deadline must be before the event date!");
    }

    try {
      const res = await communityAPI.createCarnival(formData);
      if (res.status === 201 || res.data.success) {
        toast.success("Carnival published successfully!");
        setShowModal(false);
        fetchCarnivals();
      }
    } catch (error) {
      const message = error.response?.data?.message || "Server connection failed";
      toast.error(`Submission Failed: ${message}`);
    }
  };

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="animate-spin text-yellow-400 w-12 h-12" />
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 uppercase tracking-tighter">Carnival Management</h1>
          <p className="text-neutral-400 font-bold text-sm">Schedule events and manage stall pricing</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-black text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-neutral-800 transition-all"
        >
          <Plus size={20} /> New Event
        </button>
      </header>

      <div className="space-y-4">
        {carnivals.map((event) => (
          <div key={event.id} className="bg-white border border-neutral-100 p-5 rounded-[2.5rem] hover:shadow-xl hover:shadow-neutral-100 transition-all group flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="bg-yellow-100 p-4 rounded-3xl text-yellow-600 group-hover:rotate-12 transition-transform">
                <Tent size={28} />
              </div>
              
              <div>
                <button 
                  onClick={() => navigate(`/admin/carnivals/${event.id}`)}
                  className="text-xl font-black text-neutral-900 hover:text-yellow-600 transition-colors text-left uppercase tracking-tighter"
                >
                  {event.event_title}
                </button>
                <div className="flex gap-4 mt-1">
                  <span className="flex items-center gap-1 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                    <Calendar size={12} /> {new Date(event.event_date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-black text-red-500 uppercase tracking-widest">
                    <Clock size={12} /> Deadline: {event.bid_deadline ? new Date(event.bid_deadline).toLocaleDateString() : 'N/A'}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                    <Users size={12} /> {event.total_stalls} Stalls
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 items-center mr-4">
              <div className="text-right">
                <p className="text-[8px] font-black text-neutral-300 uppercase tracking-widest">Base Price</p>
                <p className="font-black text-lg">₹{event.base_stall_price}</p>
              </div>
              <div className="text-right border-l border-neutral-100 pl-4 mr-2">
                <p className="text-[8px] font-black text-neutral-300 uppercase tracking-widest">Extra Stall</p>
                <p className="font-black text-lg text-yellow-600">₹{event.extra_stall_price}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="bg-neutral-50 p-4 rounded-2xl text-neutral-400 hover:bg-black hover:text-white transition-colors">
                  <BadgePercent size={20} />
                </button>
                <button 
                  onClick={() => setDeleteConfirmId(event.id)}
                  className="bg-red-50 p-4 rounded-2xl text-red-500 hover:bg-red-600 hover:text-white transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- DELETE CONFIRMATION POPUP --- */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl text-center relative animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-500" size={40} />
            </div>
            <h4 className="text-xl font-black mb-2 uppercase tracking-tighter">Confirm Deletion</h4>
            <p className="text-neutral-500 text-sm mb-8 font-bold">
              Are you sure? This will permanently remove this carnival and all related stall bookings.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={processDelete} 
                disabled={isDeleting}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs hover:bg-red-700 flex items-center justify-center gap-2 shadow-lg shadow-red-100"
              >
                {isDeleting ? <Loader2 className="animate-spin" size={16}/> : "Delete Permanently"}
              </button>
              <button 
                onClick={() => setDeleteConfirmId(null)} 
                disabled={isDeleting}
                className="w-full py-4 bg-neutral-100 text-neutral-600 rounded-2xl font-black uppercase text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CREATE MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 relative animate-in zoom-in duration-300">
            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-neutral-400 hover:text-black">
                <X size={24} />
            </button>
            
            <h2 className="text-2xl font-black mb-6 italic text-neutral-900 uppercase">Schedule Event</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-neutral-400 ml-2 tracking-widest">Event Title</label>
                <input 
                  type="text" required
                  className="w-full bg-neutral-50 border-none rounded-2xl p-4 mt-1 font-bold focus:ring-2 ring-yellow-400"
                  onChange={(e) => setFormData({...formData, event_title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-neutral-400 ml-2 tracking-widest">Event Date</label>
                  <input 
                    type="date" required
                    className="w-full bg-neutral-50 border-none rounded-2xl p-4 mt-1 font-bold focus:ring-2 ring-yellow-400"
                    onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-red-400 ml-2 tracking-widest">Bid Deadline</label>
                  <input 
                    type="date" required
                    className="w-full bg-neutral-50 border-none rounded-2xl p-4 mt-1 font-bold focus:ring-2 ring-red-400"
                    onChange={(e) => setFormData({...formData, bid_deadline: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-neutral-400 ml-2 tracking-widest">Total Stalls</label>
                  <input 
                    type="number" defaultValue={20}
                    className="w-full bg-neutral-50 border-none rounded-2xl p-4 mt-1 font-bold focus:ring-2 ring-yellow-400"
                    onChange={(e) => setFormData({...formData, total_stalls: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-neutral-400 ml-2 tracking-widest">Base Price</label>
                  <input 
                    type="number" defaultValue={2000}
                    className="w-full bg-neutral-50 border-none rounded-2xl p-4 mt-1 font-bold focus:ring-2 ring-yellow-400"
                    onChange={(e) => setFormData({...formData, base_stall_price: e.target.value})}
                  />
                </div>
              </div>
          
              <div>
                <label className="text-[10px] font-black uppercase text-neutral-400 ml-2 tracking-widest">Extra Stall Price</label>
                <input 
                  type="number" 
                  defaultValue={1500}
                  className="w-full bg-neutral-50 border-none rounded-2xl p-4 mt-1 font-bold focus:ring-2 ring-yellow-400"
                  onChange={(e) => setFormData({...formData, extra_stall_price: e.target.value})}
                />
              </div>

              <button type="submit" className="w-full bg-yellow-400 text-black py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-yellow-500 transition-all mt-4">
                Publish Event
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}