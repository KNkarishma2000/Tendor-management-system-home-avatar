import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { communityAPI } from '../api/auth.service'; // Import your service
import Header from '../pages/components/Header';
import Footer from '../pages/components/Footer';
import { Search, ArrowRight, Tent, Calendar, Sparkles } from 'lucide-react';

const AllCarnivals = () => {
  const [carnivals, setCarnivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCarnivals = async () => {
      try {
        setLoading(true);
        // Using the API from your service file
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
    <div className="h-screen flex items-center justify-center font-serif italic text-[#a88d5e] animate-pulse tracking-widest bg-[#fbfbfb]">
      Orchestrating the Festivities...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fbfbfb]">
      <Header activePage="carnivals" />

      {/* LUXURY HERO SECTION */}
      <section className="pt-48 pb-24 px-6 bg-[#1f1b16] relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#a88d5e]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Sparkles size={16} className="text-[#a88d5e]" />
            <span className="text-[#a88d5e] font-bold uppercase text-[10px] tracking-[0.5em]">
              The HomeAvatar Socials
            </span>
            <Sparkles size={16} className="text-[#a88d5e]" />
          </div>
          
          <h1 className="text-5xl md:text-8xl font-serif italic text-white leading-tight mb-8">
            The Carnival <br/> <span className="text-[#a88d5e]">Calendar</span>
          </h1>
          
          <div className="w-20 h-[1px] bg-[#a88d5e]/50 mx-auto mb-12"></div>
          
          {/* Minimalist Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-[#a88d5e]/60" size={18} />
            <input 
              type="text" 
              placeholder="FIND AN EVENT..." 
              className="w-full bg-transparent border-b border-white/10 py-4 pl-10 pr-4 text-white font-serif italic focus:outline-none focus:border-[#a88d5e] transition-all placeholder:text-gray-600 text-lg"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* CARNIVAL FEED */}
      <main className="max-w-6xl mx-auto px-6 py-24">
        {filteredCarnivals.length > 0 ? (
          <div className="grid grid-cols-1 gap-16">
            {filteredCarnivals.map((event) => (
              <div 
                key={event.id} 
                className="group flex flex-col lg:flex-row bg-white border border-gray-100 transition-all duration-700 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)]"
              >
                {/* Visual Side */}
                <div className="lg:w-2/5 relative overflow-hidden h-72 lg:h-auto bg-[#1f1b16]">
                  <img 
                    src={event.banner_image || "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80"} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-80 group-hover:opacity-100" 
                    alt={event.event_title} 
                  />
                  <div className="absolute top-0 left-0 bg-[#a88d5e] text-white p-6">
                    <span className="block text-3xl font-serif italic leading-none">
                      {new Date(event.event_date).getDate()}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest border-t border-white/30 pt-2 mt-2 block">
                      {new Date(event.event_date).toLocaleString('default', { month: 'short' })}
                    </span>
                  </div>
                </div>

                {/* Content Side */}
                <div className="lg:w-3/5 p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-4 mb-6">
                     <span className="h-[1px] w-8 bg-[#a88d5e]"></span>
                     <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a88d5e]">Upcoming Event</span>
                  </div>

                  <h3 className="text-4xl md:text-5xl font-serif italic text-[#1f1b16] mb-6 leading-tight">
                    {event.event_title}
                  </h3>

                  <div className="grid grid-cols-2 gap-8 mb-10 border-y border-gray-50 py-6">
                    <div className="flex items-center gap-3">
                      <Tent size={18} className="text-[#a88d5e]" />
                      <div>
                        <p className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter">Availability</p>
                        <p className="text-sm font-serif">{event.total_stalls} Curated Stalls</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar size={18} className="text-[#a88d5e]" />
                      <div>
                        <p className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter">Participation</p>
                        <p className="text-sm font-serif italic">Starts ₹{event.base_stall_price}</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate(`/supplier-register`)}
                    className="w-fit group/btn flex items-center gap-6 text-[11px] font-bold uppercase tracking-[0.4em] text-[#1f1b16] hover:text-[#a88d5e] transition-all"
                  >
                    HOST A STALL 
                    <span className="w-12 h-[1px] bg-[#1f1b16] group-hover/btn:w-20 group-hover/btn:bg-[#a88d5e] transition-all duration-500"></span>
                    <ArrowRight size={14} className="group-hover/btn:translate-x-2 transition-transform duration-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-40 border-t border-gray-100">
            <h2 className="text-2xl font-serif italic text-gray-300 tracking-widest uppercase">No festivities currently scheduled</h2>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AllCarnivals;