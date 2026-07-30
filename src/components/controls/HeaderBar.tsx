import React, { useState } from 'react';
import { useDemoStore } from '../../stores/useDemoStore';
import { useUserStore } from '../../stores/useUserStore';
import { Map, LayoutDashboard, Play, Pause, Menu, X, Trophy, Gift, Mail } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { auth } from '../../firebase';
import { LeaderboardModal } from '../modals/LeaderboardModal';
import { PointsStoreModal } from '../modals/PointsStoreModal';
import { MailboxModal } from '../modals/MailboxModal';
import { useMailStore } from '../../stores/useMailStore';
import { collection, query, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
export const HeaderBar: React.FC = () => {
  const { currentMode, setMode, isAutoPlaying, setIsAutoPlaying, activeView, setActiveView } = useDemoStore();
  const { userCoins } = useUserStore();
  const { user, role } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [showMailbox, setShowMailbox] = useState(false);
  const { unreadCount, setMailsData } = useMailStore();

  React.useEffect(() => {
    if (!user) return;

    let userGuildId: string | null = null;
    let unsubUser: () => void = () => {};
    let unsubMails: () => void = () => {};

    const setup = async () => {
      // 1. Listen to user doc for readMails array and guildId
      unsubUser = onSnapshot(doc(db, 'users', user.uid), (userDoc) => {
        if (userDoc.exists()) {
          const data = userDoc.data();
          userGuildId = data.guildId && data.guildId !== 'None' ? data.guildId : null;
          const readMails = data.readMails || [];
          
          // 2. Fetch mails and filter
          const q = query(collection(db, 'mail'), orderBy('createdAt', 'desc'));
          unsubMails = onSnapshot(q, (snapshot) => {
            const fetchedMails = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            const filtered = fetchedMails.filter(mail => {
              // 1. Check scope
              if (mail.expiresForNewUsers && data.createdAt) {
                const userCreatedTime = new Date(data.createdAt).getTime();
                if (userCreatedTime > mail.createdAt) return false;
              }

              // 2. Check audience
              if (mail.recipientType === 'all') return true;
              if (mail.recipientType === 'user' && mail.recipientId === user.uid) return true;
              if (mail.recipientType === 'merchant_all' && role === 'merchant') return true;
              if (mail.recipientType === 'guild' && userGuildId && mail.recipientId === userGuildId) return true;
              return false;
            });
            
            setMailsData(filtered, readMails);
          });
        }
      });
    };

    setup();

    return () => {
      unsubUser();
      unsubMails();
    };
  }, [user, role, setMailsData]);

  return (
    <div className="absolute top-4 left-4 z-50">
      {/* Hamburger Button */}
      <button 
        onClick={() => setMenuOpen(!menuOpen)}
        className="glass-active p-3 rounded-full border border-white/60 shadow-sm hover:shadow-md transition-all text-[var(--color-text-main)]"
      >
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Menu Drawer */}
      {menuOpen && (
        <div className="absolute top-16 left-0 w-64 glass-card p-4 flex flex-col gap-4 animate-in slide-in-from-left-4 fade-in duration-200">
          
          {/* User Profile Summary */}
          <div className="flex flex-col gap-1 pb-3 border-b border-white/40">
            <div className="flex items-center justify-between">
              <div className="bg-[var(--color-pastel-yellow)] text-[var(--color-text-main)] px-2 py-0.5 rounded-full border border-white/50 shadow-sm text-xs font-bold uppercase">
                {user ? role : 'Guest'}
              </div>
              <div className="bg-white/40 text-[var(--color-text-main)] px-2 py-0.5 rounded-full border border-white/50 shadow-sm flex items-center gap-1 font-bold text-sm">
                🪙 <span>{userCoins}</span>
              </div>
            </div>
            {user && <span className="text-xs text-[var(--color-text-muted)] font-bold truncate mt-1">{user.email}</span>}
          </div>

          {/* View Switch (Vertical List) */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-black text-[var(--color-text-muted)] uppercase">Navigation</p>
            <button 
              onClick={() => { setActiveView('map'); setMenuOpen(false); }}
              className={`w-full px-3 py-2 rounded-xl flex items-center gap-2 font-bold text-sm transition-all ${activeView === 'map' ? 'glass-active text-[var(--color-teal-dark)] border border-white/50 shadow-sm' : 'border border-transparent bg-white/20 hover:bg-white/40 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}`}
            >
              <Map size={16} /> Map View
            </button>
            <button 
              onClick={() => { setShowLeaderboard(true); setMenuOpen(false); }}
              className={`w-full px-3 py-2 rounded-xl flex items-center gap-2 font-bold text-sm transition-all border border-transparent bg-white/20 hover:bg-white/40 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]`}
            >
              <Trophy size={16} /> Leaderboards
            </button>
            <button 
              onClick={() => { setShowStore(true); setMenuOpen(false); }}
              className={`w-full px-3 py-2 rounded-xl flex items-center gap-2 font-bold text-sm transition-all border border-transparent bg-white/20 hover:bg-white/40 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]`}
            >
              <Gift size={16} /> Points Store
            </button>
            <button 
              onClick={() => { setShowMailbox(true); setMenuOpen(false); }}
              className={`w-full px-3 py-2 rounded-xl flex items-center justify-between font-bold text-sm transition-all border border-transparent bg-white/20 hover:bg-white/40 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] relative`}
            >
              <div className="flex items-center gap-2">
                <Mail size={16} /> Mailbox
              </div>
              {unreadCount > 0 && (
                <div className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black min-w-[20px] text-center border border-white/50 shadow-sm animate-bounce">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
            </button>
            {role === 'merchant' && (
              <>
                <button 
                  onClick={() => { setActiveView('merchant_onboarding'); setMenuOpen(false); }}
                  className={`w-full px-3 py-2 rounded-xl font-bold text-sm text-left transition-all ${activeView === 'merchant_onboarding' ? 'glass-active text-[var(--color-teal-dark)] border border-white/50 shadow-sm' : 'border border-transparent bg-white/20 hover:bg-white/40 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}`}
                >
                  📝 Apply for Listing
                </button>
              </>
            )}
          </div>

          {/* Logout */}
          {user && (
            <div className="pt-2 border-t border-white/40">
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
                className="w-full text-center py-2 text-sm font-bold text-red-500 hover:text-red-700 bg-white/20 hover:bg-white/40 border border-transparent rounded-xl transition-all"
              >
                Logout Account
              </button>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && <LeaderboardModal isOpen={true} onClose={() => setShowLeaderboard(false)} />}

      {/* Points Store Modal */}
      {showStore && <PointsStoreModal onClose={() => setShowStore(false)} />}

      {/* Mailbox Modal */}
      {showMailbox && <MailboxModal onClose={() => setShowMailbox(false)} />}
    </div>
  );
};
