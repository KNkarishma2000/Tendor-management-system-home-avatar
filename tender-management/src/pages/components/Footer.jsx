import React from 'react';
import { Building, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Logo from '../../assets/logo.png';
const Footer = ({ setActivePage }) => {
  const navigate = useNavigate();

  return (
    <footer className="bg-white pt-20 pb-10 px-4 mt-20 rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-10">
        
        {/* Brand Section */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
             <Link to="/" className="flex items-center gap-3 pl-4">
        <img src={Logo} className='w-[150px]' alt="logo" />
        </Link>
          </div>
          <p className="text-neutral-500 font-medium max-w-xs mx-auto md:mx-0">
            Reimagining community living with vibrant spaces and connected hearts.
          </p>
        </div>
        
        {/* Links Sections */}
        <div className="flex flex-col sm:flex-row gap-10 w-full md:w-auto">
          
          {/* Community Links */}
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 text-center md:text-left">Community</span>
            <div className="flex flex-wrap md:flex-col justify-center gap-2">
              {[ 'Tenders'].map((link) => (
                <button 
                  key={link} 
                  onClick={() => navigate(`/${link.toLowerCase()}`)}
                  className="px-5 py-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-all font-bold text-sm text-neutral-600 text-left"
                >
                  {link}
                </button>
              ))}
            </div>
          </div>

          {/* Business/Supplier Links - NEW SECTION */}
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-600 text-center md:text-left flex items-center justify-center md:justify-start gap-2">
              <Briefcase size={12} /> For Businesses
            </span>
            <div className="flex flex-wrap md:flex-col justify-center gap-2">
              <button 
                onClick={() => navigate('/supplier-login')}
                className="px-5 py-2 rounded-xl border border-neutral-100 hover:bg-neutral-900 hover:text-white transition-all font-bold text-sm text-neutral-600"
              >
                Supplier Login
              </button>
              <button 
                onClick={() => navigate('/supplier-register')}
                className="px-5 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-500 transition-all font-black text-sm text-neutral-900"
              >
                Become a Supplier
              </button>
            </div>
          </div>

        </div>
      </div>

      <div className="text-center mt-16 pt-8 border-t border-neutral-50 text-neutral-400 text-xs font-bold uppercase tracking-widest">
        © 2026 My Home Avatar RWA
      </div>
    </footer>
  );
};

export default Footer;
