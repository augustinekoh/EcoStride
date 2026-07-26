import React from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { auth, db } from '../../firebase';
import { useDemoStore } from '../../stores/useDemoStore';
import { LogOut, Settings, User } from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, role } = useAuthStore();
  const { setActiveView } = useDemoStore();

  const handleLogout = async () => {
    if (user?.email?.toLowerCase() === 'ecostride_demo@gmail.com') {
      try {
        const { doc, deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'demo_requests', user.uid));
      } catch (e) { console.error(e); }
    }
    auth.signOut();
  };

  return (
    <div className="h-full w-full p-4 md:p-8 pb-32 overflow-y-auto relative">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-pastel-yellow)] rounded-full mix-blend-overlay filter blur-3xl opacity-60 animate-pulse pointer-events-none"></div>
      
      <h2 className="text-3xl font-black uppercase tracking-tight text-[var(--color-text-main)] mb-8 relative z-10">Profile</h2>
      
      <div className="glass-card p-6 flex items-center gap-6 mb-6 relative z-10">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-white/50 backdrop-blur-sm shrink-0 border border-white/40 shadow-sm flex items-center justify-center p-1">
          <img 
            src="https://api.dicebear.com/7.x/bottts/svg?seed=EcoStride" 
            alt="Profile" 
            className="w-full h-full object-cover rounded-full"
          />
        </div>
        <div className="flex-1 overflow-hidden">
          <h3 className="text-xl font-black truncate text-[var(--color-text-main)]">{user?.email || 'Guest User'}</h3>
          <p className="text-sm font-bold text-[var(--color-teal-dark)] uppercase tracking-widest mt-1 bg-white/40 inline-block px-4 py-1.5 rounded-full border border-white/60 shadow-sm">{role || 'User'}</p>
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <button className="w-full glass-active rounded-[24px] p-5 hover:-translate-y-1 hover:shadow-md transition-all flex items-center justify-between border border-white/30 text-[var(--color-text-main)]">
          <div className="flex items-center gap-4">
            <Settings size={24} className="text-[var(--color-teal-dark)]" />
            <span className="font-black text-lg">Settings</span>
          </div>
        </button>

        <button className="w-full glass-active rounded-[24px] p-5 hover:-translate-y-1 hover:shadow-md transition-all flex items-center justify-between border border-white/30 text-[var(--color-text-main)]">
          <div className="flex items-center gap-4">
            <User size={24} className="text-[var(--color-teal-dark)]" />
            <span className="font-black text-lg">Edit Avatar</span>
          </div>
        </button>

        {role === 'merchant' && (
          <button 
            onClick={() => setActiveView('merchant_dashboard')}
            className="w-full bg-gradient-to-r from-[var(--color-pastel-yellow)] to-[var(--color-soft-green-1)] rounded-[24px] p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all flex items-center justify-between border border-white/60 text-[var(--color-text-main)]"
          >
            <div className="flex items-center gap-4">
              <span className="font-black text-lg">Merchant Dashboard</span>
            </div>
          </button>
        )}

        <button 
          onClick={handleLogout}
          className="w-full bg-red-400/80 backdrop-blur-md hover:bg-red-500/90 text-white rounded-[24px] p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all flex items-center justify-center gap-3 mt-8 border border-white/30"
        >
          <LogOut size={24} />
          <span className="font-black text-xl uppercase tracking-wider">Log Out</span>
        </button>
      </div>

    </div>
  );
};
