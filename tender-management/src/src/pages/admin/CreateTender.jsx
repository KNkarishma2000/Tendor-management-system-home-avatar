import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, IndianRupee, Calendar, 
  ShieldCheck, FileText, ChevronRight, 
  ChevronLeft, CheckCircle2, Loader2,
  Upload, File, X, AlertCircle
} from 'lucide-react';
import { tenderAdminAPI } from '../../api/auth.service';
import toast from 'react-hot-toast';

export default function CreateTender() {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEditMode);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);

  const getUserId = () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return null;
      const user = JSON.parse(storedUser);
      return user?.id || user?.user?.id || null;
    } catch (error) {
      return null;
    }
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scope_of_work: '',
    quantity: 1,
    created_by: getUserId(), 
    budget_estimate: '',
    emd_amount: '',
    price_weightage: '',
    technical_weightage: '',
    min_experience_years: '',
    min_turnover: '',
    required_certifications: '',
    submission_deadline: '',
    opening_date: '',
    clarification_deadline: '',
    delivery_timeline: '',
    bid_validity_days: '',
    penalty_clauses: '',
  });

  // --- STEP VALIDATION LOGIC ---
  const validateStep = (step) => {
    const fieldsByStep = {
      1: ['title', 'description', 'scope_of_work'],
      2: ['budget_estimate', 'emd_amount', 'price_weightage', 'technical_weightage'],
      3: ['min_experience_years', 'min_turnover'],
      4: ['clarification_deadline', 'submission_deadline', 'opening_date', 'delivery_timeline', 'bid_validity_days'],
      5: [] // Documents are usually optional or handled separately
    };

    const requiredFields = fieldsByStep[step];
    const missingFields = requiredFields.filter(field => {
      const value = formData[field];
      return value === undefined || value === null || value.toString().trim() === '';
    });

    if (missingFields.length > 0) {
      // Create a readable name for the toast
      const fieldNames = missingFields.map(f => f.replace(/_/g, ' ')).join(', ');
      toast.error(`Please fill all required fields: ${fieldNames}`, {
        icon: '🚫',
        style: { borderRadius: '10px', background: '#333', color: '#fff' }
      });
      return false;
    }

    // Logical check for weightage in Step 2
    if (step === 2) {
      const total = Number(formData.price_weightage) + Number(formData.technical_weightage);
      if (total !== 100) {
        toast.error("Price and Technical weightage must add up to 100%");
        return false;
      }
    }

    return true;
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  useEffect(() => {
    if (isEditMode) {
      const fetchTenderData = async () => {
        try {
          const res = await tenderAdminAPI.getTenderById(id);
          const t = res.data.data;
          setFormData({
            title: t.title || '',
            description: t.description || '',
            scope_of_work: t.scope_of_work || '',
            quantity: t.quantity || 1,
            created_by: t.created_by,
            budget_estimate: t.budget_estimate || '',
            emd_amount: t.emd_amount || '',
            price_weightage: t.price_weightage || '',
            technical_weightage: t.technical_weightage || '',
            delivery_timeline: t.delivery_timeline || '',
            bid_validity_days: t.bid_validity_days || '',
            penalty_clauses: t.penalty_clauses || '',
            submission_deadline: t.tender_timeline?.[0]?.submission_deadline?.split('T')[0] || '',
            opening_date: t.tender_timeline?.[0]?.opening_date?.split('T')[0] || '',
            clarification_deadline: t.tender_timeline?.[0]?.clarification_deadline?.split('T')[0] || '',
            min_experience_years: t.tender_eligibility_criteria?.[0]?.min_experience_years || '',
            min_turnover: t.tender_eligibility_criteria?.[0]?.min_turnover || '',
            required_certifications: t.tender_eligibility_criteria?.[0]?.required_certifications || '',
          });
          if (t.tender_documents) setExistingFiles(t.tender_documents);
        } catch (error) {
          toast.error("Could not load tender details.");
          navigate('/admin/tenders');
        } finally {
          setFetchingData(false);
        }
      };
      fetchTenderData();
    }
  }, [id, isEditMode, navigate]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Final validation for Step 5 or whole form
    if (!validateStep(currentStep)) return;

    if (!formData.created_by) {
        toast.error("Session expired. Please login again.");
        return;
    }

    setLoading(true);
    const toastId = toast.loading(isEditMode ? "Updating tender..." : "Publishing tender...");

    try {
        const finalData = new FormData();
        Object.keys(formData).forEach(key => {
            finalData.append(key, formData[key]);
        });
        finalData.append('status', 'PUBLISHED');
        
        attachedFiles.forEach((item) => {
            finalData.append('tender_documents', item.file);
            finalData.append('document_types', item.type); 
        });

        if (isEditMode) {
          await tenderAdminAPI.updateTender(id, finalData);
          toast.success("Tender Updated Successfully", { id: toastId });
        } else {
          await tenderAdminAPI.createTender(finalData);
          toast.success("Tender Published Successfully", { id: toastId });
        }
        
        setTimeout(() => navigate('/admin/tenders'), 1500);
    } catch (error) {
        toast.error(error.response?.data?.message || "Server connection failed", { id: toastId });
    } finally {
        setLoading(false);
    }
  };

  // ... (keeping your steps array and handleFile functions the same)
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => ({ file, type: 'TECHNICAL_SPEC', name: file.name }));
    setAttachedFiles(prev => [...prev, ...newFiles]);
  };
  const removeNewFile = (index) => setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  const updateFileType = (index, type) => {
    const updated = [...attachedFiles];
    updated[index].type = type;
    setAttachedFiles(updated);
  };

  const steps = [
    { id: 1, title: 'Basic Info', icon: <FileText size={16}/> },
    { id: 2, title: 'Financials', icon: <IndianRupee size={16}/> },
    { id: 3, title: 'Eligibility', icon: <ShieldCheck size={16}/> },
    { id: 4, title: 'Timeline', icon: <Calendar size={16}/> },
    { id: 5, title: 'Documents', icon: <Upload size={16}/> }
  ];

  if (fetchingData) return (
    <div className="flex h-screen items-center justify-center bg-[#FAFAFA]">
      <div className="text-center">
        <Loader2 className="animate-spin text-neutral-900 w-12 h-12 mx-auto mb-4" />
        <p className="font-black text-[10px] uppercase tracking-widest text-neutral-400">Loading Tender Data...</p>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-4xl mx-auto bg-[#FAFAFA] min-h-screen">
      {/* Header and Stepper remains same as your original */}
      <div className="flex justify-between items-center mb-8">
        <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 text-neutral-400 hover:text-black font-black text-[10px] uppercase tracking-widest transition-all">
          <ArrowLeft size={14} /> Back
        </button>
        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase italic ${isEditMode ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
          {isEditMode ? 'Edit Mode' : 'Drafting Mode'}
        </div>
      </div>

      <div className="flex items-center justify-between mb-12 bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm">
        {steps.map((step, idx) => (
          <React.Fragment key={step.id}>
            <div className={`flex items-center gap-3 ${currentStep >= step.id ? 'text-neutral-900' : 'text-neutral-300'}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs transition-all ${currentStep >= step.id ? 'bg-neutral-900 text-white shadow-lg shadow-neutral-200' : 'bg-neutral-100'}`}>
                {currentStep > step.id ? <CheckCircle2 size={16}/> : step.id}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">{step.title}</span>
            </div>
            {idx !== steps.length - 1 && <div className={`h-px flex-1 mx-4 ${currentStep > step.id ? 'bg-neutral-900' : 'bg-neutral-100'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white rounded-[3rem] p-12 border border-neutral-100 shadow-xl">
        <form onSubmit={handleSubmit}>
          
          {/* STEP 1 */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <SectionHeader title="Basic Project Details" subtitle="All fields are required." />
              <InputField label="Tender Title *" placeholder="Annual Maintenance Contract" value={formData.title} onChange={(v) => handleInputChange('title', v)} />
              <TextareaField label="Brief Description *" placeholder="Summarize objectives..." value={formData.description} onChange={(v) => handleInputChange('description', v)}  />
              <TextareaField label="Scope of Work *" placeholder="Detailed requirements..." value={formData.scope_of_work} onChange={(v) => handleInputChange('scope_of_work', v)}  />
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <SectionHeader title="Financial Parameters" subtitle="Specify budget and weightage (Total 100%)." />
              <div className="grid grid-cols-2 gap-6">
                <InputField label="Budget Estimate (₹) *" type="number" value={formData.budget_estimate} onChange={(v) => handleInputChange('budget_estimate', v)}   />
                <InputField label="EMD Amount (₹) *" type="number" value={formData.emd_amount} onChange={(v) => handleInputChange('emd_amount', v)}   />
                <InputField label="Price Weightage (%) *" type="number" value={formData.price_weightage} onChange={(v) => handleInputChange('price_weightage', v)}   />
                <InputField label="Technical Weightage (%) *" type="number" value={formData.technical_weightage} onChange={(v) => handleInputChange('technical_weightage', v)}   />
              </div>
              <TextareaField label="Penalty Clauses" placeholder="Optional penalty terms..." value={formData.penalty_clauses} onChange={(v) => handleInputChange('penalty_clauses', v)} />
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <SectionHeader title="Vendor Eligibility" subtitle="Define minimum criteria." />
              <div className="grid grid-cols-2 gap-6">
                <InputField label="Min. Experience (Years) *" type="number" value={formData.min_experience_years} onChange={(v) => handleInputChange('min_experience_years', v)}   />
                <InputField label="Min. Annual Turnover (₹) *" type="number" value={formData.min_turnover} onChange={(v) => handleInputChange('min_turnover', v)}   />
              </div>
              <InputField label="Required Certifications" value={formData.required_certifications} onChange={(v) => handleInputChange('required_certifications', v)} />
            </div>
          )}

          {/* STEP 4 */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <SectionHeader title="Timeline & Deadlines" subtitle="Finalize critical dates." />
              <div className="grid grid-cols-3 gap-4">
                <InputField label="Clarification Due *" type="date" value={formData.clarification_deadline} onChange={(v) => handleInputChange('clarification_deadline', v)}  />
                <InputField label="Submission Due *" type="date" value={formData.submission_deadline} onChange={(v) => handleInputChange('submission_deadline', v)}  />
                <InputField label="Opening Date *" type="date" value={formData.opening_date} onChange={(v) => handleInputChange('opening_date', v)}  />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <InputField label="Delivery Timeline (Days) *" type="number" value={formData.delivery_timeline} onChange={(v) => handleInputChange('delivery_timeline', v)} />
                <InputField label="Bid Validity (Days) *" type="number" value={formData.bid_validity_days} onChange={(v) => handleInputChange('bid_validity_days', v)}  />
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {currentStep === 5 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
               <SectionHeader title="Tender Documents" subtitle="Upload technical specifications (PDF Only)." />
               {/* ... (Your existing Document Upload UI) */}
               {isEditMode && existingFiles.length > 0 && (
                <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl mb-4">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <AlertCircle size={14}/> Currently Uploaded Files:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {existingFiles.map((file, i) => (
                      <span key={i} className="bg-white border border-blue-100 px-3 py-1.5 rounded-lg text-[10px] font-bold text-neutral-600 flex items-center gap-2">
                        <FileText size={12} className="text-blue-400"/> {file.file_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-4 border-dashed border-neutral-50 rounded-[2.5rem] p-12 text-center hover:border-neutral-200 transition-all">
                <input type="file" multiple accept=".pdf" id="file-upload" className="hidden" onChange={handleFileChange} />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                  <div className="w-16 h-16 bg-neutral-900 text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-neutral-200">
                    <Upload size={24} />
                  </div>
                  <h4 className="font-black text-neutral-800 uppercase tracking-widest text-xs">Browse New Documents</h4>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {attachedFiles.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-xl text-emerald-500 shadow-sm"><File size={20}/></div>
                      <div>
                        <p className="text-xs font-black text-neutral-800 truncate max-w-[250px]">{item.name}</p>
                        <select 
                          className="bg-transparent text-[10px] font-black uppercase text-neutral-400 outline-none mt-1"
                          value={item.type}
                          onChange={(e) => updateFileType(idx, e.target.value)}
                        >
                          <option value="TECHNICAL_SPEC">Technical Specification</option>
                          <option value="NIT_DOCUMENT">NIT Document</option>
                          <option value="FINANCIAL_DOC">Financial Template</option>
                        </select>
                      </div>
                    </div>
                    <button type="button" onClick={() => removeNewFile(idx)} className="p-2 text-neutral-300 hover:text-red-500 transition-colors"><X size={18} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-neutral-50">
            <button 
              type="button" 
              onClick={() => setCurrentStep(prev => prev - 1)}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'text-neutral-400 hover:text-black'}`}
            >
              <ChevronLeft size={16} /> Previous
            </button>

            {currentStep < 5 ? (
              <button 
                type="button" 
                onClick={handleNext}
                className="flex items-center gap-3 bg-neutral-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-neutral-200 hover:-translate-y-1 transition-transform"
              >
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button 
                type="submit" 
                disabled={loading}
                className={`flex items-center gap-3 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all hover:scale-105 disabled:opacity-50 ${isEditMode ? 'bg-blue-500' : 'bg-emerald-500'}`}
              >
                {loading ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle2 size={16}/>}
                {isEditMode ? 'Update Tender' : 'Publish Tender'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ... (SectionHeader, InputField, TextareaField components remain the same)
const SectionHeader = ({ title, subtitle }) => (
  <div className="mb-8">
    <h2 className="text-2xl font-black text-neutral-900 tracking-tight">{title}</h2>
    <p className="text-neutral-400 font-bold text-xs mt-1 italic">{subtitle}</p>
  </div>
);

const InputField = ({ label, type = "text", placeholder, value, onChange, required = false }) => (
  <div className="w-full">
    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 ml-1">{label}</label>
    <input 
      type={type} required={required} placeholder={placeholder} value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-neutral-50 border-2 border-transparent focus:border-neutral-900 focus:bg-white rounded-2xl px-6 py-4 font-bold text-neutral-800 transition-all outline-none"
    />
  </div>
);

const TextareaField = ({ label, placeholder, value, onChange, required = false }) => (
  <div>
    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 ml-1">{label}</label>
    <textarea 
      required={required} placeholder={placeholder} value={value} rows="3"
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-neutral-50 border-2 border-transparent focus:border-neutral-900 focus:bg-white rounded-2xl px-6 py-4 font-bold text-neutral-800 transition-all outline-none resize-none"
    />
  </div>
);