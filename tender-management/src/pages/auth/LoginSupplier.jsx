import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Briefcase, ShieldCheck, AlertCircle, Sparkles, Building2 } from 'lucide-react';
import { authAPI } from '../../api/auth.service';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function LoginSupplier() {
 const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(''); // Clear error when user types
  };
// 1. ADD SESSION CHECK HERE
useEffect(() => {
  const token = localStorage.getItem('accessToken');
  const role = localStorage.getItem('userRole');
  
  if (token) {
    if (role === 'ADMIN') navigate('/admin/dashboard');
    else if (role === 'RESIDENT') navigate('/dashboard/resident');
    else if (role === 'ACCOUNTANT') navigate('/accountant/dashboard'); // Added this
    else if (role === 'SUPPLIER') navigate('/supplier/portal');
  }
}, [navigate]);
const handleLogin = async (e) => {
  e.preventDefault(); 
  setLoading(true);
  setError('');

  try {
    const response = await authAPI.login({ 
      email: formData.email, 
      password: formData.password 
    });

    const { accessToken, user } = response.data;

    if (user.role !== 'SUPPLIER') {
      setError("Access denied. This portal is for Suppliers only.");
      setLoading(false);
      return;
    }

    // --- ESSENTIAL STORAGE FOR CHAT & AUTH ---
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('userRole', user.role);
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('userStatus', user.status || 'PENDING');

    // 1. This is the UUID from the 'users' table (Needed for the Chat Controller)
    localStorage.setItem('internal_user_id', user.id); 

    // 2. This is the ID from the 'suppliers' table (Needed for Tenders/Bids)
    localStorage.setItem('profile_id', user.profile_id); 
    
    // Fallback if your code specifically looks for 'userId' elsewhere
    localStorage.setItem('userId', user.profile_id); 

    navigate('/supplier/portal');
  } catch (err) {
    setError(err.response?.data?.message || "Login failed.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="bg-[#fbfbfb] min-h-screen">
      <Header />
      
      <main className="flex min-h-screen pt-20 md:pt-0">
        
        {/* LEFT SIDE: CORPORATE ELEGANCE */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#1f1b16] relative overflow-hidden items-center justify-center p-20">
          <div className="absolute inset-0 opacity-20">
            <img 
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200" 
              className="w-full h-full object-cover" 
              alt="Corporate Architecture" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1f1b16] via-transparent to-transparent"></div>
          </div>
          
          <div className="relative z-10 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#a88d5e]/30 rounded-full mb-8">
              <Sparkles className="w-3 h-3 text-[#a88d5e]" />
              <span className="text-[10px] font-bold text-[#a88d5e] uppercase tracking-[0.2em]">Partner Network</span>
            </div>
            
            <h1 className="text-6xl font-serif italic text-white mb-8 leading-tight">
              Elevating <br />
              <span className="text-[#a88d5e]">B2B Excellence.</span>
            </h1>
            <div className="w-12 h-[1px] bg-[#a88d5e] mb-8"></div>
            <p className="text-gray-400 font-serif italic text-xl leading-relaxed mb-12">
              The central gateway for HomeAvatar vendors. Securely manage tenders, proposals, and project lifecycles.
            </p>

            <div className="space-y-4 border-l border-white/10 pl-6">
              <div className="flex items-center gap-4 text-white/50">
                <ShieldCheck className="w-5 h-5 text-[#a88d5e]" />
                <span className="text-xs font-bold uppercase tracking-widest">Encrypted Tendering</span>
              </div>
              <div className="flex items-center gap-4 text-white/50">
                <Briefcase className="w-5 h-5 text-[#a88d5e]" />
                <span className="text-xs font-bold uppercase tracking-widest">Performance Metrics</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: MINIMALIST LOGIN */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-24 bg-white">
          <div className="w-full max-w-md">
            
            <div className="mb-12">
              <Building2 className="text-[#a88d5e] mb-4 w-10 h-10" />
              <h2 className="text-4xl font-serif text-[#1f1b16] mb-4 uppercase tracking-tight">Vendor Login</h2>
              <p className="text-gray-500 text-sm font-serif italic">Welcome back. Please authenticate to access the bidding room.</p>
            </div>

            {error && (
              <div className="flex items-center gap-3 bg-red-50 text-red-900 p-4 rounded-lg mb-8 text-xs font-bold uppercase tracking-tighter border-l-4 border-red-500">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-10">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Corporate Email</label>
                <div className="relative">
                  <Mail className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a88d5e]" />
                  <input 
                    type="email" name="email" required
                    className="w-full border-b border-gray-100 py-4 pl-8 pr-4 font-serif text-lg focus:outline-none focus:border-[#a88d5e] transition-all placeholder:text-gray-200"
                    placeholder="partners@company.com"
                    value={formData.email} onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Security Key</label>
                  <Link to="/forgot-password" size="sm" className="text-[9px] font-bold uppercase text-[#a88d5e] tracking-widest hover:text-[#1f1b16] transition-colors">Recover</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a88d5e]" />
                  <input 
                    type="password" name="password" required
                    className="w-full border-b border-gray-100 py-4 pl-8 pr-4 font-serif text-lg focus:outline-none focus:border-[#a88d5e] transition-all placeholder:text-gray-200"
                    placeholder="••••••••"
                    value={formData.password} onChange={handleChange}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#1f1b16] text-[#a88d5e] py-6 text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-[#a88d5e] hover:text-[#1f1b16] transition-all duration-500 flex items-center justify-center gap-4 group shadow-2xl shadow-[#1f1b16]/10"
              >
                {loading ? "Verifying..." : "Access Portal"}
                {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />}
              </button>
            </form>

            <div className="mt-16 pt-8 border-t border-gray-50 text-center">
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                New vendor? <Link to="/supplier-register" className="text-[#1f1b16] border-b border-[#a88d5e] pb-1 ml-2">Register Partnership</Link>
              </p>
            </div>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}