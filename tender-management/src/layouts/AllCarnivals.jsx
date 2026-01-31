import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { communityAPI } from '../api/auth.service';
import Header from '../pages/components/Header';
import Footer from '../pages/components/Footer';
import { Tent, Ticket, Calendar, MapPin, Search, ArrowRight, Sparkles } from 'lucide-react';

const PLACEHOLDER = "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80";

const AllCarnivals = () => {
  const [carnivals, setCarnivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCarnivals = async () => {
      try {
        setLoading(true);
        const res = await communityAPI.getCarnivals();
        setCarnivals(res?.data?.data || []);
      } catch (error) {
        console.error("Error fetching carnivals:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCarnivals();
  }, []);

  const filteredCarnivals = carnivals.filter(c => 
    c.event_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-neutral-50 font-black text-xl italic uppercase animate-pulse">
      Setting the Stage...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Header activePage="carnivals" />

      {/* HERO SECTION */}
      <section className="pt-40 pb-20 px-6 bg-neutral-900 rounded-b-[4rem]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 bg-yellow-400 text-neutral-900 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                <Sparkles size={12} /> Community Events
              </span>
              <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-none">
                THE FESTIVAL <br/> <span className="text-yellow-400 italic">CALENDAR.</span>
              </h1>
            </div>
            
            <div className="relative w-full md:w-96">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
              <input 
                type="text" 
                placeholder="Search events..." 
                className="w-full bg-white/5 border border-white/10 rounded-full py-5 pl-16 pr-8 text-white font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* GRID SECTION */}
      <main className="max-w-7xl mx-auto px-6 py-20">
        {filteredCarnivals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredCarnivals.map((event) => (
              <div key={event.id} className="group bg-white rounded-[3.5rem] overflow-hidden border border-neutral-100 shadow-sm hover:shadow-2xl transition-all duration-500">
                <div className="relative h-72 overflow-hidden">
                  <img 
                    src={PLACEHOLDER} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    alt={event.event_title} 
                  />
                  <div className="absolute top-6 left-6 bg-white rounded-2xl px-4 py-3 text-center shadow-lg">
                    <span className="block text-2xl font-black text-neutral-900 leading-none">
                      {new Date(event.event_date).getDate()}
                    </span>
                    <span className="text-[10px] font-black uppercase text-neutral-400">
                      {new Date(event.event_date).toLocaleString('default', { month: 'short' })}
                    </span>
                  </div>
                </div>

                <div className="p-10 space-y-6">
                  <h3 className="text-3xl font-black text-neutral-900 tracking-tight leading-none">
                    {event.event_title}
                  </h3>

                  <div className="flex flex-wrap gap-3">
                    <span className="flex items-center gap-2 bg-neutral-50 px-4 py-2 rounded-xl text-xs font-bold text-neutral-600">
                      <Tent size={14} className="text-yellow-500" /> {event.total_stalls} Stalls
                    </span>
                    <span className="flex items-center gap-2 bg-neutral-50 px-4 py-2 rounded-xl text-xs font-bold text-neutral-600">
                      <Ticket size={14} className="text-yellow-500" /> From ₹{event.base_stall_price}
                    </span>
                  </div>

                  <button 
                    onClick={() => navigate(`/resident-register`)}
                    className="w-full bg-neutral-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 group-hover:bg-yellow-400 group-hover:text-neutral-900 transition-colors"
                  >
                    Host a Stall <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-40">
            <h2 className="text-4xl font-black text-neutral-200 uppercase italic">No Carnivals Found</h2>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AllCarnivals;