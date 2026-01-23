import React, { useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { KeyRound, Mail, Lock, ArrowRight, ShieldCheck, CheckCircle2, ChevronLeft } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { authAPI } from '../../api/auth.service'; // Adjust path if needed
import { Link, useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // Step 1: Request OTP, Step 2: Reset Password
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Toast Helpers
  const showSuccess = (msg) => toast.success(msg, {
    style: { border: '2px solid #fbbf24', padding: '16px', borderRadius: '20px' },
  });

  const showError = (msg) => toast.error(msg, {
    style: { borderRadius: '20px', fontWeight: 'bold' }
  });

  // --- STEP 1: SEND OTP ---
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) return showError("Please enter your email address");

    setLoading(true);
    try {
      const { data } = await authAPI.forgotPassword(email);
      if (data.success) {
        showSuccess("OTP sent! Check your inbox.");
        setStep(2);
      }
    } catch (err) {
      showError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 2: VERIFY & RESET ---
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      return showError("Passwords do not match!");
    }
    if (newPassword.length < 6) {
      return showError("Password must be at least 6 characters.");
    }

    setLoading(true);
    try {
      const payload = {
        email,
        otp,
        newPassword
      };

      const { data } = await authAPI.resetPassword(payload);
      
      if (data.success) {
        showSuccess("Password reset successfully!");
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      showError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header />
      <div className="min-h-screen flex items-center justify-center p-4 font-sans bg-gray-50">
        <Toaster position="top-center" reverseOrder={false} />
        
        <div className="w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] border border-neutral-100">
          
          {/* Left Side: Branding */}
          <div className="md:w-1/2 bg-neutral-900 p-12 flex flex-col justify-between relative overflow-hidden text-white">
            <div className="relative z-10">
              <div className="bg-yellow-400 w-12 h-12 rounded-full flex items-center justify-center text-neutral-900 mb-6 shadow-lg">
                <KeyRound className="w-6 h-6" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
                ACCOUNT <br /> RECOVERY.
              </h1>
              <p className="mt-4 text-neutral-400 font-bold text-lg">
                {step === 1 ? "Secure Identity Verification" : "Create New Credentials"}
              </p>
            </div>
            
            {/* Steps Indicator */}
            <div className="flex gap-2 mt-8">
              <div className={`h-2 rounded-full transition-all duration-300 ${step === 1 ? 'w-12 bg-yellow-400' : 'w-4 bg-neutral-700'}`}></div>
              <div className={`h-2 rounded-full transition-all duration-300 ${step === 2 ? 'w-12 bg-yellow-400' : 'w-4 bg-neutral-700'}`}></div>
            </div>
          </div>

          {/* Right Side: Dynamic Form */}
          <div className="md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white relative">
            
            {/* Back to Login Link */}
            <Link to="/login" className="absolute top-8 right-8 text-sm font-bold text-neutral-400 hover:text-neutral-900 flex items-center gap-1 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back to Login
            </Link>

            <div className="mb-8">
              <h2 className="text-3xl font-black text-neutral-900 tracking-tight mb-2">
                {step === 1 ? "Forgot Password?" : "Set New Password"}
              </h2>
              <p className="text-neutral-500 font-medium">
                {step === 1 
                  ? "Enter your email address to receive a 6-digit verification code." 
                  : `Enter the code sent to ${email} and your new password.`}
              </p>
            </div>

            {/* STEP 1 FORM: EMAIL */}
            {step === 1 && (
              <form onSubmit={handleSendOTP} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-neutral-400 ml-4">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input 
                      type="email" 
                      required
                      className="w-full bg-neutral-100 border-none rounded-2xl py-4 pl-14 pr-6 font-bold focus:ring-2 focus:ring-yellow-400 transition-all"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-yellow-400 text-neutral-900 py-5 rounded-2xl font-black text-lg hover:bg-yellow-500 transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending OTP..." : "Send Verification Code"}
                  {!loading && <ArrowRight className="w-5 h-5" />}
                </button>
              </form>
            )}

            {/* STEP 2 FORM: OTP & NEW PASSWORD */}
            {step === 2 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                
                {/* OTP Input */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-neutral-400 ml-4">One-Time Password (OTP)</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input 
                      type="text" 
                      required
                      maxLength={6}
                      className="w-full bg-neutral-100 border-none rounded-2xl py-4 pl-14 pr-6 font-bold tracking-widest text-lg"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-neutral-400 ml-4">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input 
                      type="password" 
                      required
                      className="w-full bg-neutral-100 border-none rounded-2xl py-4 pl-14 pr-6 font-bold"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-neutral-400 ml-4">Confirm Password</label>
                  <div className="relative">
                    <CheckCircle2 className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input 
                      type="password" 
                      required
                      className="w-full bg-neutral-100 border-none rounded-2xl py-4 pl-14 pr-6 font-bold"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-neutral-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-neutral-800 transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                    {!loading && <ArrowRight className="w-5 h-5" />}
                  </button>
                </div>

                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-center text-sm font-bold text-neutral-400 hover:text-neutral-900 mt-2"
                >
                  Change Email Address
                </button>
              </form>
            )}

            <div className="mt-8 flex items-center justify-center gap-2 text-neutral-400 text-sm font-bold">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              Secure 256-bit Encryption
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ForgotPassword;