import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import Header from '../pages/components/Header';
import Footer from '../pages/components/Footer';
import { communityAPI } from '../api/auth.service';
import mainVideo from './assets/mainvideo.mp4';
import { 
  Bell, 
  MapPin, 
  Sparkles, 
  ArrowUpRight, 
  Tent, 
  ImageIcon as ImageIconLucide, 
  ShoppingBag, 
  Phone,
  Ticket
} from 'lucide-react';

const MARKET_THEMES = {
  'Service': 'bg-[#E7F9ED] text-[#1B4332] border-[#D1F2DE]',
  'Education': 'bg-[#E3F2FD] text-[#0D47A1] border-[#BBDEFB]',
  'General': 'bg-[#FFF3E0] text-[#E65100] border-[#FFE0B2]',
  'Sale': 'bg-[#FCE4EC] text-[#880E4F] border-[#F8BBD0]',
  'Yoga': 'bg-[#FFF3E0] text-[#E65100] border-[#FFE0B2]'
};

const PLACEHOLDERS = {
  blog: "https://images.unsplash.com/photo-1496664444929-8c75efb9546f?auto=format&fit=crop&q=80",
  carnival: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80"
};

const GALLERY_PATTERNS = ['col-span-2 row-span-2', 'col-span-1 row-span-1', 'col-span-1 row-span-2', 'col-span-1 row-span-1'];

const TenderHomePage = () => {
  const navigate = useNavigate(); // 2. Initialize navigate
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    notices: [], blogs: [], carnivals: [], gallery: [], marketplace: []
  });

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const [noticesRes, blogsRes, carnivalsRes, galleryRes, marketplaceRes] = await Promise.all([
          communityAPI.getNotices(),
          communityAPI.getApprovedBlogs(),
          communityAPI.getCarnivals(),
          communityAPI.getPublicGallery(),
          communityAPI.getPublicMarketplace()
        ]);

        setData({
          notices: noticesRes?.data?.data || [],
          blogs: blogsRes?.data?.data || [],
          carnivals: carnivalsRes?.data?.data || [],
          gallery: galleryRes?.data?.data || [],
          marketplace: marketplaceRes?.data?.data || [],
        });
      } catch (error) {
        console.error("Error fetching homepage data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  // 3. Updated Navigation Handler
  const handleNavigation = (page) => {
    navigate(page);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-neutral-500 font-bold">Syncing Community Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
    <div className="min-h-screen font-sans text-neutral-900 overflow-x-hidden">
  {/* HERO SECTION */}
  <div className="relative pt-32 pb-16 px-4 md:px-8 max-w-7xl mx-auto">
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[600px]">
      
      {/* VIDEO BANNER CONTAINER */}
      <div className="md:col-span-8 bg-neutral-900 rounded-[3rem] p-8 md:p-16 flex flex-col justify-between relative overflow-hidden group">
        
        {/* The Video Element */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity duration-700"
        >
          <source src={mainVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Overlay content - ensure z-index is above video */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-yellow-400 text-neutral-900 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
            <Sparkles className="w-3 h-3" /> Puppalaguda's Finest
          </div>
          <h1 className="text-5xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter mb-6">
            LIVE <br/> VIBRANT.
          </h1>
          <p className="text-xl md:text-2xl font-bold text-neutral-200 max-w-md">
            83.5% Open Spaces. <br/> Endless Possibilities.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-4 mt-8">
          <button onClick={() => handleNavigation('/tenders')} className="bg-yellow-400 text-neutral-900 px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform flex items-center gap-2">
            Explore Tenders <ArrowUpRight className="w-5 h-5" />
          </button>
          <button onClick={() => handleNavigation('/carnivals')} className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-full font-bold text-lg hover:bg-white/20 transition-transform flex items-center gap-2">
            Book Stalls <Tent className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* RIGHT SIDE CARDS */}
      <div className="md:col-span-4 flex flex-col gap-6">
        <div className="flex-1 bg-neutral-900 rounded-[3rem] p-10 flex flex-col justify-center items-center text-center group cursor-pointer" onClick={() => handleNavigation('/notices')}>
           <Bell className="w-12 h-12 text-yellow-400 mb-4 group-hover:rotate-12 transition-transform" />
           <h3 className="text-4xl font-black text-white mb-2">{data.notices.length} New</h3>
           <p className="text-neutral-400 font-bold">Important Notices</p>
        </div>
        <div className="flex-1 bg-neutral-100 rounded-[3rem] p-8 flex flex-row items-center justify-between group hover:shadow-xl transition-all cursor-pointer" onClick={() => handleNavigation('/gallery')}>
           <div>
             <h3 className="text-3xl font-black text-neutral-900">Gallery</h3>
             <p className="text-neutral-500 font-bold text-sm mt-1">View Community</p>
           </div>
           <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
             <ImageIconLucide className="w-6 h-6 text-neutral-900" />
           </div>
        </div>
      </div>
    </div>
  </div>


        {/* NOTICES */}
        <div className="px-4 max-w-7xl mx-auto mb-20">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-4xl font-black text-neutral-900">Flash Updates</h2>
            <div className="h-1 flex-1 bg-neutral-100 rounded-full"></div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {data.notices.map((notice, i) => (
              <div key={i} className="min-w-[300px] bg-white border border-neutral-100 p-6 rounded-[2rem] hover:shadow-xl transition-all cursor-pointer group">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-black uppercase mb-4 inline-block">{notice.type || 'Notice'}</span>
                <h3 className="text-xl font-bold text-neutral-800 group-hover:text-yellow-600 transition-colors">{notice.title}</h3>
              </div>
            ))}
          </div>
        </div>

        {/* MARKETPLACE SECTION */}
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-5xl font-black text-neutral-900 tracking-tight">Marketplace</h2>
              <p className="text-neutral-500 font-bold mt-2">Resident-to-resident classifieds.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.marketplace.slice(0, 4).map((item) => {
              const themeClass = MARKET_THEMES[item.category] || MARKET_THEMES.General;
              return (
                <div key={item.id} className={`rounded-[2.5rem] p-8 h-[260px] flex flex-col justify-between border ${themeClass}`}>
                  <div>
                    <span className="inline-block bg-white/70 px-3 py-1 rounded-full text-[11px] font-black uppercase mb-3">
                      {item.category || 'Service'}
                    </span>
                    <h3 className="text-xl font-black mb-1">{item.item_name}</h3>
                    <p className="text-sm font-bold opacity-70 line-clamp-2">{item.description}</p>
                  </div>
                  <div className="mt-6 bg-white/60 rounded-xl py-3 text-center font-black text-sm flex items-center justify-center gap-2">
                    <Phone size={14} />
                    {item.contact_no || 'Contact'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CARNIVALS SECTION */}
        <div className="max-w-7xl mx-auto px-4 py-20 bg-neutral-900 rounded-[4rem] my-20 overflow-hidden relative">
           <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/10 rounded-full blur-[120px] -mr-48 -mt-48"></div>
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-center mb-16 px-8">
              <div className="text-center md:text-left">
                <h2 className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-4">Upcoming Vibes</h2>
                <p className="text-neutral-400 font-bold text-lg">Book stalls and join the community festivities.</p>
              </div>
              <button onClick={() => handleNavigation('/carnivals')} className="mt-8 md:mt-0 bg-yellow-400 text-neutral-900 px-10 py-4 rounded-full font-black text-lg hover:scale-105 transition-transform">
                Host a Stall
              </button>
           </div>
           <div className="grid md:grid-cols-3 gap-8 px-8 relative z-10">
            {data.carnivals.length > 0 ? data.carnivals.slice(0, 3).map((event) => (
              <div key={event.id} className="group relative h-[500px] rounded-[3.5rem] overflow-hidden bg-neutral-800">
                <img src={PLACEHOLDERS.carnival} className="w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-1000" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent flex flex-col justify-end p-10">
                  <div className="bg-yellow-400 w-fit px-5 py-3 rounded-2xl mb-6 text-neutral-900 font-black text-center shadow-xl">
                    <span className="block text-3xl leading-none">{new Date(event.event_date).getDate()}</span>
                    <span className="text-xs uppercase tracking-tighter">{new Date(event.event_date).toLocaleString('default', { month: 'short', year: 'numeric' })}</span>
                  </div>
                  <h3 className="text-4xl font-black text-white mb-4 leading-none tracking-tight">{event.event_title}</h3>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-white font-bold text-sm">
                      <Tent size={16} className="text-yellow-400" /> {event.total_stalls} Stalls
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-white font-bold text-sm">
                      <Ticket size={16} className="text-yellow-400" /> From ₹{event.base_stall_price}
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-3 text-center py-20 text-white/30 font-black text-2xl uppercase italic">The stage is being set...</div>
            )}
           </div>
        </div>

        {/* BLOGS SECTION - Fixed Redirection */}
        <div className="px-4 max-w-7xl mx-auto mb-24">
          <div className="bg-[#111111] rounded-[4rem] p-8 md:p-16 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
              <div>
                <span className="text-yellow-400 font-black uppercase text-xs mb-3 block tracking-[0.2em]">THE COMMUNITY BLOG</span>
                <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter">The Avatar Pulse</h2>
              </div>
              {/* FIXED: Read All Stories Redirection */}
              <button onClick={() => handleNavigation('/blog')} className="mt-6 md:mt-0 px-8 py-3 rounded-full border border-white/20 text-white hover:bg-white hover:text-black font-black transition-all text-sm">
                Read All Stories
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative z-10">
              {data.blogs.slice(0, 3).map((blog) => (
                <div 
                  key={blog.id} 
                  /* FIXED: Clicking card redirects to specific blog */
                  onClick={() => handleNavigation(`/blog/${blog.id}`)}
                  className="bg-[#1A1A1A] p-4 rounded-[3rem] border border-white/5 group cursor-pointer hover:border-white/20 transition-all"
                >
                  <div className="h-60 rounded-[2.5rem] overflow-hidden mb-6 relative">
                    <img src={blog.images?.[0] || PLACEHOLDERS.blog} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                    <span className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {blog.category || 'Lifestyle'}
                    </span>
                  </div>
                  <div className="px-2 pb-4">
                    <h3 className="text-2xl font-black text-white mb-4 leading-tight group-hover:text-yellow-400 transition-colors">{blog.title}</h3>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-yellow-400 flex-shrink-0"></div>
                      <p className="text-neutral-400 font-bold text-sm">
                        {blog.residents?.full_name || 'Anonymous'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* GALLERY */}
        <div className="max-w-7xl mx-auto px-4 py-16 mb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-6 h-[600px]">
            {data.gallery.slice(0, 4).map((img, i) => (
              <div key={img.id} className={`${GALLERY_PATTERNS[i % 4]} rounded-[3rem] overflow-hidden relative group cursor-pointer`}>
                <img src={img.image_path} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/50 transition-all"></div>
                <div className="absolute bottom-10 left-10 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all">
                  <h3 className="text-white font-black text-3xl tracking-tighter">{img.caption}</h3>
                  <p className="text-white/70 font-bold mt-1">Snapshot by {img.residents?.full_name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
      <Footer />
    </div>
  );
};


export default TenderHomePage;

