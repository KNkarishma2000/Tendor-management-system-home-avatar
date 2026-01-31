import React, { useState, useEffect } from 'react';
import { Building, Menu, X, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Header = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get user info from localStorage
  const token = localStorage.getItem('accessToken');
  const userRole = localStorage.getItem('userRole');
  const userEmail = localStorage.getItem('userEmail');

  const handleLogout = () => {
    localStorage.clear(); // Clear everything
    navigate('/login');
    window.location.reload(); // Refresh to update header state
  };

  const getDashboardLink = () => {
    if (userRole === 'ADMIN') return '/admin/dashboard';
    if (userRole === 'RESIDENT') return '/dashboard/resident';
    if (userRole === 'SUPPLIER') return '/supplier/portal';
    return '/login';
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Carnivals', path: '/carnivals' },
    { name: 'Tenders', path: '/tenders' },
  ];

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
      <nav className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl rounded-full px-2 py-2 flex items-center justify-between w-full max-w-5xl transition-all duration-300">
        
        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-3 pl-4">
          <div className="bg-yellow-400 p-2 rounded-full text-neutral-900">
            <Building className="w-5 h-5" />
          </div>
          <span className="font-black text-lg tracking-tight text-neutral-800 hidden sm:block">My Home Avatar</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center bg-neutral-100/50 rounded-full p-1 mx-2">
          {navLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                isActive(item.path) ? 'bg-neutral-900 text-white shadow-lg' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Auth Actions */}
        <div className="flex items-center gap-2 pr-2">
          {token ? (
            <div className="flex items-center gap-3">
              {/* Show Dashboard Link */}
              <Link 
                to={getDashboardLink()} 
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-full text-sm font-bold hover:bg-neutral-800 transition-all"
              >
                Dashboard
              </Link>
              {/* Logout Button */}
              <button 
                onClick={handleLogout}
                className="p-2.5 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="flex items-center gap-2 px-6 py-2.5 bg-yellow-400 text-neutral-900 rounded-full text-sm font-black hover:bg-yellow-300 transition-all"
            >
              <LogIn className="w-4 h-4" />
              Login
            </Link>
          )}

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-3 bg-neutral-100 rounded-full text-neutral-900">
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Header;