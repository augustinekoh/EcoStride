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
    <div className="h-full w-full bg-brand-cream p-4 md:p-8 font-sans pb-32 overflow-y-auto">
      <h2 className="text-3xl font-black uppercase tracking-tight drop-shadow-[2px_2px_0px_#fff] mb-8">Profile</h2>
      
      <div className="bg-white border-comic rounded-3xl p-6 shadow-comic flex items-center gap-6 mb-6">
        <div className="w-24 h-24 rounded-full border-comic overflow-hidden bg-brand-yellow shrink-0">
          <img 
            src="https://api.dicebear.com/7.x/bottts/svg?seed=EcoStride" 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 overflow-hidden">
          <h3 className="text-xl font-black truncate">{user?.email || 'Guest User'}</h3>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1 bg-slate-100 inline-block px-3 py-1 rounded-full border-2 border-slate-900">{role || 'User'}</p>
        </div>
      </div>

      <div className="space-y-4">
        <button className="w-full bg-white border-comic rounded-3xl p-5 shadow-comic-hover active:translate-y-1 active:shadow-none transition-all flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Settings size={24} className="text-slate-500" />
            <span className="font-black text-lg">Settings</span>
          </div>
        </button>

        <button className="w-full bg-white border-comic rounded-3xl p-5 shadow-comic-hover active:translate-y-1 active:shadow-none transition-all flex items-center justify-between">
          <div className="flex items-center gap-4">
            <User size={24} className="text-slate-500" />
            <span className="font-black text-lg">Edit Avatar</span>
          </div>
        </button>

        {role === 'merchant' && (
          <button 
            onClick={() => setActiveView('merchant_dashboard')}
            className="w-full bg-brand-orange border-comic rounded-3xl p-5 shadow-comic-hover active:translate-y-1 active:shadow-none transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <span className="font-black text-lg">Merchant Dashboard</span>
            </div>
          </button>
        )}

        <button 
          onClick={handleLogout}
          className="w-full bg-red-400 hover:bg-red-500 text-white border-comic rounded-3xl p-5 shadow-comic-hover active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3 mt-8"
        >
          <LogOut size={24} />
          <span className="font-black text-xl uppercase tracking-wider">Log Out</span>
        </button>
      </div>

    </div>
  );
};
