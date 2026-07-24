import React from 'react';
import { X, User } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: any | null;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, player }) => {
  if (!isOpen || !player) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
      <div className="bg-brand-cream border-4 border-slate-900 shadow-comic rounded-3xl w-full max-w-sm max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-90 duration-300 relative">
        
        {/* Header */}
        <div className="bg-slate-900 p-4 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-2">
            <User className="text-brand-pink" size={24} />
            <h2 className="text-xl font-black uppercase tracking-wider text-brand-pink">User Profile</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content - Placeholder */}
        <div className="p-6 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-24 h-24 rounded-full border-4 border-slate-900 bg-white flex items-center justify-center text-5xl shadow-comic">
            {player.avatar || '👤'}
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">{player.name || player.email}</h3>
            <p className="text-sm font-bold text-slate-500">{player.guildName || 'Independent Explorer'}</p>
          </div>
          
          <div className="bg-slate-100 border-2 border-slate-900 border-dashed rounded-xl p-4 w-full mt-4 opacity-70">
            <p className="text-slate-500 font-bold text-sm uppercase mb-2">Profile Stats</p>
            <p className="text-xs text-slate-400">Detailed user profile, activity timeline, and achievements will be displayed here.</p>
            <p className="text-xs font-black text-brand-green mt-2">(Coming in Phase 2)</p>
          </div>
        </div>

      </div>
    </div>
  );
};
