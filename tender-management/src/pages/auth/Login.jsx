import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { Building, Lock, User, Hash, ArrowRight, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../api/auth.service';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Login = () => {
 const [isAdminMode, setIsAdminMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    flat_no: '',
    password: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const role = localStorage.getItem('userRole');
    
    if (token) {
      if (role === 'ADMIN') navigate('/admin/dashboard');
      else if (role === 'RESIDENT') navigate('/dashboard/resident');
      else if (role === 'ACCOUNTANT') navigate('/accountant/dashboard');
      else if (role === 'SUPPLIER') navigate('/supplier/portal');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    toast.dismiss(); 

    const payload = isAdminMode 
      ? { email: formData.email, password: formData.password }
      : { flat_no: formData.flat_no, password: formData.password };

    try {
      const { data } = await authAPI.login(payload);
      
      if (data.success) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('userRole', data.user.role);
        localStorage.setItem('userStatus', data.user.status || 'PENDING');
        localStorage.setItem('internal_user_id', data.user.id);

        if (data.user.role === 'RESIDENT') {
            localStorage.setItem('resident_id', data.user.resident_id);
        } else if (data.user.role === 'SUPPLIER') {
            localStorage.setItem('profile_id', data.user.profile_id);
        }

        toast.success("Authentication Successful!", { icon: '🔑' });

        setTimeout(() => {
          if (data.user.role === 'ADMIN') navigate('/admin/dashboard');
          else if (data.user.role === 'RESIDENT') navigate('/dashboard/resident');
          else if (data.user.role === 'ACCOUNTANT') navigate('/accountant/dashboard');
          else if (data.user.role === 'SUPPLIER') navigate('/supplier/portal');
          else navigate('/');
        }, 1500);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="bg-[#fbfbfb] min-h-screen">
      <Header />
      <Toaster position="top-right" />
      
      <div className="flex min-h-screen pt-20 md:pt-0">
        {/* LEFT SIDE: ARCHITECTURAL ART */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#1f1b16] relative overflow-hidden items-center justify-center p-20">
          <div className="absolute inset-0 opacity-40">
            <img 
              src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200" 
              className="w-full h-full object-cover" 
              alt="Luxury Living" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1f1b16] via-transparent to-transparent"></div>
          </div>
          
          <div className="relative z-10 max-w-lg">
            <Sparkles className="text-[#a88d5e] mb-6 w-8 h-8" />
            <h1 className="text-6xl font-serif italic text-white mb-8 leading-tight">
              A private world, <br />
              <span className="text-[#a88d5e]">reimagined.</span>
            </h1>
            <div className="w-12 h-[1px] bg-[#a88d5e] mb-8"></div>
            <p className="text-gray-400 font-serif italic text-xl leading-relaxed">
              Step back into your sanctuary. The portal to your community, services, and exclusive experiences awaits.
            </p>
          </div>

          <div className="absolute bottom-12 left-12 flex items-center gap-4 text-white/20 text-[10px] font-bold uppercase tracking-[0.5em]">
            <div className="w-8 h-[1px] bg-white/10"></div>
            HomeAvatar Resident Portal
          </div>
        </div>

        {/* RIGHT SIDE: MINIMALIST FORM */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-24 bg-white">
          <div className="w-full max-w-md">
            
            <div className="mb-12">
              <span className="text-[#a88d5e] font-bold uppercase text-[10px] tracking-[0.4em] mb-4 block">Secure Access</span>
              <h2 className="text-4xl font-serif text-[#1f1b16] mb-4 uppercase tracking-tight">Authentication</h2>
              <p className="text-gray-500 text-sm font-serif italic">Please select your access level to proceed.</p>
            </div>

            {/* TAB TOGGLE */}
            <div className="flex border-b border-gray-100 mb-10">
              <button 
                onClick={() => setIsAdminMode(false)}
                className={`pb-4 px-6 text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative ${!isAdminMode ? 'text-[#1f1b16]' : 'text-gray-300'}`}
              >
                Resident
                {!isAdminMode && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#a88d5e]"></div>}
              </button>
              <button 
                onClick={() => setIsAdminMode(true)}
                className={`pb-4 px-6 text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative ${isAdminMode ? 'text-[#1f1b16]' : 'text-gray-300'}`}
              >
                Management
                {isAdminMode && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#a88d5e]"></div>}
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-8">
              {isAdminMode ? (
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Email Address</label>
                  <div className="relative group">
                    <User className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a88d5e]" />
                    <input 
                      type="email" required
                      className="w-full border-b border-gray-100 py-4 pl-8 pr-4 font-serif text-lg focus:outline-none focus:border-[#a88d5e] transition-all placeholder:text-gray-200"
                      placeholder="concierge@homeavatar.com"
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Flat Identifier</label>
                  <div className="relative group">
                    <Hash className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a88d5e]" />
                    <input 
                      type="text" required
                      className="w-full border-b border-gray-100 py-4 pl-8 pr-4 font-serif text-lg focus:outline-none focus:border-[#a88d5e] transition-all placeholder:text-gray-200"
                      placeholder="e.g. Tower A - 1204"
                      onChange={(e) => setFormData({...formData, flat_no: e.target.value})}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Access Key</label>
                  <Link to="/forgot-password" size={10} className="text-[9px] font-bold text-[#a88d5e] uppercase tracking-widest hover:text-[#1f1b16] transition-colors">
                    Reset Password
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a88d5e]" />
                  <input 
                    type="password" required
                    className="w-full border-b border-gray-100 py-4 pl-8 pr-4 font-serif text-lg focus:outline-none focus:border-[#a88d5e] transition-all placeholder:text-gray-200"
                    placeholder="••••••••"
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#1f1b16] text-[#a88d5e] py-6 text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-[#a88d5e] hover:text-[#1f1b16] transition-all duration-500 flex items-center justify-center gap-4 group"
              >
                {loading ? "Authenticating..." : "Enter Portal"}
                {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />}
              </button>
            </form>

            <div className="mt-12 flex flex-col items-center gap-6">
              {!isAdminMode && (
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                  Not a registered resident?{' '}
                  <Link to="/resident-register" className="text-[#1f1b16] border-b border-[#a88d5e] pb-1 ml-2">
                    Inquire Here
                  </Link>
                </p>
              )}
              
              <div className="flex items-center gap-3 text-gray-300 text-[9px] font-bold uppercase tracking-[0.2em]">
                <ShieldCheck className="w-3 h-3 text-green-500/50" />
                Encrypted Estate Connection
              </div>
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;