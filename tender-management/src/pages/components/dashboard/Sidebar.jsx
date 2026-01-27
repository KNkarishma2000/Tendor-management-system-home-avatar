import React from 'react';
import { LayoutDashboard, Users,UserCircle, Tent,MessageSquare,User2, Bell, FileText, Settings, LogOut, Briefcase } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../../../api/auth.service'; // Ensure this path matches your file structure

const MENU_ITEMS = {
  ADMIN: [
    { label: 'Overview', icon: LayoutDashboard, path: '/admin' },
    { label: 'Register User', icon: User2, path: '/admin/register' },
    { label: 'Residents', icon: Users, path: '/admin/residents' },
    { label: 'Carnivals', icon: Tent, path: '/admin/carnivals' },
    { label: 'Notices', icon: Bell, path: '/admin/notices' },
    { label: 'Tenders', icon: FileText, path: '/admin/tenders' },
    { label: 'Suppliers', icon: FileText, path: '/admin/suppliers' },
     { label: 'Marketplace', icon: Briefcase, path: '/admin/marketplace' },
    { label: 'Events', icon: Tent, path: '/admin/blogs' },
     { label: 'Gallery', icon: Tent, path: '/admin/gallery' },
    { label: 'Support Queries', icon: MessageSquare, path: '/admin/support' },
      
  ],
  // Add these to MENU_ITEMS in your Sidebar component
ACCOUNTANT: [
  { label: 'Overview', icon: LayoutDashboard, path: '/accountant/dashboard' },
  { label: 'Attendance', icon: Users, path: '/accountant/attendance' }, // Fixed path
  { label: 'Google Drive', icon: Settings, path: '/accountant/googledrive' }, // Match App.jsx
  { label: 'Raw Data Export', icon: FileText, path: '/accountant/export' },
  { label: 'Invoices', icon: Briefcase, path: '/accountant/invoices' },
  { label: 'Purchase Reconciliation', icon: Settings, path: '/accountant/purchasereconcilation' },
    { label: 'Bank Reconciliation', icon: Settings, path: '/accountant/bankreconcilation' },
{ label: 'Zoho VS Elemensor', icon: Settings, path: '/accountant/zohovselemensor' },
    
  
],
  SUPPLIER: [
    // { label: 'Bidding Board', icon: Briefcase, path: '/supplier/bids' },
    // { label: 'My Contracts', icon: FileText, path: '/dashboard/contracts' },
    // { label: 'Performance', icon: LayoutDashboard, path: '/dashboard/performance' },
      { label: 'Tenders', icon: LayoutDashboard, path: '/supplier/tender' },
       { label: 'Carnivals', icon: LayoutDashboard, path: '/supplier/carnival' },
  ],
  RESIDENT: [
    { label: 'Home', icon: LayoutDashboard, path: '/dashboard/resident' },
    { label: 'Marketplace', icon: Briefcase, path: '/dashboard/marketplace' },
    { label: 'Events', icon: Tent, path: '/dashboard/blogs' },
     { label: 'Gallery', icon: Tent, path: '/dashboard/gallery' },
   
  ]
};

export default function Sidebar({ role }) {
  const location = useLocation();
  const navigate = useNavigate();
  const menu = MENU_ITEMS[role] || [];
const roleHeadings = {
    ADMIN: 'MHA Admin',
    RESIDENT: 'MHA Resident',
    SUPPLIER: 'MHA Supplier',
    ACCOUNTANT: 'MHA Finance'
  };

  // 2. Fallback to 'MHA Portal' if role is undefined
  const currentHeading = roleHeadings[role] || 'MHA Portal';
  const handleLogout = async () => {
    try {
      // 1. Call the backend logout API to clear cookies/sessions
      await authAPI.logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      // 2. Clear local storage regardless of API success
      localStorage.removeItem('accessToken');
      
      // 3. Redirect user to the login or home page
      navigate('/login'); 
      
      // 4. Force a page refresh to reset the application state
      window.location.reload();
    }
  };

  return (
    <aside className="w-64 bg-[#1A1A1A] text-white flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-yellow-400 p-2 rounded-lg">
          <Briefcase className="text-black w-6 h-6" />
        </div>
       <span className="font-black text-xl tracking-tighter">
          {currentHeading}
        </span>
      </div>

      <nav className="flex-1 px-4 mt-4 space-y-2 overflow-y-auto">
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

      <div className=" border-t border-neutral-800">
        <div className="p-4 border-t border-neutral-800 space-y-2">
        {role === 'SUPPLIER' && (
          <Link
            to="/supplier/profile"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
              location.pathname === '/supplier/profile'
                ? ' text-white'
                : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <UserCircle size={20} /> My Profile
          </Link>
        )}
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 text-red-400 font-bold px-4 py-3 hover:bg-red-500/10 w-full rounded-xl transition-all"
        >
          <LogOut size={20} /> Logout
        </button>
      </div>
    </aside>
  );
}