import React, { useState, useEffect } from 'react';
import { financeAPI } from '../../api/auth.service';
import { Play, FileText, Loader2, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ZohoVsElemensor() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [formData, setFormData] = useState({
    filename: '', elemensor_file: '', sep_file: '', zoho_balance_sheet: ''
  });

  const fetchHistory = async () => {
    const { data } = await financeAPI.getZohoVsElemensorHistory();
    if (data.success) setHistory(data.data);
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await financeAPI.processZohoVsElemensor(formData);
      if (data.success) {
        toast.success("Process started! Check back in 30 mins.");
        fetchHistory();
        setFormData({ filename: '', elemensor_file: '', sep_file: '', zoho_balance_sheet: '' });
      }
    } catch (err) {
      toast.error("Failed to start process");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm">
        <h2 className="text-xl font-black mb-6 uppercase tracking-tight">Zoho vs Elemensor Mapping</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            placeholder="Batch Name (e.g. DEC 2025 Mapping)"
            className="w-full p-4 bg-neutral-50 rounded-2xl border border-neutral-200 outline-none"
            value={formData.filename}
            onChange={e => setFormData({...formData, filename: e.target.value})}
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input placeholder="Elemensor File URL" className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-sm" 
              value={formData.elemensor_file} onChange={e => setFormData({...formData, elemensor_file: e.target.value})} required />
            <input placeholder="SEP File URL" className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-sm"
              value={formData.sep_file} onChange={e => setFormData({...formData, sep_file: e.target.value})} required />
            <input placeholder="Zoho Balance Sheet URL" className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-sm"
              value={formData.zoho_balance_sheet} onChange={e => setFormData({...formData, zoho_balance_sheet: e.target.value})} required />
          </div>
          <button disabled={loading} className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-black flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : <Play size={18} fill="currentColor" />}
            START 30-MIN ANALYSIS
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="p-6 text-[10px] font-black text-neutral-400 uppercase">Batch Name</th>
              <th className="p-6 text-[10px] font-black text-neutral-400 uppercase">Status</th>
              <th className="p-6 text-[10px] font-black text-neutral-400 uppercase text-right">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {history.map((row) => (
              <tr key={row.id}>
                <td className="p-6 font-bold text-neutral-800">{row.filename}</td>
                <td className="p-6">
                  {row.status === 'PROCESSING' ? (
                    <span className="flex items-center gap-2 text-amber-600 font-bold text-xs">
                      <Clock size={14} className="animate-pulse" /> PROCESSING (30 MINS)
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-green-600 font-bold text-xs">
                      <CheckCircle size={14} /> COMPLETED
                    </span>
                  )}
                </td>
                <td className="p-6 text-right">
                  {row.output_url ? (
                    <a href={row.output_url} target="_blank" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-black text-[10px]">
                      VIEW GOOGLE SHEET <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span className="text-neutral-300 text-[10px] font-bold">WAITING FOR N8N...</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}