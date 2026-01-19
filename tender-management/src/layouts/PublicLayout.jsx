import React from 'react';
// Note: Header and Footer are now imported in App.jsx or here if you prefer
import Header from '../pages/components/Header';
import Footer from '../pages/components/Footer';
import { 
  Building, 
  Menu, 
  X, 
  ChevronRight, 
  Calendar, 
  Download, 
  Phone, 
  ShoppingBag, 
  Star, 
  Image as ImageIcon, 
  ArrowUpRight, 
  Sparkles, 
  Tent, 
  Check, 
  Briefcase,
  Tag,
  PlusCircle,
  UserPlus
} from 'lucide-react';

// --- Static Content / Mock Data ---
const MOMENT_OF_THE_WEEK = {
  id: 1,
  img: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80',
  title: 'Golden Hour at the Amphitheater',
  photographer: 'Ravi Verma (Block 4)',
  desc: 'Residents gathering for an impromptu music session as the sun sets over the city skyline.',
  date: 'Sunday, Jan 14'
};

const BLOG_POSTS = [
  { id: 1, title: "Life in the Green Zone", category: "Lifestyle", image: "https://images.unsplash.com/photo-1496664444929-8c75efb9546f?auto=format&fit=crop&q=80", author: "Sneha R.", excerpt: "How 83.5% open space changes everything." },
  { id: 2, title: "Dandiya Night 2025", category: "Events", image: "https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?auto=format&fit=crop&q=80", author: "Cultural Comm.", excerpt: "A night of colors, dance, and community joy." },
  { id: 3, title: "Balcony Gardening", category: "Tips", image: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&q=80", author: "Dr. Rao", excerpt: "Thriving plants on the 25th floor." },
];

const GALLERY_IMAGES = [
  { id: 1, src: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80', title: 'Aerial View', span: 'col-span-2 row-span-2' },
  { id: 2, src: 'https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80', title: 'Clubhouse', span: 'col-span-1 row-span-1' },
  { id: 3, src: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80', title: 'Pool', span: 'col-span-1 row-span-2' },
  { id: 4, src: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?auto=format&fit=crop&q=80', title: 'Park', span: 'col-span-1 row-span-1' },
];

const ADS = [
  { id: 1, title: 'Organic Milk', desc: 'Farm fresh delivery @ 6 AM.', contact: '9876543210', tag: 'Service', color: 'bg-green-100 text-green-800' },
  { id: 2, title: 'Math Tuition', desc: 'Classes 8-10. Block 3.', contact: 'Block 3-402', tag: 'Education', color: 'bg-blue-100 text-blue-800' },
  { id: 3, title: 'Sofa Cleaning', desc: 'Deep clean. 20% off.', contact: 'CleanPro', tag: 'Service', color: 'bg-orange-100 text-orange-800' },
  { id: 4, title: 'Honda Activa', desc: '2022 Model. For Sale.', contact: 'Block 6-1102', tag: 'Sale', color: 'bg-red-100 text-red-800' },
];

const INITIAL_EVENTS = [
  { id: '1', day: '26', month: 'JAN', title: 'Republic Day', category: 'Celebration', img: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&q=80', time: '9:00 AM' },
  { id: '2', day: '02', month: 'FEB', title: 'Cricket Finals', category: 'Sports', img: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80', time: '4:00 PM' },
];

const MOCK_NOTICES = [
    { id: 1, title: 'AGM Scheduled', type: 'Meeting', date: '15 JAN', bg: 'bg-purple-100', text: 'text-purple-800' },
    { id: 2, title: 'STP Maintenance', type: 'Alert', date: '10 JAN', bg: 'bg-red-100', text: 'text-red-800' },
    { id: 3, title: 'Audit Report', type: 'Info', date: '05 JAN', bg: 'bg-blue-100', text: 'text-blue-800' },
];

// --- Shared Helper Components ---
const BellIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

// --- Internal Section Components ---
const Hero = ({ handleNavigation, noticesCount }) => (
  <div className="relative pt-32 pb-16 px-4 md:px-8 max-w-7xl mx-auto">
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[600px]">
      <div className="md:col-span-8 bg-yellow-400 rounded-[3rem] p-8 md:p-16 flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-20 rounded-full blur-3xl -mr-16 -mt-16 transition-transform duration-1000 group-hover:scale-150"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-neutral-900 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
            <Sparkles className="w-3 h-3 text-yellow-400" />
            Puppalaguda's Finest
          </div>
          <h1 className="text-5xl md:text-8xl font-black text-neutral-900 leading-[0.9] tracking-tighter mb-6">LIVE <br/> VIBRANT.</h1>
          <p className="text-xl md:text-2xl font-bold text-neutral-800 max-w-md leading-relaxed">83.5% Open Spaces. <br/> Endless Possibilities.</p>
        </div>
        <div className="relative z-10 flex flex-wrap gap-4 mt-8">
          <button onClick={() => handleNavigation('events')} className="bg-neutral-900 text-white px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform flex items-center gap-2">
            Explore Events <ArrowUpRight className="w-5 h-5" />
          </button>
          <button onClick={() => handleNavigation('carnivals')} className="bg-white text-neutral-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-neutral-100 transition-transform flex items-center gap-2">
            Book Stalls <Tent className="w-5 h-5" />
          </button>
        </div>
        <img src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80" className="absolute right-0 bottom-0 w-1/2 h-full object-cover opacity-20 md:opacity-40 mix-blend-multiply grayscale group-hover:grayscale-0 transition-all duration-700" alt="Landscape" />
      </div>
      <div className="md:col-span-4 flex flex-col gap-6">
        <div className="flex-1 bg-neutral-900 rounded-[3rem] p-10 flex flex-col justify-center items-center text-center relative overflow-hidden group hover:bg-neutral-800 transition-colors cursor-pointer" onClick={() => handleNavigation('home')}>
           <BellIcon className="w-12 h-12 text-yellow-400 mb-4 group-hover:rotate-12 transition-transform" />
           <h3 className="text-4xl font-black text-white mb-2">{noticesCount} New</h3>
           <p className="text-neutral-400 font-bold">Important Notices</p>
        </div>
        <div className="flex-1 bg-neutral-100 rounded-[3rem] p-8 flex flex-row items-center justify-between group hover:bg-white hover:shadow-xl transition-all cursor-pointer border border-transparent hover:border-yellow-200" onClick={() => handleNavigation('gallery')}>
           <div>
             <h3 className="text-3xl font-black text-neutral-900">Gallery</h3>
             <p className="text-neutral-500 font-bold text-sm mt-1">View 360° Tours</p>
           </div>
           <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
             <ImageIcon className="w-6 h-6 text-neutral-900" />
           </div>
        </div>
      </div>
    </div>
  </div>
);

const Notices = ({ notices }) => (
  <div className="px-4 max-w-7xl mx-auto mb-20">
    <div className="flex items-center gap-4 mb-8">
      <h2 className="text-4xl font-black text-neutral-900 tracking-tight">Flash Updates</h2>
      <div className="h-1 flex-1 bg-neutral-100 rounded-full"></div>
    </div>
    {notices.length === 0 ? (
      <div className="p-8 text-center bg-neutral-100 rounded-[2rem] text-neutral-500 font-bold">No active notices found.</div>
    ) : (
      <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {notices.map((notice) => (
          <div key={notice.id} className="min-w-[300px] bg-white border border-neutral-100 p-6 rounded-[2rem] hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group">
            <div className="flex justify-between items-start mb-4">
              <span className={`${notice.bg || 'bg-blue-100'} ${notice.text || 'text-blue-800'} px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider`}>{notice.type}</span>
              <span className="font-bold text-neutral-300 text-sm group-hover:text-neutral-900 transition-colors">{notice.date}</span>
            </div>
            <h3 className="text-xl font-bold text-neutral-800 leading-tight group-hover:text-yellow-600 transition-colors">{notice.title}</h3>
          </div>
        ))}
      </div>
    )}
  </div>
);

const MomentOfTheWeek = () => (
  <div className="max-w-7xl mx-auto px-4 mb-24">
    <div className="flex items-center gap-4 mb-8">
       <div className="p-3 bg-neutral-900 rounded-full text-yellow-400"><Sparkles className="w-6 h-6" /></div>
       <h2 className="text-4xl font-black text-neutral-900 tracking-tight">Moment of the Week</h2>
    </div>
    <div className="relative rounded-[3rem] overflow-hidden shadow-2xl h-[500px] group cursor-pointer">
       <img src={MOMENT_OF_THE_WEEK.img} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Moment" />
       <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent"></div>
       <div className="absolute top-8 right-8 bg-white/10 backdrop-blur-md border border-white/20 px-6 py-2 rounded-full font-black text-xs uppercase text-white shadow-lg rotate-3 group-hover:rotate-0 transition-transform">🏆 Selected Shot</div>
       <div className="absolute bottom-0 left-0 p-10 md:p-16 w-full md:w-3/4">
         <h3 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight">{MOMENT_OF_THE_WEEK.title}</h3>
         <p className="text-neutral-300 text-lg font-medium mb-8 leading-relaxed max-w-2xl">{MOMENT_OF_THE_WEEK.desc}</p>
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center font-bold text-neutral-900 text-xl shadow-lg">{MOMENT_OF_THE_WEEK.photographer.charAt(0)}</div>
            <div>
               <p className="text-[10px] text-white/50 font-black uppercase tracking-widest">Captured By</p>
               <p className="text-white font-bold text-lg">{MOMENT_OF_THE_WEEK.photographer}</p>
            </div>
            <div className="h-8 w-[1px] bg-white/20 mx-4"></div>
            <div className="flex items-center text-white/80 font-bold text-sm">
               <Calendar className="w-4 h-4 mr-2 text-yellow-400" /> {MOMENT_OF_THE_WEEK.date}
            </div>
         </div>
       </div>
    </div>
  </div>
);

const BlogPreview = ({ handleNavigation }) => (
  <div className="px-4 max-w-7xl mx-auto mb-24">
    <div className="bg-neutral-900 rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden">
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-end mb-12">
        <div>
          <span className="text-yellow-400 font-bold tracking-widest uppercase text-sm mb-2 block">The Community Blog</span>
          <h2 className="text-5xl md:text-6xl font-black tracking-tight">The Avatar Pulse</h2>
        </div>
        <button onClick={() => handleNavigation('blog')} className="mt-6 md:mt-0 px-8 py-3 rounded-full border border-white/20 hover:bg-white hover:text-neutral-900 font-bold transition-all">Read All Stories</button>
      </div>
      <div className="grid md:grid-cols-3 gap-6 relative z-10">
        {BLOG_POSTS.slice(0, 3).map((post) => (
          <div key={post.id} className="bg-white/5 backdrop-blur-lg border border-white/10 p-4 rounded-[2rem] hover:bg-white/10 transition-colors cursor-pointer group">
            <div className="h-48 rounded-[1.5rem] overflow-hidden mb-4 relative">
              <img src={post.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={post.title} />
              <div className="absolute top-3 left-3 bg-neutral-900/80 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold uppercase">{post.category}</div>
            </div>
            <h3 className="text-xl font-bold mb-2 leading-snug">{post.title}</h3>
            <div className="flex items-center text-sm text-neutral-400 font-medium">
              <span className="w-6 h-6 rounded-full bg-yellow-500 mr-2"></span> {post.author}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const Events = ({ events }) => (
  <div className="max-w-7xl mx-auto px-4 py-16">
    <h2 className="text-4xl font-black text-neutral-900 mb-12 text-center">Upcoming Vibes</h2>
    <div className="grid md:grid-cols-3 gap-8">
      {events.map((event, i) => (
        <div key={event.id} className={`group relative h-[400px] rounded-[2.5rem] overflow-hidden cursor-pointer ${i === 1 ? 'md:-mt-12' : ''}`}>
          <img src={event.img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={event.title} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8">
            <div className="bg-white/20 backdrop-blur-md w-fit px-4 py-2 rounded-xl mb-4 border border-white/10">
              <span className="block text-2xl font-black text-white text-center leading-none">{event.day}</span>
              <span className="block text-[10px] font-bold text-white/80 uppercase text-center">{event.month}</span>
            </div>
            <h3 className="text-3xl font-black text-white leading-tight mb-2">{event.title}</h3>
            <span className="text-yellow-400 font-bold text-sm tracking-wide uppercase">{event.category}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const HomeAds = ({ handleNavigation }) => (
  <div className="max-w-7xl mx-auto px-4 py-16">
    <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-4">
      <div>
        <h2 className="text-4xl font-black text-neutral-900 tracking-tight">Marketplace</h2>
        <p className="text-neutral-500 font-bold mt-2">Resident-to-resident classifieds.</p>
      </div>
      <button onClick={() => handleNavigation('ads')} className="px-6 py-2 rounded-full bg-neutral-100 hover:bg-yellow-400 hover:text-neutral-900 font-bold transition-all text-sm flex items-center">
        View All <ArrowUpRight className="w-4 h-4 ml-2" />
      </button>
    </div>
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {ADS.slice(0, 4).map(ad => (
        <div key={ad.id} className={`p-6 rounded-[2rem] flex flex-col justify-between h-64 hover:-translate-y-2 transition-transform cursor-pointer group ${ad.color}`}>
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="bg-white/40 px-3 py-1 rounded-full text-[10px] font-black uppercase">{ad.tag}</span>
              <div className="p-2 bg-white/20 rounded-full"><ShoppingBag className="w-4 h-4 opacity-70" /></div>
            </div>
            <h3 className="text-xl font-black leading-tight mb-2">{ad.title}</h3>
            <p className="text-sm font-bold opacity-70 line-clamp-2">{ad.desc}</p>
          </div>
          <div className="bg-white/30 backdrop-blur p-3 rounded-xl text-center font-bold text-sm flex items-center justify-center gap-2 group-hover:bg-white/50 transition-colors">
            <Phone className="w-3 h-3" /> {ad.contact}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Gallery = () => (
  <div className="max-w-7xl mx-auto px-4 py-16">
    <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-4 h-[600px]">
      {GALLERY_IMAGES.map((img) => (
        <div key={img.id} className={`${img.span} rounded-[2rem] overflow-hidden relative group cursor-pointer`}>
          <img src={img.src} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={img.title} />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
          <div className="absolute bottom-6 left-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <h3 className="text-white font-black text-xl">{img.title}</h3>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// --- Main Layout for Home Page ---
export default function PublicLayout() {
  const handleNavigation = (page) => {
    console.log(`Navigating to ${page}...`);
    // Logic for routing will be handled by React Router in App.jsx
  };

  return (
    <div>
        <Header />
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 selection:bg-yellow-400 selection:text-black overflow-x-hidden">
     
      <div className="animate-in fade-in duration-500">
       
        <Hero handleNavigation={handleNavigation} noticesCount={MOCK_NOTICES.length} />
        <Notices notices={MOCK_NOTICES} />
        <MomentOfTheWeek />
        <BlogPreview handleNavigation={handleNavigation} />
        <Events events={INITIAL_EVENTS} />
        <HomeAds handleNavigation={handleNavigation} />
        <Gallery />
      
      </div>
       
    </div>
     <Footer />
    </div>
  );
}