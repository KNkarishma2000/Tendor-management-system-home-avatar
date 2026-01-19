import React, { useState, useEffect } from 'react';
import { CheckCircle, Trash2, Loader2, UserCheck, XCircle } from 'lucide-react';
import { authResidentAPI } from '../../api/auth.service'; // Ensure this points to your resident routes
import toast from 'react-hot-toast';

export default function ResidentManagement() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    try {
      setLoading(true);
      const res = await authResidentAPI.getAllResidents(); 
      setResidents(res.data.data || []);
    } catch (error) {
      toast.error("Failed to load resident directory");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      // Matches your backend: router.put('/approve/:resident_id'...)
      await authResidentAPI.approveResident(id, { action }); 
      toast.success(`Resident ${action === 'APPROVE' ? 'Approved' : 'Rejected'}`);
      fetchResidents();
    } catch (error) {
      toast.error("Action failed");
    }
  };

const handleDelete = async (id) => {
  if (!window.confirm("Permanently delete this resident and all their posts/items?")) return;
  
  try {
    const res = await authResidentAPI.deleteResident(id);
    if (res.data.success) {
      toast.success("Resident and all content removed");
      setResidents(prev => prev.filter(r => r.id !== id));
    }
  } catch (error) {
    // This will show exactly which table is blocking the delete
    const serverMessage = error.response?.data?.message || "Delete failed";
    toast.error(serverMessage, { duration: 5000 }); 
    console.error("Full Error:", error);
  }
};

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="animate-spin text-yellow-400 w-12 h-12" />
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-2xl font-black text-neutral-900 uppercase tracking-tight">Resident Directory</h1>
        <p className="text-neutral-400 font-bold text-sm">Manage approvals and resident records.</p>
      </header>

      <div className="bg-white rounded-[2.5rem] border border-neutral-100 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-50">
              <th className="px-8 py-6 text-[10px] font-black uppercase text-neutral-400 tracking-widest">Name</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase text-neutral-400 tracking-widest">Unit</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase text-neutral-400 tracking-widest">Contact</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase text-neutral-400 tracking-widest">Status</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase text-neutral-400 tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {residents.map((res) => (
              <tr key={res.id} className="group hover:bg-neutral-50/50 transition-colors">
                <td className="px-8 py-6 font-black text-neutral-900">{res.full_name}</td>
                <td className="px-8 py-6">
                  <span className="bg-neutral-100 text-neutral-600 px-3 py-1.5 rounded-xl text-xs font-bold uppercase">
                    {res.block} - {res.flat_no}
                  </span>
                </td>
                <td className="px-8 py-6 text-sm font-bold text-neutral-500">{res.mobile_no}</td>
                <td className="px-8 py-6">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                    res.status === 'APPROVED' ? 'bg-green-100 text-green-600' : 
                    res.status === 'REJECTED' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                  }`}>
                    {res.status === 'APPROVED' && <CheckCircle size={12} />}
                    {res.status}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {res.status === 'PENDING' && (
                      <>
                        <button onClick={() => handleAction(res.id, 'APPROVE')} className="p-2 text-green-500 hover:bg-green-50 rounded-xl" title="Approve">
                          <UserCheck size={20} />
                        </button>
                        <button onClick={() => handleAction(res.id, 'REJECT')} className="p-2 text-red-400 hover:bg-red-50 rounded-xl" title="Reject">
                          <XCircle size={20} />
                        </button>
                      </>
                    )}
                    <button onClick={() => handleDelete(res.id)} className="p-2 text-neutral-300 hover:text-red-600 hover:bg-red-50 rounded-xl" title="Delete">
                      <Trash2 size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}