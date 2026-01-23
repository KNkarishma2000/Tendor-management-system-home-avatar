import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Minus, ChevronRight } from 'lucide-react';
import { supportAPI } from '../../../api/auth.service';

const QUICK_OPTIONS = [
  "Tender Query",
  "Carnival Application",
  "Account/Login Issue",
  "Technical Bug",
  "General Feedback"
];

export default function ChatWidget({ role }) {
const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState('options'); 
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);// 'options' or 'chat'
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  
  const chatContainerRef = useRef(null);

  // Get user details from localStorage
  const userEmail = localStorage.getItem('userEmail');
  const userRole = localStorage.getItem('userRole');

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
        setStep('chat'); // Skip options if messages exist
      } else {
        setStep('options'); // New user, show options
      }
    } catch (err) {
      console.error("Chat sync failed", err);
    } finally {
      setLoading(false);
    }
  };

  // Standard auto-refresh for active chat
  useEffect(() => {
    if (isOpen && step === 'chat') {
      const interval = setInterval(async () => {
        const res = await supportAPI.getChatHistory();
        if (res.data.success) setChatHistory(res.data.data);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, step]);
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    try {
      await supportAPI.sendQuery(message);
      setMessage('');
      fetchHistory();
    } catch (err) { alert("Failed to send"); }
  };

  if (role === 'ADMIN') return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="w-80 h-[450px] bg-white rounded-2xl shadow-2xl border flex flex-col overflow-hidden mb-4">
          <div className="bg-yellow-400 p-4 flex justify-between items-center text-black">
            <span className="font-bold">MHA Support</span>
            <button onClick={() => setIsOpen(false)}><X size={20}/></button>
          </div>

          {step === 'options' ? (
            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
              <div className="text-center mb-4">
                <p className="font-black text-lg">Hello! 👋</p>
                <p className="text-sm text-neutral-500">What is your query related to?</p>
              </div>
              {QUICK_OPTIONS.map((opt) => (
                <button 
                  key={opt}
                  onClick={() => handleStartChat(opt)}
                  className="w-full text-left p-3 rounded-xl border border-neutral-100 hover:border-yellow-400 hover:bg-yellow-50 transition-all flex justify-between items-center group"
                >
                  <span className="text-sm font-bold text-neutral-700">{opt}</span>
                  <ChevronRight size={16} className="text-neutral-300 group-hover:text-yellow-600"/>
                </button>
              ))}
            </div>
          ) : (
            <>
              <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-3 bg-neutral-50">
                {chatHistory.map((chat, i) => (
                  <div key={i} className={`flex ${chat.sender_role === 'ADMIN' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${chat.sender_role === 'ADMIN' ? 'bg-white border text-neutral-800' : 'bg-yellow-400 text-black font-medium'}`}>
                      {chat.message}
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendMessage} className="p-3 border-t bg-white flex gap-2">
                <input 
                  value={message} onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type details..." className="flex-1 text-sm bg-neutral-100 p-2 rounded-lg outline-none"
                />
                <button className="bg-black text-white p-2 rounded-lg"><Send size={18}/></button>
              </form>
            </>
          )}
        </div>
      )}

      <button onClick={() => setIsOpen(!isOpen)} className="bg-yellow-400 text-black p-4 rounded-full shadow-xl hover:scale-110 transition-all flex items-center gap-2 font-bold">
        {isOpen ? <Minus size={24}/> : <MessageCircle size={24}/>}
        {!isOpen && <span>Help</span>}
      </button>
    </div>
  );
}