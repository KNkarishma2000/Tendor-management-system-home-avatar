import React, { useState } from 'react';
import { UserPlus, Building, Mail, Lock, Phone, Users, ArrowRight, ShieldCheck } from 'lucide-react';
import { authAPI } from '../../api/auth.service'; // Importing the API service we built
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
    family_members: 1
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await authAPI.registerResident(formData);
      setMessage({ type: 'success', text: response.data.message });
      // Clear form on success
      setFormData({ full_name: '', email: '', password: '', block: '', flat_no: '', mobile_no: '', family_members: 1 });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || "Registration failed. Please try again." 
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
          
          {/* Left Side: Branding & Info */}
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
            {/* Decorative Element */}
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/20 rounded-full blur-3xl"></div>
          </div>

          {/* Right Side: Registration Form */}
          <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-neutral-100">
            <h2 className="text-3xl font-black text-neutral-900 mb-2">Create Account</h2>
            <p className="text-neutral-500 font-bold mb-8 text-sm">Fill in your details for Admin verification.</p>

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

                <div className="col-span-2 relative">
                  <Mail className="absolute left-4 top-4 w-5 h-5 text-neutral-400" />
                  <input
                    type="email" name="email" placeholder="Email Address" required
                    className="w-full pl-12 pr-4 py-4 bg-neutral-50 border-none rounded-2xl focus:ring-2 focus:ring-yellow-400 font-bold"
                    value={formData.email} onChange={handleChange}
                  />
                </div>

                <div className="relative">
                  <Building className="absolute left-4 top-4 w-5 h-5 text-neutral-400" />
                  <input
                    type="text" name="block" placeholder="Block (e.g. 4)" required
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
                {loading ? "Processing..." : "Submit Registration"} 
                {!loading && <ArrowRight className="w-5 h-5 text-yellow-400" />}
              </button>
            </form>
            
            <p className="text-center mt-6 text-neutral-400 font-bold text-xs uppercase tracking-widest">
              Existing Resident? <a href="/login" className="text-neutral-900 hover:text-yellow-600 underline">Login Here</a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}