import React, { useState, useEffect } from 'react';
import { Users, Tent, FileText, Bell, Send, Loader2, ArrowUpRight } from 'lucide-react';
// Importing the API services you provided
import { 
  communityAPI, 
  authResidentAPI, 
  tenderAdminAPI 
} from '../../api/auth.service'; 
// import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    residentCount: 0,
    carnivalCount: 0,
    tenderCount: 0,
    noticeCount: 0,
    recentActivity: []
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
  try {
    setLoading(true);
    
    // 1. Fire off the requests
    const [resResp, carnResp, tendResp, noteResp] = await Promise.all([
      authResidentAPI.getPendingResidents(),
      communityAPI.getCarnivals(),
      tenderAdminAPI.getAllTenders(),
      communityAPI.getNotices()
    ]);

    // 2. LOG THE DATA to see exactly what is coming back
    console.log("Residents Raw:", resResp.data); 
    
    // 3. Handle different response shapes safely
    // Note: If backend returns { data: [...] }, we need resResp.data.data
    // If backend returns [...], we need resResp.data
    const residentsArr = Array.isArray(resResp.data) ? resResp.data : (resResp.data.data || []);
    const carnivalsArr = Array.isArray(carnResp.data) ? carnResp.data : (carnResp.data.data || []);
    const tendersArr = Array.isArray(tendResp.data) ? tendResp.data : (tendResp.data.data || []);
    const noticesArr = Array.isArray(noteResp.data) ? noteResp.data : (noteResp.data.data || []);

    const allActivities = [
      ...carnivalsArr.map(c => ({ ...c, type: 'carnival', title: c.name, date: c.created_at })),
      ...tendersArr.map(t => ({ ...t, type: 'tender', title: t.title, date: t.created_at })),
      ...noticesArr.map(n => ({ ...n, type: 'notice', title: n.title, date: n.created_at }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);

    setData({
      residentCount: residentsArr.length,
      carnivalCount: carnivalsArr.length,
      tenderCount: tendersArr.length,
      noticeCount: noticesArr.length,
      recentActivity: allActivities
    });

  } catch (error) {
    console.error("Fetch Error:", error);
  } finally {
    setLoading(false);
  }
};

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-yellow-400" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 uppercase tracking-tight">Overview</h1>
          <p className="text-neutral-400 font-bold text-sm">Real-time community metrics</p>
        </div>
        <button 
          onClick={fetchDashboardStats}
          className="p-2 hover:rotate-180 transition-all duration-500 text-neutral-400"
        >
          <ArrowUpRight size={20} />
        </button>
      </header>

      {/* 4-Column Stat Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard 
          icon={Users} 
          label="Pending Residents" 
          value={data.residentCount} 
          growth={data.residentCount > 0 ? "Action Required" : "All Clear"} 
          color="text-blue-600"
        />
        <StatCard 
          icon={Tent} 
          label="Upcoming Carnivals" 
          value={data.carnivalCount} 
        />
        <StatCard 
          icon={FileText} 
          label="Active Tenders" 
          value={data.tenderCount} 
        />
        <StatCard 
          icon={Bell} 
          label="Global Notices" 
          value={data.noticeCount} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity Table */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-neutral-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black italic">Recent Activity</h3>
            <button className="text-sm font-bold text-neutral-400 hover:text-black transition-colors">View All</button>
          </div>
          
          <div className="space-y-6">
            {data.recentActivity.length > 0 ? (
              data.recentActivity.map((item, index) => (
                <ActivityItem 
                  key={index}
                  icon={item.type === 'carnival' ? Tent : item.type === 'tender' ? FileText : Bell} 
                  color={item.type === 'carnival' ? "bg-yellow-100" : item.type === 'tender' ? "bg-blue-100" : "bg-red-100"} 
                  text={item.title || item.name || "New Update Posted"} 
                  time={item.date || "Just now"} 
                />
              ))
            ) : (
              <div className="text-center py-10 text-neutral-400 font-bold italic">
                No recent activity to show.
              </div>
            )}
          </div>
        </div>

        {/* Maintenance Funds Card */}
        <div className="bg-[#1A1A1A] rounded-[2.5rem] p-8 text-white flex flex-col justify-between min-h-[400px]">
          <div>
            <h3 className="text-xl font-bold mb-1">Maintenance Funds</h3>
            <p className="text-neutral-400 text-sm font-medium">Collection Status (Jan)</p>
          </div>
          
          <div className="flex justify-center py-8">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-neutral-800" />
                <circle cx="80" cy="80" r="70" stroke="#FFD700" strokeWidth="12" fill="transparent" strokeDasharray="440" strokeDashoffset="110" strokeLinecap="round" className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black">75%</span>
                <span className="text-[10px] uppercase font-bold text-neutral-400">Collected</span>
              </div>
            </div>
          </div>

          <button className="w-full bg-yellow-400 text-black py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-yellow-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-yellow-400/20">
            Send Reminders <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Internal Components ---

const StatCard = ({ icon: Icon, label, value, growth, color = "text-green-600" }) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-neutral-100 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-neutral-50 rounded-2xl text-neutral-900 group-hover:bg-yellow-400 group-hover:rotate-12 transition-all duration-300">
        <Icon size={24} />
      </div>
      {growth && (
        <span className={`text-[10px] font-black ${color} bg-neutral-50 px-2 py-1 rounded-full uppercase tracking-tighter`}>
          {growth}
        </span>
      )}
    </div>
    <div className="text-4xl font-black mb-1 text-neutral-900">{value}</div>
    <div className="text-xs font-bold text-neutral-400 uppercase tracking-widest">{label}</div>
  </div>
);

const ActivityItem = ({ icon: Icon, color, text, time }) => (
  <div className="flex items-center justify-between group cursor-pointer p-2 hover:bg-neutral-50 rounded-2xl transition-all">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-2xl ${color} group-hover:scale-110 transition-transform`}>
        <Icon size={20} className="text-neutral-900" /> 
      </div>
      <div>
        <p className="font-black text-neutral-900 group-hover:text-yellow-600 transition-colors line-clamp-1">{text}</p>
        <p className="text-xs font-bold text-neutral-400">{time}</p>
      </div>
    </div>
    <div className="text-neutral-300 group-hover:text-neutral-900 group-hover:translate-x-1 transition-all">
        <Send size={16} className="rotate-45" />
    </div>
  </div>
);