import React from 'react';
import { Building, Menu, X } from 'lucide-react';

const Header = ({ activePage, setActivePage, isMobileMenuOpen, setIsMobileMenuOpen }) => (
  <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
    <nav className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl rounded-full px-2 py-2 flex items-center justify-between w-full max-w-5xl transition-all duration-300 hover:shadow-yellow-500/10">
      
      {/* Logo */}
      <div className="flex items-center gap-3 pl-4 cursor-pointer" onClick={() => setActivePage('home')}>
        <div className="bg-yellow-400 p-2 rounded-full text-neutral-900">
          <Building className="w-5 h-5" />
        </div>
        <span className="font-black text-lg tracking-tight text-neutral-800 hidden sm:block">My Home Avatar</span>
      </div>

      {/* Desktop Links */}
      <div className="hidden md:flex items-center bg-neutral-100/50 rounded-full p-1 mx-2">
        {['home', 'blog', 'events', 'carnivals', 'tenders'].map((item) => (
          <button
            key={item}
            onClick={() => setActivePage(item)}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-500 ${
              activePage === item 
                ? 'bg-neutral-900 text-white shadow-lg' 
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-white'
            }`}
          >
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pr-2">
        <button className="hidden sm:flex bg-yellow-400 text-neutral-900 px-5 py-2.5 rounded-full font-bold text-sm hover:bg-yellow-300 transition-colors" onClick={() => setActivePage('contact')}>
          Contact
        </button>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-3 bg-neutral-100 rounded-full text-neutral-900">
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
    </nav>

    {/* Mobile Menu Dropdown */}
    {isMobileMenuOpen && (
      <div className="absolute top-20 left-4 right-4 bg-white rounded-[2rem] shadow-2xl p-4 flex flex-col gap-2 z-50 animate-in slide-in-from-top-10">
        {['home', 'blog', 'events', 'carnivals', 'gallery', 'tenders', 'requirements', 'ads', 'contact'].map(item => (
          <button 
            key={item}
            onClick={() => { setActivePage(item); setIsMobileMenuOpen(false); }}
            className="w-full text-left p-4 rounded-xl font-bold text-neutral-600 hover:bg-yellow-50 hover:text-yellow-600 transition-colors capitalize"
          >
            {item}
          </button>
        ))}
      </div>
    )}
  </div>
);

export default Header;