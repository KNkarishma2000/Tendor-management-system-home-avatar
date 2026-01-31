import React, { useState, useEffect } from 'react';
import { UserPlus, Building, Mail, Lock, Phone, Users, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { authResidentAPI } from '../../api/auth.service';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function RegisterResident() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    block: '',
    flat_no: '',
    mobile_no: '',
    family_members: 1,
    otp: '' // New field
  });

  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [timer, setTimer] = useState(0);

  // Timer logic for Resend OTP
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
      setTimer(60); // Start 60s cooldown
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
      // Reset form
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
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Header />
      
      <main className="flex-grow pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          
          {/* Left Side: Branding */}
          <div className="hidden md:block p-12 bg-yellow-400 rounded-[3rem] h-full relative overflow-hidden">
            <div className="relative z-10">
              <div className="bg-neutral-900 text-white w-fit px-4 py-1 rounded-full text-xs font-black uppercase mb-6">
                Resident Portal
              </div>
              <h1 className="text-6xl font-black text-neutral-900 leading-[0.9] mb-8">
                JOIN THE <br /> COMMUNITY.
              </h1>
              <ul className="space-y-6">
                {[
                  { icon: ShieldCheck, text: "Verified Resident Access" },
                  { icon: Building, text: "Marketplace & Classifieds" },
                  { icon: Users, text: "Community Blogs & Events" }
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 font-bold text-neutral-800">
                    <div className="bg-neutral-900 p-2 rounded-lg text-yellow-400">
                      <item.icon className="w-5 h-5" />
                    </div>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Side: Registration Form */}
          <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-neutral-100">
            <h2 className="text-3xl font-black text-neutral-900 mb-2">Create Account</h2>
            <p className="text-neutral-500 font-bold mb-8 text-sm">Verify your email to continue.</p>

            {message.text && (
              <div className={`p-4 rounded-2xl mb-6 font-bold text-sm ${
                message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 relative">
                  <UserPlus className="absolute left-4 top-4 w-5 h-5 text-neutral-400" />
                  <input
                    type="text" name="full_name" placeholder="Full Name" required
                    className="w-full pl-12 pr-4 py-4 bg-neutral-50 border-none rounded-2xl focus:ring-2 focus:ring-yellow-400 font-bold"
                    value={formData.full_name} onChange={handleChange}
                  />
                </div>

                {/* Email with Send OTP Button */}
                <div className="col-span-2 flex gap-2">
                  <div className="relative flex-grow">
                    <Mail className="absolute left-4 top-4 w-5 h-5 text-neutral-400" />
                    <input
                      type="email" name="email" placeholder="Email Address" required
                      className="w-full pl-12 pr-4 py-4 bg-neutral-50 border-none rounded-2xl focus:ring-2 focus:ring-yellow-400 font-bold"
                      value={formData.email} onChange={handleChange}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={otpLoading || timer > 0}
                    className="px-6 bg-neutral-900 text-yellow-400 rounded-2xl font-black text-xs uppercase disabled:opacity-50 whitespace-nowrap"
                  >
                    {timer > 0 ? `Resend in ${timer}s` : otpLoading ? "Sending..." : "Send OTP"}
                  </button>
                </div>

                <div className="col-span-2 relative">
                  <KeyRound className="absolute left-4 top-4 w-5 h-5 text-neutral-400" />
                  <input
                    type="text" name="otp" placeholder="Enter 6-Digit OTP" required
                    className="w-full pl-12 pr-4 py-4 bg-yellow-50 border-2 border-yellow-200 rounded-2xl focus:ring-2 focus:ring-yellow-400 font-black text-center text-xl tracking-widest"
                    value={formData.otp} onChange={handleChange} maxLength={6}
                  />
                </div>

                <div className="relative">
                  <Building className="absolute left-4 top-4 w-5 h-5 text-neutral-400" />
                  <input
                    type="text" name="block" placeholder="Block" required
                    className="w-full pl-12 pr-4 py-4 bg-neutral-50 border-none rounded-2xl focus:ring-2 focus:ring-yellow-400 font-bold"
                    value={formData.block} onChange={handleChange}
                  />
                </div>

                <div className="relative">
                  <Building className="absolute left-4 top-4 w-5 h-5 text-neutral-400" />
                  <input
                    type="text" name="flat_no" placeholder="Flat No." required
                    className="w-full pl-12 pr-4 py-4 bg-neutral-50 border-none rounded-2xl focus:ring-2 focus:ring-yellow-400 font-bold"
                    value={formData.flat_no} onChange={handleChange}
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute left-4 top-4 w-5 h-5 text-neutral-400" />
                  <input
                    type="text" name="mobile_no" placeholder="Mobile No." required
                    className="w-full pl-12 pr-4 py-4 bg-neutral-50 border-none rounded-2xl focus:ring-2 focus:ring-yellow-400 font-bold"
                    value={formData.mobile_no} onChange={handleChange}
                  />
                </div>

                <div className="relative">
                  <Users className="absolute left-4 top-4 w-5 h-5 text-neutral-400" />
                  <input
                    type="number" name="family_members" placeholder="Family Size" min="1"
                    className="w-full pl-12 pr-4 py-4 bg-neutral-50 border-none rounded-2xl focus:ring-2 focus:ring-yellow-400 font-bold"
                    value={formData.family_members} onChange={handleChange}
                  />
                </div>

                <div className="col-span-2 relative">
                  <Lock className="absolute left-4 top-4 w-5 h-5 text-neutral-400" />
                  <input
                    type="password" name="password" placeholder="Create Password" required
                    className="w-full pl-12 pr-4 py-4 bg-neutral-50 border-none rounded-2xl focus:ring-2 focus:ring-yellow-400 font-bold"
                    value={formData.password} onChange={handleChange}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-neutral-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-neutral-800 transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Complete Registration"} 
                {!loading && <ArrowRight className="w-5 h-5 text-yellow-400" />}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}