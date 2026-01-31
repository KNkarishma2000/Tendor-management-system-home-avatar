import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import Header from '../pages/components/Header';
import Footer from '../pages/components/Footer';
import { communityAPI } from '../api/auth.service';

const AllGallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [selectedImg, setSelectedImg] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        setLoading(true);
        const res = await communityAPI.getPublicGallery();
        setImages(res?.data?.data || []);
      } catch (err) {
        console.error("Gallery failed to load");
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  const openLightbox = (img, index) => {
    setSelectedImg(img);
    setCurrentIndex(index);
    document.body.style.overflow = 'hidden'; // Prevent scrolling
  };

  const closeLightbox = () => {
    setSelectedImg(null);
    document.body.style.overflow = 'auto';
  };

  const nextImg = (e) => {
    e.stopPropagation();
    const nextIdx = (currentIndex + 1) % images.length;
    setSelectedImg(images[nextIdx]);
    setCurrentIndex(nextIdx);
  };

  const prevImg = (e) => {
    e.stopPropagation();
    const prevIdx = (currentIndex - 1 + images.length) % images.length;
    setSelectedImg(images[prevIdx]);
    setCurrentIndex(prevIdx);
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black uppercase tracking-widest">Developing Snapshots...</div>;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        <header className="mb-16">
          <span className="text-yellow-500 font-black uppercase text-xs tracking-[0.3em]">Snapshot Archive</span>
          <h1 className="text-6xl md:text-8xl font-black text-neutral-900 tracking-tighter leading-none mt-2">
            LIFE AT <br/> THE AVATAR.
          </h1>
        </header>

        {/* Masonry-style Grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {images.map((img, index) => (
            <div 
              key={img.id}
              onClick={() => openLightbox(img, index)}
              className="relative group cursor-zoom-in overflow-hidden rounded-[2rem] bg-neutral-100 break-inside-avoid"
            >
              <img 
                src={img.image_path} 
                alt={img.caption}
                className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end p-8 opacity-0 group-hover:opacity-100">
                <div>
                  <p className="text-white font-black text-xl leading-tight">{img.caption}</p>
                  <p className="text-white/60 text-xs font-bold mt-1 uppercase tracking-widest">By {img.residents?.full_name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* --- LIGHTBOX MODAL --- */}
      {selectedImg && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 md:p-10 transition-all duration-300"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
            <X size={40} strokeWidth={1} />
          </button>

          {/* Controls */}
          <button 
            onClick={prevImg}
            className="absolute left-4 md:left-8 p-4 text-white/30 hover:text-white bg-white/5 rounded-full backdrop-blur-md transition-all"
          >
            <ChevronLeft size={32} />
          </button>

          <button 
            onClick={nextImg}
            className="absolute right-4 md:right-8 p-4 text-white/30 hover:text-white bg-white/5 rounded-full backdrop-blur-md transition-all"
          >
            <ChevronRight size={32} />
          </button>

          {/* Image Container */}
          <div className="max-w-5xl w-full flex flex-col items-center">
            <img 
              src={selectedImg.image_path} 
              className="max-h-[75vh] w-auto object-contain shadow-2xl animate-in zoom-in-95 duration-300"
              alt="Zoomed view"
              onClick={(e) => e.stopPropagation()} 
            />
            <div className="mt-8 text-center" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-white text-2xl font-black tracking-tight">{selectedImg.caption}</h3>
                <p className="text-white/40 font-bold text-sm uppercase mt-2 tracking-widest italic">Shared by {selectedImg.residents?.full_name}</p>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AllGallery;