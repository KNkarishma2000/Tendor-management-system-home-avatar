import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Building, Lock, User, Hash, ArrowRight, ShieldCheck} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { authAPI } from '../../api/auth.service'; // Using the centralized API file
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';

const Login = () => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // 2. Initialize it here
  

  const [formData, setFormData] = useState({
    email: '',
    flat_no: '',
    password: ''
  });

  const showSuccess = (msg) => toast.success(msg, {
    style: { border: '2px solid #fbbf24', padding: '16px', borderRadius: '20px' },
  });

  const showError = (msg) => toast.error(msg, {
    style: { borderRadius: '20px', fontWeight: 'bold' }
  });
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
  
  // ADD THIS LINE: Clear any previous toasts before starting
  toast.dismiss(); 

  const payload = isAdminMode 
    ? { email: formData.email, password: formData.password }
    : { flat_no: formData.flat_no, password: formData.password };

  try {
    const { data } = await authAPI.login(payload);
    
    if (data.success) {
      // 1. Show the success toast
      // showSuccess(isAdminMode ? "Access Granted!" : "Welcome Home!");
      
      // 2. Set storage
  // Inside handleLogin after: if (data.success) {

// 1. Set standard storage for all roles
localStorage.setItem('accessToken', data.accessToken);
localStorage.setItem('userEmail', data.user.email);
localStorage.setItem('userRole', data.user.role);
localStorage.setItem('userStatus', data.user.status || 'PENDING');

// 2. CRITICAL CHANGE: Always store the internal Auth UUID
// This is the 'id' column from your Supabase 'users' table (seen in your screenshot)
localStorage.setItem('internal_user_id', data.user.id);

// 3. Store role-specific IDs if they exist
if (data.user.role === 'RESIDENT') {
    localStorage.setItem('resident_id', data.user.resident_id);
} else if (data.user.role === 'SUPPLIER') {
    localStorage.setItem('profile_id', data.user.profile_id);
}

      // 3. Redirect
      setTimeout(() => {
          // Use navigate instead of window.location.href to stay in SPA mode
         if (data.user.role === 'ADMIN') {
    navigate('/admin/dashboard');
} else if (data.user.role === 'RESIDENT') {
    navigate('/dashboard/resident');
} else if (data.user.role === 'ACCOUNTANT') {
    navigate('/accountant/dashboard');
} else if (data.user.role === 'SUPPLIER') {
    navigate('/supplier/portal');
} else {
    // If no role matches, go to a generic landing or show error
    navigate('/'); 
}
      }, 1500);
    }
  } catch (err) {
    // Clear loading toasts if you had them
    toast.dismiss(); 
    showError(err.response?.data?.message || "Authentication failed");
  } finally {
    setLoading(false);
  }
};

  return (
    <div>
      <Header />
      <div className="min-h-screen flex items-center justify-center p-4 font-sans">
        <Toaster position="top-center" reverseOrder={false} />
        
        <div className="w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] border border-neutral-100">
          
          {/* Left Side: Branding */}
          <div className="md:w-1/2 bg-yellow-400 p-12 flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <div className="bg-neutral-900 w-12 h-12 rounded-full flex items-center justify-center text-yellow-400 mb-6 shadow-lg">
                <Building className="w-6 h-6" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-neutral-900 leading-tight">
                MY HOME <br /> AVATAR.
              </h1>
              <p className="mt-4 text-neutral-800 font-bold text-lg">
                {isAdminMode ? "Management Portal" : "Resident Access"}
              </p>
            </div>
            {/* Shapes removed for brevity, keep your original CSS classes here */}
          </div>

          {/* Right Side: Unified Form */}
          <div className="md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white">
            <div className="mb-10">
              <div className="flex bg-neutral-100 p-1 rounded-2xl mb-8">
                <button 
                  onClick={() => setIsAdminMode(false)}
                  className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${!isAdminMode ? 'bg-white text-neutral-900 shadow-md' : 'text-neutral-500'}`}
                >
                  Resident
                </button>
                <button 
                  onClick={() => setIsAdminMode(true)}
                  className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${isAdminMode ? 'bg-neutral-900 text-white shadow-md' : 'text-neutral-500'}`}
                >
                  Staff/Admin
                </button>
              </div>

              <h2 className="text-3xl font-black text-neutral-900 tracking-tight mb-2">
                {isAdminMode ? "Association Login" : "Resident Login"}
              </h2>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {isAdminMode ? (
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-neutral-400 ml-4">Email Address</label>
                  <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input 
                      type="email" 
                      required
                      className="w-full bg-neutral-100 border-none rounded-2xl py-4 pl-14 pr-6 font-bold"
                      placeholder="admin@myhome.com"
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-neutral-400 ml-4">Flat Number</label>
                  <div className="relative">
                    <Hash className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input 
                      type="text" 
                      required
                      className="w-full bg-neutral-100 border-none rounded-2xl py-4 pl-14 pr-6 font-bold"
                      placeholder="e.g. A-1204"
                      onChange={(e) => setFormData({...formData, flat_no: e.target.value})}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-neutral-400 ml-4">Password</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input 
                    type="password" 
                    required
                    className="w-full bg-neutral-100 border-none rounded-2xl py-4 pl-14 pr-6 font-bold"
                    placeholder="••••••••"
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-neutral-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-neutral-800 transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-70"
              >
                {loading ? "Verifying..." : "Unlock Dashboard"}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
              
              
            </form>
{!isAdminMode && (
  <div className="mt-6 text-center">
    <p className="text-neutral-500 font-bold">
      Don't have an account?{' '}
      <Link 
        to="/resident-register" 
        className="text-neutral-900 underline decoration-yellow-400 decoration-2 underline-offset-4 hover:text-yellow-600 transition-colors"
      >
        Register Here
      </Link>
    </p>
  </div>
)}
            <div className="mt-8 flex items-center justify-center gap-2 text-neutral-400 text-sm font-bold">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              Secure AES-256 Encrypted Connection
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;