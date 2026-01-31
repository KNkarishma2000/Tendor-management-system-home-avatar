import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { communityAPI } from '../api/auth.service';
import Header from '../pages/components/Header'; 
import Footer from '../pages/components/Footer';
import { Share2 } from 'lucide-react';

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

  if (loading) return <div className="h-screen flex items-center justify-center font-black uppercase tracking-widest">Opening Story...</div>;
  if (!blog) return <div className="h-screen flex items-center justify-center font-black uppercase tracking-widest">Story Not Found</div>;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-4xl mx-auto px-6 pt-32 pb-20">
        
        {/* 1. Half-Width Featured Image (Fixed Height 200px, No Radius) */}
        <div className=" bg-neutral-100 mb-2">
          <img 
            src={blog.images?.[0] || "https://via.placeholder.com/600x200?text=Featured+Image"} 
            className="w-[1250px] h-[250px]  object-cover" 
            alt="Featured"
          />
        </div>

        {/* 2. Blog Title (Left Aligned, ~35px) */}
        <h1 className="text-[35px] font-black text-neutral-900 leading-tight mb-2 text-left uppercase tracking-tighter">
          {blog.title}
        </h1>

        {/* 3. Meta Row (Category | Date | Share) */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-2">
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500">
              {blog.category || "Blogs"}
            </span>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
              {new Date(blog.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>

          <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:text-black transition-colors">
            <Share2 size={14} />
            <span>Share</span>
          </button>
        </div>

        {/* 4. Blog Details / Content (18px Style) */}
        <article className="max-w-3xl">
          <div 
            className="text-[18px] leading-[1.8] text-neutral-700 font-medium whitespace-pre-line prose prose-neutral max-w-none"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default BlogDetails;