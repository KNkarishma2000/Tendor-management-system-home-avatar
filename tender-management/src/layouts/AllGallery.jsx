import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '../pages/components/Header';
import Footer from '../pages/components/Footer';
import { communityAPI } from '../api/auth.service';

const AllGallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
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
    document.body.style.overflow = 'hidden';
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

  if (loading) return (
    <div className="h-screen flex items-center justify-center font-serif italic text-[#a88d5e] animate-pulse tracking-widest">
      Curating the Collection...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fbfbfb]">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 pt-40 pb-20">
        {/* Editorial Header */}
        <header className="mb-20 text-center">
          <span className="text-[#a88d5e] font-bold uppercase text-[10px] tracking-[0.4em] mb-4 block">
            Visual Journal
          </span>
          <h1 className="text-5xl md:text-7xl font-serif italic text-[#1f1b16] leading-tight">
            Life at the HomeAvatar
          </h1>
          <div className="w-12 h-[1px] bg-[#a88d5e] mx-auto mt-8"></div>
        </header>

        {/* Elegant Masonry Grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 space-y-8">
          {images.map((img, index) => (
            <div 
              key={img.id}
              onClick={() => openLightbox(img, index)}
              className="relative group cursor-pointer overflow-hidden rounded-sm bg-white break-inside-avoid shadow-sm hover:shadow-xl transition-all duration-500"
            >
              <img 
                src={img.image_path} 
                alt={img.caption}
                className="w-full h-auto object-cover transition-transform duration-1000 scale-[1.01] group-hover:scale-105"
              />
              
              {/* Overlay: Minimalist & Editorial */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-start p-8">
                <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <p className="text-white font-serif italic text-2xl mb-1">{img.caption}</p>
                  <p className="text-white/80 text-[10px] font-bold uppercase tracking-[0.2em]">
                    By {img.residents?.full_name || "Resident"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* --- REFINED LIGHTBOX --- */}
      {selectedImg && (
        <div 
          className="fixed inset-0 z-[9999] bg-[#1f1b16]/98 flex items-center justify-center p-4 transition-all duration-500"
          onClick={closeLightbox}
        >
          {/* Elegant Close Button */}
          <button className="absolute top-10 right-10 text-white/30 hover:text-[#a88d5e] transition-colors">
            <X size={30} strokeWidth={1} />
          </button>

          {/* Minimal Controls */}
          <button 
            onClick={prevImg}
            className="absolute left-6 p-4 text-white/20 hover:text-[#a88d5e] transition-all"
          >
            <ChevronLeft size={40} strokeWidth={1} />
          </button>

          <button 
            onClick={nextImg}
            className="absolute right-6 p-4 text-white/20 hover:text-[#a88d5e] transition-all"
          >
            <ChevronRight size={40} strokeWidth={1} />
          </button>

          {/* Image Display */}
          <div className="max-w-4xl w-full flex flex-col items-center">
            <img 
              src={selectedImg.image_path} 
              className="max-h-[80vh] w-auto object-contain shadow-2xl animate-in fade-in zoom-in-95 duration-500"
              alt="Zoomed view"
              onClick={(e) => e.stopPropagation()} 
            />
            <div className="mt-10 text-center" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-white font-serif italic text-3xl tracking-wide">{selectedImg.caption}</h3>
                <div className="w-8 h-[1px] bg-[#a88d5e] mx-auto my-4"></div>
                <p className="text-[#a88d5e] font-bold text-[10px] uppercase tracking-[0.3em]">
                  Shared by {selectedImg.residents?.full_name || "Resident"}
                </p>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AllGallery;