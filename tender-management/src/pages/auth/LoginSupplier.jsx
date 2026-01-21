import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Briefcase, ShieldCheck, AlertCircle } from 'lucide-react';
import { authAPI } from '../../api/auth.service'; // Importing the API service we built
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

const handleLogin = async (e) => {
  e.preventDefault(); 
  setLoading(true);
  setError('');

  try {
    const response = await authAPI.login({ 
      email: formData.email, 
      password: formData.password 
    });

    // Extract the data from the response
    const { accessToken, user } = response.data;

    // 1. Check if the user is actually a supplier
    if (user.role !== 'SUPPLIER') {
      setError("Access denied. This portal is for Suppliers only.");
      setLoading(false);
      return;
    }

    // 2. Store credentials
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('userRole', user.role);
    
    // IMPORTANT: Use user.profile_id (from your backend) or user.id
    // Your backend sends 'profile_id', so we use that for Bidding tables
    localStorage.setItem('userId', user.profile_id); 
    
    localStorage.setItem('userName', user.display_name || 'Supplier');
    
    // FIX: Use user.status (this was causing the crash)
    localStorage.setItem('userStatus', user.status || 'PENDING'); 
    
    localStorage.setItem('internal_user_id', user.id);

    // 3. Navigate to portal
    navigate('/supplier/portal');
  } catch (err) {
    console.error("Login error detail:", err);
    setError(err.response?.data?.message || "Login failed. Please check your credentials.");
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Header />
      
      <main className="flex-grow flex items-center justify-center pt-32 pb-20 px-4">
        <div className="max-w-6xl w-full grid md:grid-cols-2 bg-white rounded-[3rem] overflow-hidden shadow-2xl border border-neutral-100">
          
          {/* Left Side: Visual/Branding */}
          <div className="hidden md:flex flex-col justify-between p-16 bg-neutral-900 text-white relative">
            <div className="relative z-10">
              <div className="bg-yellow-400 text-neutral-900 w-fit px-4 py-1 rounded-full text-xs font-black uppercase mb-8">
                Supplier Portal
              </div>
              <h1 className="text-5xl font-black leading-tight mb-6">
                GROW YOUR <br /> BUSINESS WITH <br /> <span className="text-yellow-400">AVATAR.</span>
              </h1>
              <p className="text-neutral-400 font-bold text-lg max-w-sm">
                Access exclusive community tenders, submit bids, and track your project performance.
              </p>
            </div>

            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3 text-sm font-bold text-neutral-300">
                <ShieldCheck className="w-5 h-5 text-yellow-400" />
                Secure e-Tendering System
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-neutral-300">
                <Briefcase className="w-5 h-5 text-yellow-400" />
                Transparent Awarding Process
              </div>
            </div>

            {/* Abstract background shape */}
            <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
                    <path fill="#FFD700" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.5,90,-16.3,88.5,-0.9C86.9,14.5,81.2,29.1,72.4,41.4C63.6,53.7,51.8,63.7,38.5,71.2C25.2,78.7,10.4,83.7,-3.9,90.4C-18.1,97.1,-31.7,105.5,-44,101.4C-56.3,97.3,-67.2,80.7,-74.8,65.1C-82.4,49.5,-86.6,34.9,-88.9,20.2C-91.1,5.5,-91.4,-9.3,-86.4,-22.4C-81.4,-35.5,-71.2,-46.8,-59.5,-55.1C-47.8,-63.3,-34.5,-68.5,-21.5,-76.3C-8.4,-84.1,4.4,-94.4,18.1,-93.6C31.8,-92.8,44.7,-83.5,44.7,-76.4Z" transform="translate(100 100)" />
                </svg>
            </div>
          </div>

          {/* Right Side: Login Form */}
          <div className="p-8 md:p-16 flex flex-col justify-center">
            <div className="mb-10">
              <h2 className="text-3xl font-black text-neutral-900 mb-2">Welcome Back</h2>
              <p className="text-neutral-500 font-bold">Please enter your credentials to access bids.</p>
            </div>

            {error && (
              <div className="flex items-center gap-3 bg-red-50 text-red-600 p-4 rounded-2xl mb-6 font-bold text-sm animate-in fade-in zoom-in duration-300">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-neutral-400 ml-1">Official Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-4 w-5 h-5 text-neutral-300" />
                  <input 
                    type="email" name="email" required
                    placeholder="name@company.com"
                    className="w-full pl-12 pr-4 py-4 bg-neutral-50 border-none rounded-2xl focus:ring-2 focus:ring-yellow-400 font-bold transition-all"
                    value={formData.email} onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                    <label className="text-xs font-black uppercase tracking-widest text-neutral-400">Password</label>
                    <Link to="/forgot-password" size="sm" className="text-[10px] font-black uppercase text-neutral-400 hover:text-neutral-900 transition-colors">Forgot?</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 w-5 h-5 text-neutral-300" />
                  <input 
                    type="password" name="password" required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-4 bg-neutral-50 border-none rounded-2xl focus:ring-2 focus:ring-yellow-400 font-bold transition-all"
                    value={formData.password} onChange={handleChange}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-neutral-900 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-neutral-800 transition-all shadow-xl shadow-neutral-200"
              >
                {loading ? "Authenticating..." : "Login to Dashboard"}
                {!loading && <ArrowRight className="w-5 h-5 text-yellow-400" />}
              </button>
            </form>

            <div className="mt-12 pt-8 border-t border-neutral-100 text-center">
              <p className="text-neutral-500 font-bold text-sm">
                New vendor? <Link to="/supplier-register" className="text-neutral-900 hover:text-yellow-600 underline decoration-2 underline-offset-4">Register your business</Link>
              </p>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}