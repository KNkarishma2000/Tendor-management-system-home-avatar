import React from 'react';
import { LayoutDashboard, Users, Tent, Bell, FileText, Settings, LogOut, Briefcase } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const MENU_ITEMS = {
  ADMIN: [
    { label: 'Overview', icon: LayoutDashboard, path: '/admin' },
    { label: 'Residents', icon: Users, path: '/admin/residents' },
    { label: 'Carnivals', icon: Tent, path: '/admin//carnivals' },
    { label: 'Notices', icon: Bell, path: '/admin/notices' },
    { label: 'Tenders', icon: FileText, path: '/admin/tenders' },
    { label: 'Suppliers', icon: FileText, path: '/admin/suppliers' },
  ],
  SUPPLIER: [
    { label: 'Bidding Board', icon: Briefcase, path: '/dashboard/bids' },
    { label: 'My Contracts', icon: FileText, path: '/dashboard/contracts' },
    { label: 'Performance', icon: LayoutDashboard, path: '/dashboard/performance' },
  ],
  RESIDENT: [
    { label: 'Home', icon: LayoutDashboard, path: '/dashboard/resident' },
    { label: 'Marketplace', icon: Briefcase, path: '/dashboard/marketplace' },
    { label: 'Events', icon: Tent, path: '/dashboard/events' },
  ]
};

export default function Sidebar({ role }) {
  const location = useLocation();
  const menu = MENU_ITEMS[role] || [];

  return (
    <aside className="w-64 bg-[#1A1A1A] text-white flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-yellow-400 p-2 rounded-lg">
          <Briefcase className="text-black w-6 h-6" />
        </div>
        <span className="font-black text-xl tracking-tighter">MHA Admin</span>
      </div>

      <nav className="flex-1 px-4 mt-4 space-y-2">
        {menu.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              location.pathname === item.path 
              ? 'bg-yellow-400 text-black' 
              : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <item.icon size={20} />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-neutral-800">
        <button className="flex items-center gap-3 text-red-400 font-bold px-4 py-3 hover:bg-red-500/10 w-full rounded-xl transition-all">
          <LogOut size={20} /> Logout
        </button>
      </div>
    </aside>
  );
}