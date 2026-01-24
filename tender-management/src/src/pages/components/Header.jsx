import React from 'react';
import { Building, Menu, X, LogIn } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Header = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const location = useLocation();
  
  // Function to check if a link is active based on current URL path
  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    return location.pathname === path;
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: 'Events', path: '/gallery' },
    { name: 'Carnivals', path: '/carnivals' },
    { name: 'Tenders', path: '/tenders' },
  ];

  const mobileLinks = [
    ...navLinks,
    { name: 'Gallery', path: '/gallery' },
   { name: 'Contact', path: '/contact' },
  ];

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
      <nav className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl rounded-full px-2 py-2 flex items-center justify-between w-full max-w-5xl transition-all duration-300 hover:shadow-yellow-500/10">
        
        {/* 1. Logo Section */}
        <Link to="/" className="flex items-center gap-3 pl-4 cursor-pointer">
          <div className="bg-yellow-400 p-2 rounded-full text-neutral-900">
            <Building className="w-5 h-5" />
          </div>
          <span className="font-black text-lg tracking-tight text-neutral-800 hidden sm:block">My Home Avatar</span>
        </Link>

        {/* 2. Desktop Navigation Links */}
        <div className="hidden md:flex items-center bg-neutral-100/50 rounded-full p-1 mx-2">
          {navLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-500 ${
                isActive(item.path)
                  ? 'bg-neutral-900 text-white shadow-lg' 
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-white'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* 3. Actions (Login & Contact) */}
        <div className="flex items-center gap-2 pr-2">
          <Link 
            to="/login" 
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-bold text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Login
          </Link>

          {/* <Link 
            to="/contact"
            className={`hidden sm:flex px-5 py-2.5 rounded-full font-bold text-sm transition-colors ${
                isActive('/contact') 
                ? 'bg-neutral-800 text-white' 
                : 'bg-yellow-400 text-neutral-900 hover:bg-yellow-300'
            }`}
          >
            Contact
          </Link> */}

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="md:hidden p-3 bg-neutral-100 rounded-full text-neutral-900"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* 4. Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="absolute top-20 left-4 right-4 bg-white rounded-[2rem] shadow-2xl p-4 flex flex-col gap-2 z-50 animate-in slide-in-from-top-10">
          {mobileLinks.map(item => (
            <Link 
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`w-full text-left p-4 rounded-xl font-bold transition-colors capitalize ${
                isActive(item.path) 
                ? 'bg-yellow-100 text-yellow-700' 
                : 'text-neutral-600 hover:bg-yellow-50 hover:text-yellow-600'
              }`}
            >
              {item.name}
            </Link>
          ))}
          
          <div className="mt-2 pt-2 border-t border-neutral-100">
            <Link 
              to="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-xl font-black bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
            >
              <LogIn className="w-5 h-5" />
              Sign In to Account
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;