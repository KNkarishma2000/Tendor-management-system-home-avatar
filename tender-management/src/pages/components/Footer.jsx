import React from 'react';
import { Building } from 'lucide-react';

const Footer = ({ setActivePage }) => (
  <footer className="bg-white pt-20 pb-10 px-4 mt-20 rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-10">
      <div>
        <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
          <div className="bg-neutral-900 p-2 rounded-xl">
            <Building className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black text-neutral-900">My Home Avatar</span>
        </div>
        <p className="text-neutral-500 font-medium max-w-xs">
          Reimagining community living with vibrant spaces and connected hearts.
        </p>
      </div>
      
      <div className="flex flex-wrap justify-center gap-4">
        {['Bylaws', 'Tenders', 'Login / Join', 'Contact'].map((link) => (
          <button 
            key={link} 
            onClick={() => setActivePage(link.toLowerCase())}
            className="px-6 py-3 rounded-full bg-neutral-50 hover:bg-neutral-900 hover:text-white transition-all font-bold text-sm text-neutral-600"
          >
            {link}
          </button>
        ))}
      </div>
    </div>
    <div className="text-center mt-16 text-neutral-400 text-xs font-bold uppercase tracking-widest">
      © 2026 My Home Avatar RWA
    </div>
  </footer>
);

export default Footer;