import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { carnivalAPI } from '../../api/auth.service';
import { Calendar, MapPin, ArrowRight, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SupplierCarnivalList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await carnivalAPI.getActiveCarnivals();
        setEvents(res.data.data || []);
      } catch (err) {
        toast.error("Could not load events. Check your connection.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse">LOADING CARNIVALS...</div>;

  return (
    <div className="p-8 bg-neutral-50 min-h-screen">
      <div className="max-w-7xl mx-auto mb-12">
        <h1 className="text-5xl font-black uppercase italic mb-2 tracking-tighter">Carnival Opportunities</h1>
        <p className="text-neutral-500 font-bold uppercase text-sm tracking-widest">Book your stall for upcoming community events</p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {events.length > 0 ? (
          events.map((event) => (
            <CarnivalCard 
              key={event.id} 
              event={event} 
              onApply={() => navigate(`/supplier/carnival/${event.id}`)} 
            />
          ))
        ) : (
          <div className="col-span-full py-20 bg-white border-4 border-dashed border-neutral-200 rounded-[3rem] text-center">
            <AlertCircle className="mx-auto mb-4 text-neutral-300" size={48} />
            <p className="font-black text-neutral-400 uppercase">No active carnivals scheduled yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const CarnivalCard = ({ event, onApply }) => {
  // Check if deadline is close (24h logic)
  const eventDate = new Date(event.event_date);
  const isClosingSoon = (eventDate - new Date()) < (48 * 60 * 60 * 1000); // 48h warning

  return (
    <div className="bg-white border-4 border-black rounded-[2.5rem] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col justify-between group">
      <div>
        <div className="flex justify-between items-start mb-6">
          <span className={`px-4 py-1 border-2 border-black rounded-full font-black text-[10px] uppercase ${isClosingSoon ? 'bg-red-400' : 'bg-green-400'}`}>
            {isClosingSoon ? 'Closing Soon' : 'Open'}
          </span>
          <Clock size={20} className="text-neutral-300" />
        </div>

        <h3 className="text-2xl font-black mb-4 group-hover:text-blue-600 transition-colors">{event.event_title}</h3>
        
        <div className="space-y-3 mb-8">
          <div className="flex items-center gap-3 font-bold text-neutral-600 text-sm">
            <Calendar size={18} className="text-black" />
            {new Date(event.event_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
          <div className="flex items-center gap-3 font-bold text-neutral-600 text-sm">
            <MapPin size={18} className="text-black" />
            {event.location || "Community Grounds"}
          </div>
        </div>
      </div>

      <button 
        onClick={onApply}
        className="w-full py-4 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-yellow-400 hover:text-black transition-all"
      >
        Book a Stall <ArrowRight size={18} />
      </button>
    </div>
  );
};