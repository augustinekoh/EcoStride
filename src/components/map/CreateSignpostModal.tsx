import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthStore } from '../../stores/useAuthStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: [number, number] | null;
}

const EMOJI_LIST = ['🚴', '💪', '📸', '☕', '⚠️', '🌳', '🏆'];

export const CreateSignpostModal: React.FC<Props> = ({ isOpen, onClose, currentLocation }) => {
  const { user } = useAuthStore();
  const [selectedEmoji, setSelectedEmoji] = useState('🚴');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLocation) {
      alert("Cannot detect your live location to drop a signpost.");
      return;
    }
    if (!message.trim()) {
      alert("Please enter a short message.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'signposts'), {
        location: currentLocation,
        message: message.substring(0, 50),
        emoji: selectedEmoji,
        authorId: user?.uid || 'anonymous',
        authorEmail: user?.email || 'Guest Commuter',
        likes: 0,
        createdAt: Date.now()
      });
      setMessage('');
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to drop signpost.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="bg-white border-4 border-slate-900 shadow-comic rounded-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="bg-brand-pink border-b-4 border-slate-900 px-4 py-3 flex items-center justify-between">
          <h2 className="font-black text-slate-900 text-lg uppercase tracking-tight">📍 Drop a Signpost</h2>
          <button onClick={onClose} className="text-slate-900 font-bold hover:scale-110 transition-transform">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase">Select a Sticker</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_LIST.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`text-3xl p-2 rounded-xl border-2 transition-transform ${selectedEmoji === emoji ? 'border-slate-900 bg-brand-yellow scale-110 shadow-comic' : 'border-transparent hover:bg-slate-100 hover:scale-105'}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase">Your Message (Max 50 chars)</label>
            <input 
              type="text" 
              maxLength={50}
              placeholder="e.g., Keep pushing! Almost there!"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-300 focus:border-slate-900 rounded-xl px-4 py-3 font-bold text-slate-900 outline-none transition-colors"
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full mt-2 bg-brand-green border-2 border-slate-900 shadow-comic rounded-xl py-3 font-black text-slate-900 uppercase tracking-wide hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Dropping...' : 'Drop Signpost 📍'}
          </button>
        </form>
      </div>
    </div>
  );
};
