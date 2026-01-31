import React, { useState } from 'react';
import { 
  Building2, Mail, Lock, Phone, FileText, Landmark, 
  Briefcase, CheckCircle2, ArrowRight, ArrowLeft, Upload, ShieldCheck, Key, Sparkles, User
} from 'lucide-react';
import { authAPI } from '../../api/auth.service';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function RegisterSupplier() {
  const [step, setStep] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    email: '', otp: '', password: '', company_name: '', registered_address: '',
    pan: '', gstin: '', cin: '', contact_person_name: '', contact_phone: '',
    bank_account_no: '', ifsc_code: '', bank_name: '', categories: []
  });

  const [files, setFiles] = useState({ cancelled_cheque: null, license: null, affidavit: null });

  const CATEGORIES = ['Construction', 'Plumbing', 'Electrical', 'Security', 'Landscaping', 'Housekeeping', 'IT Services'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (message.type === 'error') setMessage({ type: '', text: '' });
  };

  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] });
  };

  const toggleCategory = (cat) => {
    setFormData(prev => {
      const current = prev.categories;
      const updated = current.includes(cat) ? current.filter(c => c !== cat) : [...current, cat];
      return { ...prev, categories: updated };
    });
  };

  const handleSendOTP = async () => {
    if (!formData.email.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid official email.' });
      return;
    }
    setLoading(true);
    try {
      await authAPI.sendSupplierOTP({ email: formData.email });
      setOtpSent(true);
      setMessage({ type: 'success', text: 'Verification code sent to your email.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || "Failed to send OTP." });
    } finally {
      setLoading(false);
    }
  };

  const validateStep = () => {
    if (step === 0) {
      if (!formData.otp || formData.otp.length < 6) {
        setMessage({ type: 'error', text: 'Valid 6-digit verification code is required.' });
        return false;
      }
    }
    if (step === 1) {
      if (!formData.password || !formData.company_name || !formData.contact_phone) {
        setMessage({ type: 'error', text: 'Company basics are mandatory.' });
        return false;
      }
    }
    if (step === 2) {
      if (!formData.pan || !formData.contact_person_name || formData.categories.length === 0) {
        setMessage({ type: 'error', text: 'PAN, Contact Person, and at least one Category required.' });
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setMessage({ type: '', text: '' });
      setStep(s => s + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setMessage({ type: '', text: '' });
    setStep(s => s - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.bank_account_no || !files.cancelled_cheque) {
      setMessage({ type: 'error', text: 'Bank details and Cancelled Cheque are required.' });
      return;
    }

    setLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if(key === 'categories') data.append('categories', JSON.stringify(formData.categories));
      else data.append(key, formData[key]);
    });
    if (files.cancelled_cheque) data.append('cancelled_cheque', files.cancelled_cheque); 
    if (files.license) data.append('license', files.license); 
    if (files.affidavit) data.append('affidavit', files.affidavit);

    try {
      const response = await authAPI.registerSupplier(data);
      setMessage({ type: 'success', text: response.data.message });
      setStep(4);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || "Registration failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#fbfbfb] min-h-screen">
      <Header />
      
      <main className="flex-grow pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          
          {/* STEP INDICATOR - LUXE VERSION */}
          <div className="mb-16">
            <div className="flex justify-between items-center max-w-2xl mx-auto relative">
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gray-200 -translate-y-1/2 z-0"></div>
              {[0, 1, 2, 3].map((num) => (
                <div key={num} className="relative z-10 flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-700 ${
                    step >= num ? 'bg-[#1f1b16] text-[#a88d5e] ring-4 ring-white shadow-xl' : 'bg-gray-200 text-gray-500 ring-4 ring-[#fbfbfb]'
                  }`}>
                    {step > num ? <CheckCircle2 className="w-4 h-4" /> : num + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl shadow-[#1f1b16]/5 border border-gray-100 min-h-[600px] flex flex-col md:flex-row">
            
            {/* SIDEBAR INFO */}
            <div className="md:w-1/3 bg-[#1f1b16] p-12 text-white">
                <Sparkles className="text-[#a88d5e] mb-6 w-6 h-6" />
                <h3 className="text-2xl font-serif italic mb-6">Partner Onboarding</h3>
                <p className="text-gray-400 text-xs leading-relaxed font-serif italic mb-10">
                  Provide your statutory and banking details to participate in the Avatar community tenders.
                </p>
                <div className="space-y-4">
                    <div className={`flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest transition-opacity ${step === 0 ? 'opacity-100 text-[#a88d5e]' : 'opacity-30'}`}>
                        <ShieldCheck size={14} /> Identity Verification
                    </div>
                    <div className={`flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest transition-opacity ${step === 1 ? 'opacity-100 text-[#a88d5e]' : 'opacity-30'}`}>
                        <Building2 size={14} /> Company Profile
                    </div>
                    <div className={`flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest transition-opacity ${step === 2 ? 'opacity-100 text-[#a88d5e]' : 'opacity-30'}`}>
                        <FileText size={14} /> Statutory & Bidding
                    </div>
                    <div className={`flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest transition-opacity ${step === 3 ? 'opacity-100 text-[#a88d5e]' : 'opacity-30'}`}>
                        <Landmark size={14} /> Financial Records
                    </div>
                </div>
            </div>

            {/* FORM CONTENT */}
            <div className="flex-grow p-8 md:p-16">
              {message.text && step !== 4 && (
                <div className={`${message.type === 'error' ? 'bg-red-50 text-red-900 border-red-200' : 'bg-green-50 text-green-900 border-green-200'} p-4 rounded border text-[10px] font-bold uppercase tracking-widest mb-8 animate-in fade-in slide-in-from-top-2`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* STEP 0: OTP */}
                {step === 0 && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <h2 className="text-3xl font-serif text-[#1f1b16] mb-8 uppercase tracking-tight">Security Access</h2>
                    <div className="space-y-8 max-w-md">
                      <div className="flex gap-4 items-end">
                        <div className="flex-grow">
                          <InputField icon={Mail} label="Corporate Email" name="email" type="email" placeholder="partners@company.com" value={formData.email} onChange={handleInputChange} disabled={otpSent} />
                        </div>
                        {!otpSent && (
                          <button type="button" onClick={handleSendOTP} disabled={loading} className="px-6 py-4 bg-[#1f1b16] text-[#a88d5e] text-[10px] font-bold uppercase tracking-widest hover:bg-[#a88d5e] hover:text-[#1f1b16] transition-all disabled:opacity-50 h-[52px]">
                             {loading ? '...' : 'Verify'}
                          </button>
                        )}
                      </div>
                      {otpSent && (
                        <div className="animate-in slide-in-from-top-4">
                          <InputField icon={Key} label="Verification Code" name="otp" placeholder="Enter 6-digit OTP" value={formData.otp} onChange={handleInputChange} maxLength={6} />
                          <button type="button" onClick={nextStep} className="mt-10 w-full bg-[#1f1b16] text-[#a88d5e] py-5 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-[#a88d5e] hover:text-[#1f1b16] transition-all shadow-xl shadow-[#1f1b16]/10">
                            Continue to Profile <ArrowRight className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => setOtpSent(false)} className="mt-4 w-full text-gray-400 font-bold text-[9px] uppercase tracking-widest hover:text-[#1f1b16] transition-colors">Change Email</button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 1: COMPANY BASICS */}
                {step === 1 && (
                  <div className="animate-in slide-in-from-right-4 duration-500">
                    <h2 className="text-3xl font-serif text-[#1f1b16] mb-8 uppercase tracking-tight">Company Profile</h2>
                    <div className="grid md:grid-cols-2 gap-x-12 gap-y-8 mt-8">
                      <InputField icon={Lock} label="System Password *" name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleInputChange} />
                      <InputField icon={Building2} label="Registered Company Name *" name="company_name" placeholder="Legal Entity Name" value={formData.company_name} onChange={handleInputChange} />
                      <InputField icon={Phone} label="Corporate Phone *" name="contact_phone" placeholder="+1..." value={formData.contact_phone} onChange={handleInputChange} />
                      <div className="md:col-span-2">
                        <InputField icon={FileText} label="Primary Business Address *" name="registered_address" placeholder="Full Registered HQ Address" value={formData.registered_address} onChange={handleInputChange} />
                      </div>
                    </div>
                    <div className="flex gap-4 mt-16 pt-8 border-t border-gray-50">
                      <button type="button" onClick={prevStep} className="px-8 py-5 text-gray-400 hover:text-[#1f1b16] text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors">
                          <ArrowLeft className="w-4 h-4" /> Back
                      </button>
                      <button type="button" onClick={nextStep} className="flex-grow bg-[#1f1b16] text-[#a88d5e] py-5 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-[#a88d5e] hover:text-[#1f1b16] transition-all">
                          Next: Statutory <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: STATUTORY & CATEGORIES */}
                {step === 2 && (
                  <div className="animate-in slide-in-from-right-4 duration-500">
                    <h2 className="text-3xl font-serif text-[#1f1b16] mb-8 uppercase tracking-tight">Statutory Data</h2>
                    <div className="grid md:grid-cols-2 gap-x-12 gap-y-8 mt-8">
                      <InputField icon={Briefcase} label="PAN Number *" name="pan" placeholder="ABCDE1234F" value={formData.pan} onChange={handleInputChange} />
                      <InputField icon={ShieldCheck} label="GSTIN" name="gstin" placeholder="22AAAAA0000A1Z5" value={formData.gstin} onChange={handleInputChange} />
                      <InputField icon={Building2} label="Corporate Identity (CIN)" name="cin" placeholder="U1234..." value={formData.cin} onChange={handleInputChange} />
                      <InputField icon={User} label="Authorized Liaison *" name="contact_person_name" placeholder="Lead Representative" value={formData.contact_person_name} onChange={handleInputChange} />
                    </div>

                    <div className="mt-12">
                      <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 block mb-4">Trade Specializations *</label>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat} type="button" onClick={() => toggleCategory(cat)}
                            className={`px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
                              formData.categories.includes(cat)
                                ? 'bg-[#1f1b16] border-[#1f1b16] text-[#a88d5e] shadow-lg shadow-[#1f1b16]/20'
                                : 'bg-white border-gray-100 text-gray-400 hover:border-[#a88d5e] hover:text-[#a88d5e]'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4 mt-16 pt-8 border-t border-gray-50">
                      <button type="button" onClick={prevStep} className="px-8 py-5 text-gray-400 hover:text-[#1f1b16] text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors">
                          <ArrowLeft className="w-4 h-4" /> Back
                      </button>
                      <button type="button" onClick={nextStep} className="flex-grow bg-[#1f1b16] text-[#a88d5e] py-5 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-[#a88d5e] hover:text-[#1f1b16] transition-all">
                          Next: Financials <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: BANKING & DOCUMENTS */}
                {step === 3 && (
                  <div className="animate-in slide-in-from-right-4 duration-500">
                    <h2 className="text-3xl font-serif text-[#1f1b16] mb-8 uppercase tracking-tight">Financial Records</h2>
                    <div className="grid md:grid-cols-2 gap-x-12 gap-y-8 mt-8">
                      <InputField icon={Landmark} label="Bank Name *" name="bank_name" placeholder="Financial Institution" value={formData.bank_name} onChange={handleInputChange} />
                      <InputField icon={FileText} label="Current Account Number *" name="bank_account_no" placeholder="000000000000" value={formData.bank_account_no} onChange={handleInputChange} />
                      <div className="md:col-span-2 grid md:grid-cols-3 gap-6 pt-4">
                        <FileUpload label="Cancelled Cheque *" name="cancelled_cheque" fileName={files.cancelled_cheque?.name} onChange={handleFileChange} />
                        <FileUpload label="Trade License" name="license" fileName={files.license?.name} onChange={handleFileChange} />
                        <FileUpload label="Affidavit" name="affidavit" fileName={files.affidavit?.name} onChange={handleFileChange} />
                      </div>
                    </div>
                    <div className="flex gap-4 mt-16 pt-8 border-t border-gray-50">
                      <button type="button" onClick={prevStep} className="px-8 py-5 text-gray-400 hover:text-[#1f1b16] text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back
                      </button>
                      <button type="submit" disabled={loading} className="flex-grow bg-[#a88d5e] text-[#1f1b16] py-5 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-[#1f1b16] hover:text-[#a88d5e] transition-all shadow-xl shadow-[#a88d5e]/20 disabled:opacity-50">
                        {loading ? 'Processing...' : 'Finalize Registration'} <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* SUCCESS STATE */}
                {step === 4 && (
                  <div className="text-center py-10 animate-in zoom-in duration-700">
                    <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-100">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h2 className="text-4xl font-serif text-[#1f1b16] mb-4 uppercase tracking-tight">Application Filed</h2>
                    <p className="text-gray-500 font-serif italic max-w-sm mx-auto mb-12">
                      Your vendor credentials have been submitted for review. Expect an approval confirmation via email within 48 business hours.
                    </p>
                    <button type="button" onClick={() => window.location.href = '/'} className="bg-[#1f1b16] text-[#a88d5e] px-12 py-5 text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-[#a88d5e] hover:text-[#1f1b16] transition-all shadow-2xl">
                      Return to Gateway
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// STYLED INPUT COMPONENT
function InputField({ icon: Icon, label, placeholder, ...props }) {
  return (
    <div className="space-y-1">
      <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 ml-1">{label}</label>
      <div className="relative group">
        {Icon && <Icon className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a88d5e] group-focus-within:text-[#1f1b16] transition-colors" />}
        <input 
          {...props} 
          placeholder={placeholder}
          className={`w-full ${Icon ? 'pl-8' : 'pl-0'} pr-4 py-3 border-b border-gray-100 font-serif text-lg focus:outline-none focus:border-[#a88d5e] transition-all placeholder:text-gray-200 disabled:opacity-30`}
        />
      </div>
    </div>
  );
}

// STYLED FILE UPLOAD COMPONENT
function FileUpload({ label, name, fileName, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 ml-1">{label}</label>
      <label className={`border border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all min-h-[120px] text-center ${fileName ? 'border-green-400 bg-green-50/30' : 'border-gray-200 hover:border-[#a88d5e] hover:bg-gray-50'}`}>
        <div className={`p-2 rounded-full ${fileName ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-[#a88d5e]'}`}>
          <Upload className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-[10px] uppercase tracking-tighter">{fileName ? 'File Ready' : 'Upload PDF'}</span>
          {fileName && <span className="text-[9px] text-green-700 truncate max-w-[120px] mt-1 italic">{fileName}</span>}
        </div>
        <input type="file" name={name} className="hidden" onChange={onChange} accept=".pdf,image/*" />
      </label>
    </div>
  );
}