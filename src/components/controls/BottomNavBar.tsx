import React, { useState } from 'react';
import { useDemoStore } from '../../stores/useDemoStore';
import { Home, Map as MapIcon, Users, User, Building, Menu, ChevronDown } from 'lucide-react';

export const BottomNavBar: React.FC = () => {
  const { activeView, setActiveView } = useDemoStore();
  const [isExpanded, setIsExpanded] = useState(false);

  if (activeView === 'map' && !isExpanded) {
    return (
      <button 
        onClick={() => setIsExpanded(true)}
        className="absolute bottom-10 left-4 z-[100] glass-card rounded-full p-4 hover:-translate-y-1 transition-transform"
      >
        <Menu size={24} className="text-[var(--color-text-main)]" />
      </button>
    );
  }

  const navItems = [
    { id: 'landing', icon: <Home size={24} />, label: 'Home' },
    { id: 'city', icon: <Building size={24} />, label: 'City' },
    { id: 'map', icon: <MapIcon size={28} className="text-white drop-shadow-md" />, label: "Walk", isCenter: true },
    { id: 'group', icon: <Users size={24} />, label: 'Social' },
    { id: 'profile', icon: <User size={24} />, label: 'Profile' },
  ];

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md">
      {activeView === 'map' && isExpanded && (
        <button 
          onClick={() => setIsExpanded(false)}
          className="absolute -top-14 right-0 glass-card rounded-full p-3 hover:-translate-y-1 transition-transform"
        >
          <ChevronDown size={20} className="text-[var(--color-text-main)]" />
        </button>
      )}

      <div className="glass-pill px-4 py-4 flex items-center justify-between shadow-2xl">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          
          if (item.isCenter) {
            return (
              <button 
                key={item.id}
                onClick={() => {
                  setActiveView(item.id as any);
                  setIsExpanded(false); 
                }}
                className="relative -top-8 bg-[var(--color-teal-dark)] rounded-[2rem] p-5 shadow-[0_8px_32px_rgba(84,150,162,0.3)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(84,150,162,0.4)] transition-all flex flex-col items-center justify-center min-w-[75px] border border-white/20"
              >
                {item.icon}
              </button>
            );
          }

          return (
            <button 
              key={item.id}
              onClick={() => {
                setActiveView(item.id as any);
                setIsExpanded(false); 
              }}
              className={`flex flex-col items-center justify-center transition-all px-3`}
            >
              <div className={`p-2.5 rounded-[1.2rem] transition-colors ${isActive ? 'glass-active text-[var(--color-teal-dark)]' : 'text-[var(--color-text-muted)] hover:bg-white/20 hover:text-[var(--color-text-main)]'}`}>
                {item.icon}
              </div>
              <span className={`text-[10px] font-black mt-1 ${isActive ? 'block text-[var(--color-text-main)]' : 'hidden'}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
