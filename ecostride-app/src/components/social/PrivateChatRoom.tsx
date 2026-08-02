import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, ArrowLeft, Send, User } from 'lucide-react';
import { useCommunityChat } from '../../hooks/useCommunityChat';
import { auth } from '../../firebase';
import { useDemoStore } from '../../stores/useDemoStore';

export function PrivateChatRoom() {
  const { activePrivateChat, setActivePrivateChat } = useDemoStore();
  const [token, setToken] = useState<string | null>(null);
  
  const currentUserId = auth.currentUser?.uid;
  const friendId = activePrivateChat?.friendId || '';
  
  // Generate unique room ID for the 2 users
  const roomId = currentUserId && friendId 
    ? `1to1_${[currentUserId, friendId].sort().join('_')}` 
    : '';

  const { messages, isConnected, sendMessage } = useCommunityChat(roomId, token);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    auth.currentUser?.getIdToken().then(t => setToken(t)).catch(console.error);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && isConnected) {
      sendMessage(inputMessage);
      setInputMessage("");
    }
  };

  if (!activePrivateChat || !currentUserId) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#faf9f6]/95 backdrop-blur-xl flex flex-col pointer-events-auto">
      <div className="flex-1 w-full h-full flex flex-col">
        {/* Header */}
        <div className="px-4 py-4 border-b border-black/10 flex items-center bg-white/60 backdrop-blur-md">
          <button 
            onClick={() => setActivePrivateChat(null)}
            className="p-2 mr-3 rounded-full hover:bg-black/5 text-[#5496a2] hover:text-[#1d3539] transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--color-teal-dark)] to-[var(--color-teal-light)] flex items-center justify-center">
              <User size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#1d3539]">{activePrivateChat.friendUsername}</h2>
              <div className="flex items-center text-xs font-bold text-[#5496a2]">
                <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'}`} />
                {isConnected ? 'Connected' : 'Connecting...'}
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-slate-500 font-bold">
              No messages yet. Say hi to {activePrivateChat.friendUsername}!
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.user_id === currentUserId;
              const messageDate = new Date(msg.created_at);
              const messageDateString = messageDate.toDateString();
              
              let showDateDivider = false;
              let dateHeaderText = '';
              
              if (idx === 0) {
                showDateDivider = true;
              } else {
                const prevDate = new Date(messages[idx - 1].created_at);
                if (prevDate.toDateString() !== messageDateString) {
                  showDateDivider = true;
                }
              }

              if (showDateDivider) {
                const today = new Date();
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                
                if (messageDateString === today.toDateString()) {
                  dateHeaderText = 'Today';
                } else if (messageDateString === yesterday.toDateString()) {
                  dateHeaderText = 'Yesterday';
                } else {
                  dateHeaderText = messageDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                }
              }

              return (
                <React.Fragment key={msg.id || idx}>
                  {showDateDivider && (
                    <div className="flex justify-center my-6">
                      <span className="bg-white text-[#5496a2] text-xs font-bold px-3 py-1 rounded-full border border-[#1d3539]/10 shadow-sm">
                        {dateHeaderText}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                      isMe 
                        ? 'bg-gradient-to-br from-[var(--color-teal-dark)] to-emerald-600 text-white rounded-tr-sm' 
                        : 'bg-white text-[#1d3539] border border-[#1d3539]/10 rounded-tl-sm'
                    }`}>
                      <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                      <div className={`text-[10px] mt-1 font-bold ${isMe ? 'text-emerald-100' : 'text-slate-400'} text-right`}>
                        {messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white/60 border-t border-[#1d3539]/10 backdrop-blur-md pb-8">
          <form onSubmit={handleSend} className="relative max-w-2xl mx-auto">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={!isConnected}
              className="w-full bg-white text-[#1d3539] placeholder-slate-400 rounded-full py-4 pl-6 pr-14 outline-none border border-[#1d3539]/10 shadow-sm font-medium focus:border-[var(--color-teal-dark)] focus:ring-4 focus:ring-[var(--color-teal-dark)]/20 transition-all"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || !isConnected}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[var(--color-teal-dark)] text-white rounded-full hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send size={18} className="translate-x-[-1px] translate-y-[1px]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
