import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, FileText, Bell, ArrowUpRight, 
  MessageSquare, Briefcase, CheckCircle, Loader2 
} from 'lucide-react';
import { communityAPI, authResidentAPI, tenderAdminAPI, supportAPI } from '../../api/auth.service';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    pendingResidents: 0,
    activeTenders: 0,
    unreadSupport: 0,
    pendingContent: 0,
    totalNewBids: 0, // Track bid count
    notifications: []
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      const [resResp, tendResp, contentResp, supportResp] = await Promise.all([
        authResidentAPI.getPendingResidents(),
        tenderAdminAPI.getAllTenders(),
        communityAPI.getPendingContent(), 
        supportAPI.getAdminInbox()         
      ]);

      // 1. TENDER & BIDS LOGIC
      const allTenders = tendResp.data?.data || [];
      const tendersWithBids = allTenders.filter(t => (t.bid_count || 0) > 0);
      const totalBidsReceived = tendersWithBids.reduce((sum, t) => sum + (t.bid_count || 0), 0);

      // 2. CONTENT MODERATION LOGIC (Filtered for 'pending' status)
      const pendingData = contentResp.data?.pending || {};
      const pendingBlogs = (pendingData.blogs || []).filter(b => b.status?.toLowerCase() === 'pending');
      const pendingItems = (pendingData.items || []).filter(i => i.status?.toLowerCase() === 'pending');
      const pendingGallery = (pendingData.gallery || []).filter(g => g.status?.toLowerCase() === 'pending');
      const totalPendingContent = pendingBlogs.length + pendingItems.length + pendingGallery.length;

      // 3. RESIDENTS & SUPPORT PARSING
      const residentsArr = Array.isArray(resResp.data) ? resResp.data : (resResp.data.data || []);
      const supportConversations = Array.isArray(supportResp.data) ? supportResp.data : (supportResp.data.data || []);

      // 4. GENERATE DYNAMIC ALERTS
      const alerts = [];

      if (residentsArr.length > 0) {
        alerts.push({
          id: 'res_pending',
          title: 'Resident Verification',
          description: `${residentsArr.length} registration requests pending`,
          path: '/admin/residents',
          icon: Users,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50'
        });
      }

      if (totalBidsReceived > 0) {
        alerts.push({
          id: 'tender_bids',
          title: 'New Tender Bids',
          description: `${totalBidsReceived} bids received across ${tendersWithBids.length} tenders`,
          path: '/admin/tenders',
          icon: Briefcase,
          color: 'text-emerald-500',
          bgColor: 'bg-emerald-50'
        });
      }

      if (totalPendingContent > 0) {
        alerts.push({
          id: 'content_pending',
          title: 'Content Moderation',
          description: `${totalPendingContent} items waiting in approvals queue`,
          path: '/admin/approvals',
          icon: CheckCircle,
          color: 'text-orange-500',
          bgColor: 'bg-orange-50'
        });
      }

      if (supportConversations.length > 0) {
        alerts.push({
          id: 'support_msg',
          title: 'Support Inbox',
          description: `You have ${supportConversations.length} active support queries`,
          path: '/admin/support',
          icon: MessageSquare,
          color: 'text-purple-500',
          bgColor: 'bg-purple-50'
        });
      }

      setData({
        pendingResidents: residentsArr.length,
        activeTenders: allTenders.length,
        unreadSupport: supportConversations.length,
        pendingContent: totalPendingContent,
        totalNewBids: totalBidsReceived,
        notifications: alerts
      });

    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-yellow-400" />
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500 space-y-8 p-2">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 tracking-tighter uppercase italic">Mission Control</h1>
          <p className="text-neutral-400 font-bold text-sm">Real-time administration hub</p>
        </div>
        <button onClick={fetchDashboardStats} className="p-3 bg-white border border-neutral-200 rounded-2xl hover:bg-neutral-50 transition-all shadow-sm">
          <ArrowUpRight size={20} />
        </button>
      </header>

      {/* Grid of 4 key numbers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Users} 
          label="Pending Residents" 
          value={data.pendingResidents} 
          urgent={data.pendingResidents > 0}
          onClick={() => navigate('/admin/residents')}
        />
        <StatCard 
          icon={CheckCircle} 
          label="Pending Content" 
          value={data.pendingContent} 
          urgent={data.pendingContent > 0}
          onClick={() => navigate('/admin/approvals')}
        />
        <StatCard 
          icon={Briefcase} 
          label="New Bids" 
          value={data.totalNewBids} 
          urgent={data.totalNewBids > 0}
          onClick={() => navigate('/admin/tenders')}
        />
        <StatCard 
          icon={FileText} 
          label="Active Tenders" 
          value={data.activeTenders} 
        />
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-neutral-100 min-h-[400px]">
          <h3 className="text-xl font-black mb-8 flex items-center gap-2 italic uppercase tracking-tight">
            <Bell className="text-yellow-500" size={24} /> Immediate Attention Required
          </h3>
          
          <div className="space-y-4">
            {data.notifications.length > 0 ? (
              data.notifications.map((note) => (
                <div 
                  key={note.id}
                  onClick={() => navigate(note.path)}
                  className={`flex items-center justify-between p-6 ${note.bgColor} border border-transparent hover:border-neutral-200 rounded-[2rem] cursor-pointer transition-all group hover:shadow-md`}
                >
                  <div className="flex items-center gap-5">
                    <div className="bg-white p-4 rounded-2xl shadow-sm">
                      <note.icon size={24} className={note.color} />
                    </div>
                    <div>
                      <p className="font-black text-neutral-900 text-lg tracking-tight">{note.title}</p>
                      <p className="text-sm font-bold text-neutral-500">{note.description}</p>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                    <ArrowUpRight size={20} className="text-neutral-900" />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="bg-green-50 text-green-500 p-6 rounded-full mb-4 animate-bounce">
                  <CheckCircle size={48} />
                </div>
                <p className="font-black text-neutral-900 text-xl tracking-tight uppercase italic">Everything Clear</p>
                <p className="text-neutral-400 font-bold text-sm">All approvals and bids are up to date.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ icon: Icon, label, value, urgent, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white p-7 rounded-[2.5rem] shadow-sm border border-neutral-100 transition-all group ${onClick ? 'cursor-pointer hover:border-yellow-400 hover:shadow-xl' : ''}`}
  >
    <div className={`p-4 rounded-2xl w-fit mb-6 transition-all ${urgent ? 'bg-red-50 text-red-500 group-hover:bg-red-500 group-hover:text-white' : 'bg-neutral-50 text-neutral-900 group-hover:bg-yellow-400'}`}>
      <Icon size={24} />
    </div>
    <div className="text-6xl font-black mb-1 text-neutral-900 tracking-tighter italic">{value}</div>
    <div className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">{label}</div>
    {urgent && <div className="mt-4 text-[10px] font-black text-red-500 bg-red-50 px-3 py-1 rounded-full w-fit animate-pulse">ACTION REQUIRED</div>}
  </div>
);