import React, { useState } from 'react';
import { 
  Building2, Mail, Lock, Phone, FileText, Landmark, 
  Briefcase, CheckCircle2, ArrowRight, ArrowLeft, Upload, ShieldCheck, Key
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
    email: '', 
    otp: '', 
    password: '', 
    company_name: '', 
    registered_address: '',
    pan: '', 
    gstin: '', 
    cin: '', 
    contact_person_name: '', 
    contact_phone: '',
    bank_account_no: '', 
    ifsc_code: '', 
    bank_name: '', 
    categories: []
  });

  const [files, setFiles] = useState({
    cancelled_cheque: null,
    license: null,
    affidavit: null
  });

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
      const updated = current.includes(cat)
        ? current.filter(c => c !== cat)
        : [...current, cat];
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
    
    // Append all text fields
    Object.keys(formData).forEach(key => {
      if(key === 'categories') {
        data.append('categories', JSON.stringify(formData.categories));
      } else {
        data.append(key, formData[key]);
      }
    });
    
    // Append files
    if (files.cancelled_cheque) data.append('cancelled_cheque', files.cancelled_cheque); 
    if (files.license) data.append('license', files.license); 
    if (files.affidavit) data.append('affidavit', files.affidavit);

    try {
      const response = await authAPI.registerSupplier(data);
      setMessage({ type: 'success', text: response.data.message });
      setStep(4); // Success Step
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || "Registration failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Header />
      <main className="flex-grow pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          
          {/* Progress Bar */}
          <div className="flex justify-between mb-12 relative px-10">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-neutral-200 -translate-y-1/2 z-0"></div>
            {[0, 1, 2, 3].map((num) => (
              <div key={num} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-500 ${
                step >= num ? 'bg-neutral-900 text-yellow-400 scale-110 shadow-lg' : 'bg-neutral-200 text-neutral-500'
              }`}>
                {step > num ? <CheckCircle2 className="w-6 h-6" /> : num + 1}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-[3rem] p-8 md:p-16 shadow-2xl border border-neutral-100">
            {message.text && step !== 4 && (
              <div className={`${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'} p-4 rounded-2xl mb-6 font-bold text-center`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* STEP 0: OTP */}
              {step === 0 && (
                <div className="animate-in fade-in duration-500 text-center">
                  <h2 className="text-4xl font-black text-neutral-900 mb-2 tracking-tighter">Security Verification</h2>
                  <p className="text-neutral-500 font-bold mb-8">Verify your official email to begin registration.</p>
                  <div className="max-w-md mx-auto space-y-6">
                    <div className="flex gap-2 items-end">
                      <div className="flex-grow">
                        <InputField icon={Mail} label="Official Email" name="email" type="email" placeholder="info@company.com" value={formData.email} onChange={handleInputChange} disabled={otpSent} />
                      </div>
                      {!otpSent && (
                        <button type="button" onClick={handleSendOTP} disabled={loading} className="mb-1 px-6 py-4 bg-neutral-900 text-white rounded-2xl font-bold hover:bg-neutral-800 disabled:opacity-50 h-[60px]">
                           {loading ? '...' : 'Send OTP'}
                        </button>
                      )}
                    </div>
                    {otpSent && (
                      <div className="animate-in slide-in-from-top-4">
                        <InputField icon={Key} label="Enter 6-Digit OTP" name="otp" placeholder="123456" value={formData.otp} onChange={handleInputChange} maxLength={6} />
                        <button type="button" onClick={nextStep} className="mt-6 w-full bg-yellow-400 text-neutral-900 py-5 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-yellow-500 transition-all shadow-xl">
                          Verify & Continue <ArrowRight className="w-5 h-5" />
                        </button>
                        <button type="button" onClick={() => setOtpSent(false)} className="mt-4 w-full text-neutral-400 font-bold text-sm">Change Email Address</button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 1: COMPANY BASICS */}
              {step === 1 && (
                <div className="animate-in slide-in-from-right-4 duration-500">
                  <h2 className="text-4xl font-black text-neutral-900 mb-2 tracking-tighter">Company Basics</h2>
                  <div className="grid md:grid-cols-2 gap-6 mt-8">
                    <InputField icon={Lock} label="Set Password *" name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleInputChange} />
                    <InputField icon={Building2} label="Company Name *" name="company_name" placeholder="Legal Name" value={formData.company_name} onChange={handleInputChange} />
                    <InputField icon={Phone} label="Contact Phone *" name="contact_phone" placeholder="10-digit number" value={formData.contact_phone} onChange={handleInputChange} />
                    <div className="md:col-span-2">
                      <InputField icon={FileText} label="Registered Address *" name="registered_address" placeholder="Full Address" value={formData.registered_address} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="flex gap-4 mt-10">
                    <button type="button" onClick={prevStep} className="w-1/3 bg-neutral-100 text-neutral-900 py-5 rounded-2xl font-black flex items-center justify-center gap-2">
                        <ArrowLeft className="w-5 h-5" /> Back
                    </button>
                    <button type="button" onClick={nextStep} className="flex-grow bg-neutral-900 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-neutral-800 shadow-xl">
                        Next: Statutory <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: STATUTORY & CATEGORIES */}
              {step === 2 && (
                <div className="animate-in slide-in-from-right-4 duration-500">
                  <h2 className="text-4xl font-black text-neutral-900 mb-2 tracking-tighter">Statutory Info</h2>
                  <div className="grid md:grid-cols-2 gap-6 mt-8">
                    <InputField icon={Briefcase} label="PAN Number *" name="pan" placeholder="ABCDE1234F" value={formData.pan} onChange={handleInputChange} />
                    <InputField icon={ShieldCheck} label="GSTIN" name="gstin" placeholder="22AAAAA0000A1Z5" value={formData.gstin} onChange={handleInputChange} />
                    <InputField icon={Building2} label="CIN" name="cin" placeholder="U12345MH2023PTC123456" value={formData.cin} onChange={handleInputChange} />
                    <InputField icon={Briefcase} label="Contact Person *" name="contact_person_name" placeholder="John Doe" value={formData.contact_person_name} onChange={handleInputChange} />
                  </div>

                  <div className="mt-8">
                    <label className="text-xs font-black uppercase tracking-widest text-neutral-400 ml-1">Business Categories *</label>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          className={`px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all ${
                            formData.categories.includes(cat)
                              ? 'bg-neutral-900 border-neutral-900 text-yellow-400 shadow-md'
                              : 'bg-white border-neutral-200 text-neutral-500 hover:border-yellow-400'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4 mt-10">
                    <button type="button" onClick={prevStep} className="w-1/3 bg-neutral-100 text-neutral-900 py-5 rounded-2xl font-black flex items-center justify-center gap-2">
                        <ArrowLeft className="w-5 h-5" /> Back
                    </button>
                    <button type="button" onClick={nextStep} className="flex-grow bg-neutral-900 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-neutral-800 shadow-xl">
                        Next: Banking <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: BANKING & DOCUMENTS */}
              {step === 3 && (
                <div className="animate-in slide-in-from-right-4 duration-500">
                  <h2 className="text-4xl font-black text-neutral-900 mb-2 tracking-tighter">Banking & Docs</h2>
                  <div className="grid md:grid-cols-2 gap-6 mt-8">
                    <InputField icon={Landmark} label="Bank Name *" name="bank_name" placeholder="HDFC Bank" value={formData.bank_name} onChange={handleInputChange} />
                    <InputField icon={FileText} label="Account Number *" name="bank_account_no" placeholder="50100..." value={formData.bank_account_no} onChange={handleInputChange} />
                    <InputField icon={ShieldCheck} label="IFSC Code *" name="ifsc_code" placeholder="HDFC0000..." value={formData.ifsc_code} onChange={handleInputChange} />
                    <div className="md:col-span-2 grid md:grid-cols-3 gap-4">
                      <FileUpload label="Cancelled Cheque *" name="cancelled_cheque" fileName={files.cancelled_cheque?.name} onChange={handleFileChange} />
                      <FileUpload label="Trade License" name="license" fileName={files.license?.name} onChange={handleFileChange} />
                      <FileUpload label="Affidavit" name="affidavit" fileName={files.affidavit?.name} onChange={handleFileChange} />
                    </div>
                  </div>
                  <div className="flex gap-4 mt-10">
                    <button type="button" onClick={prevStep} className="w-1/3 bg-neutral-100 text-neutral-900 py-5 rounded-2xl font-black flex items-center justify-center gap-2">
                      <ArrowLeft className="w-5 h-5" /> Back
                    </button>
                    <button type="submit" disabled={loading} className="flex-grow bg-yellow-400 text-neutral-900 py-5 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-yellow-500 shadow-xl disabled:opacity-50">
                      {loading ? 'Processing...' : 'Submit Registration'} <CheckCircle2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* SUCCESS STATE */}
              {step === 4 && (
                <div className="text-center py-10 animate-in zoom-in duration-500">
                  <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <h2 className="text-4xl font-black text-neutral-900 mb-4">Registration Sent!</h2>
                  <p className="text-neutral-500 font-bold max-w-md mx-auto mb-8">
                    Your profile has been submitted for verification. We will notify you via email once approved.
                  </p>
                  <button type="button" onClick={() => window.location.href = '/'} className="bg-neutral-900 text-white px-10 py-4 rounded-2xl font-black hover:bg-neutral-800 shadow-lg">
                    Back to Home
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function InputField({ icon: Icon, label, placeholder, ...props }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-black uppercase tracking-widest text-neutral-400 ml-1">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-4 top-4 w-5 h-5 text-neutral-300" />}
        <input 
          {...props} 
          placeholder={placeholder}
          className={`w-full ${Icon ? 'pl-12' : 'pl-6'} pr-4 py-4 bg-neutral-50 border-none rounded-2xl focus:ring-2 focus:ring-yellow-400 font-bold transition-all placeholder:text-neutral-300 disabled:opacity-50`}
        />
      </div>
    </div>
  );
}

function FileUpload({ label, name, fileName, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-black uppercase tracking-widest text-neutral-400 ml-1">{label}</label>
      <label className={`border-2 border-dashed rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all ${fileName ? 'border-green-400 bg-green-50' : 'border-neutral-200 hover:border-yellow-400'}`}>
        <div className={`p-2 rounded-lg ${fileName ? 'bg-green-100' : 'bg-neutral-100'}`}>
          <Upload className={`w-5 h-5 ${fileName ? 'text-green-600' : 'text-neutral-500'}`} />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm">{fileName ? 'File Selected' : 'Choose PDF'}</span>
          {fileName && <span className="text-xs text-green-600 truncate max-w-[150px]">{fileName}</span>}
        </div>
        <input type="file" name={name} className="hidden" onChange={onChange} accept=".pdf,image/*" />
      </label>
    </div>
  );
}