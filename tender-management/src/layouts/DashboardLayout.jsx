import React from 'react';
import Sidebar from '../pages/components/dashboard/Sidebar'; 
import { Outlet } from 'react-router-dom';

export default function DashboardLayout() {
  // 1. Get dynamic data from storage
  const role = localStorage.getItem('userRole') || 'RESIDENT';
  const userName = localStorage.getItem('userName') || (role === 'ADMIN' ? 'Admin User' : 'Resident');
  
  // 2. Fetch the status from localStorage (Ensure your login logic saves this)
  // Your Supabase screenshots show values like 'APPROVED' or 'PENDING'
  const userStatus = localStorage.getItem('userStatus') || 'PENDING';

  // 3. Logic for the Verification Badge
  let userSub = '';
  if (role === 'ADMIN') {
    userSub = 'Estate Manager';
  } else {
    // We check if the status is exactly 'APPROVED'
    const isVerified = userStatus.toUpperCase() === 'APPROVED';
    
    // Format the role text (e.g., 'Resident' or 'Supplier')
    const roleText = role.charAt(0) + role.slice(1).toLowerCase();

    // If verified show "VERIFIED [ROLE]", otherwise just show "[ROLE]"
    userSub = isVerified ? `Verified ${roleText}` : `${roleText} (Pending)`;
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <Sidebar role={role} />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white border-b border-neutral-100 flex items-center justify-between px-8 shrink-0">
          <div className="relative w-96">
            <input 
              type="text" 
              placeholder={`Search ${role.toLowerCase()} portal...`} 
              className="w-full bg-neutral-100 border-none rounded-2xl py-3 px-6 text-sm font-bold"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-black text-neutral-900 leading-tight">{userName}</p>
              {/* This will now show "Verified Resident" only if status === 'APPROVED' */}
              <p className={`text-[10px] font-bold uppercase tracking-widest ${
                userSub.includes('Verified') ? 'text-green-600' : 'text-neutral-400'
              }`}>
                {userSub}
              </p>
            </div>
            
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-neutral-900 shadow-md ${
              role === 'ADMIN' ? 'bg-yellow-400' : 'bg-blue-400 text-white'
            }`}>
              {userName.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {/* Pro-Tip: You can pass the verification status via Outlet Context 
              to child pages so they can disable the "Add Item" button if not verified */}
          <Outlet context={{ isVerified: userStatus.toUpperCase() === 'APPROVED' }} />
        </main>
      </div>
    </div>
  );
}