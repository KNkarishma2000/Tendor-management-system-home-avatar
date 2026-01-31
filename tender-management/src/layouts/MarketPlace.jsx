import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ShoppingBag, Store, 
  ArrowRight, Phone, X, Sparkles 
} from 'lucide-react';
import { communityAPI } from '../api/auth.service';
import Header from '../pages/components/Header';
import Footer from '../pages/components/Footer';

const Marketplace = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState(['All']); // Start with 'All'
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const fetchMarketplace = async () => {
      try {
        setLoading(true);
        const res = await communityAPI.getPublicMarketplace();
        const data = res?.data?.data || [];
        setItems(data);

        // DYNAMIC CATEGORIES: Extract unique categories from backend data
        const uniqueCategories = ['All', ...new Set(data.map(item => item.category).filter(Boolean))];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error("Marketplace sync failed:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMarketplace();
  }, []);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#fbfbfb]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-[#a88d5e] border-t-transparent rounded-full animate-spin"></div>
        <p className="font-serif italic text-[#a88d5e]">Loading the Exchange...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fbfbfb]">
      <Header activePage="marketplace" />

      {/* LUXURY HERO HEADER - Optimized for Mobile */}
      <section className="pt-32 pb-12 md:pt-48 md:pb-20 px-6 bg-[#1f1b16] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-[#a88d5e]/5 rounded-full blur-3xl"></div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="flex items-center justify-center gap-2 md:gap-3 mb-4 md:mb-6">
            <Sparkles size={14} className="text-[#a88d5e]" />
            <span className="text-[#a88d5e] font-bold uppercase text-[8px] md:text-[10px] tracking-[0.3em] md:tracking-[0.5em]">The Residents' Exchange</span>
            <Sparkles size={14} className="text-[#a88d5e]" />
          </div>
          <h1 className="text-3xl md:text-7xl font-serif italic text-white leading-tight mb-4 md:mb-8">
            Curated <span className="text-[#a88d5e]">Marketplace</span>
          </h1>
          <p className="text-gray-400 font-serif italic text-sm md:text-lg max-w-2xl mx-auto mb-8 md:mb-12">
            A refined space for residents to discover quality goods and services within our community.
          </p>
          
          {/* SEARCH BAR - Responsive Width */}
          <div className="max-w-xl mx-auto relative group px-2 md:px-0">
            <Search className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 text-[#a88d5e]" size={18} />
            <input 
              type="text" 
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 py-4 md:py-5 pl-14 md:pl-16 pr-6 rounded-full text-white placeholder:text-gray-500 focus:outline-none focus:border-[#a88d5e] transition-all text-sm"
            />
          </div>
        </div>
      </section>

      {/* FILTER TABS - Horizontal Scroll for Mobile */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 py-4 md:py-6 px-6">
        <div className="max-w-7xl mx-auto flex gap-6 md:gap-8 overflow-x-auto pb-2 scrollbar-hide px-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-[9px] md:text-[11px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] whitespace-nowrap transition-all relative pb-2 ${
                selectedCategory === cat ? 'text-[#a88d5e]' : 'text-gray-400 hover:text-[#1f1b16]'
              }`}
            >
              {cat}
              {selectedCategory === cat && (
                <motion.div layoutId="underline" className="absolute bottom-0 left-0 w-full h-[1px] bg-[#a88d5e]" />
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <MarketplaceItemCard 
                key={item.id} 
                item={item} 
                onClick={() => setSelectedItem(item)} 
              />
            ))
          ) : (
            <div className="col-span-full text-center py-20 border border-dashed border-gray-200">
              <ShoppingBag className="w-10 h-10 text-gray-200 mx-auto mb-4" />
              <p className="font-serif italic text-gray-400 text-lg tracking-widest">No listings found in this collection</p>
            </div>
          )}
        </div>
      </main>

      {/* ITEM DETAIL MODAL - Mobile Responsive Layout */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#1f1b16]/95 backdrop-blur-md" 
              onClick={() => setSelectedItem(null)}
            ></motion.div>
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-4xl shadow-2xl flex flex-col md:flex-row overflow-y-auto md:overflow-hidden max-h-[90vh]"
            >
              <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 text-gray-400 hover:text-[#1f1b16] z-20 p-2 bg-white/90 rounded-full">
                <X size={20} />
              </button>

              {/* Responsive Image Height */}
              <div className="w-full md:w-1/2 h-64 md:h-auto bg-gray-100 relative shrink-0">
                <img 
                  src={selectedItem.image_path || "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800"} 
                  className="w-full h-full object-cover"
                  alt={selectedItem.item_name}
                />
              </div>

              {/* Product Info - Added Padding adjustments */}
             {/* Product Info Section */}
<div className="w-full md:w-1/2 p-6 md:p-16 flex flex-col justify-center bg-[#fbfbfb]">
  <p className="text-[#a88d5e] font-serif italic text-base md:text-lg mb-2">
    {selectedItem.category}
  </p>
  <h2 className="text-2xl md:text-5xl font-serif text-[#1f1b16] mb-4 md:mb-6 leading-tight">
    {selectedItem.item_name}
  </h2>
  
  <div className="text-xl md:text-2xl font-serif text-[#1f1b16] mb-6">
    ₹ {selectedItem.price || 'Contact for Price'}
  </div>

  <div className="w-12 h-[1px] bg-[#a88d5e] mb-6"></div>
  
  <p className="text-gray-500 font-serif italic leading-relaxed text-sm md:text-lg mb-8">
    {selectedItem.description}
  </p>

  {/* NEW CONTACT SECTION: Shows number directly */}
  <div className="space-y-4">
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
        Contact Resident
      </span>
      <a 
        href={`tel:${selectedItem.contact_no}`}
        className="flex items-center gap-3 text-[#1f1b16] hover:text-[#a88d5e] transition-colors group"
      >
        <div className="bg-[#1f1b16] group-hover:bg-[#a88d5e] p-2 rounded-full transition-colors">
            <Phone size={14} className="text-white" />
        </div>
        <span className="text-lg md:text-xl font-serif font-medium">
          {selectedItem.contact_no || 'N/A'}
        </span>
      </a>
    </div>

    <button 
      onClick={() => window.location.href = `tel:${selectedItem.contact_no}`}
      className="w-full bg-[#1f1b16] text-[#a88d5e] py-4 md:py-5 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-[#a88d5e] hover:text-[#1f1b16] transition-all"
    >
      Call Now
    </button>
  </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

const MarketplaceItemCard = ({ item, onClick }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    onClick={onClick}
    className="group bg-white border border-gray-100 p-6 md:p-10 cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col relative"
  >
    <div className="absolute top-6 right-6 md:top-10 md:right-10 text-gray-100 group-hover:text-[#a88d5e]/20 transition-colors">
      <Store size={32} md:size={40} />
    </div>
    
    <div className="flex-1">
      <div className="mb-4">
        <span className="text-[8px] md:text-[9px] font-bold text-[#a88d5e] uppercase tracking-[0.2em] border-b border-[#a88d5e]/20 pb-1">
          {item.category || 'RESIDENT'}
        </span>
      </div>
      
      <h3 className="font-serif text-xl md:text-3xl mb-3 text-[#1f1b16] group-hover:text-[#a88d5e] transition-colors leading-tight">
        {item.item_name}
      </h3>
      
      <p className="text-gray-500 italic font-serif text-xs md:text-sm mb-6 md:mb-10 line-clamp-2">
        {item.description}
      </p>
    </div>

    <div className="mt-auto pt-4 md:pt-6 border-t border-gray-50 flex items-center justify-between">
      <div className="font-serif text-[#1f1b16] text-sm md:text-base">₹ {item.price || 'P.O.A'}</div>
      <div className="flex items-center gap-2 text-[#a88d5e] font-bold text-[8px] md:text-[9px] uppercase tracking-widest opacity-100 md:opacity-0 md:group-hover:opacity-100 md:translate-x-4 md:group-hover:translate-x-0 transition-all">
        Details <ArrowRight size={10} />
      </div>
    </div>
  </motion.div>
);

export default Marketplace;