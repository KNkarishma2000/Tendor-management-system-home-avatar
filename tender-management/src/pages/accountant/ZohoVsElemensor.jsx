import React, { useState, useEffect } from 'react';
import { financeAPI } from '../../api/auth.service';
import { Play, FileText, Loader2, CheckCircle, Clock, ExternalLink, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ZohoVsElemensor() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  
  // ✅ UPDATED: Added start_date and end_date to state
  const [formData, setFormData] = useState({
    filename: '', 
    elemensor_file: '', 
    sep_file: '', 
    zoho_balance_sheet: '',
    start_date: '', 
    end_date: ''
  });

  const fetchHistory = async () => {
    try {
      const { data } = await financeAPI.getZohoVsElemensorHistory();
      if (data.success) setHistory(data.data);
    } catch (err) {
      console.error("Failed to fetch history");
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Create a notification for the long process
    const processingToast = toast.loading("Initializing 30-min analysis...");

    try {
      // ✅ Sending the full formData including dates to the API
      const { data } = await financeAPI.processZohoVsElemensor(formData);
      
      if (data.success) {
        toast.success("Process started! Please check back in 30 minutes.", { id: processingToast });
        fetchHistory();
        // Reset form
        setFormData({ 
          filename: '', elemensor_file: '', sep_file: '', 
          zoho_balance_sheet: '', start_date: '', end_date: '' 
        });
      }
    } catch (err) {
      toast.error("Failed to start process. Check your connection.", { id: processingToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* 1. INPUT FORM SECTION */}
      <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
            <FileText size={24} />
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight">Zoho vs Elemensor Mapping</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Batch Name */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-400 uppercase ml-2">File Name</label>
            <input 
              placeholder="e.g. DEC 2025 Mapping"
              className="w-full p-4 bg-neutral-50 rounded-2xl border border-neutral-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
              value={formData.filename}
              onChange={e => setFormData({...formData, filename: e.target.value})}
              required
            />
          </div>

          {/* Date Range Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-400 uppercase ml-2 flex items-center gap-1">
                <Calendar size={12} /> Start Date
              </label>
              <input 
                type="date"
                className="w-full p-4 bg-neutral-50 rounded-2xl border border-neutral-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-neutral-700"
                value={formData.start_date}
                onChange={e => setFormData({...formData, start_date: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-400 uppercase ml-2 flex items-center gap-1">
                <Calendar size={12} /> End Date
              </label>
              <input 
                type="date"
                className="w-full p-4 bg-neutral-50 rounded-2xl border border-neutral-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-neutral-700"
                value={formData.end_date}
                onChange={e => setFormData({...formData, end_date: e.target.value})}
                required
              />
            </div>
          </div>

          {/* URL Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-400 uppercase ml-2 text-indigo-500">Elemensor URL</label>
              <input placeholder="https://docs.google..." className="w-full p-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-sm outline-none" 
                value={formData.elemensor_file} onChange={e => setFormData({...formData, elemensor_file: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-400 uppercase ml-2 text-indigo-500">SEP URL</label>
              <input placeholder="https://docs.google..." className="w-full p-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-sm outline-none"
                value={formData.sep_file} onChange={e => setFormData({...formData, sep_file: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-400 uppercase ml-2 text-indigo-500">Zoho BS URL</label>
              <input placeholder="https://docs.google..." className="w-full p-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-sm outline-none"
                value={formData.zoho_balance_sheet} onChange={e => setFormData({...formData, zoho_balance_sheet: e.target.value})} required />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading} 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-5 rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 className="animate-spin" /> INITIALIZING ENGINE...</>
            ) : (
              <><Play size={20} fill="currentColor" /> Start Mapping</>
            )}
          </button>
        </form>
      </div>

      {/* 2. HISTORY SECTION */}
      <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-neutral-100">
          <h3 className="font-black text-neutral-800 uppercase tracking-widest text-sm">Analysis History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="p-6 text-[10px] font-black text-neutral-400 uppercase">Batch Name & Period</th>
                <th className="p-6 text-[10px] font-black text-neutral-400 uppercase">Status</th>
                <th className="p-6 text-[10px] font-black text-neutral-400 uppercase text-right">Mapping Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {history.length > 0 ? history.map((row) => (
                <tr key={row.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="p-6">
                    <div className="font-bold text-neutral-800">{row.filename}</div>
                    <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-tighter">
                      {row.start_date} → {row.end_date}
                    </div>
                  </td>
                  <td className="p-6">
                    {row.status === 'PROCESSING' ? (
                      <span className="flex items-center gap-2 text-amber-600 bg-amber-50 w-fit px-3 py-1 rounded-full font-black text-[10px] uppercase">
                        <Clock size={12} className="animate-pulse" /> Processing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-green-600 bg-green-50 w-fit px-3 py-1 rounded-full font-black text-[10px] uppercase">
                        <CheckCircle size={12} /> Analysis Complete
                      </span>
                    )}
                  </td>
                  <td className="p-6 text-right">
                    {row.output_url ? (
                      <a 
                        href={row.output_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-[10px] hover:shadow-lg transition-all"
                      >
                        VIEW RECON SHEET <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-neutral-300 text-[10px] font-black uppercase">Analysis in progress...</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="3" className="p-10 text-center text-neutral-400 font-bold">No mapping history found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}