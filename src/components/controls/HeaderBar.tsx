import React, { useState } from 'react';
import { useDemoStore } from '../../stores/useDemoStore';
import { useUserStore } from '../../stores/useUserStore';
import { Map, LayoutDashboard, Play, Pause, Menu, X, Trophy } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { auth } from '../../firebase';
import { LeaderboardModal } from '../modals/LeaderboardModal';

export const HeaderBar: React.FC = () => {
  const { currentMode, setMode, isAutoPlaying, setIsAutoPlaying, activeView, setActiveView } = useDemoStore();
  const { userCoins } = useUserStore();
  const { user, role } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  return (
    <div className="absolute top-4 left-4 z-50">
      {/* Hamburger Button */}
      <button 
        onClick={() => setMenuOpen(!menuOpen)}
        className="bg-white p-3 rounded-full border-2 border-slate-900 shadow-comic hover:bg-slate-100 transition-colors"
      >
        {menuOpen ? <X size={24} className="text-slate-900" /> : <Menu size={24} className="text-slate-900" />}
      </button>

      {/* Menu Drawer */}
      {menuOpen && (
        <div className="absolute top-16 left-0 w-64 bg-white/95 backdrop-blur-md border-2 border-slate-900 shadow-comic rounded-3xl p-4 flex flex-col gap-4 animate-in slide-in-from-left-4 fade-in duration-200">
          
          {/* User Profile Summary */}
          <div className="flex flex-col gap-1 pb-3 border-b-2 border-slate-200">
            <div className="flex items-center justify-between">
              <div className="bg-brand-pink px-2 py-0.5 rounded-full border-2 border-slate-900 text-xs font-bold uppercase">
                {user ? role : 'Guest'}
              </div>
              <div className="bg-brand-cream px-2 py-0.5 rounded-full border-2 border-slate-900 flex items-center gap-1 font-bold text-sm">
                🪙 <span className="text-brand-orange">{userCoins}</span>
              </div>
            </div>
            {user && <span className="text-xs text-slate-500 font-bold truncate mt-1">{user.email}</span>}
          </div>

          {/* Mode Switch (Vertical) - Removed as mode is now tied to account */}

          {/* View Switch (Vertical List) */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-black text-slate-400 uppercase">Navigation</p>
            <button 
              onClick={() => { setActiveView('map'); setMenuOpen(false); }}
              className={`w-full px-3 py-2 rounded-xl flex items-center gap-2 font-bold text-sm transition-all ${activeView === 'map' ? 'bg-brand-blue border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a]' : 'border-2 border-transparent bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
            >
              <Map size={16} /> Map View
            </button>
            <button 
              onClick={() => { setShowLeaderboard(true); setMenuOpen(false); }}
              className={`w-full px-3 py-2 rounded-xl flex items-center gap-2 font-bold text-sm transition-all border-2 border-transparent bg-slate-50 hover:bg-slate-100 text-brand-orange`}
            >
              <Trophy size={16} /> Leaderboards
            </button>
            {role === 'merchant' && (
              <>
                <button 
                  onClick={() => { setActiveView('merchant_dashboard'); setMenuOpen(false); }}
                  className={`w-full px-3 py-2 rounded-xl flex items-center gap-2 font-bold text-sm transition-all ${activeView === 'merchant_dashboard' ? 'bg-brand-orange border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a]' : 'border-2 border-transparent bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
                >
                  <LayoutDashboard size={16} /> Dashboard
                </button>
                <button 
                  onClick={() => { setActiveView('merchant_onboarding'); setMenuOpen(false); }}
                  className={`w-full px-3 py-2 rounded-xl font-bold text-sm text-left transition-all ${activeView === 'merchant_onboarding' ? 'bg-brand-green border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a]' : 'border-2 border-transparent bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
                >
                  📝 Apply for Listing
                </button>
              </>
            )}
          </div>

          {/* Logout */}
          {user && (
            <div className="pt-2 border-t-2 border-slate-200">
              <button 
                onClick={async () => { 
                  if (user.email?.toLowerCase() === 'ecostride_demo@gmail.com') {
                    // Try to delete the demo request document to avoid caching previous state
                    try {
                      const { doc, deleteDoc } = await import('firebase/firestore');
                      await deleteDoc(doc(db, 'demo_requests', user.uid));
                    } catch (e) { console.error(e); }
                  }
                  auth.signOut(); 
                  setMenuOpen(false); 
                }}
                className="w-full text-center py-2 text-sm font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
              >
                Logout Account
              </button>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Modal */}
      <LeaderboardModal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
    </div>
  );
};
