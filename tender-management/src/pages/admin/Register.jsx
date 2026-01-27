import React, { useState } from 'react';
import { authAPI } from '../../api/auth.service';
import { 
  UserPlus, Building2, Home, Loader2, CheckCircle2, 
  Calculator, ArrowRight, ChevronLeft, 
  Users, Phone, Mail, Lock, Hash, MapPin,
  ShieldAlert
} from 'lucide-react';

const AdminRegisterUser = () => {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    block: '',
    flat_no: '',
    mobile_no: '',
    family_members: '1',
    company_name: '',
    registered_address: '',
    contact_person_name: '',
    contact_phone: '',
    pan: '',
    gstin: '',
    cin: '',
    bank_account_no: '',
    ifsc_code: '',
    bank_name: '',
  });

  // MC Role removed from this list
  const roles = [
    { id: 'RESIDENT', label: 'Resident', icon: Home, desc: 'Standard Owner/Tenant access' },
    { id: 'SUPPLIER', label: 'Supplier', icon: Building2, desc: 'Vendors & Service Providers' },
    { id: 'ACCOUNTANT', label: 'Accountant', icon: Calculator, desc: 'Finance & Billing Access' },
  ];

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const startRegistration = (selectedRole) => {
    setRole(selectedRole);
    setFormData({
      email: '', password: '', full_name: '', block: '', flat_no: '',
      mobile_no: '', family_members: '1', company_name: '',
      registered_address: '', contact_person_name: '', contact_phone: '',
      pan: '', gstin: '', cin: '', bank_account_no: '', ifsc_code: '', bank_name: '',
    });
    setStep(2);
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await authAPI.register({ ...formData, role });
      if (response.data.success) {
        setMessage({ type: 'success', text: `Successfully created ${role} account!` });
        setTimeout(() => {
            setStep(1);
            setMessage({ type: '', text: '' });
        }, 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || "Registration failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-[600px]">
      <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-neutral-100 transition-all duration-500">
        
        {/* HEADER */}
        <div className="bg-neutral-900 p-10 text-white relative">
          <div className="relative z-10">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="flex items-center gap-2 text-yellow-400 font-bold mb-4 hover:opacity-70 transition-all">
                <ChevronLeft size={20} /> Back to Roles
              </button>
            )}
            <h2 className="text-4xl font-black tracking-tighter flex items-center gap-3">
              {step === 1 ? "Select User Role" : `Register ${role}`}
            </h2>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        </div>

        {step === 1 ? (
          /* STEP 1: ROLE SELECTION */
          <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            {roles.map((item) => (
              <div key={item.id} onClick={() => startRegistration(item.id)} className="group p-8 rounded-[2.5rem] border-2 border-neutral-100 hover:border-yellow-400 hover:bg-neutral-50 cursor-pointer transition-all flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <item.icon className="text-yellow-400" size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-neutral-900">{item.label}</h3>
                    <p className="text-neutral-500 font-bold text-sm">{item.desc}</p>
                  </div>
                </div>
                <ArrowRight className="text-neutral-300 group-hover:text-yellow-500 group-hover:translate-x-2 transition-all" />
              </div>
            ))}
          </div>
        ) : (
          /* STEP 2: DYNAMIC FORM */
          <form onSubmit={handleSubmit} className="p-10 space-y-8 animate-in fade-in zoom-in-95 duration-500">
            {message.text && (
              <div className={`p-5 rounded-2xl font-black flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {message.type === 'success' ? <CheckCircle2 /> : <ShieldAlert />} {message.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CORE CREDENTIALS */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-50 p-6 rounded-[2rem] border border-neutral-100">
                <div className="space-y-2">
                  <label className="text-xs font-black text-neutral-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Mail size={14}/> Login Email</label>
                  <input name="email" type="email" value={formData.email} required onChange={handleInputChange} className="w-full px-5 py-3 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none font-bold" placeholder="user@example.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-neutral-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Lock size={14}/> Login Password</label>
                  <input name="password" type="password" value={formData.password} required onChange={handleInputChange} className="w-full px-5 py-3 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-yellow-400 outline-none font-bold" placeholder="••••••••" />
                </div>
              </div>

              {/* RESIDENT FIELDS */}
              {role === 'RESIDENT' && (
                <>
                  <div className="md:col-span-2 space-y-2">
                    <h3 className="text-sm font-black text-neutral-900 border-l-4 border-yellow-400 pl-3 uppercase tracking-tighter mb-4">
                      Resident Personal Details
                    </h3>
                    <label className="text-xs font-black text-neutral-400 uppercase">Full Name</label>
                    <input name="full_name" type="text" value={formData.full_name} required onChange={handleInputChange} className="w-full px-5 py-3 bg-neutral-50 border rounded-xl font-bold" placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-neutral-400 uppercase flex items-center gap-2"><Phone size={14}/> Mobile No</label>
                    <input name="mobile_no" type="text" value={formData.mobile_no} required onChange={handleInputChange} className="w-full px-5 py-3 bg-neutral-50 border rounded-xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-neutral-400 uppercase flex items-center gap-2"><MapPin size={14}/> Block</label>
                    <input name="block" type="text" value={formData.block} required onChange={handleInputChange} className="w-full px-5 py-3 bg-neutral-50 border rounded-xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-neutral-400 uppercase flex items-center gap-2"><Hash size={14}/> Flat Number</label>
                    <input name="flat_no" type="text" value={formData.flat_no} required onChange={handleInputChange} className="w-full px-5 py-3 bg-neutral-50 border rounded-xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-neutral-400 uppercase flex items-center gap-2"><Users size={14}/> Family Members</label>
                    <input name="family_members" type="number" value={formData.family_members} onChange={handleInputChange} className="w-full px-5 py-3 bg-neutral-50 border rounded-xl font-bold" />
                  </div>
                </>
              )}

              {/* SUPPLIER FIELDS */}
              {role === 'SUPPLIER' && (
                <>
                  <div className="md:col-span-2 space-y-4">
                    <h3 className="text-sm font-black text-neutral-900 border-l-4 border-yellow-400 pl-3 uppercase tracking-tighter">Company Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-neutral-400 uppercase">Company Name</label>
                            <input name="company_name" type="text" value={formData.company_name} required onChange={handleInputChange} className="w-full px-4 py-3 bg-neutral-50 border rounded-xl font-bold text-sm" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-neutral-400 uppercase">Contact Person</label>
                            <input name="contact_person_name" type="text" value={formData.contact_person_name} required onChange={handleInputChange} className="w-full px-4 py-3 bg-neutral-50 border rounded-xl font-bold text-sm" />
                        </div>
                        <div className="md:col-span-2 space-y-1">
                            <label className="text-[10px] font-black text-neutral-400 uppercase">Registered Address</label>
                            <input name="registered_address" type="text" value={formData.registered_address} onChange={handleInputChange} className="w-full px-4 py-3 bg-neutral-50 border rounded-xl font-bold text-sm" />
                        </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-4">
                    <h3 className="text-sm font-black text-neutral-900 border-l-4 border-yellow-400 pl-3 uppercase tracking-tighter">Tax & Banking</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1"><label className="text-[10px] font-black text-neutral-400 uppercase">PAN</label><input name="pan" value={formData.pan} onChange={handleInputChange} className="w-full px-4 py-3 bg-neutral-50 border rounded-xl font-bold text-sm" /></div>
                        <div className="space-y-1"><label className="text-[10px] font-black text-neutral-400 uppercase">GSTIN</label><input name="gstin" value={formData.gstin} onChange={handleInputChange} className="w-full px-4 py-3 bg-neutral-50 border rounded-xl font-bold text-sm" /></div>
                        <div className="md:col-span-2 space-y-1"><label className="text-[10px] font-black text-neutral-400 uppercase">Bank Account</label><input name="bank_account_no" value={formData.bank_account_no} onChange={handleInputChange} className="w-full px-4 py-3 bg-neutral-50 border rounded-xl font-bold text-sm" /></div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button type="submit" disabled={loading} className="w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 bg-neutral-900 text-white hover:bg-black">
              {loading ? <Loader2 className="animate-spin" /> : <UserPlus />} 
              {loading ? "Processing..." : `Register ${role} Profile`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminRegisterUser;