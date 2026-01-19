import React, { useState, useEffect } from 'react';
import { Tent, Plus, Calendar, BadgePercent, Users, Loader2 } from 'lucide-react';
import { communityAPI } from '../../api/auth.service';
import toast from 'react-hot-toast';

export default function Carnivals() {
  const [carnivals, setCarnivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    event_title: '',
    event_date: '',
    total_stalls: 20,
    base_stall_price: 2000,
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await communityAPI.createCarnival(formData);
      toast.success("Carnival scheduled!");
      setShowModal(false);
      fetchCarnivals();
    } catch (error) {
      toast.error("Creation failed");
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
          <h1 className="text-2xl font-black text-neutral-900 uppercase">Carnival Management</h1>
          <p className="text-neutral-400 font-bold text-sm">Schedule events and manage stall pricing</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-black text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-neutral-800 transition-all"
        >
          <Plus size={20} /> New Event
        </button>
      </header>

      {/* Modern Compact List */}
      <div className="space-y-4">
        {carnivals.map((event) => (
          <div key={event.id} className="bg-white border border-neutral-100 p-5 rounded-[2rem] hover:shadow-xl hover:shadow-neutral-100 transition-all group flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="bg-yellow-100 p-4 rounded-2xl text-yellow-600 group-hover:scale-110 transition-transform">
                <Tent size={28} />
              </div>
              
              <div>
                <h3 className="text-xl font-black text-neutral-900">{event.event_title}</h3>
                <div className="flex gap-4 mt-1">
                  <span className="flex items-center gap-1 text-xs font-bold text-neutral-400 uppercase tracking-tighter">
                    <Calendar size={14} /> {new Date(event.event_date).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold text-neutral-400 uppercase tracking-tighter">
                    <Users size={14} /> {event.total_stalls} Stalls
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-8 items-center mr-4">
              <div className="text-right">
                <p className="text-[10px] font-black text-neutral-300 uppercase">Base Price</p>
                <p className="font-black text-lg">₹{event.base_stall_price}</p>
              </div>
              <div className="text-right border-l border-neutral-100 pl-8">
                <p className="text-[10px] font-black text-neutral-300 uppercase">Extra Stall</p>
                <p className="font-black text-lg text-yellow-600">₹{event.extra_stall_price}</p>
              </div>
              <button className="bg-neutral-50 p-3 rounded-xl text-neutral-400 hover:bg-black hover:text-white transition-colors">
                <BadgePercent size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal - Simplified Create Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 relative animate-in zoom-in duration-300">
            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-neutral-400 hover:text-black">
               <Plus className="rotate-45" size={24} />
            </button>
            
            <h2 className="text-2xl font-black mb-6 italic text-neutral-900">Schedule Event</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase text-neutral-400 ml-2">Event Title</label>
                <input 
                  type="text" required
                  className="w-full bg-neutral-50 border-none rounded-2xl p-4 mt-1 font-bold focus:ring-2 ring-yellow-400"
                  onChange={(e) => setFormData({...formData, event_title: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase text-neutral-400 ml-2">Event Date</label>
                <input 
                  type="date" required
                  className="w-full bg-neutral-50 border-none rounded-2xl p-4 mt-1 font-bold focus:ring-2 ring-yellow-400"
                  onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase text-neutral-400 ml-2">Total Stalls</label>
                  <input 
                    type="number" defaultValue={20}
                    className="w-full bg-neutral-50 border-none rounded-2xl p-4 mt-1 font-bold"
                    onChange={(e) => setFormData({...formData, total_stalls: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-neutral-400 ml-2">Base Price (₹)</label>
                  <input 
                    type="number" defaultValue={2000}
                    className="w-full bg-neutral-50 border-none rounded-2xl p-4 mt-1 font-bold"
                    onChange={(e) => setFormData({...formData, base_stall_price: e.target.value})}
                  />
                </div>
                
              </div>
          
<div className="grid grid-cols-2 gap-4 mt-4">
  <div>
    <label className="text-xs font-black uppercase text-neutral-400 ml-2">Extra Stall (₹)</label>
    <input 
      type="number" 
      placeholder="1500"
      className="w-full bg-neutral-50 border-none rounded-2xl p-4 mt-1 font-bold focus:ring-2 ring-yellow-400"
      onChange={(e) => setFormData({...formData, extra_stall_price: e.target.value})}
    />
  </div>
  <div>
    <label className="text-xs font-black uppercase text-neutral-400 ml-2">Total Stalls</label>
    <input 
      type="number" 
      placeholder="20"
      className="w-full bg-neutral-50 border-none rounded-2xl p-4 mt-1 font-bold focus:ring-2 ring-yellow-400"
      onChange={(e) => setFormData({...formData, total_stalls: e.target.value})}
    />
  </div>
</div>
              <button type="submit" className="w-full bg-yellow-400 text-black py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-yellow-500 transition-all mt-4">
                Publish Event
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}