import React from 'react';
import { Building, Briefcase, Sparkles, MapPin, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LOGO from '../../assets/logo.png'
import Main from '../../assets/shortlogo.png'
const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-[#1f1b16] pt-24 pb-12 px-6 overflow-hidden relative">
      {/* Sublte background glow to match the Header/Hero style */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#a88d5e]/30 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8 items-start">
          
          {/* Brand & Editorial Column */}
          <div className="md:col-span-5 space-y-8">
            <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/')}>
                <img
                          src={LOGO}
                          alt="logo"
                          className="w-[130px] sm:w-[36px] md:w-[150px]"
                        />
            </div>
            
            <p className="text-gray-400 font-serif italic leading-relaxed text-lg max-w-sm">
              "Crafting a higher standard of community living through curated experiences and refined architectural spaces."
            </p>

            <div className="flex gap-4">
               <div className="w-10 h-[1px] bg-[#a88d5e] mt-3"></div>
               <div className="space-y-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                  <div className="flex items-center gap-3 hover:text-white transition-colors cursor-default">
                    <MapPin size={14} className="text-[#a88d5e]" /> Home Avatar,Narsingi 
                  </div>
                  <div className="flex items-center gap-3 hover:text-white transition-colors cursor-default">
                    <Mail size={14} className="text-[#a88d5e]" /> concierge@homeavatar.com
                  </div>
               </div>
            </div>
          </div>
          
          {/* Navigation Grid */}
          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-12 sm:gap-4">
            
            {/* Resident Services */}
            <div className="space-y-6">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#a88d5e] border-b border-white/5 pb-4">
                The Estate
              </h4>
              <ul className="space-y-4">
                {['Notices', 'Blog', 'Gallery', 'Carnivals', 'Tenders'].map((link) => (
                  <li key={link}>
                    <button 
                      onClick={() => navigate(`/${link.toLowerCase()}`)}
                      className="text-gray-400 hover:text-white transition-all text-[11px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 group"
                    >
                      <span className="w-0 group-hover:w-4 h-[1px] bg-[#a88d5e] transition-all duration-300"></span>
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Business Partners */}
            <div className="space-y-6">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#a88d5e] border-b border-white/5 pb-4 flex items-center gap-2">
                <Briefcase size={12} /> Partner Services
              </h4>
              <div className="space-y-4">
                <button 
                  onClick={() => navigate('/supplier-login')}
                  className="w-full py-4 border border-white/10 text-white text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-white hover:text-[#1f1b16] transition-all duration-500"
                >
                  Supplier Portal
                </button>
                <button 
                  onClick={() => navigate('/supplier-register')}
                  className="w-full py-4 bg-[#a88d5e] text-[#1f1b16] text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-white transition-all duration-500 flex items-center justify-center gap-2"
                >
                  <Sparkles size={12} /> Become a Partner
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Legal Footer */}
        <div className="mt-24 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-600 text-[10px] font-bold uppercase tracking-[0.3em]">
            © 2026 HomeAvatar RWA. All Rights Reserved.
          </p>
          <div className="flex gap-8">
            {['Privacy', 'Terms', 'Accessibility'].map(item => (
              <button key={item} className="text-gray-600 hover:text-[#a88d5e] text-[9px] font-bold uppercase tracking-[0.2em] transition-colors">
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;