import React, { useState, useEffect } from 'react';
import { financeAPI } from '../../api/auth.service';
import { FileSpreadsheet, Send, ExternalLink, History, Loader2, CheckCircle2, ShieldCheck, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UpdatedAttendanceSync() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  
  const [formData, setFormData] = useState({
    MTH: '', mth_name: '',
    hk: '', hk_name: '',
    mvp: '', mvp_name: '',
    security: '', security_name: '',
    Jll: '', jll: '' // Note: backend expects 'jll' lowercase for the name
  });

  const fetchHistory = async () => {
    try {
      const { data } = await financeAPI.getUpdatedAttendanceHistory();
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
    if (loading) return;

    setLoading(true);
    const syncToast = toast.loading("Processing 10-field Attendance Sync...");

    try {
      const { data } = await financeAPI.processUpdatedAttendance(formData);
      if (data.success) {
        toast.success("Extended Sync Complete!", { id: syncToast });
        fetchHistory(); 
        setFormData({ 
          MTH: '', mth_name: '', hk: '', hk_name: '', 
          mvp: '', mvp_name: '', security: '', security_name: '', 
          Jll: '', jll: '' 
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Sync failed", { id: syncToast });
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 1. INPUT FORM SECTION */}
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-neutral-100">
        <h2 className="text-2xl font-black flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg"><FileSpreadsheet className="text-indigo-600" /></div>
          Master Attendance Sync (Extended)
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* MTH */}
            <SyncInputGroup label="MTH File" nameKey="mth_name" urlKey="MTH" data={formData} setter={setFormData} color="blue" />
            
            {/* HK */}
            <SyncInputGroup label="HK File" nameKey="hk_name" urlKey="hk" data={formData} setter={setFormData} color="green" />
            
            {/* MVP */}
            <SyncInputGroup label="MVP File" nameKey="mvp_name" urlKey="mvp" data={formData} setter={setFormData} color="purple" />
            
            {/* Security */}
            <SyncInputGroup label="Security File" nameKey="security_name" urlKey="security" data={formData} setter={setFormData} color="red" />
            
            {/* JLL */}
            <SyncInputGroup label="JLL File" nameKey="jll" urlKey="Jll" data={formData} setter={setFormData} color="orange" />
          </div>

          <button 
            type="submit"
            disabled={loading} 
            className="w-full bg-neutral-900 text-white py-4 rounded-2xl font-black hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <><Loader2 className="animate-spin" /> RUNNING MASTER SYNC...</> : <><Send size={18} /> START SYNC</>}
          </button>
        </form>
      </div>

      {/* 2. HISTORY TABLE */}
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-neutral-100">
        <h3 className="text-xl font-black flex items-center gap-3 mb-6"><History /> Sync History</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-100 text-neutral-400 text-[10px] uppercase font-black">
                <th className="pb-4 px-4">Date</th>
                <th className="pb-4 px-4">Collection Name</th>
                <th className="pb-4 px-4 text-center">Output Sheets (Click to Open)</th>
                <th className="pb-4 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr key={row.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                  <td className="p-4 text-xs font-bold text-neutral-500">{new Date(row.created_at).toLocaleDateString()}</td>
                  <td className="p-4 font-black text-neutral-800 uppercase text-xs">{row.mth_name || 'Sync Record'}</td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <FileLink href={row.mth_output_url} label="MTH" color="blue" />
                      <FileLink href={row.hk_output_url} label="HK" color="green" />
                      <FileLink href={row.mvp_output_url} label="MVP" color="purple" />
                      <FileLink href={row.security_output_url} label="SEC" color="red" />
                      <FileLink href={row.jll_output_url} label="JLL" color="orange" />
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase flex items-center w-fit gap-1">
                      <CheckCircle2 size={12}/> {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- Helper Sub-Components for Cleanliness ---

const SyncInputGroup = ({ label, nameKey, urlKey, data, setter, color }) => (
  <div className={`space-y-3 bg-neutral-50 p-4 rounded-2xl border border-neutral-100`}>
    <p className={`font-black text-[10px] text-neutral-400 uppercase tracking-widest`}>{label}</p>
    <input 
      type="text" 
      placeholder="Sheet Name" 
      className="w-full p-2.5 rounded-xl border-none font-bold text-xs" 
      value={data[nameKey]} 
      onChange={e => setter({...data, [nameKey]: e.target.value})} 
      required 
    />
    <input 
      type="url" 
      placeholder="Google URL" 
      className="w-full p-2.5 rounded-xl border-none text-[10px]" 
      value={data[urlKey]} 
      onChange={e => setter({...data, [urlKey]: e.target.value})} 
      required 
    />
  </div>
);

const FileLink = ({ href, label, color }) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-600",
    green: "bg-green-50 text-green-600 hover:bg-green-600",
    purple: "bg-purple-50 text-purple-600 hover:bg-purple-600",
    red: "bg-red-50 text-red-600 hover:bg-red-600",
    orange: "bg-orange-50 text-orange-600 hover:bg-orange-600",
  };

  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noreferrer"
      className={`flex items-center gap-1 px-3 py-1.5 ${colors[color]} rounded-lg text-[10px] font-bold hover:text-white transition-all shadow-sm`}
    >
      <ExternalLink size={10} /> {label}
    </a>
  );
};