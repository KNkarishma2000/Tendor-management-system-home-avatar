import React, { useState, useEffect } from 'react';
import { financeAPI } from '../../api/auth.service';
import { Play, FileSpreadsheet, Loader2, Calendar, FileText, ExternalLink, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Reconciliation() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [formData, setFormData] = useState({
    excel_sheet: '', 
    start_date: '',  
    end_date: '',    
    phase1: '',      
    phase2: ''       
  });

  const fetchHistory = async () => {
    try {
      const { data } = await financeAPI.getReconciliationHistory();
      // Ensure we are setting the data array from the backend response
      if (data.success) setHistory(data.data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const loadToast = toast.loading("Processing Reconciliation...");

    try {
      const { data } = await financeAPI.processReconciliation(formData);
      if (data.success) {
        toast.success("Sync Complete!", { id: loadToast });
        fetchHistory();
        setFormData({ excel_sheet: '', start_date: '', end_date: '', phase1: '', phase2: '' });
      }
    } catch (err) {
      toast.error("Reconciliation failed", { id: loadToast });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Helper to format "YYYY-MM-DD" to a cleaner "DD MMM YYYY" if desired, 
   * or just return the "Start - End" string.
   */
  const formatSheetName = (start, end) => {
    if (!start || !end) return "RECONCILIATION BATCH";
    return `${start} — ${end}`;
  };

  return (
    <div className="p-8 space-y-10">
      {/* --- RECONCILIATION INPUT FORM --- */}
      <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 space-y-2">
              <label className="text-sm font-bold text-neutral-600 ml-1">Blockwise Sheet URL</label>
              <input 
                type="url" placeholder="Google Sheet Link" 
                className="w-full p-4 bg-neutral-50 rounded-2xl border border-neutral-200 outline-none font-medium text-sm focus:ring-2 ring-blue-500"
                value={formData.excel_sheet} 
                onChange={e => setFormData({...formData, excel_sheet: e.target.value})}
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-600 ml-1">Start Date</label>
              <input 
                type="date" 
                className="w-full p-4 bg-neutral-50 rounded-2xl border border-neutral-200 outline-none font-medium text-sm focus:ring-2 ring-blue-500"
                value={formData.start_date}
                onChange={e => setFormData({...formData, start_date: e.target.value})}
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-600 ml-1">End Date</label>
              <input 
                type="date" 
                className="w-full p-4 bg-neutral-50 rounded-2xl border border-neutral-200 outline-none font-medium text-sm focus:ring-2 ring-blue-500"
                value={formData.end_date}
                onChange={e => setFormData({...formData, end_date: e.target.value})}
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-neutral-100 pt-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-600 ml-1">Elementor Phase 1 Link</label>
              <input 
                type="url" placeholder="Google Sheet URL" 
                className="w-full p-4 bg-neutral-50 rounded-2xl border border-neutral-200 outline-none font-medium text-sm focus:ring-2 ring-blue-500"
                value={formData.phase1}
                onChange={e => setFormData({...formData, phase1: e.target.value})}
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-600 ml-1">Elementor Phase 2 Link</label>
              <input 
                type="url" placeholder="Google Sheet URL" 
                className="w-full p-4 bg-neutral-50 rounded-2xl border border-neutral-200 outline-none font-medium text-sm focus:ring-2 ring-blue-500"
                value={formData.phase2}
                onChange={e => setFormData({...formData, phase2: e.target.value})}
                required 
              />
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : <Play size={20} fill="currentColor" />}
            {loading ? "PROCESSING SYNC..." : "RUN FULL RECONCILIATION"}
          </button>
        </form>
      </div>

      {/* --- RECENT SYNC HISTORY TABLE --- */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-neutral-100 bg-neutral-50/50 flex justify-between items-center">
          <h3 className="text-sm font-black text-neutral-800 uppercase tracking-widest">Recent Sync History</h3>
          <span className="text-[10px] bg-neutral-200 text-neutral-600 px-3 py-1 rounded-full font-bold">
            {history.length} Records found
          </span>
        </div>
        <table className="w-full text-left table-fixed">
          <thead className="bg-white border-b border-neutral-200">
            <tr>
              <th className="p-6 w-20 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-center">No.</th>
              <th className="p-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Sheet Name (Selected Period)</th>
              <th className="p-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right">Output Sheets</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {history.length > 0 ? history.map((row, index) => (
              <tr key={row.id} className="hover:bg-neutral-50/50 transition-colors group">
                <td className="p-6 text-center font-black text-neutral-300 text-sm">{index + 1}</td>
                
                {/* DYNAMIC SHEET NAME USING DATABASE DATES */}
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="font-black text-neutral-800 text-sm uppercase tracking-tight">
                        {formatSheetName(row.start_date, row.end_date)}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-black uppercase tracking-tighter">
                           Sync Successful
                         </span>
                         <span className="text-[10px] text-neutral-400 font-bold flex items-center gap-1">
                           <Calendar size={10} /> {new Date(row.created_at).toLocaleDateString()}
                         </span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* OUTPUT BUTTONS */}
                <td className="p-6">
                  <div className="flex justify-end gap-3">
                    <a href={row.reconciliation_sheet_url} target="_blank" rel="noreferrer" 
                       className="flex items-center gap-2 px-5 py-3 bg-white border border-neutral-200 text-neutral-700 rounded-xl text-[11px] font-black hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm">
                      <FileSpreadsheet size={14} className="text-blue-500" /> RECONCILIATION <ExternalLink size={10} className="opacity-40" />
                    </a>
                    <a href={row.elemensor_final_sheet_url} target="_blank" rel="noreferrer" 
                       className="flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-xl text-[11px] font-black hover:bg-neutral-900 transition-all shadow-md shadow-green-100">
                      <CheckCircle size={14} /> ELEMENSOR FINAL <ExternalLink size={10} className="opacity-50" />
                    </a>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="3" className="p-20 text-center text-neutral-300 font-black uppercase text-xs tracking-widest italic opacity-50">
                  No records found in database
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}