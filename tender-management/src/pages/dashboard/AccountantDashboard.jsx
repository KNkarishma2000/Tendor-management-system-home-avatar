import React from 'react';
import { 
  FileSpreadsheet, 
  FileSearch, 
  RefreshCw, 
  FileUp, 
  ClipboardCheck,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AccountantDashboard() {
  const navigate = useNavigate();

  const financeTools = [
    {
      title: "Attendance Sheet",
      desc: "Manage staff and security daily logs",
      icon: ClipboardCheck,
      color: "bg-blue-50 text-blue-600",
      path: "/accountant/attendance"
    },
    {
      title: "Raw Data to Excel",
      desc: "Export system records for external audit",
      icon: FileSpreadsheet,
      color: "bg-green-50 text-green-600",
      path: "/accountant/export"
    },
    {
      title: "Invoice Extractor",
      desc: "AI-powered data extraction from PDF/Images",
      icon: FileUp,
      color: "bg-purple-50 text-purple-600",
      path: "/accountant/invoices"
    },
    {
      title: "Purchase Reconciliation",
      desc: "Match purchase orders with deliveries",
      icon: RefreshCw,
      color: "bg-orange-50 text-orange-600",
      path: "/accountant/purchasereconcilation"
    },
    {
      title: "BRS Reconciliation",
      desc: "Bank Reconciliation Statement processing",
      icon: FileSearch,
      color: "bg-red-50 text-red-600",
      path: "/accountant/bankreconcilation"
    },
    {
      title: "Zoho vs Elemensor",
      desc: "Cross-platform data sync verification",
      icon: Zap,
      color: "bg-yellow-50 text-yellow-700",
      path: "/accountant/sync"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 p-4">
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-3xl font-black text-neutral-900 tracking-tight">
          FINANCE <span className="text-blue-600">DASHBOARD</span>
        </h1>
        <p className="text-neutral-500 font-bold italic">Centralized tools for MHA accounts & audit.</p>
      </header>

      {/* Finance Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {financeTools.map((tool, index) => (
          <div 
            key={index}
            onClick={() => navigate(tool.path)}
            className="group bg-white border-2 border-neutral-100 rounded-[2.5rem] p-8 hover:border-blue-200 hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden"
          >
            <div className={`w-14 h-14 rounded-2xl ${tool.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <tool.icon size={28} />
            </div>
            
            <h3 className="text-xl font-black text-neutral-900 mb-2 uppercase tracking-tight">
              {tool.title}
            </h3>
            <p className="text-neutral-500 font-medium text-sm leading-relaxed mb-6">
              {tool.desc}
            </p>

            <div className="flex items-center text-xs font-black text-blue-600 uppercase tracking-widest gap-2 group-hover:gap-4 transition-all">
              Launch Tool <ArrowUpRight size={16} />
            </div>

            {/* Subtle background decoration */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-5 group-hover:opacity-10 transition-opacity ${tool.color.split(' ')[0]}`}></div>
          </div>
        ))}
      </div>

      {/* Footer Info Card */}
      <div className="mt-12 bg-neutral-900 rounded-[3rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black mb-2">Audit Readiness Score</h2>
          <p className="text-neutral-400 font-bold">All reconciliations are currently up to date.</p>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-3xl font-black text-green-400">98%</div>
            <div className="text-[10px] font-black uppercase text-neutral-500">Accuracy</div>
          </div>
          <div className="h-10 w-px bg-neutral-800 mx-4"></div>
          <div className="text-center">
            <div className="text-3xl font-black text-blue-400">24h</div>
            <div className="text-[10px] font-black uppercase text-neutral-500">Avg Sync</div>
          </div>
        </div>
      </div>
    </div>
  );
}