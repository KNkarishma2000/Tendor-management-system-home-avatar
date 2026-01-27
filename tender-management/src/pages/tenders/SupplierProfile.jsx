import React, { useState, useEffect } from 'react';
import { Save, Building, Landmark, CheckCircle, FileUp, ShieldCheck } from 'lucide-react';
import { supplierAPI } from '../../api/auth.service';
import toast, { Toaster } from 'react-hot-toast';

const CATEGORY_OPTIONS = ["Civil Works", "Electrical", "Plumbing", "Security", "Landscaping", "IT Services", "Events"];
const DOC_TYPES = ["LICENSE", "AFFIDAVIT", "DSC", "BALANCE_SHEET"];

export default function SupplierProfile() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({
        company_name: '', registered_address: '', contact_person_name: '', contact_phone: '',
        pan: '', gstin: '', cin: '', bank_account_no: '', ifsc_code: '', bank_name: '',
        categories: [], documents: [] 
    });
    
    const [chequeFile, setChequeFile] = useState(null);
    const [extraDocs, setExtraDocs] = useState({}); // Stores new files by type

    useEffect(() => { fetchProfile(); }, []);

const fetchProfile = async () => {
    try {
        const res = await supplierAPI.getProfile();
        if (res.data.success) {
            const d = res.data.data;
            
            // 1. Extract financial data safely
            // In your backend, this is: financials: supplier.supplier_financials[0] || {}
            const fin = d.financials || {};

            setProfile({
                // 2. Keep existing supplier basic info
                ...d, 
                // 3. EXPLICITLY set the keys your <Input /> fields use
                // This prevents '...d' from overwriting them with null
                bank_name: fin.bank_name || '',
                bank_account_no: fin.bank_account_no || '',
                ifsc_code: fin.ifsc_code || '',
                categories: d.categories || [],
                documents: d.documents || []
            });
            
            console.log("Profile Data Loaded:", d); // Check console to see the structure
            console.log("Mapped Financials:", fin);
        }
    } catch (err) { 
        toast.error("Failed to load profile"); 
    } finally { 
        setLoading(false); 
    }
};
    const toggleCategory = (cat) => {
        setProfile(prev => ({
            ...prev,
            categories: prev.categories.includes(cat) 
                ? prev.categories.filter(c => c !== cat)
                : [...prev.categories, cat]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const loadingToast = toast.loading("Saving all changes...");
        
        const formData = new FormData();
        
        // 1. Add All Text Fields (Company + Bank)
        const fields = ['company_name', 'registered_address', 'contact_person_name', 'contact_phone', 'pan', 'gstin', 'cin', 'bank_account_no', 'ifsc_code', 'bank_name'];
        fields.forEach(field => formData.append(field, profile[field] || ''));
        
        // 2. Add Categories
        formData.append('categories', JSON.stringify(profile.categories));

        // 3. Add Cancelled Cheque
        if (chequeFile) formData.append('cancelled_cheque', chequeFile);

        // 4. Add Extra Documents (Dynamic)
        Object.keys(extraDocs).forEach(type => {
            formData.append(type.toLowerCase(), extraDocs[type]);
        });

        try {
            const res = await supplierAPI.updateProfile(formData);
            if (res.data.success) {
                toast.success("Profile, Bank details & Documents updated!", { id: loadingToast });
                setExtraDocs({}); // Clear local file state
                fetchProfile(); 
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Update failed", { id: loadingToast });
        } finally { setSaving(false); }
    };

    if (loading) return <div className="p-10 font-black uppercase tracking-widest animate-pulse">Loading Profile...</div>;

    return (
        <div className=" p-6 md:p-10 bg-[#FAFAFA] min-h-screen">
            <Toaster position="top-right" />
            <header className="mb-10">
                <h1 className="text-4xl font-black uppercase tracking-tighter italic">Supplier Profile</h1>
                <p className="text-neutral-500 font-bold">Update your legal, financial, and compliance information.</p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-10">
                {/* SECTION 1: COMPANY INFORMATION */}
                <div className="bg-white border-2 border-black p-8 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-3 mb-8 border-b-2 border-neutral-100 pb-4">
                        <Building size={28} className="text-yellow-500" />
                        <h2 className="text-xl font-black uppercase tracking-tight">Company Information</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Company Name" value={profile.company_name} onChange={e => setProfile({...profile, company_name: e.target.value})} />
                        <Input label="Contact Person" value={profile.contact_person_name} onChange={e => setProfile({...profile, contact_person_name: e.target.value})} />
                        <Input label="Phone Number" value={profile.contact_phone} onChange={e => setProfile({...profile, contact_phone: e.target.value})} />
                        <Input label="GSTIN" value={profile.gstin} onChange={e => setProfile({...profile, gstin: e.target.value})} />
                        <Input label="PAN Number" value={profile.pan} onChange={e => setProfile({...profile, pan: e.target.value})} />
                        <Input label="CIN (Optional)" value={profile.cin} onChange={e => setProfile({...profile, cin: e.target.value})} />
                        <div className="md:col-span-2">
                            <Input label="Registered Address" value={profile.registered_address} onChange={e => setProfile({...profile, registered_address: e.target.value})} />
                        </div>
                    </div>
                </div>

                {/* SECTION 2: SERVICE CATEGORIES */}
                <div className="bg-white border-2 border-black p-8 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <h2 className="text-xl font-black uppercase tracking-tight mb-6">Service Categories</h2>
                    <div className="flex flex-wrap gap-2">
                        {CATEGORY_OPTIONS.map(cat => (
                            <button
                                type="button" key={cat}
                                onClick={() => toggleCategory(cat)}
                                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all ${
                                    profile.categories.includes(cat) 
                                    ? 'bg-yellow-400 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-1' 
                                    : 'bg-neutral-50 border-neutral-200 text-neutral-400'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* SECTION 3: BANKING DETAILS */}
                <div className="bg-white border-2 border-black p-8 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-3 mb-8 border-b-2 border-neutral-100 pb-4">
                        <Landmark size={28} className="text-yellow-500" />
                        <h2 className="text-xl font-black uppercase tracking-tight">Financial Details</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <Input label="Bank Name" value={profile.bank_name} onChange={e => setProfile({...profile, bank_name: e.target.value})} />
                        <Input label="Account Number" value={profile.bank_account_no} onChange={e => setProfile({...profile, bank_account_no: e.target.value})} />
                        <div className="md:col-span-2">
                            <Input label="IFSC Code" value={profile.ifsc_code} onChange={e => setProfile({...profile, ifsc_code: e.target.value})} />
                        </div>
                    </div>

                    <div className="p-6 bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-300">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Cancelled Cheque</label>
                            {profile.financials?.cancelled_cheque_file && <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-black uppercase">Available</span>}
                        </div>
                        <input type="file" onChange={e => setChequeFile(e.target.files[0])} className="text-xs font-bold w-full" accept=".pdf,.jpg,.jpeg,.png" />
                    </div>
                </div>

                {/* SECTION 4: COMPLIANCE DOCUMENTS (NEW) */}
                <div className="bg-white border-2 border-black p-8 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-3 mb-8 border-b-2 border-neutral-100 pb-4">
                        <ShieldCheck size={28} className="text-yellow-500" />
                        <h2 className="text-xl font-black uppercase tracking-tight">Compliance Documents</h2>
                    </div>
                    <p className="text-[11px] font-bold text-neutral-400 mb-6 uppercase tracking-wider">Please provide at least one of the following for verification.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {DOC_TYPES.map(type => {
                            const isUploaded = profile.documents.some(d => d.document_type === type);
                            return (
                                <div key={type} className={`p-4 rounded-2xl border-2 transition-all ${isUploaded ? 'bg-green-50 border-green-200' : 'bg-neutral-50 border-neutral-100'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-black uppercase tracking-tighter">{type.replace('_', ' ')}</span>
                                        {isUploaded && <CheckCircle size={14} className="text-green-600" />}
                                    </div>
                                    <input 
                                        type="file" 
                                        onChange={e => setExtraDocs(prev => ({...prev, [type]: e.target.files[0]}))}
                                        className="text-[10px] w-full font-bold cursor-pointer" 
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                <button
                    disabled={saving}
                    className="w-full bg-black text-white p-6 rounded-2xl font-black uppercase tracking-[0.3em] shadow-[8px_8px_0px_0px_rgba(250,204,21,1)] hover:translate-y-1 hover:shadow-none transition-all flex justify-center items-center gap-4"
                >
                    {saving ? "UPDATING SECURELY..." : <><Save size={24}/> SAVE ALL PROFILE DATA</>}
                </button>
            </form>
        </div>
    );
}

function Input({ label, value, onChange }) {
    return (
        <div className="group">
            <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1.5 ml-1 transition-colors group-focus-within:text-black">{label}</label>
            <input 
                type="text" value={value || ''} onChange={onChange}
                className="w-full bg-neutral-50 border-2 border-neutral-100 p-3.5 rounded-xl font-bold focus:border-black focus:bg-white outline-none transition-all shadow-sm"
            />
        </div>
    );
}