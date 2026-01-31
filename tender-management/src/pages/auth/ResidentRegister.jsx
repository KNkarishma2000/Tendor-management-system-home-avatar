import React, { useState, useEffect } from 'react';
import { UserPlus, Building, Mail, Lock, Phone, Users, ArrowRight, ShieldCheck, KeyRound, Sparkles, ChevronLeft } from 'lucide-react';
import { authResidentAPI } from '../../api/auth.service';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

export default function RegisterResident() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    block: '',
    flat_no: '',
    mobile_no: '',
    family_members: 1,
    otp: ''
  });

  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendOTP = async () => {
    if (!formData.email) {
      setMessage({ type: 'error', text: 'Please enter your email first.' });
      return;
    }
    setOtpLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await authResidentAPI.sendOTP(formData.email);
      setMessage({ type: 'success', text: 'OTP sent to your email!' });
      setTimer(60);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || "Failed to send OTP." 
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await authResidentAPI.registerResident(formData);
      setMessage({ type: 'success', text: response.data.message });
      setFormData({ 
        full_name: '', email: '', password: '', block: '', 
        flat_no: '', mobile_no: '', family_members: 1, otp: '' 
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || "Registration failed." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#fbfbfb] min-h-screen">
      <Header />
      
      <main className="flex min-h-screen pt-20 md:pt-0">
        
        {/* LEFT SIDE: LIFESTYLE IMAGE */}
        <div className="hidden lg:flex lg:w-1/3 bg-[#1f1b16] relative overflow-hidden items-center justify-center p-12">
          <div className="absolute inset-0 opacity-40">
            <img 
              src="https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=1200" 
              className="w-full h-full object-cover" 
              alt="Luxury Apartment" 
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#1f1b16] via-transparent to-[#1f1b16]"></div>
          </div>
          
          <div className="relative z-10">
            <Sparkles className="text-[#a88d5e] mb-6 w-8 h-8" />
            <h1 className="text-5xl font-serif italic text-white mb-8 leading-tight">
              Begin your <br />
              <span className="text-[#a88d5e]">residency.</span>
            </h1>
            <div className="w-12 h-[1px] bg-[#a88d5e] mb-8"></div>
            
            <div className="space-y-6">
              {[
                { icon: ShieldCheck, text: "Verified Resident Access", desc: "Secure and private credentials" },
                { icon: Building, text: "Marketplace Hub", desc: "Exclusive trade with neighbors" },
                { icon: Users, text: "Community Circle", desc: "Access events and forums" }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="bg-white/5 p-3 rounded-full text-[#a88d5e] group-hover:bg-[#a88d5e] group-hover:text-[#1f1b16] transition-all duration-500">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-xs uppercase tracking-widest">{item.text}</h4>
                    <p className="text-gray-500 text-[10px] font-serif italic">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: REGISTRATION FORM */}
        <div className="w-full lg:w-2/3 flex items-center justify-center p-6 md:p-20 bg-white">
          <div className="w-full max-w-2xl relative">
            
            <Link to="/login" className="absolute -top-12 left-0 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-[#a88d5e] transition-colors">
              <ChevronLeft size={14} /> Already a resident? Login
            </Link>

            <div className="mb-10">
              <span className="text-[#a88d5e] font-bold uppercase text-[10px] tracking-[0.4em] mb-4 block">New Membership</span>
              <h2 className="text-4xl font-serif text-[#1f1b16] uppercase tracking-tight">Create Account</h2>
            </div>

            {message.text && (
              <div className={`p-4 rounded-lg mb-8 text-[10px] font-bold uppercase tracking-widest border-l-4 ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-800 border-green-500' 
                  : 'bg-red-50 text-red-800 border-red-500'
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* PRIMARY DETAILS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Full Name</label>
                  <div className="relative group">
                    <UserPlus className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a88d5e]" />
                    <input
                      type="text" name="full_name" required
                      className="w-full border-b border-gray-100 py-3 pl-8 font-serif text-lg focus:outline-none focus:border-[#a88d5e] transition-all placeholder:text-gray-200"
                      placeholder="Johnathan Doe"
                      value={formData.full_name} onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Email Address</label>
                  <div className="flex gap-4">
                    <div className="relative flex-grow group">
                      <Mail className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a88d5e]" />
                      <input
                        type="email" name="email" required
                        className="w-full border-b border-gray-100 py-3 pl-8 font-serif text-lg focus:outline-none focus:border-[#a88d5e] transition-all placeholder:text-gray-200"
                        placeholder="john@example.com"
                        value={formData.email} onChange={handleChange}
                      />
                    </div>
                    <button
                      type="button" onClick={handleSendOTP} disabled={otpLoading || timer > 0}
                      className="text-[9px] font-bold uppercase tracking-widest text-[#a88d5e] hover:text-[#1f1b16] disabled:opacity-30 transition-colors pt-2"
                    >
                      {timer > 0 ? `Retry in ${timer}s` : "Verify"}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Verification Code (OTP)</label>
                  <div className="relative group">
                    <KeyRound className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a88d5e]" />
                    <input
                      type="text" name="otp" required maxLength={6}
                      className="w-full border-b border-gray-100 py-3 pl-8 font-serif text-lg tracking-[0.5em] focus:outline-none focus:border-[#a88d5e] transition-all placeholder:text-gray-200"
                      placeholder="000000"
                      value={formData.otp} onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Mobile Number</label>
                  <div className="relative group">
                    <Phone className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a88d5e]" />
                    <input
                      type="text" name="mobile_no" required
                      className="w-full border-b border-gray-100 py-3 pl-8 font-serif text-lg focus:outline-none focus:border-[#a88d5e] transition-all"
                      placeholder="+1 234..."
                      value={formData.mobile_no} onChange={handleChange}
                    />
                  </div>
                </div>

                {/* RESIDENCE DETAILS */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Block / Wing</label>
                  <div className="relative group">
                    <Building className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a88d5e]" />
                    <input
                      type="text" name="block" required
                      className="w-full border-b border-gray-100 py-3 pl-8 font-serif text-lg focus:outline-none focus:border-[#a88d5e] transition-all"
                      placeholder="Tower A"
                      value={formData.block} onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Flat Number</label>
                  <div className="relative group">
                    <Building className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a88d5e]" />
                    <input
                      type="text" name="flat_no" required
                      className="w-full border-b border-gray-100 py-3 pl-8 font-serif text-lg focus:outline-none focus:border-[#a88d5e] transition-all"
                      placeholder="1204"
                      value={formData.flat_no} onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Family Size</label>
                  <div className="relative group">
                    <Users className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a88d5e]" />
                    <input
                      type="number" name="family_members" min="1"
                      className="w-full border-b border-gray-100 py-3 pl-8 font-serif text-lg focus:outline-none focus:border-[#a88d5e] transition-all"
                      value={formData.family_members} onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Access Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a88d5e]" />
                    <input
                      type="password" name="password" required
                      className="w-full border-b border-gray-100 py-3 pl-8 font-serif text-lg focus:outline-none focus:border-[#a88d5e] transition-all"
                      placeholder="••••••••"
                      value={formData.password} onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1f1b16] text-[#a88d5e] py-6 text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-[#a88d5e] hover:text-[#1f1b16] transition-all duration-500 flex items-center justify-center gap-4 mt-8 group"
              >
                {loading ? "Establishing Membership..." : "Complete Registration"} 
                {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}