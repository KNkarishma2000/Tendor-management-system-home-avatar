import React, { useState } from 'react';
import { 
  Building2, Mail, Lock, Phone, FileText, Landmark, 
  Briefcase, CheckCircle2, ArrowRight, ArrowLeft, Upload, ShieldCheck
} from 'lucide-react';
import { authAPI } from '../../api/auth.service'; // Importing the API service we built
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function RegisterSupplier() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    email: '', password: '', company_name: '', registered_address: '',
    pan: '', gstin: '', cin: '', contact_person_name: '', contact_phone: '',
    bank_account_no: '', ifsc_code: '', bank_name: '', categories: []
  });

  const [files, setFiles] = useState({
    cancelled_cheque: null,
    pan_card: null,
    gst_cert: null
  });

  const CATEGORIES = ['Construction', 'Plumbing', 'Electrical', 'Security', 'Landscaping', 'Housekeeping', 'IT Services'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFiles({ ...files, [e.target.name]: e.target.files[0] });
  };

  const toggleCategory = (cat) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(cat) 
        ? prev.categories.filter(c => c !== cat) 
        : [...prev.categories, cat]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Using FormData for Multi-part upload (important for files)
    const data = new FormData();
    Object.keys(formData).forEach(key => {
        if(key === 'categories') {
            formData.categories.forEach(cat => data.append('categories', cat));
        } else {
            data.append(key, formData[key]);
        }
    });
    
    // Append files
    if (files.cancelled_cheque) data.append('cancelled_cheque', files.cancelled_cheque);
    if (files.pan_card) data.append('pan_card', files.pan_card);
    if (files.gst_cert) data.append('gst_cert', files.gst_cert);

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

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Header />
      
      <main className="flex-grow pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          
          {/* Progress Bar */}
          <div className="flex justify-between mb-12 relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-neutral-200 -translate-y-1/2 z-0"></div>
            {[1, 2, 3].map((num) => (
              <div key={num} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-500 ${
                step >= num ? 'bg-neutral-900 text-yellow-400 scale-110' : 'bg-neutral-200 text-neutral-500'
              }`}>
                {step > num ? <CheckCircle2 className="w-6 h-6" /> : num}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-[3rem] p-8 md:p-16 shadow-2xl border border-neutral-100">
            {message.text && step !== 4 && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 font-bold text-center">
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* STEP 1: ACCOUNT & COMPANY */}
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h2 className="text-4xl font-black text-neutral-900 mb-2">Company Details</h2>
                  <p className="text-neutral-500 font-bold mb-8">Basic identification and login credentials.</p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <InputField icon={Mail} label="Official Email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
                    <InputField icon={Lock} label="Password" name="password" type="password" value={formData.password} onChange={handleInputChange} />
                    <InputField icon={Building2} label="Company Name" name="company_name" value={formData.company_name} onChange={handleInputChange} />
                    <InputField icon={Phone} label="Contact Phone" name="contact_phone" value={formData.contact_phone} onChange={handleInputChange} />
                    <div className="md:col-span-2">
                        <InputField icon={FileText} label="Registered Address" name="registered_address" value={formData.registered_address} onChange={handleInputChange} />
                    </div>
                  </div>
                  <button type="button" onClick={nextStep} className="mt-10 w-full bg-neutral-900 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all">
                    Next: Statutory Info <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* STEP 2: TAX & BANKING */}
              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <h2 className="text-4xl font-black text-neutral-900 mb-2">Tax & Banking</h2>
                  <p className="text-neutral-500 font-bold mb-8">Verification for financial compliance.</p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <InputField label="PAN Number" name="pan" value={formData.pan} onChange={handleInputChange} />
                    <InputField label="GSTIN" name="gstin" value={formData.gstin} onChange={handleInputChange} />
                    <InputField label="Bank Name" name="bank_name" value={formData.bank_name} onChange={handleInputChange} />
                    <InputField label="IFSC Code" name="ifsc_code" value={formData.ifsc_code} onChange={handleInputChange} />
                    <div className="md:col-span-2">
                        <InputField label="Bank Account Number" name="bank_account_no" value={formData.bank_account_no} onChange={handleInputChange} />
                    </div>
                  </div>

                  <div className="flex gap-4 mt-10">
                    <button type="button" onClick={prevStep} className="flex-1 border-2 border-neutral-900 py-5 rounded-2xl font-black flex items-center justify-center gap-2">
                       <ArrowLeft className="w-5 h-5" /> Back
                    </button>
                    <button type="button" onClick={nextStep} className="flex-[2] bg-neutral-900 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all">
                      Next: Documents <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: DOCUMENTS & CATEGORY */}
              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <h2 className="text-4xl font-black text-neutral-900 mb-2">Final Submission</h2>
                  <p className="text-neutral-500 font-bold mb-8">Upload documents and select service categories.</p>

                  <label className="block text-sm font-black uppercase tracking-widest mb-4">Service Categories</label>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {CATEGORIES.map(cat => (
                      <button 
                        key={cat} type="button" onClick={() => toggleCategory(cat)}
                        className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${
                          formData.categories.includes(cat) ? 'bg-yellow-400 text-neutral-900 ring-2 ring-neutral-900' : 'bg-neutral-100 text-neutral-500'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4 mb-10">
                    <FileUpload label="Cancelled Cheque (Required)" name="cancelled_cheque" onChange={handleFileChange} />
                    <FileUpload label="PAN Card PDF" name="pan_card" onChange={handleFileChange} />
                  </div>

                  <button type="submit" disabled={loading} className="w-full bg-yellow-400 text-neutral-900 py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:bg-yellow-500 transition-all shadow-lg shadow-yellow-200">
                    {loading ? "Uploading Profile..." : "Complete Registration"} 
                    <ShieldCheck className="w-6 h-6" />
                  </button>
                </div>
              )}

              {/* STEP 4: SUCCESS */}
              {step === 4 && (
                <div className="text-center py-10 animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <h2 className="text-4xl font-black text-neutral-900 mb-4">Application Submitted!</h2>
                    <p className="text-neutral-500 font-bold max-w-md mx-auto leading-relaxed">
                        Your profile is now under review by the My Home Avatar Admin committee. You will receive an email once your account is verified.
                    </p>
                    <button type="button" onClick={() => window.location.href = '/'} className="mt-10 bg-neutral-900 text-white px-12 py-4 rounded-full font-black">
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

// Helper UI Components
function InputField({ icon: Icon, label, ...props }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-black uppercase tracking-widest text-neutral-400 ml-1">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-4 top-4 w-5 h-5 text-neutral-300" />}
        <input 
          {...props} 
          className={`w-full ${Icon ? 'pl-12' : 'pl-6'} pr-4 py-4 bg-neutral-50 border-none rounded-2xl focus:ring-2 focus:ring-yellow-400 font-bold transition-all`}
        />
      </div>
    </div>
  );
}

function FileUpload({ label, name, onChange }) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase tracking-widest text-neutral-400 ml-1">{label}</label>
            <label className="border-2 border-dashed border-neutral-200 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:border-yellow-400 hover:bg-yellow-50 transition-all">
                <div className="bg-neutral-100 p-2 rounded-lg"><Upload className="w-5 h-5 text-neutral-500" /></div>
                <span className="font-bold text-neutral-500 text-sm">Choose PDF or Image</span>
                <input type="file" name={name} className="hidden" onChange={onChange} accept=".pdf,image/*" />
            </label>
        </div>
    );
}