import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { communityAPI } from '../api/auth.service';
import Header from '../pages/components/Header'; // Ensure path is correct
import Footer from '../pages/components/Footer';
import { Search, ArrowRight, Clock, User, ChevronRight } from 'lucide-react';

const AllBlogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const res = await communityAPI.getApprovedBlogs();
        setBlogs(res?.data?.data || []);
      } catch (error) {
        console.error("Error fetching blogs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const categories = ["All", ...new Set(blogs.map(b => b.category || "Lifestyle"))];
  const filteredBlogs = filter === "All" ? blogs : blogs.filter(b => b.category === filter);

  if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse">LOADING STORIES...</div>;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 pt-40 pb-20">
        {/* Header */}
        <div className="mb-16">
          <h1 className="text-6xl md:text-8xl font-black text-neutral-900 tracking-tighter mb-6">
            AVATAR <span className="text-yellow-400 italic">PULSE.</span>
          </h1>
          
          {/* Category Filter */}
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                  filter === cat ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-400 border border-neutral-100 hover:border-neutral-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Blogs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredBlogs.map((blog) => (
            <div 
              key={blog.id} 
              onClick={() => navigate(`/blog/${blog.id}`)}
              className="group cursor-pointer bg-white rounded-[3rem] overflow-hidden border border-neutral-100 hover:shadow-2xl transition-all duration-500"
            >
              <div className="h-64 overflow-hidden relative">
                <img 
                  src={blog.images?.[0] || "https://images.unsplash.com/photo-1496664444929-8c75efb9546f?q=80"} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                />
                <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {blog.category || 'Community'}
                </div>
              </div>
              
              <div className="p-5">
                <div className="flex items-center gap-4 mb-4 text-neutral-400 text-[10px] font-black uppercase tracking-widest">
                  <span className="flex items-center gap-1"><User size={12}/> {blog.residents?.full_name || 'Resident'}</span>
                  <span className="flex items-center gap-1"><Clock size={12}/> {new Date(blog.created_at).toLocaleDateString()}</span>
                </div>
                <h3 className="text-2xl font-black text-neutral-900 leading-tight mb-2 group-hover:text-yellow-500 transition-colors">
                  {blog.title}
                </h3>
               <p className="text-neutral-500 text-sm line-clamp-2 mb-6 font-medium">
  {blog.content
    .replace(/<[^>]*>?/gm, '')       // Remove HTML tags
    .replace(/&nbsp;/g, ' ')        // Replace non-breaking spaces with normal spaces
    .replace(/&amp;/g, '&')         // Fix ampersands
    .trim()}
</p>
                <div className="flex items-center gap-2 text-neutral-900 font-black text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                  Read Story <ArrowRight size={16} className="text-yellow-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AllBlogs;