import React from 'react';
import Sidebar from '../pages/components/dashboard/Sidebar'; 
import { Outlet } from 'react-router-dom';

export default function DashboardLayout() { // Removed { children }
  const role = localStorage.getItem('userRole') || 'ADMIN';

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <Sidebar role={role} />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white border-b border-neutral-100 flex items-center justify-between px-8 shrink-0">
          <div className="relative w-96">
            <input 
              type="text" 
              placeholder="Search data..." 
              className="w-full bg-neutral-100 border-none rounded-2xl py-3 px-6 text-sm font-bold"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-black text-neutral-900 leading-tight">Admin User</p>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Estate Manager</p>
            </div>
            <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center font-black text-neutral-900 shadow-md">
              AD
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}