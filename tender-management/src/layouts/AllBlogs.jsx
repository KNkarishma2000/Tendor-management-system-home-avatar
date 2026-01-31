import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { communityAPI } from '../api/auth.service';
import Header from '../pages/components/Header';
import Footer from '../pages/components/Footer';
import { ArrowRight } from 'lucide-react';

const AllBlogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await communityAPI.getApprovedBlogs();
        setBlogs(res?.data?.data || []);
      } catch (error) {
        console.error("Sync failed:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#1f1b16] text-[#a88d5e]">Loading...</div>;

  return (
    <div className="bg-[#fbfbfb] min-h-screen">
      <Header />
      
      {/* md:ml-20 is critical to clear your sidebar */}
      <main className="md:ml-20 pt-32 px-6 md:px-20 pb-20">
        
        {/* Header - Sharp Windsor Style */}
        <div className="max-w-7xl mx-auto mb-16">
          <p className="italic font-serif text-[#a88d5e] mb-2">Resident Stories</p>
          <h1 className="text-5xl font-serif text-[#1f1b16] uppercase tracking-tighter">News & Articles</h1>
          <div className="w-12 h-1 bg-[#a88d5e] mt-4"></div>
        </div>

        {/* Grid - Matching Home Page spacing */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {blogs.map((blog) => (
            <div key={blog.id} onClick={() => navigate(`/blog/${blog.id}`)} className="cursor-pointer group">
              
              {/* Card Container - NO ROUNDED CORNERS */}
              <motion.div 
                whileHover={{ y: -10 }}
                className="bg-white border border-gray-100 flex flex-col h-full shadow-sm hover:shadow-xl transition-all duration-500"
              >
                {/* Image Section */}
                <div className="aspect-[16/10] overflow-hidden">
                  <img 
                    src={blog.images?.[0] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600"} 
                    className="w-full h-full object-cover grayscale-[50%] group-hover:grayscale-0 transition-all duration-700"
                    alt="" 
                  />
                </div>

                {/* Content Section */}
                <div className="p-8 flex flex-col flex-1">
                  <div className="text-[#a88d5e] font-serif italic text-sm mb-2">
                    {new Date(blog.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>

                  {/* Title - min-h keeps cards same size */}
                  <h3 className="text-xl font-serif mb-4 text-[#1f1b16] group-hover:text-[#a88d5e] line-clamp-2 min-h-[3.5rem]">
                    {blog.title}
                  </h3>

                  <p className="text-gray-500 text-sm mb-6 line-clamp-3 leading-relaxed">
                    {blog.content.replace(/<[^>]*>?/gm, '')}
                  </p>

                  {/* Footer Action */}
                  <div className="mt-auto flex items-center gap-2 text-[#a88d5e] font-bold text-xs uppercase tracking-widest pt-4 border-t border-gray-50">
                    Read More <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AllBlogs;