import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LOGO from '../assets/logo.png'
import Main from '../assets/shortlogo.png'
import { 
  Building2, Home, Store, PartyPopper, Images, Newspaper, 
  Menu, X, ArrowLeft, ArrowRight, ChevronRight, 
  Calendar, Megaphone, StoreIcon, ZoomIn, Phone, ExternalLink
} from 'lucide-react';
import { communityAPI } from '../api/auth.service';
import Video from '../assets/mainvideo.mp4';

const WindsorLiving = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // DATA STATE
  const [notices, setNotices] = useState([]);
  const [marketplace, setMarketplace] = useState([]);
  const [carnivals, setCarnivals] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [gallery, setGallery] = useState([]);
  
  // POPUP/LIGHTBOX STATE
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [selectedMarketItem, setSelectedMarketItem] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [noticesRes, blogsRes, carnivalsRes, galleryRes, marketRes] = await Promise.all([
          communityAPI.getNotices(),
          communityAPI.getApprovedBlogs(),
          communityAPI.getCarnivals(),
          communityAPI.getPublicGallery(),
          communityAPI.getPublicMarketplace()
        ]);
        setNotices(noticesRes?.data?.data || []);
        setBlogs(blogsRes?.data?.data || []);
        setCarnivals(carnivalsRes?.data?.data || []);
        setGallery(galleryRes?.data?.data || []);
        setMarketplace(marketRes?.data?.data || []);
      } catch (error) {
        console.error("Backend sync failed:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const galleryImages = [
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200"
  ];

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % (gallery.length || galleryImages.length));
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + (gallery.length || galleryImages.length)) % (gallery.length || galleryImages.length));

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#1f1b16] z-[9999] flex items-center justify-center">
        <img
  src={Main}
  alt="logo"
  className="w-[130px] sm:w-[36px] md:w-[100px]"
/>
        {/* <Logo className="text-[#a88d5e] w-12 h-12 animate-pulse" /> */}
      </div>
    );
  }

  return (
    <div className="bg-[#fbfbfb] font-sans text-[#222] selection:bg-[#a88d5e] selection:text-white scroll-smooth">
      
      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#1f1b16] z-[1100] flex items-center justify-between px-6 border-b border-white/5">
        <div className="flex items-center gap-2 text-white">
        <img
  src={LOGO}
  alt="logo"
  className="w-[130px] sm:w-[36px] md:w-[40px]"
/>

        </div>
        <button onClick={() => setIsMenuOpen(true)} className="text-[#a88d5e]"><Menu size={28} /></button>
      </div>

      {/* LIGHTBOX: GALLERY FULL VIEW */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[4000] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setSelectedImage(null)}
          >
            <button className="absolute top-6 right-6 text-white hover:text-[#a88d5e]"><X size={32}/></button>
            <motion.img 
              initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              src={selectedImage} 
              className="max-w-full max-h-[90vh] object-contain shadow-2xl" 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* POPUP: MARKETPLACE DETAILS */}
      <AnimatePresence>
        {selectedMarketItem && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#1f1b16]/95 backdrop-blur-md" onClick={() => setSelectedMarketItem(null)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-lg p-10 shadow-2xl z-[3001]">
              <button onClick={() => setSelectedMarketItem(null)} className="absolute top-6 right-6 text-gray-400 hover:text-black"><X size={24}/></button>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#a88d5e]/10 text-[#a88d5e] rounded-full flex items-center justify-center mx-auto mb-4"><StoreIcon size={32} /></div>
                <h2 className="text-3xl font-serif text-[#1f1b16] mb-2">{selectedMarketItem.item_name}</h2>
                <div className="w-10 h-[1px] bg-[#a88d5e] mx-auto"></div>
              </div>
              <p className="text-gray-600 italic mb-8 leading-relaxed text-center">{selectedMarketItem.description}</p>
              <div className="bg-[#fbfbfb] p-6 border border-gray-100 flex items-center justify-center gap-4">
                <Phone size={20} className="text-[#a88d5e]" />
                <span className="font-bold tracking-widest text-[#1f1b16]">{selectedMarketItem.contact_no}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP: FLASH UPDATES (NOTICES) */}
      <AnimatePresence>
        {selectedNotice && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#1f1b16]/95 backdrop-blur-md" onClick={() => setSelectedNotice(null)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-2xl p-10 md:p-16 shadow-2xl z-[3001] max-h-[90vh] overflow-y-auto">
              <button onClick={() => setSelectedNotice(null)} className="absolute top-8 right-8 text-gray-400 hover:text-[#1f1b16]"><X size={24} /></button>
              <div className="mb-10 text-center">
                <span className="px-4 py-1 text-[10px] font-bold uppercase tracking-[0.3em] mb-6 inline-block text-[#a88d5e] bg-[#a88d5e]/5">{selectedNotice.notice_type || 'BULLETIN'}</span>
                <h2 className="text-3xl md:text-5xl font-serif italic text-[#1f1b16] leading-tight mb-6">{selectedNotice.title}</h2>
                <div className="flex items-center justify-center gap-3 text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em]"><Calendar size={14} className="text-[#a88d5e]" />{new Date(selectedNotice.display_date).toLocaleDateString()}</div>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-wrap font-serif italic text-center">{selectedNotice.content}</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULL SCREEN MOBILE MENU OVERLAY */}
{/* FULL SCREEN MOBILE MENU OVERLAY */}
{/* FULL SCREEN MOBILE MENU OVERLAY */}
<AnimatePresence>
  {isMenuOpen && (
    <motion.div 
      initial={{ x: "100%" }} 
      animate={{ x: 0 }} 
      exit={{ x: "100%" }}
      className="fixed inset-0 bg-[#1f1b16] z-[2000] flex flex-col p-8"
    >
      <div className="flex justify-between items-center mb-10">
        <img
  src={LOGO}
  alt="logo"
  className="w-[130px] sm:w-[36px] md:w-[150px]"
/>
        <button onClick={() => setIsMenuOpen(false)} className="text-[#a88d5e]">
          <X size={28} />
        </button>
      </div>
      
      {/* Mobile Links: Proper Page Redirects */}
      <nav className="flex flex-col space-y-6"> 
        {[
          { name: 'HOME', path: '/home' },
          { name: 'NOTICES', path: '/notices' },
          { name: 'MARKETPLACE', path: '/marketplace' },
          { name: 'CARNIVAL', path: '/carnivals' },
          { name: 'GALLERY', path: '/gallery' },
          { name: 'BLOGS', path: '/blog' },
          { name: 'TENDERS', path: '/tenders' }
        ].map((item) => (
          <a 
            key={item.name} 
            href={item.path}  // Redirects to the actual URL path
            onClick={() => setIsMenuOpen(false)} 
            className="text-white text-xl font-serif tracking-[0.2em] hover:text-[#a88d5e] transition-all border-b border-white/5 pb-2"
          >
            {item.name}
          </a>
        ))}
      </nav>
    </motion.div>
  )}
</AnimatePresence>

{/* DESKTOP SIDEBAR - Remains as ID-based Scroll Navigation */}
<nav className="fixed left-0 top-0 h-screen w-20 bg-[#1f1b16] hidden md:flex flex-col z-[1000] border-r border-white/5">
  <div className="h-20 flex items-center justify-center text-white border-b border-white/5">
    <img
  src={Main}
  alt="logo"
  className="w-[130px] sm:w-[36px] md:w-[40px]"
/>
  </div>
  
  <button onClick={() => setIsMenuOpen(true)} className="h-20 flex items-center justify-center text-[#a88d5e] hover:text-white transition-colors">
    <Menu size={24} />
  </button>

  <div className="flex-1 flex flex-col pt-10">
    <SidebarIcon icon={<Home size={20}/>} label="Home" href="#home" active />
    <SidebarIcon icon={<Store size={20}/>} label="Marketplace" href="#marketplace" />
    <SidebarIcon icon={<PartyPopper size={20}/>} label="Carnival" href="#carnival" />
    <SidebarIcon icon={<Images size={20}/>} label="Photos" href="#gallery" />
    <SidebarIcon icon={<Newspaper size={20}/>} label="News" href="#news" />
  </div>
</nav>

      {/* 5. MAIN CONTENT */}
      <main className="md:ml-20 pt-16 md:pt-0">
        
    <section id="home" className="relative h-[90vh] md:h-screen flex items-center overflow-hidden bg-[#1f1b16]">
  {/* 1. Background Video with Parallax Effect */}
  <div className="absolute inset-0 z-0">
    <video 
      autoPlay 
      loop 
      muted 
      playsInline 
      className="w-full h-full object-cover opacity-60 scale-105"
    >
      <source src={Video} type="video/mp4" />
    </video>
    {/* Gradient Overlay for text readability */}
    <div className="absolute inset-0 bg-gradient-to-r from-[#1f1b16] via-[#1f1b16]/40 to-transparent" />
  </div>

  {/* 2. Editorial Content Layout */}
  <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-20 flex flex-col md:flex-row items-center justify-between gap-12">
    
    {/* Left Side: Bold Typography */}
    <motion.div 
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 1, ease: "easeOut" }}
    
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-[1px] bg-[#a88d5e]" />
        <span className="text-[#a88d5e] uppercase tracking-[0.5em] text-[10px] font-bold">
          Hyderabad's Premier Residence
        </span>
      </div>
      
      <h1 className="text-5xl md:text-8xl font-serif text-white leading-[1.1] mb-8">
       The Joy of<br />
        <span className="italic text-[#a88d5e]">  Inclusive </span>Living
      </h1>

      <div className="flex flex-wrap gap-6 items-center">
       <a href="#residence"> <button className="group relative px-10 py-5 overflow-hidden border border-white/20 bg-white/5 backdrop-blur-md text-white transition-all hover:border-[#a88d5e]">
          <span className="relative z-10 uppercase tracking-widest text-xs font-bold group-hover:text-[#1f1b16] transition-colors duration-500">
            Explore Residence
          </span>
          <div className="absolute inset-0 bg-[#a88d5e] translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
        </button>
        </a>
      
      </div>
    </motion.div>

    {/* Right Side: Floating Aesthetic Card (Desktop Only) */}
   

  </div>

  {/* 3. Bottom Scroll Indicator */}
  <div className="absolute bottom-10 left-1/2 -translate-x-1/2 md:left-auto md:right-20 md:translate-x-0 flex flex-col items-center gap-4">
    <span className="[writing-mode:vertical-lr] text-white/30 uppercase tracking-[0.3em] text-[10px]">Scroll</span>
    <motion.div 
      animate={{ y: [0, 10, 0] }}
      transition={{ repeat: Infinity, duration: 2 }}
      className="w-[1px] h-12 bg-gradient-to-b from-[#a88d5e] to-transparent"
    />
  </div>
</section>

        {/* FLASH UPDATES */}
   <section className="py-20 bg-[#fbfbfb] px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-12 border-b border-gray-100 pb-6">
              <h2 className="text-[25px] sm:text-4xl md:text-5xl font-serif text-[#1f1b16]">FLASH UPDATES</h2>
              <a href="/notices" className="text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-[#a88d5e] flex items-center gap-2">View Archive <ChevronRight size={14} /></a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {notices.slice(0, 4).map((notice) => (
                <motion.div key={notice.id} whileHover={{ y: -5 }} onClick={() => setSelectedNotice(notice)} className="bg-white border border-gray-100 p-6 cursor-pointer hover:shadow-xl transition-all group relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#a88d5e] transform scale-y-0 group-hover:scale-y-100 transition-transform origin-top"></div>
                  <Megaphone size={18} className="text-[#a88d5e] mb-4" />
                  <h3 className="font-serif text-lg mb-2 group-hover:text-[#a88d5e] transition-colors">{notice.title}</h3>
                  <p className="text-gray-500 text-xs line-clamp-2 italic mb-4">{notice.content}</p>
                  <div className="text-[9px] font-bold uppercase text-[#a88d5e] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Read Details <ArrowRight size={10} /></div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      <section id="residence" className="py-24 px-6 md:px-20 relative bg-white overflow-hidden">
          <div className="absolute top-0 right-0 text-[15rem] font-bold text-black/[0.02] leading-none pointer-events-none">01</div>
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }}>
              <p className="italic font-serif text-[#a88d5e] mb-4">Modern Architecture</p>
              <h2 className="text-[25px] sm:text-4xl md:text-5xl font-serif text-[#1f1b16] mb-8 leading-tight">INTRODUCING A NEW <br/> STANDARD OF LIVING</h2>
              <div className="w-12 h-1 bg-[#a88d5e] mb-8"></div>
              <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                Each apartment has been individually designed to maximize space and light. 
                Smart Home Technology comes installed as standard.
              </p>
              <a href="#" className="inline-flex items-center gap-2 text-[#a88d5e] font-bold uppercase tracking-widest hover:gap-4 transition-all">
                Read More <ArrowRight size={18} />
              </a>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} className="relative">
              <img src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800" className="shadow-2xl grayscale hover:grayscale-0 transition-all duration-700" alt="Architecture" />
            </motion.div>
          </div>
        </section>

        {/* MARKETPLACE */}
   <section id="marketplace" className="py-24 bg-[#f8f8f8] px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16"><h2 className="text-[25px] sm:text-4xl md:text-5xl font-serif text-[#1f1b16]">COMMUNITY MARKETPLACE</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {marketplace.slice(0, 3).map((item) => (
                <motion.div 
                  key={item.id} 
                  whileHover={{ y: -5 }} 
                  onClick={() => setSelectedMarketItem(item)}
                  className="bg-white p-10 text-center border border-gray-100 shadow-sm hover:border-[#a88d5e] transition-all cursor-pointer group"
                >
                  <div className="text-[#a88d5e] flex justify-center mb-6 scale-150 group-hover:scale-110 transition-transform"><StoreIcon /></div>
                  <h3 className="font-serif text-2xl mb-4 text-[#1f1b16]">{item.item_name}</h3>
                  <p className="text-gray-500 mb-8 line-clamp-2">{item.description}</p>
                  <button className="border border-[#a88d5e] text-[#a88d5e] px-6 py-2 uppercase text-xs font-bold group-hover:bg-[#a88d5e] group-hover:text-white transition-all">View Details</button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CARNIVAL */}
        <section id="carnival" className="py-24 bg-[#1f1b16] text-white px-6">
          <div className="max-w-7xl mx-auto text-center mb-16">
            <h2 className="text-[25px] sm:text-4xl md:text-5xl font-serif uppercase tracking-widest">Carnivals & Events</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-7xl mx-auto">
            {carnivals.slice(0, 3).map((event) => (
              <div key={event.id} className="bg-white/5 border-l-4 border-[#a88d5e] p-8 hover:bg-white/10 transition-all">
                <div className="text-[#a88d5e] font-serif text-5xl mb-2">{new Date(event.event_date).getDate()}</div>
                <h3 className="text-xl font-serif mb-4">{event.event_title}</h3>
                <p className="text-gray-400 text-sm line-clamp-3 mb-6">{event.description}</p>
                <span className="bg-[#a88d5e] text-[#1f1b16] px-3 py-1 text-[10px] font-bold">{event.total_stalls} STALLS</span>
              </div>
            ))}
          </div>
  <div className="flex justify-center">
      <a 
        href="/carnivals" 
        className="px-12 py-4 bg-[#a88d5e] text-white font-serif uppercase tracking-[0.2em] text-sm hover:bg-[#1f1b16] transition-colors duration-300 shadow-lg"
      >
        View All Carnivals
      </a>
    </div>

        </section>

   <section id="gallery" className="py-24 bg-white">
  <div className="text-center mb-16">
    <h2 className="text-4xl md:text-5xl font-serif uppercase tracking-widest text-[#1f1b16]">Photo Tour</h2>
  </div>
  
  <div className="max-w-6xl mx-auto px-4">
    <div className="flex flex-col md:flex-row items-stretch md:h-[500px] relative">
      
      {/* --- DESKTOP ONLY: ORIGINAL SIDEBAR PREV --- */}
      <button 
        onClick={(e) => { e.stopPropagation(); prevSlide(); }} 
        className="w-20 bg-[#1f1b16] text-white hidden md:flex items-center justify-center hover:bg-[#a88d5e] transition-colors"
      >
        <div className="flex flex-col items-center gap-4">
          <span className="text-[10px] uppercase tracking-widest opacity-60">Prev</span>
          <ArrowLeft size={20} />
          <span className="[writing-mode:vertical-lr] rotate-180 uppercase text-xs tracking-[0.3em] font-light">Tour</span>
        </div>
      </button>

      {/* --- MAIN IMAGE VIEWPORT --- */}
      <div 
        className="flex-1 relative overflow-hidden shadow-2xl bg-gray-100 cursor-zoom-in group h-[300px] md:h-auto"
        onClick={() => setSelectedImage(gallery[currentSlide]?.image_path || galleryImages[currentSlide % 3])}
      >
        <img 
          src={gallery[currentSlide]?.image_path || galleryImages[currentSlide % 3]} 
          className="w-full h-full object-cover" 
          alt="Gallery" 
        />

        {/* --- MOBILE ONLY: FLOATING OVERLAY BUTTONS --- */}
        <div className="absolute inset-0 flex items-center justify-between px-4 md:hidden z-20 pointer-events-none">
          <button 
            onClick={(e) => { e.stopPropagation(); prevSlide(); }} 
            className="w-10 h-10 flex items-center justify-center bg-[#1f1b16]/60 backdrop-blur-md text-white rounded-full pointer-events-auto active:scale-90"
          >
            <ArrowLeft size={18} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); nextSlide(); }} 
            className="w-10 h-10 flex items-center justify-center bg-[#1f1b16]/60 backdrop-blur-md text-white rounded-full pointer-events-auto active:scale-90"
          >
            <ArrowRight size={18} />
          </button>
        </div>

        {/* DESKTOP HOVER ZOOM ICON */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center">
          <ZoomIn className="text-white w-12 h-12" />
        </div>

        {/* SLIDE COUNTER */}
        <div className="absolute bottom-4 right-4 bg-[#1f1b16]/80 text-white px-3 py-1 text-[10px] font-bold z-30">
          {(currentSlide + 1)} / {(gallery.length || galleryImages.length)}
        </div>
      </div>

      {/* --- DESKTOP ONLY: ORIGINAL SIDEBAR NEXT --- */}
      <button 
        onClick={(e) => { e.stopPropagation(); nextSlide(); }} 
        className="w-20 bg-[#1f1b16] text-white hidden md:flex items-center justify-center hover:bg-[#a88d5e] transition-colors"
      >
        <div className="flex flex-col items-center gap-4">
          <span className="text-[10px] uppercase tracking-widest opacity-60">Next</span>
          <span className="[writing-mode:vertical-lr] uppercase text-xs tracking-[0.3em] font-light">Tour</span>
          <ArrowRight size={20} />
        </div>
      </button>

    </div>
  </div>
</section>
        {/* NEWS SECTION */}
        <section id="news" className="py-24 bg-[#f8f8f8]">
          <div className="text-center mb-16"><h2 className="text-[25px] sm:text-4xl md:text-5xl font-serif text-[#1f1b16] uppercase">News & Articles</h2></div>
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {blogs.slice(0, 3).map((blog) => (
                <NewsCard 
                  key={blog.id}
                  id={blog.id}
                  img={blog.images?.[0] || galleryImages[0]} 
                  date={new Date(blog.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} 
                  title={blog.title} 
                  desc={blog.content} 
                />
              ))}
            </div>
            <div className="flex justify-center">
              <a href="/blog" className="px-12 py-4 bg-[#a88d5e] text-white font-serif uppercase tracking-[0.2em] text-sm hover:bg-[#1f1b16] transition-colors duration-300 shadow-lg">
                View All Articles
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

// SUB-COMPONENTS
const SidebarIcon = ({ icon, label, href, active = false }) => (
  <a href={href} className="relative group w-full h-20 flex items-center cursor-pointer transition-all duration-300">
    {/* The Icon Box */}
    <div className={`w-20 h-20 flex items-center justify-center transition-colors duration-300 z-20
      ${active ? 'bg-[#a88d5e] text-white' : 'text-gray-500 group-hover:bg-[#a88d5e] group-hover:text-white'}`}>
      {icon}
    </div>
    
    {/* The Label Box (Tooltip) */}
    <div className="absolute left-20 h-20 bg-[#a88d5e] text-white flex items-center px-8 text-xs font-bold uppercase tracking-widest 
                    opacity-0 invisible -translate-x-full group-hover:opacity-100 group-hover:visible group-hover:translate-x-0 
                    transition-all duration-500 ease-in-out z-10 whitespace-nowrap shadow-xl">
      {label}
    </div>
  </a>
);
const MarketplaceCard = ({ icon, title, desc, btn }) => (
  <motion.div whileHover={{ y: -5 }} className="bg-white p-10 text-center border border-gray-100 shadow-sm hover:border-[#a88d5e] transition-all">
    <div className="text-[#a88d5e] flex justify-center mb-6 scale-150">{icon}</div>
    <h3 className="font-serif text-2xl mb-4 text-[#1f1b16]">{title}</h3>
    <p className="text-gray-500 mb-8 line-clamp-3">{desc}</p>
    <button className="border border-[#a88d5e] text-[#a88d5e] px-6 py-2 uppercase text-xs font-bold hover:bg-[#a88d5e] hover:text-white transition-all">{btn}</button>
  </motion.div>
);

const EventCard = ({ date, month, title, desc, tag }) => (
  <div className="bg-white/5 border border-white/10 p-8 relative group hover:bg-white/10 transition-all border-l-4 border-l-[#a88d5e]">
    <div className="text-[#a88d5e] font-serif text-5xl mb-2">{date} <span className="text-sm text-gray-400 uppercase tracking-widest">{month}</span></div>
    <h3 className="text-xl font-serif mb-4">{title}</h3>
    <p className="text-gray-400 mb-6 line-clamp-3">{desc}</p>
    <span className="bg-[#a88d5e] text-[#1f1b16] px-3 py-1 text-[10px] font-bold">{tag}</span>
  </div>
);

const NewsCard = ({ id, img, date, title, desc }) => (
  <a href={`/blog/${id}`} className="block h-full"> 
    <motion.div whileHover={{ y: -10 }} className="bg-white group cursor-pointer shadow-sm h-full flex flex-col">
      <div className="aspect-[16/10] overflow-hidden">
        <img src={img} alt={title} className="w-full h-full object-cover grayscale-[50%] group-hover:grayscale-0 transition-all duration-700" />
      </div>
      <div className="p-8 flex flex-col flex-1">
        <div className="text-[#a88d5e] font-serif italic text-sm mb-2">{date}</div>
        <h3 className="text-xl font-serif mb-4 group-hover:text-[#a88d5e] transition-colors line-clamp-2 min-h-[3.5rem]">{title}</h3>
        <p className="text-gray-500 text-sm mb-6 line-clamp-3 italic">{desc}</p>
        <div className="mt-auto flex items-center gap-2 text-[#a88d5e] font-bold text-xs uppercase tracking-widest">
          Read More <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
        </div>
      </div>
    </motion.div>
  </a>
);

export default WindsorLiving;

