import React, { useState, useEffect } from 'react';
import { 
  Loader2, ArrowLeft, X, Ban, CheckCircle, Search,
  UserCheck, Mail, Phone, Home, Calendar, ShieldCheck, Users,
  ExternalLink, User
} from 'lucide-react';
import { authResidentAPI } from '../../api/auth.service';
import toast from 'react-hot-toast';

export default function ResidentManagement() {
  const [residents, setResidents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedResident, setSelectedResident] = useState(null);

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

  const handleResidentAction = async (id, actionType) => {
    try {
      const actionToSend = actionType === 'approve' ? 'APPROVE' : 'REJECT';
      const optimisticStatus = actionType === 'approve' ? 'APPROVED' : 'REJECTED';
      
      setSelectedResident(prev => ({ ...prev, status: optimisticStatus }));
      await authResidentAPI.approveResident(id, { action: actionToSend });
      toast.success(`Resident ${optimisticStatus}`);
      fetchResidents();
    } catch (error) {
      toast.error(`Failed to ${actionType} resident`);
      fetchResidents(); 
    }
  };

  const filteredResidents = residents.filter(res => 
    res.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    res.block.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#fbfbfb]">
      <div className="text-center">
        <Loader2 className="animate-spin text-yellow-500 w-12 h-12 mx-auto mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Loading Directory</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fbfbfb] p-4 md:p-8">
      {selectedResident ? (
        <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button 
            onClick={() => setSelectedResident(null)} 
            className="flex items-center gap-2 text-neutral-400 hover:text-black font-black text-[10px] tracking-widest mb-8 transition-all group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> BACK TO DIRECTORY
          </button>
          
          <div className="bg-white rounded-[3rem] shadow-xl shadow-neutral-200/50 border border-neutral-100 overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              {/* Profile Main Info */}
              <div className="flex-1 p-8 md:p-12">
                <div className="flex items-center gap-3 mb-6">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    selectedResident.status?.toUpperCase() === 'APPROVED' ? 'bg-green-100 text-green-700' :
                    selectedResident.status?.toUpperCase() === 'REJECTED' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {selectedResident.status || 'PENDING'}
                  </span>
                </div>
                
                <h1 className="text-5xl md:text-6xl font-black text-neutral-900 mb-8 tracking-tighter">
                  {selectedResident.full_name}
                </h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailCard icon={<Home size={20}/>} label="Unit" value={`${selectedResident.block} - ${selectedResident.flat_no}`} color="text-yellow-500" />
                  <DetailCard icon={<Mail size={20}/>} label="Email" value={selectedResident.users?.email || 'N/A'} color="text-blue-500" />
                  <DetailCard icon={<Phone size={20}/>} label="Phone" value={selectedResident.mobile_no || 'N/A'} color="text-green-500" />
                  <DetailCard icon={<Users size={20}/>} label="Family Size" value={`${selectedResident.family_members} Members`} color="text-purple-500" />
                </div>
              </div>

              {/* Action Sidebar */}
              <div className="bg-neutral-900 lg:w-80 p-8 md:p-12 flex flex-col justify-center">
                <p className="text-[10px] font-black text-neutral-500 uppercase mb-8 tracking-[0.3em] text-center">Administrative Control</p>
                
                <div className="space-y-4">
                  {selectedResident.status?.toUpperCase() !== 'APPROVED' && (
                    <button 
                      onClick={() => handleResidentAction(selectedResident.id, 'approve')}
                      className="w-full bg-white text-black hover:bg-green-500 hover:text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-3"
                    >
                      <UserCheck size={18} /> Approve Resident
                    </button>
                  )}

                  {selectedResident.status?.toUpperCase() !== 'REJECTED' && (
                    <button 
                      onClick={() => handleResidentAction(selectedResident.id, 'reject')}
                      className="w-full bg-white/5 text-white hover:bg-red-500 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-3 border border-white/10"
                    >
                      <Ban size={18} /> Deny Access
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
            <div>
              <h2 className="text-4xl font-black text-neutral-900 tracking-tighter">Resident Directory</h2>
              <p className="text-neutral-400 font-bold text-sm">Managing {residents.length} registered households</p>
            </div>
            
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300 group-focus-within:text-yellow-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search by name or block..."
                className="bg-white border border-neutral-200 rounded-2xl py-4 pl-12 pr-6 w-full md:w-80 focus:outline-none focus:ring-4 focus:ring-yellow-500/10 focus:border-yellow-500 transition-all font-bold text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-neutral-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-neutral-50/50">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-400">Resident Details</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-400">Unit Number</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-400">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {filteredResidents.map(res => (
                    <tr 
                      key={res.id} 
                      onClick={() => setSelectedResident(res)} 
                      className="group hover:bg-neutral-50/80 transition-all cursor-pointer"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-400 group-hover:bg-yellow-100 group-hover:text-yellow-600 transition-colors">
                            <User size={20} />
                          </div>
                          <div>
                            <p className="font-black text-neutral-900 group-hover:text-yellow-600 transition-colors">{res.full_name}</p>
                            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">{res.users?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 font-black text-neutral-500 text-xs">
                        {res.block} <span className="text-neutral-300 mx-1">/</span> {res.flat_no}
                      </td>
                      <td className="px-8 py-6">
                        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${
                           res.status?.toUpperCase() === 'APPROVED' ? 'bg-green-100 text-green-700' :
                           res.status?.toUpperCase() === 'REJECTED' ? 'bg-red-100 text-red-600' : 
                           'bg-yellow-100 text-yellow-700'
                        }`}>
                          {res.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className="inline-flex items-center gap-2 text-[10px] font-black text-neutral-300 group-hover:text-black transition-colors uppercase tracking-widest">
                          View Profile <ExternalLink size={12} />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredResidents.length === 0 && (
                <div className="p-20 text-center">
                  <p className="font-black text-neutral-300 uppercase tracking-widest">No residents found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Component for UI consistency
// Find the DetailCard component at the bottom of your Resident.jsx
function DetailCard({ icon, label, value, color }) {
  return (
    <div className="flex items-center gap-5 p-6 bg-neutral-50 rounded-[2rem] hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-neutral-100 min-w-0">
      <div className={`flex-shrink-0 bg-white p-4 rounded-2xl shadow-sm ${color}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1"> {/* min-w-0 is critical for text wrapping in flexbox */}
        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">
          {label}
        </p>
        <p className="font-bold text-neutral-900 leading-tight break-all text-sm md:text-base">
          {value}
        </p>
      </div>
    </div>
  );
}