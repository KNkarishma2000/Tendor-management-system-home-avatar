import React, { useState, useEffect } from 'react';
import { financeAPI } from '../../api/auth.service';
import { Play, Link2, FileText, ExternalLink, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InvoiceExtractor() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [formData, setFormData] = useState({ folder_name: '', folder_url: '' });

  const fetchHistory = async () => {
    try {
      const { data } = await financeAPI.getInvoiceHistory();
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
    setLoading(true);
    const loadToast = toast.loading("Processing...");

    try {
      const { data } = await financeAPI.processInvoiceExtraction(formData);
      if (data.success) {
        toast.success("Success!", { id: loadToast });
        fetchHistory();
        setFormData({ folder_name: '', folder_url: '' });
      }
    } catch (err) {
      toast.error("Failed to process", { id: loadToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8  space-y-10">
      {/* Input Section */}
      <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 space-y-2 w-full">
            <label className="text-sm font-bold text-neutral-600 ml-1">File Name</label>
            <input 
              type="text" 
              placeholder="e.g. Dec 2025 Invoices" 
              className="w-full p-4 bg-neutral-50 rounded-2xl border border-neutral-200 focus:ring-2 ring-orange-500 outline-none font-medium"
              value={formData.folder_name}
              onChange={e => setFormData({...formData, folder_name: e.target.value})}
              required 
            />
          </div>
          
          <div className="flex-[2] space-y-2 w-full">
            <label className="text-sm font-bold text-neutral-600 ml-1">Invoice Folder Link</label>
            <input 
              type="url" 
              placeholder="Paste Google Drive Folder URL" 
              className="w-full p-4 bg-neutral-50 rounded-2xl border border-neutral-200 focus:ring-2 ring-orange-500 outline-none font-medium"
              value={formData.folder_url}
              onChange={e => setFormData({...formData, folder_url: e.target.value})}
              required 
            />
          </div>

          <button 
            disabled={loading}
            className="bg-neutral-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-orange-600 transition-all flex items-center gap-2 h-[58px]"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} fill="currentColor" />}
            START
          </button>
        </form>
      </div>

      {/* Simplified Table Section */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="p-5 text-sm font-black text-neutral-500 w-20">S.No</th>
              <th className="p-5 text-sm font-black text-neutral-500">File Name</th>
              <th className="p-5 text-sm font-black text-neutral-500 text-right">Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {history.length > 0 ? history.map((row, index) => (
              <tr key={row.id} className="hover:bg-neutral-50 transition-colors">
                <td className="p-5 font-bold text-neutral-400">{index + 1}</td>
                <td className="p-5 font-bold text-neutral-800 uppercase tracking-tight">
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-orange-500" />
                    {row.folder_name}
                  </div>
                </td>
                <td className="p-5 text-right">
                  <a 
                    href={row.extracted_output_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 font-bold hover:underline"
                  >
                    View Result <ExternalLink size={14} />
                  </a>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="3" className="p-10 text-center text-neutral-400 font-medium">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}