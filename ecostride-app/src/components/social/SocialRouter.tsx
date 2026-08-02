import React, { useState } from 'react';
import { useUserStore } from '../../stores/useUserStore';
import { useDemoStore } from '../../stores/useDemoStore';
import { CommunityDiscovery } from './CommunityDiscovery';
import { CommunityDashboard } from './CommunityDashboard';
import { FriendsTab } from './FriendsTab';
import { PrivateChatRoom } from './PrivateChatRoom';
import { CapybaraRequests } from './CapybaraRequests';

export function SocialRouter() {
  const { guildId, setGuildId } = useUserStore();
  const { activePrivateChat } = useDemoStore();
  const [activeTab, setActiveTab] = useState<'community' | 'friends'>('friends');

  const handleJoin = (id: string) => {
    setGuildId(id);
  };

  // 1-to-1 Chat Overlay
  if (activePrivateChat) {
    return <PrivateChatRoom />;
  }

  return (
    <div className="w-full h-full flex flex-col bg-brand-cream relative pb-32">
      {/* Header and Switcher */}
      <div className="pt-8 px-6 pb-4 flex items-end justify-between z-10 sticky top-0 bg-brand-cream/90 backdrop-blur-md">
        <div>
          {activeTab === 'community' && !guildId ? (
            <>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Community</h1>
              <p className="text-slate-500 text-sm">Find your perfect eco-community.</p>
            </>
          ) : activeTab === 'friends' ? (
            <>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">Friends</h1>
              <p className="text-slate-500 text-sm">Connect with other eco-warriors.</p>
            </>
          ) : (
            <div className="h-14"></div> /* Spacer for CommunityDashboard which has its own hero */
          )}
        </div>
        
        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Switching Bar */}
          <div className="glass-active rounded-full p-1 flex items-center gap-1 shadow-sm border border-black/5 mb-2">
            <button
              onClick={() => setActiveTab('friends')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === 'friends' 
                  ? 'bg-[var(--color-teal-dark)] text-white shadow-md scale-105' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Friends
            </button>
            <button
              onClick={() => setActiveTab('community')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === 'community' 
                  ? 'bg-[var(--color-teal-dark)] text-white shadow-md scale-105' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Community
            </button>
          </div>
          
          {/* Capybara Requests Icon */}
          <div className="mb-2">
            <CapybaraRequests />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'friends' ? (
          <FriendsTab />
        ) : (
          guildId ? <CommunityDashboard /> : <CommunityDiscovery onJoinCommunity={handleJoin} />
        )}
      </div>
    </div>
  );
}
