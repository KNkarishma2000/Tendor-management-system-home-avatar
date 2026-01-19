import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, FileText, Calendar, 
  ChevronRight, Loader2, X, Info 
} from 'lucide-react';
import { tenderAdminAPI } from '../../api/auth.service';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function TenderManagement() {
  const navigate = useNavigate();
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget_estimate: '',
    submission_deadline: '',
    min_experience_years: '',
    min_turnover: '',
    status: 'DRAFT'
  });

  useEffect(() => {
    fetchTenders();
  }, []);

  const fetchTenders = async () => {
    try {
      setLoading(true);
      const res = await tenderAdminAPI.getAllTenders();
      setTenders(res.data.data || []);
    } catch (error) {
      toast.error("Failed to load tenders");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await tenderAdminAPI.createTender(formData);
      toast.success("Tender Created Successfully");
      setIsModalOpen(false);
      fetchTenders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Creation failed");
    }
  };

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="animate-spin text-yellow-400 w-12 h-12" />
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 uppercase tracking-tight italic">Tender Tracking</h1>
          <p className="text-neutral-400 font-bold text-sm">Manage vendor bids and contracts.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-2xl font-black text-xs hover:bg-neutral-800 transition-all shadow-xl shadow-neutral-200"
        >
          <Plus size={16} />
          CREATE NEW TENDER
        </button>
      </header>

      {/* Tender List */}
      <div className="space-y-4">
        {tenders.map((tender) => (
          <div 
            key={tender.id}
            onClick={() => navigate(`/admin/tenders/${tender.id}`)}
            className="group bg-white p-6 rounded-[2rem] border border-neutral-100 flex items-center justify-between hover:shadow-xl hover:shadow-neutral-100 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="font-black text-neutral-800 text-lg leading-tight">{tender.title}</h3>
                <p className="text-neutral-400 font-bold text-xs mt-1 uppercase tracking-wider">ID: {tender.id.substring(0,8).toUpperCase()}</p>
              </div>
            </div>

            <div className="flex items-center gap-12">
              <div className="text-right">
                <div className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-1">Estimate</div>
                <div className="font-black text-neutral-900">₹{parseFloat(tender.budget_estimate).toLocaleString()}</div>
              </div>
              
              <div className="text-right hidden md:block">
                <div className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-1">Status</div>
                <span className="px-3 py-1 bg-yellow-50 text-yellow-600 rounded-full text-[10px] font-black uppercase">
                  {tender.status}
                </span>
              </div>

              <div className="p-2 bg-neutral-50 rounded-xl text-neutral-300 group-hover:bg-neutral-900 group-hover:text-white transition-all">
                <ChevronRight size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE TENDER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm animate-in zoom-in-95 duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-12 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-10 right-10 text-neutral-300 p-2 hover:bg-neutral-50 hover:text-neutral-900 rounded-full">
              <X size={24} />
            </button>
            
            <h2 className="text-3xl font-black text-neutral-900 mb-2">Publish Tender</h2>
            <p className="text-neutral-400 font-bold text-sm mb-10 italic">Define project requirements and eligibility.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-3 ml-1">Project Title</label>
                <input 
                  required type="text" 
                  className="w-full bg-neutral-50 border-2 border-transparent focus:border-neutral-900 focus:bg-white rounded-2xl px-6 py-4 font-bold text-neutral-800 transition-all outline-none"
                  placeholder="e.g. CCTV Installation - Block A & B"
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-3 ml-1">Budget Estimate (₹)</label>
                  <input 
                    required type="number" 
                    className="w-full bg-neutral-50 border-2 border-transparent focus:border-neutral-900 focus:bg-white rounded-2xl px-6 py-4 font-bold text-neutral-800 transition-all outline-none"
                    placeholder="500000"
                    value={formData.budget_estimate} 
                    onChange={(e) => setFormData({...formData, budget_estimate: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-3 ml-1">Submission Deadline</label>
                  <input 
                    required type="date" 
                    className="w-full bg-neutral-50 border-2 border-transparent focus:border-neutral-900 focus:bg-white rounded-2xl px-6 py-4 font-bold text-neutral-800 transition-all outline-none"
                    value={formData.submission_deadline} 
                    onChange={(e) => setFormData({...formData, submission_deadline: e.target.value})} 
                  />
                </div>
              </div>

              {/* Eligibility Section */}
              <div className="bg-neutral-50 p-6 rounded-3xl border border-neutral-100">
                <div className="flex items-center gap-2 mb-4 text-neutral-900">
                  <Info size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Eligibility Criteria</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="number" placeholder="Min Experience (Years)"
                    className="w-full bg-white rounded-xl px-4 py-3 text-sm font-bold border border-neutral-200 outline-none focus:border-neutral-900"
                    value={formData.min_experience_years}
                    onChange={(e) => setFormData({...formData, min_experience_years: e.target.value})}
                  />
                  <input 
                    type="number" placeholder="Min Annual Turnover (₹)"
                    className="w-full bg-white rounded-xl px-4 py-3 text-sm font-bold border border-neutral-200 outline-none focus:border-neutral-900"
                    value={formData.min_turnover}
                    onChange={(e) => setFormData({...formData, min_turnover: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-3 ml-1">Scope of Work</label>
                <textarea 
                  rows="3" required
                  className="w-full bg-neutral-50 border-2 border-transparent focus:border-neutral-900 focus:bg-white rounded-2xl px-6 py-5 font-bold text-neutral-800 transition-all outline-none resize-none"
                  placeholder="Describe the full technical requirements and expected outcomes..."
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                />
              </div>

              <button type="submit" className="w-full bg-neutral-900 text-white py-5 rounded-[1.5rem] font-black text-xs hover:bg-neutral-800 transition-all shadow-xl shadow-neutral-200 mt-4 uppercase tracking-[0.2em]">
                CREATE & PUBLISH TENDER
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}