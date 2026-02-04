import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Image as ImageIcon, 
  MessageSquare, 
  Tent, 
  Plus, 
  Loader2, 
  ArrowRight,
  Heart,
  Megaphone
} from 'lucide-react';
import { communityAPI } from '../../api/auth.service';
import { useNavigate } from 'react-router-dom';

export default function ResidentDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Stats state
  const [stats, setStats] = useState({
    approvedBlogs: 0,
    marketItems: 0,
    galleryCount: 0,
    upcomingEvents: 0
  });
const cleanSnippet = (content) => {
  if (!content) return "";
  return content
    .replace(/<[^>]*>?/gm, '') // Remove HTML tags like <p>
    .replace(/&nbsp;/g, ' ')  // Replace &nbsp; with space
    .replace(/&amp;/g, '&')   // Fix ampersands
    .trim();
};
  const [feed, setFeed] = useState([]);
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    loadResidentData();
  }, []);

  const loadResidentData = async () => {
    try {
      setLoading(true);

      // 1. Fetch ONLY approved/public data to show accurate community stats
      // We use the public endpoints we fixed earlier to ensure only "Approved" items are counted
      const [blogsRes, itemsRes, galleryRes, eventsRes, noticesRes] = await Promise.all([
        communityAPI.getBlogs(),       // Returns only approved blogs
        communityAPI.getMarketplace(), // Returns only approved items
        communityAPI.getGallery(),     // Returns only approved photos
        communityAPI.getCarnivals(),
        communityAPI.getNotices()
      ]);

      // 2. Extract arrays safely
      const blogsArr = blogsRes.data?.data || [];
      const itemsArr = itemsRes.data?.data || [];
      const galleryArr = galleryRes.data?.data || [];
      const eventsArr = eventsRes.data?.data || [];
      const noticesArr = noticesRes.data?.data || [];

      // 3. Set Stats (Counts of Approved Content Only)
      setStats({
        approvedBlogs: blogsArr.length,
        marketItems: itemsArr.length,
        galleryCount: galleryArr.length,
        upcomingEvents: eventsArr.length
      });

      // 4. Set Live Notices (Right Sidebar)
      setNotices(noticesArr.slice(0, 4)); // Show latest 4 notices

      // 5. Create Community Feed (Merge Blogs and Market items for the main timeline)
      const combinedFeed = [
        ...blogsArr.map(b => ({ ...b, type: 'blog' })),
        ...itemsArr.map(i => ({ ...i, type: 'market' }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5); // Latest 5 items

      setFeed(combinedFeed);

    } catch (error) {
      console.error("Error loading resident dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-yellow-400" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-700 p-4">
      
      {/* --- Header --- */}
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 tracking-tight">
            HELLO, <span className="text-yellow-500">RESIDENT!</span>
          </h1>
          <p className="text-neutral-500 font-bold italic">Everything happening in My Home Avatar.</p>
        </div>
        <div className="flex gap-3">
          {/* Linked to /dashboard/marketplace */}
          <button 
            onClick={() => navigate('/dashboard/marketplace')}
            className="bg-neutral-900 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-neutral-800 transition-all shadow-lg"
          >
            <Plus size={18} /> SELL SOMETHING
          </button>
        </div>
      </header>

      {/* --- Stats Grid (Live Counts) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <QuickCard 
          icon={MessageSquare} label="Blogs" value={stats.approvedBlogs} 
          sub="Live Stories" bg="bg-blue-50" iconColor="text-blue-600"
          onClick={() => navigate('/dashboard/blogs')}
        />
        <QuickCard 
          icon={ShoppingBag} label="Market" value={stats.marketItems} 
          sub="Active Listings" bg="bg-green-50" iconColor="text-green-600"
          onClick={() => navigate('/dashboard/marketplace')}
        />
        <QuickCard 
          icon={ImageIcon} label="Gallery" value={stats.galleryCount} 
          sub="Photos Shared" bg="bg-purple-50" iconColor="text-purple-600"
          onClick={() => navigate('/dashboard/gallery')}
        />
        <QuickCard 
          icon={Tent} label="Events" value={stats.upcomingEvents} 
          sub="Upcoming Fun" bg="bg-yellow-50" iconColor="text-yellow-600"
          onClick={() => navigate('/carnivals')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* --- Main Feed (Left Column) --- */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black uppercase tracking-widest text-neutral-400 text-sm">Recent Activity</h2>
            <div className="h-px flex-1 bg-neutral-100 mx-4"></div>
          </div>

          {feed.length > 0 ? (
            feed.map((item, idx) => (
              <div 
                key={idx} 
                onClick={() => {
                  const path = item.type === 'blog' ? '/dashboard/blogs' : '/dashboard/marketplace';
                  navigate(path);
                }}
                className="bg-white border border-neutral-100 rounded-[2rem] overflow-hidden hover:shadow-xl transition-all duration-500 group cursor-pointer"
              >
                <div className="p-4">
                  {/* Type Badge & Date */}
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                      item.type === 'blog' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {item.type}
                    </span>
                    <span className="text-xs font-bold text-neutral-400">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-black text-neutral-900 mb-2 group-hover:text-yellow-500 transition-colors">
                    {item.title || item.item_name}
                  </h3>
                  
                  {/* Content Preview */}
                  <p className="text-neutral-500 font-medium line-clamp-2 mb-3 text-sm">
                {cleanSnippet(item.content || item.description)}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-neutral-50">
                    {/* Resident Info */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center font-black text-neutral-400">
                        <UserIcon name={item.residents?.full_name} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-neutral-900">{item.residents?.full_name || 'Resident'}</p>
                        <p className="text-[10px] font-bold text-neutral-400 uppercase">Block {item.residents?.block} • {item.residents?.flat_no}</p>
                      </div>
                    </div>

                    {/* Action */}
                    <button className="flex items-center gap-2 font-black text-sm text-neutral-900 group-hover:gap-4 transition-all">
                      {item.type === 'market' ? (
                        <span className="text-green-600 font-black">₹{item.price}</span>
                      ) : (
                        "READ STORY"
                      )} 
                      <ArrowRight size={16} className="text-yellow-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-neutral-50 rounded-[3rem] border-2 border-dashed border-neutral-200 text-neutral-400 font-bold italic">
              No recent activity to show.
            </div>
          )}
        </div>

        {/* --- Right Sidebar (Notices & Help) --- */}
        <div className="space-y-8">
          
          {/* Notices Card */}
          <div className="bg-[#1A1A1A] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <Megaphone className="text-yellow-400" size={20} />
                <h3 className="text-lg font-black uppercase tracking-tighter">Live Notices</h3>
              </div>
              <div className="space-y-6">
                {notices.length > 0 ? notices.map((notice) => (
                  <div key={notice.id} className="group cursor-pointer">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-sm group-hover:text-yellow-400 transition-colors line-clamp-1">{notice.title}</h4>
                      <span className="text-[9px] font-black px-2 py-0.5 bg-white/10 rounded-md uppercase">Live</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 line-clamp-2">{notice.content}</p>
                  </div>
                )) : (
                  <p className="text-xs text-neutral-500 italic">No active notices.</p>
                )}
              </div>
              <button onClick={() => navigate('/dashboard/notices')} className="w-full mt-8 bg-white/10 hover:bg-white/20 py-4 rounded-2xl font-bold text-sm transition-all border border-white/5">
                View All Notices
              </button>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-yellow-400/10 rounded-full blur-3xl"></div>
          </div>

          {/* Help Desk Card */}
          <div className="bg-yellow-400 rounded-[2.5rem] p-8 text-black group hover:scale-[1.02] transition-transform cursor-pointer shadow-xl shadow-yellow-400/20">
            <h3 className="text-xl font-black mb-2 flex items-center gap-2">
              Help Desk <Heart size={20} fill="black" />
            </h3>
            <p className="font-bold text-sm opacity-80 mb-6">Need assistance? Reach out to the society management.</p>
            <button className="bg-black text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-neutral-800 transition-all">
              Contact Admin
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// --- Sub-Components ---

const QuickCard = ({ icon: Icon, label, value, sub, bg, iconColor, onClick }) => (
  <div 
    onClick={onClick}
    className={`${bg} p-6 rounded-[2rem] border border-white/50 hover:shadow-lg transition-all cursor-pointer group`}
  >
    <div className={`p-3 rounded-2xl bg-white w-fit mb-4 shadow-sm group-hover:scale-110 transition-transform ${iconColor}`}>
      <Icon size={24} />
    </div>
    <div className="text-3xl font-black text-neutral-900">{value}</div>
    <div className="text-xs font-black text-neutral-400 uppercase tracking-widest">{label}</div>
    <div className="mt-2 text-[10px] font-bold text-neutral-400 italic">{sub}</div>
  </div>
);

const UserIcon = ({ name }) => {
  const initial = name ? name.charAt(0).toUpperCase() : 'R';
  return <span>{initial}</span>;

};
