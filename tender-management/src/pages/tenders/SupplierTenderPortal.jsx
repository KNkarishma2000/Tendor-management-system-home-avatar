import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Info, Send } from 'lucide-react';
import TenderDetails from '../admin/TenderDetails';
import BidSubmissionPage from './BidSubmission';

export default function SupplierTenderPortal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info'); // 'info' or 'bid'

  return (
    <div className="bg-[#FAFAFA] min-h-screen">
      {/* 1. Header with Navigation */}
      <div className="p-6 md:p-10 pb-0">
        <button 
          onClick={() => navigate('/supplier/tender')}
          className="flex items-center gap-2 text-neutral-400 hover:text-black font-black text-xs uppercase tracking-widest transition-all mb-6"
        >
          <ArrowLeft size={16} /> Back to All Tenders
        </button>

        {/* 2. Custom Tab Switcher for Suppliers */}
        <div className="flex justify-center mb-10">
          <div className="flex bg-white p-1.5 rounded-[1.5rem] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <button 
              onClick={() => setActiveTab('info')}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'info' ? 'bg-black text-white' : 'text-neutral-400 hover:text-black'}`}
            >
              <Info size={14}/> Tender Information
            </button>
            <button 
              onClick={() => setActiveTab('bid')}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'bid' ? 'bg-yellow-400 text-black border-2 border-black' : 'text-neutral-400 hover:text-black'}`}
            >
              <Send size={14}/> My Bid Status / Apply
            </button>
          </div>
        </div>
      </div>

      {/* 3. Conditional Content Rendering */}
      <div className="px-6 md:px-10 pb-10">
        {activeTab === 'info' ? (
          <TenderDetails isSupplierView={true} /> 
        ) : (
          <BidSubmissionPage />
        )}
      </div>
    </div>
  );
}