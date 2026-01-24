import React, { useState, useEffect } from 'react';
import { supportAPI } from '../../api/auth.service';
import { MessageSquare, User, Send } from 'lucide-react';

export default function AdminSupportInbox() {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');

  // 1. Fetch the list of users who have sent messages
  useEffect(() => {
    const fetchInbox = async () => {
      try {
        // You'll need to add getAdminInbox to your backend controller 
        // to return distinct users from the chat_support table
        const res = await supportAPI.getAdminInbox(); 
        setConversations(res.data.data);
      } catch (err) { console.error(err); }
    };
    fetchInbox();
  }, []);

  // 2. Fetch specific chat history when a user is clicked
  const loadChat = async (userId) => {
    setSelectedUser(userId);
    const res = await supportAPI.getChatHistory(userId);
    setMessages(res.data.data);
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    try {
      await supportAPI.adminReply(selectedUser, reply);
      setReply('');
      loadChat(selectedUser); // Refresh chat
    } catch (err) { alert("Failed to send reply"); }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden">
      {/* Sidebar: List of Users */}
      <div className="w-1/3 border-r border-neutral-100 overflow-y-auto">
        <div className="p-6 border-b border-neutral-100"><h2 className="font-black text-xl">Support Inbox</h2></div>
        {conversations.map((conv) => (
          <div 
            key={conv.user_id} 
            onClick={() => loadChat(conv.user_id)}
            className={`p-4 cursor-pointer hover:bg-neutral-50 transition-all ${selectedUser === conv.user_id ? 'bg-yellow-50 border-r-4 border-yellow-400' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className="bg-neutral-200 p-2 rounded-xl"><User size={20}/></div>
              <div className="flex-1">
                <p className="font-bold text-sm truncate">{conv.email}</p>
                <p className="text-xs text-neutral-500 uppercase font-bold">{conv.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-neutral-50">
        {selectedUser ? (
          <>
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.sender_role === 'ADMIN' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-md p-4 rounded-2xl shadow-sm ${m.sender_role === 'ADMIN' ? 'bg-black text-white' : 'bg-white text-black'}`}>
                    {m.message}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleReply} className="p-6 bg-white border-t border-neutral-100 flex gap-4">
              <input 
                value={reply} onChange={(e) => setReply(e.target.value)}
                placeholder="Type your official response..."
                className="flex-1 bg-neutral-100 rounded-xl px-4 outline-none focus:ring-2 ring-yellow-400"
              />
              <button className="bg-yellow-400 text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2">
                <Send size={18}/> Send Reply
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-400">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p className="font-bold">Select a conversation to start helping</p>
          </div>
        )}
      </div>
    </div>
  );
}