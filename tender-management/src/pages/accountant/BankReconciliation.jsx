import React, { useState, useEffect } from 'react';
import { financeAPI } from '../../api/auth.service';
import { 
  Play, 
  Loader2, 
  ExternalLink, 
  Database,
  FileText,
  Clock,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function BankReconciliation() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [formData, setFormData] = useState({
    bank_statement: '',
    zoho_link: '',
    pos_1709: '',
    pos_1708: '',
    upi_transactions: ''
  });

  const fetchHistory = async () => {
    try {
      const { data } = await financeAPI.getBankHistory();
      if (data.success) setHistory(data.data);
    } catch (err) {
      toast.error("History sync failed");
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const loadToast = toast.loading("Processing...");
    try {
      const { data } = await financeAPI.processBankSync(formData);
      if (data.success) {
        toast.success("Success", { id: loadToast });
        setFormData({ bank_statement: '', zoho_link: '', pos_1709: '', pos_1708: '', upi_transactions: '' });
        fetchHistory();
      }
    } catch (err) {
      toast.error("Error", { id: loadToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6  space-y-6">
      
      {/* --- INPUT SECTION --- */}
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Database size={18} className="text-blue-600" />
            <h2 className="text-sm font-bold text-neutral-800 uppercase tracking-tight">Reconciliation Engine</h2>
          </div>
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">V2.0 COMPACT</span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input 
              type="url" placeholder="Bank Statement URL"
              className="w-full px-4 py-3 bg-neutral-50 rounded-xl border border-neutral-200 focus:border-blue-500 outline-none text-sm transition-all shadow-inner"
              value={formData.bank_statement} onChange={e => setFormData({...formData, bank_statement: e.target.value})} required 
            />
            <input 
              type="url" placeholder="Zoho Ledger URL"
              className="w-full px-4 py-3 bg-neutral-50 rounded-xl border border-neutral-200 focus:border-blue-500 outline-none text-sm transition-all shadow-inner"
              value={formData.zoho_link} onChange={e => setFormData({...formData, zoho_link: e.target.value})} required 
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <input type="url" placeholder="POS 1709" className="px-4 py-3 bg-white rounded-xl border border-neutral-200 outline-none text-xs focus:ring-1 ring-blue-500" value={formData.pos_1709} onChange={e => setFormData({...formData, pos_1709: e.target.value})} required />
            <input type="url" placeholder="POS 1708" className="px-4 py-3 bg-white rounded-xl border border-neutral-200 outline-none text-xs focus:ring-1 ring-blue-500" value={formData.pos_1708} onChange={e => setFormData({...formData, pos_1708: e.target.value})} required />
            <input type="url" placeholder="UPI Link" className="px-4 py-3 bg-white rounded-xl border border-neutral-200 outline-none text-xs focus:ring-1 ring-blue-500" value={formData.upi_transactions} onChange={e => setFormData({...formData, upi_transactions: e.target.value})} required />
          </div>

          <button disabled={loading} className="w-full bg-blue-600 hover:bg-neutral-900 text-white py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10">
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Play size={18} fill="currentColor" />}
            {loading ? "PROCESSING..." : "RUN RECONCILIATION"}
          </button>
        </form>
      </div>

      {/* --- TABLE SECTION --- */}
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="px-8 py-4 text-[11px] font-black text-neutral-400 uppercase tracking-widest w-[25%]">Batch Details</th>
              <th className="px-8 py-4 text-[11px] font-black text-neutral-400 uppercase tracking-widest w-[75%]">Document Tray</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {history.length > 0 ? history.map((row) => (
              <tr key={row.id} className="hover:bg-neutral-50/50 transition-colors">
                {/* BATCH DETAILS */}
                <td className="px-8 py-6 align-top">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-1.5 bg-green-50 rounded-lg text-green-600">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <div className="text-base font-bold text-neutral-800 leading-tight">
                        {new Date(row.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="text-xs text-neutral-400 font-bold uppercase mt-1 flex items-center gap-1">
                        <Clock size={12} /> {new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </td>

                {/* DOCUMENT TRAY - Now using a grid to fill space */}
                <td className="px-8 py-6">
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                    
                    {/* Main Output (NEFT) */}
                 
                    
                    {/* Source Files */}
                    {[
                      { label: 'ZOHO LEDGER', url: row.zoho_url, color: 'orange' },
                      { label: 'POS 1709', url: row.pos_1709_url, color: 'blue' },
                      { label: 'POS 1708', url: row.pos_1708_url, color: 'blue' },
                      { label: 'UPI DATA', url: row.upi_url, color: 'purple' }
                    ].map((link, i) => (
                      <a key={i} href={link.url} target="_blank" rel="noreferrer" 
                        className="flex items-center justify-between px-4 py-3 border border-neutral-200 bg-white text-neutral-700 rounded-xl text-[11px] font-bold hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm group">
                        <span>{link.label}</span>
                        <ExternalLink size={14} className="text-neutral-300 group-hover:text-blue-500" />
                      </a>
                    ))}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="2" className="px-8 py-16 text-center text-sm font-bold text-neutral-300 uppercase tracking-widest">
                  No Reconciliation Logs Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}