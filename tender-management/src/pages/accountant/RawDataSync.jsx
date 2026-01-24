import React, { useState, useEffect } from 'react';
import { financeAPI } from '../../api/auth.service';
import { FileStack, Send, ExternalLink, History, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RawDataSync() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  
  const [formData, setFormData] = useState({
    filename: '', 
    neft_file: '',
    pos_file: '',
    mygate_file: ''
  });

  const fetchHistory = async () => {
    try {
      const { data } = await financeAPI.getRawDataHistory();
      if (data.success) setHistory(data.data);
    } catch (err) { 
      console.error("History fetch failed", err); 
    }
  };

  useEffect(() => { 
    fetchHistory(); 
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const syncToast = toast.loading("Processing Raw Data to Excel...");

    try {
      // Sends: filename, neft_file, pos_file, mygate_file to your backend
      const { data } = await financeAPI.processRawDataToExcel(formData);
      
      if (data.success) {
        toast.success("Conversion Complete!", { id: syncToast });
        fetchHistory(); // Refresh the table
        setFormData({ filename: '', neft_file: '', pos_file: '', mygate_file: '' }); // Reset form
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Sync failed", { id: syncToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 ">
      
      {/* 1. SUBMISSION FORM */}
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-neutral-100">
        <h2 className="text-2xl font-black flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg"><FileStack className="text-blue-600" /></div>
          Raw Data to Excel Converter
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-neutral-400 ml-2">Record Name</label>
            <input 
              type="text" 
              placeholder="e.g. January 2026 Raw Data" 
              className="w-full p-4 bg-neutral-50 rounded-2xl border-none font-bold text-md focus:ring-2 ring-blue-500 transition-all outline-none" 
              value={formData.filename}
              onChange={e => setFormData({...formData, filename: e.target.value})}
              required 
            />
          </div>
          
          <div className="grid grid-cols-1 gap-4">
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-neutral-400 ml-2">NEFT File URL</label>
                <input type="url" placeholder="Paste Google Sheet URL" className="w-full p-3 bg-neutral-50 rounded-xl border-none text-sm" value={formData.neft_file} onChange={e => setFormData({...formData, neft_file: e.target.value})} required />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-neutral-400 ml-2">POS File URL</label>
                <input type="url" placeholder="Paste Google Sheet URL" className="w-full p-3 bg-neutral-50 rounded-xl border-none text-sm" value={formData.pos_file} onChange={e => setFormData({...formData, pos_file: e.target.value})} required />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-neutral-400 ml-2">MyGate File URL</label>
                <input type="url" placeholder="Paste Google Sheet URL" className="w-full p-3 bg-neutral-50 rounded-xl border-none text-sm" value={formData.mygate_file} onChange={e => setFormData({...formData, mygate_file: e.target.value})} required />
             </div>
          </div>

          <button 
            disabled={loading} 
            className={`w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100 ${loading ? 'bg-neutral-400' : 'bg-neutral-900 hover:bg-blue-600 text-white'}`}
          >
            {loading ? <Loader2 className="animate-spin" /> : <Send size={18} />} 
            {loading ? "PROCESSING..." : "CONVERT & SAVE"}
          </button>
        </form>
      </div>

      {/* 2. HISTORY TABLE */}
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-neutral-100">
        <h3 className="text-xl font-black flex items-center gap-3 mb-6 text-neutral-800">
            <History className="text-neutral-400" /> Permanent Records
        </h3>
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead>
                <tr className="border-b border-neutral-100 text-neutral-400 text-[10px] uppercase font-black">
                <th className="p-4">Sync Date</th>
                <th className="p-4 text-blue-600">Attendance Sheets</th>
                <th className="p-4">Final Output</th>
                </tr>
            </thead>
            <tbody>
                {history.map(row => (
                <tr key={row.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                    <td className="p-4 text-xs font-bold text-neutral-500">
                        {new Date(row.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4 font-black uppercase text-sm text-neutral-800">
                        {row.filename}
                    </td>
                    <td className="p-4">
                    <a 
                        href={row.output_excel_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black w-fit hover:bg-green-700 hover:scale-105 transition-all shadow-md"
                    >
                        <ExternalLink size={12} /> DOWNLOAD EXCEL
                    </a>
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