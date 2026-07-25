import React, { useState } from 'react';
import { useDemoStore } from '../../stores/useDemoStore';
import { Home, Map as MapIcon, Users, User, Building, Menu, ChevronDown } from 'lucide-react';

export const BottomNavBar: React.FC = () => {
  const { activeView, setActiveView } = useDemoStore();
  const [isExpanded, setIsExpanded] = useState(false);

  // If we are on the map view and not explicitly expanded, show a side icon
  if (activeView === 'map' && !isExpanded) {
    return (
      <button 
        onClick={() => setIsExpanded(true)}
        className="absolute bottom-10 left-4 z-[100] bg-brand-yellow border-comic shadow-comic rounded-full p-3 hover:-translate-y-1 transition-all active:translate-y-1 active:shadow-none"
      >
        <Menu size={28} className="text-slate-900" />
      </button>
    );
  }

  const navItems = [
    { id: 'landing', icon: <Home size={24} />, label: 'Home' },
    { id: 'city', icon: <Building size={24} />, label: 'City' },
    { id: 'map', icon: <MapIcon size={32} className="text-slate-900 drop-shadow-[2px_2px_0px_#fff]" />, label: "Let's Walk!", isCenter: true },
    { id: 'group', icon: <Users size={24} />, label: 'Group' },
    { id: 'profile', icon: <User size={24} />, label: 'Profile' },
  ];

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-md">
      {/* Hide Button (Only visible on map when expanded) */}
      {activeView === 'map' && isExpanded && (
        <button 
          onClick={() => setIsExpanded(false)}
          className="absolute -top-12 right-0 bg-brand-orange border-2 border-slate-900 rounded-full p-2 shadow-[2px_2px_0px_0px_#0f172a] hover:-translate-y-1 active:translate-y-1 active:shadow-none transition-all"
        >
          <ChevronDown size={20} className="text-slate-900" />
        </button>
      )}

      <div className="bg-brand-dark rounded-full border-comic shadow-comic px-3 py-2 flex items-center justify-between">
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
                className="relative -top-6 bg-brand-green border-comic rounded-full p-4 shadow-[4px_4px_0px_0px_#0f172a] hover:-translate-y-1 active:translate-y-1 active:shadow-none transition-all flex flex-col items-center justify-center min-w-[80px]"
              >
                {item.icon}
                <span className="text-[10px] font-black uppercase mt-1 text-slate-900 tracking-tighter leading-none">{item.label}</span>
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
              className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all ${isActive ? 'bg-slate-700 text-brand-yellow scale-110' : 'text-slate-400 hover:text-white'}`}
            >
              {item.icon}
              <span className={`text-[9px] font-bold mt-1 ${isActive ? 'block' : 'hidden md:block'}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
