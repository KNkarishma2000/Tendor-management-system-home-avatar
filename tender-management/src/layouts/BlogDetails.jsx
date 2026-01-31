import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { communityAPI } from '../api/auth.service';
import Header from '../pages/components/Header'; 
import Footer from '../pages/components/Footer';
import { Share2, Clock, User } from 'lucide-react';

const BlogDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await communityAPI.getBlogDetails(id);
        setBlog(res.data.data);
      } catch (error) {
        console.error("Blog not found");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);
  const cleanText = (str) => {
  if (!str) return "";
  return str
    .replace(/<[^>]*>?/gm, '') // Remove tags
    .replace(/&nbsp;/g, ' ')   // Fix spaces
    .replace(/&amp;/g, '&');   // Fix ampersands
};

  if (loading) return <div className="h-screen flex items-center justify-center font-serif italic text-[#a88d5e] animate-pulse text-lg tracking-widest">Opening Story...</div>;
  if (!blog) return <div className="h-screen flex items-center justify-center font-serif text-[#1f1b16]">Story Not Found</div>;

  return (
    <div className="min-h-screen bg-white">
      
      {/* HERO SECTION WITH INTEGRATED HEADER */}
      <div className="relative w-full h-[60vh] overflow-hidden bg-[#1f1b16]">
        
        {/* Floating Header - Placed above the banner */}
        <div className="absolute top-0 left-0 w-full z-50">
           <Header />
        </div>

        {/* Banner Image */}
        <img 
          src={blog.images?.[0] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200"} 
          className="w-full h-full object-cover transition-transform duration-[2s] hover:scale-105" 
          alt="Featured"
        />
        
        {/* Cinematic Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/70"></div>

        {/* Hero Text Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-6 mt-20">
          <span className="bg-[#a88d5e] ...">
  {cleanText(blog.category) || "Lifestyle"}
</span>
<h1 className="text-4xl ...">
  {cleanText(blog.title)}
</h1>
           
           {/* Bottom Hero Meta */}
           <div className="absolute bottom-12 flex items-center gap-10 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-300">
              <div className="flex items-center gap-3">
                 <User size={14} className="text-[#a88d5e]" />
                 <span className="text-white">By {blog.residents?.full_name || "Windsor Resident"}</span>
              </div>
              <div className="flex items-center gap-3">
                 <Clock size={14} className="text-[#a88d5e]" />
                 <span>{new Date(blog.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
           </div>
        </div>
      </div>

      {/* MAIN ARTICLE AREA - CLEAN & CENTERED */}
      <main className="max-w-4xl mx-auto px-6 py-20">
        
        {/* Social Share Bar */}
        <div className="flex justify-between items-center border-b border-gray-100 pb-8 mb-16">
           <button 
             onClick={() => navigate(-1)}
             className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a88d5e] hover:text-[#1f1b16] transition-colors"
           >
             ← Back
           </button>
           <button className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-[#a88d5e] transition-colors">
              <Share2 size={16} />
              <span>Share Story</span>
           </button>
        </div>

        {/* Article Content with Premium Typography */}
        <article className="prose prose-neutral max-w-none">
         <div 
    className="rich-text-content font-serif text-[22px] leading-[2] text-[#333] 
               [&_p:first-of-type]:first-letter:text-8xl [&_p:first-of-type]:first-letter:font-bold 
               [&_p:first-of-type]:first-letter:mr-4 [&_p:first-of-type]:first-letter:float-left 
               [&_p:first-of-type]:first-letter:text-[#a88d5e] [&_p:first-of-type]:first-letter:mt-3"
    dangerouslySetInnerHTML={{ __html: blog.content }}
  />
        </article>

        {/* Elegant End Marker */}
        
      </main>

      <Footer />
    </div>
  );
};

export default BlogDetails;