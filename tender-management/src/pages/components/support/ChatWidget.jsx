import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Minus, ChevronRight } from 'lucide-react';
import { supportAPI } from '../../../api/auth.service';

const ROLE_OPTIONS = {
  RESIDENT: ["Marketplace Listing Issue", "Blog/Post Support", "Gallery Upload Error", "Maintenance Request", "Account/Login Issue"],
  ACCOUNTANT: ["Bank Reconciliation Query", "Zoho vs Elemensor Sync", "Invoices/Payments Issue", "Raw Data Export Error", "Attendance/Payroll Issue"],
  SUPPLIER: ["Tender/Bidding Query", "Carnival Application Status", "Payment/Invoice Issue", "Profile Update Request", "Technical Bug"],
  MC: ["Notice Board Management", "Resident Approval Issue", "Finance Report Access", "Technical Bug", "General Feedback"]
};

const DEFAULT_OPTIONS = ["General Query", "Technical Support", "Login Issue"];

export default function ChatWidget({ role }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState('options'); 
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const chatContainerRef = useRef(null);
  const isFetching = useRef(false); // Ref to prevent request overlap

  const userRole = localStorage.getItem('userRole');
  const quickOptions = ROLE_OPTIONS[userRole] || DEFAULT_OPTIONS;

  // 1. Auto-scroll Logic
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // 2. Optimized Sync Function
  const syncChat = async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    try {
      const res = await supportAPI.getChatHistory();
      if (res.data.success) {
        setChatHistory(res.data.data);
      }
    } catch (err) {
      console.error("Sync failed", err);
    } finally {
      isFetching.current = false;
    }
  };

  // 3. SINGLE Interval Effect (Replaces the two duplicates you had)
  useEffect(() => {
    let interval;
    if (isOpen && step === 'chat') {
      // Fetch immediately on open
      syncChat();
      
      // Start polling
      interval = setInterval(() => {
        if (document.visibilityState === 'visible' && !isFetching.current) {
          syncChat();
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isOpen, step]);

  // Initial check when opening widget
  useEffect(() => {
    if (isOpen) {
      checkExistingChat();
    }
  }, [isOpen]);

  const checkExistingChat = async () => {
    setLoading(true);
    try {
      const res = await supportAPI.getChatHistory();
      if (res.data.success && res.data.data.length > 0) {
        setChatHistory(res.data.data);
        setStep('chat');
      } else {
        setStep('options');
      }
    } catch (err) {
      console.error("Initial check failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (selectedCategory) => {
    setLoading(true);
    try {
      const initialMessage = `I have a query regarding: ${selectedCategory}`;
      await supportAPI.sendQuery(initialMessage);
      setStep('chat');
      await syncChat(); 
    } catch (err) {
      alert("Could not start chat. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    if (!message.trim() || !token) return;

    const userMsg = message;
    setMessage(''); 

    // OPTIMISTIC UPDATE: Show bubble immediately
    const tempMsg = {
      message: userMsg,
      sender_role: userRole,
      created_at: new Date().toISOString()
    };
    setChatHistory(prev => [...prev, tempMsg]);

    try {
      await supportAPI.sendQuery(userMsg);
      syncChat(); // Final sync to get server timestamp/ID
    } catch (err) { 
      console.error("Send failed:", err);
    }
  };

  if (userRole === 'ADMIN') return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="w-80 h-[480px] bg-white rounded-3xl shadow-2xl border border-neutral-100 flex flex-col overflow-hidden mb-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-yellow-400 p-5 flex justify-between items-center text-neutral-900">
            <div>
              <p className="font-black text-sm uppercase tracking-wider">MHA Support</p>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold opacity-80">Support Online</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-black/10 rounded-full transition-colors">
              <X size={20}/>
            </button>
          </div>

          {step === 'options' ? (
            <div className="flex-1 p-6 space-y-3 overflow-y-auto">
              <div className="text-center mb-6">
                <p className="font-black text-xl text-neutral-900">Hello! 👋</p>
                <p className="text-sm font-bold text-neutral-500">
                  {userRole === 'ACCOUNTANT' ? "Staff Portal Support" : "How can we help today?"}
                </p>
              </div>
              {quickOptions.map((opt) => (
                <button key={opt} onClick={() => handleStartChat(opt)} className="w-full text-left p-4 rounded-2xl border border-neutral-100 hover:border-yellow-400 hover:bg-yellow-50 transition-all flex justify-between items-center group shadow-sm hover:shadow-md">
                  <span className="text-sm font-bold text-neutral-700">{opt}</span>
                  <ChevronRight size={16} className="text-neutral-300 group-hover:text-yellow-600 group-hover:translate-x-1 transition-all"/>
                </button>
              ))}
            </div>
          ) : (
            <>
              <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4 bg-neutral-50/50">
                {chatHistory.map((chat, i) => (
                  <div key={i} className={`flex ${chat.sender_role === 'ADMIN' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm shadow-sm ${
                      chat.sender_role === 'ADMIN' 
                      ? 'bg-white border border-neutral-100 text-neutral-800 rounded-tl-none' 
                      : 'bg-yellow-400 text-neutral-900 font-bold rounded-tr-none'
                    }`}>
                      {chat.message}
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendMessage} className="p-4 border-t bg-white flex gap-2">
                <input 
                  value={message} onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..." 
                  className="flex-1 text-sm bg-neutral-100 p-3 rounded-xl border-none focus:ring-2 focus:ring-yellow-400 outline-none font-medium"
                />
                <button type="submit" disabled={!message.trim()} className="bg-neutral-900 text-white p-3 rounded-xl hover:bg-neutral-800 transition-all disabled:opacity-50">
                  <Send size={18}/>
                </button>
              </form>
            </>
          )}
        </div>
      )}

      <button onClick={() => setIsOpen(!isOpen)} className="bg-yellow-400 text-neutral-900 p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center gap-3 font-black border-4 border-white">
        {isOpen ? <Minus size={24}/> : <MessageCircle size={24}/>}
        {!isOpen && <span className="pr-1 uppercase text-sm tracking-tighter">Get Help</span>}
      </button>
    </div>
  );
}