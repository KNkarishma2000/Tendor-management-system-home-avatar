import React, { useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { KeyRound, Mail, Lock, ArrowRight, ShieldCheck, CheckCircle2, ChevronLeft, Sparkles } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { authAPI } from '../../api/auth.service';
import { Link, useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const showSuccess = (msg) => toast.success(msg, {
    style: { background: '#1f1b16', color: '#a88d5e', border: '1px solid #a88d5e/20' },
  });

  const showError = (msg) => toast.error(msg, {
    style: { background: '#fff', color: '#1f1b16', fontWeight: 'bold' }
  });

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) return showError("Please enter your email address");
    setLoading(true);
    try {
      const { data } = await authAPI.forgotPassword(email);
      if (data.success) {
        showSuccess("A verification code has been dispatched.");
        setStep(2);
      }
    } catch (err) {
      showError(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return showError("Passwords do not match");
    setLoading(true);
    try {
      const { data } = await authAPI.resetPassword({ email, otp, newPassword });
      if (data.success) {
        showSuccess("Credentials updated successfully.");
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      showError(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#fbfbfb] min-h-screen">
      <Header />
      <Toaster position="top-right" />
      
      <div className="flex min-h-screen pt-20 md:pt-0">
        
        {/* LEFT SIDE: CINEMATIC SECURITY VIBE */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#1f1b16] relative overflow-hidden items-center justify-center p-20">
          <div className="absolute inset-0 opacity-30">
            <img 
              src="https://images.unsplash.com/photo-1554435493-93422e8220c8?w=1200" 
              className="w-full h-full object-cover" 
              alt="Secure Architecture" 
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#1f1b16] to-transparent"></div>
          </div>
          
          <div className="relative z-10 max-w-lg">
            <KeyRound className="text-[#a88d5e] mb-6 w-8 h-8" />
            <h1 className="text-6xl font-serif italic text-white mb-8 leading-tight">
              Restoring your <br />
              <span className="text-[#a88d5e]">access.</span>
            </h1>
            <div className="w-12 h-[1px] bg-[#a88d5e] mb-8"></div>
            <p className="text-gray-400 font-serif italic text-xl leading-relaxed">
              Security is the cornerstone of Windsor Living. Follow the steps to safely recover your account credentials.
            </p>

            {/* PROGRESS TRACKER */}
            <div className="mt-12 flex items-center gap-4">
               <div className={`h-[2px] transition-all duration-700 ${step === 1 ? 'w-16 bg-[#a88d5e]' : 'w-8 bg-white/10'}`}></div>
               <div className={`h-[2px] transition-all duration-700 ${step === 2 ? 'w-16 bg-[#a88d5e]' : 'w-8 bg-white/10'}`}></div>
               <span className="text-[10px] text-[#a88d5e] font-bold uppercase tracking-[0.3em]">Step {step} of 2</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: MINIMALIST RECOVERY FORM */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-24 bg-white">
          <div className="w-full max-w-md relative">
            
            <Link to="/login" className="absolute -top-16 left-0 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-[#a88d5e] transition-colors">
              <ChevronLeft size={14} /> Back to Login
            </Link>

            <div className="mb-12">
              <span className="text-[#a88d5e] font-bold uppercase text-[10px] tracking-[0.4em] mb-4 block">Recovery Portal</span>
              <h2 className="text-4xl font-serif text-[#1f1b16] mb-4 uppercase tracking-tight">
                {step === 1 ? "Identity" : "Credentials"}
              </h2>
              <p className="text-gray-500 text-sm font-serif italic leading-relaxed">
                {step === 1 
                  ? "Enter the email associated with your residence to receive a secure code." 
                  : "Verification successful. Please establish your new security key."}
              </p>
            </div>

            {step === 1 ? (
              <form onSubmit={handleSendOTP} className="space-y-10">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Resident Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a88d5e]" />
                    <input 
                      type="email" required
                      className="w-full border-b border-gray-100 py-4 pl-8 pr-4 font-serif text-lg focus:outline-none focus:border-[#a88d5e] transition-all placeholder:text-gray-200"
                      placeholder="resident@homeavatar.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  type="submit" disabled={loading}
                  className="w-full bg-[#1f1b16] text-[#a88d5e] py-6 text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-[#a88d5e] hover:text-[#1f1b16] transition-all duration-500 flex items-center justify-center gap-4 group"
                >
                  {loading ? "Verifying..." : "Request Code"}
                  {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-8">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">6-Digit Code</label>
                  <div className="relative group">
                    <ShieldCheck className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a88d5e]" />
                    <input 
                      type="text" required maxLength={6}
                      className="w-full border-b border-gray-100 py-4 pl-8 pr-4 font-serif text-2xl tracking-[0.5em] focus:outline-none focus:border-[#a88d5e] transition-all"
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a88d5e]" />
                    <input 
                      type="password" required
                      className="w-full border-b border-gray-100 py-4 pl-8 pr-4 font-serif text-lg focus:outline-none focus:border-[#a88d5e] transition-all"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Confirm New Password</label>
                  <div className="relative">
                    <CheckCircle2 className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a88d5e]" />
                    <input 
                      type="password" required
                      className="w-full border-b border-gray-100 py-4 pl-8 pr-4 font-serif text-lg focus:outline-none focus:border-[#a88d5e] transition-all"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  type="submit" disabled={loading}
                  className="w-full bg-[#1f1b16] text-[#a88d5e] py-6 text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-[#a88d5e] hover:text-[#1f1b16] transition-all duration-500 flex items-center justify-center gap-4"
                >
                  {loading ? "Updating..." : "Secure Credentials"}
                </button>
              </form>
            )}

            <div className="mt-16 flex items-center justify-center gap-3 text-gray-300 text-[9px] font-bold uppercase tracking-[0.2em]">
               <ShieldCheck className="w-3 h-3 text-green-500/50" />
               AES-256 Multi-Factor Recovery
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ForgotPassword;