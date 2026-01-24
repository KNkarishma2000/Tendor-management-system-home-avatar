import React, { useState, useEffect } from 'react';
import { financeAPI } from '../../api/auth.service';
import { FileSpreadsheet, Send, ExternalLink, History, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AttendanceSync() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  
  const [formData, setFormData] = useState({
    mth_name: '', 
    MTH: '',
    hk_name: '', 
    hk: '',
    mvp_name: '', 
    mvp: ''
  });

  const fetchHistory = async () => {
    try {
      const { data } = await financeAPI.getAttendanceHistory();
      if (data.success) setHistory(data.data);
    } catch (err) { 
      console.error("Failed to fetch history", err); 
    }
  };

  useEffect(() => { 
    fetchHistory(); 
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 🛡️ Extra check: prevent duplicate clicks if already loading
    if (loading) return;

    setLoading(true);
    const syncToast = toast.loading("Processing files and syncing with n8n...");

    try {
      const { data } = await financeAPI.processAttendanceSync(formData);
      if (data.success) {
        toast.success("Sync Complete! Data saved permanently.", { id: syncToast });
        fetchHistory(); 
        setFormData({ mth_name: '', MTH: '', hk_name: '', hk: '', mvp_name: '', mvp: '' });
      }
    } catch (err) {
      console.error("Sync Error:", err);
      const errorMessage = err.response?.data?.message || "Sync failed. Please check the backend.";
      toast.error(errorMessage, { id: syncToast });
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 1. INPUT FORM SECTION */}
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-neutral-100">
        <h2 className="text-2xl font-black flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg"><FileSpreadsheet className="text-green-600" /></div>
          Attendance Sync Portal
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* MTH File Inputs */}
          <div className="space-y-4 bg-neutral-50 p-6 rounded-2xl border border-neutral-100">
            <p className="font-black text-xs text-neutral-400 uppercase tracking-widest">MTH File</p>
            <input 
              type="text" 
              placeholder="Sheet Name (e.g. Jan 2026)" 
              className="w-full p-3 rounded-xl border-none font-bold" 
              value={formData.mth_name} 
              onChange={e => setFormData({...formData, mth_name: e.target.value})} 
              required 
            />
            <input 
              type="url" 
              placeholder="Source Google Sheet URL" 
              className="w-full p-3 rounded-xl border-none text-sm" 
              value={formData.MTH} 
              onChange={e => setFormData({...formData, MTH: e.target.value})} 
              required 
            />
          </div>

          {/* HK File Inputs */}
          <div className="space-y-4 bg-neutral-50 p-6 rounded-2xl border border-neutral-100">
            <p className="font-black text-xs text-neutral-400 uppercase tracking-widest">HK File</p>
            <input 
              type="text" 
              placeholder="HK Sheet Name" 
              className="w-full p-3 rounded-xl border-none font-bold" 
              value={formData.hk_name} 
              onChange={e => setFormData({...formData, hk_name: e.target.value})} 
              required 
            />
            <input 
              type="url" 
              placeholder="HK File URL" 
              className="w-full p-3 rounded-xl border-none text-sm" 
              value={formData.hk} 
              onChange={e => setFormData({...formData, hk: e.target.value})} 
              required 
            />
          </div>

          {/* MVP File Inputs */}
          <div className="space-y-4 bg-neutral-50 p-6 rounded-2xl border border-neutral-100">
            <p className="font-black text-xs text-neutral-400 uppercase tracking-widest">MVP File</p>
            <input 
              type="text" 
              placeholder="MVP Sheet Name" 
              className="w-full p-3 rounded-xl border-none font-bold" 
              value={formData.mvp_name} 
              onChange={e => setFormData({...formData, mvp_name: e.target.value})} 
              required 
            />
            <input 
              type="url" 
              placeholder="MVP File URL" 
              className="w-full p-3 rounded-xl border-none text-sm" 
              value={formData.mvp} 
              onChange={e => setFormData({...formData, mvp: e.target.value})} 
              required 
            />
          </div>

          <button 
            type="submit"
            disabled={loading} 
            className="md:col-span-3 bg-neutral-900 text-white py-4 rounded-2xl font-black hover:bg-green-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 className="animate-spin" /> SYNCING DATA...</>
            ) : (
              <><Send size={18} /> START SYNC</>
            )}
          </button>
        </form>
      </div>

      {/* 2. PERMANENT RECORDS SECTION */}
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-neutral-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black flex items-center gap-3">
            <History /> Permanent Records
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-100 text-neutral-400 text-[10px] uppercase font-black">
                <th className="pb-4 px-4">Sync Date</th>
                {/* ✅ UPDATED: Changed from MTH Report Name to Attendance Sheets */}
                <th className="pb-4 px-4">Attendance Sheets</th>
                <th className="pb-4 px-4">Generated Files</th>
                <th className="pb-4 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? (
                history.map((row) => (
                  <tr key={row.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-all">
                    <td className="p-4 text-xs font-bold text-neutral-500">
                      {new Date(row.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 font-black text-neutral-800 uppercase tracking-tight">
                    Attendance Sheet
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <a 
                          href={row.spreadsheet_id} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        >
                          <ExternalLink size={12} /> MTH
                        </a>
                        <a 
                          href={row.hk_id} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-bold hover:bg-green-600 hover:text-white transition-all shadow-sm"
                        >
                          <ExternalLink size={12} /> HK
                        </a>
                        <a 
                          href={row.mvp_file_id} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-bold hover:bg-purple-600 hover:text-white transition-all shadow-sm"
                        >
                          <ExternalLink size={12} /> MVP
                        </a>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase flex items-center w-fit gap-1 shadow-sm">
                        <CheckCircle2 size={12}/> {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-neutral-400 text-sm font-medium">
                    No records found. Complete a sync to generate files.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}