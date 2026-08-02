import React, { useState, useEffect } from 'react';
import { Search, Plus, MapPin, Users } from 'lucide-react';
import { CreateCommunityModal } from './CreateCommunityModal';
import { CommunityPreviewModal } from './CommunityPreviewModal';
import { apiClient } from '../../lib/api';

interface RecommendedGuild {
  id: string;
  name: string;
  description: string;
  icon: string;
  nationality: string;
  member_count: number;
}

interface CommunityDiscoveryProps {
  onJoinCommunity: (guildId: string) => void;
}

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787/api';

export function CommunityDiscovery({ onJoinCommunity }: CommunityDiscoveryProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewGuildId, setPreviewGuildId] = useState<string | null>(null);
  const [recommended, setRecommended] = useState<RecommendedGuild[]>([]);
  const [visibleCount, setVisibleCount] = useState(3);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RecommendedGuild[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    apiClient('/guilds/recommended')
      .then(data => {
        if (data.guilds) setRecommended(data.guilds);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      apiClient(`/guilds/search?q=${encodeURIComponent(searchQuery.trim())}`)
        .then(data => {
          if (data.guilds) setSearchResults(data.guilds);
        })
        .catch(console.error)
        .finally(() => setIsSearching(false));
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="w-full pb-20">
      {/* Header */}
      <div className="px-6 pt-2 pb-6">
        {/* Search Bar */}
        <div className="mt-6 flex items-center space-x-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search communities (name or ID)..." 
              className="w-full glass-active bg-white/50 border border-black/5 rounded-2xl py-3.5 pl-12 pr-4 text-[var(--color-text-main)] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-teal-dark)]/50 transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        {/* Create Community Action */}
        <button 
          onClick={() => setShowCreateModal(true)}
          className="w-full relative overflow-hidden bg-white/60 backdrop-blur-md border border-black/5 shadow-sm rounded-3xl p-6 flex items-center mb-10 group transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-teal-dark)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-14 h-14 bg-[var(--color-teal-dark)] text-white rounded-full flex items-center justify-center shadow-lg shadow-[var(--color-teal-dark)]/20 shrink-0">
            <Plus size={28} strokeWidth={2.5} />
          </div>
          <div className="ml-5 text-left flex-1">
            <h3 className="text-xl font-bold text-slate-800 mb-1">Create New Community</h3>
            <p className="text-slate-500 text-sm">Build your own group and start planting trees together.</p>
          </div>
        </button>

        {/* Recommended Communities */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">
            {searchQuery.trim() ? 'Search Results' : 'Recommended'}
          </h2>
        </div>

        {/* Community List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center text-slate-400 py-10">Loading communities...</div>
          ) : (
            (searchQuery.trim() ? searchResults : recommended.slice(0, visibleCount))?.map(guild => (
              <div 
                key={guild.id}
                onClick={() => setPreviewGuildId(guild.id)}
                className="glass-card bg-white/50 border border-black/5 rounded-3xl p-4 flex items-center hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="w-16 h-16 rounded-2xl bg-[var(--color-teal-dark)]/10 flex items-center justify-center text-3xl shrink-0 mr-4 shadow-inner text-[var(--color-teal-dark)]">
                  {guild.icon || '🌍'}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-800 truncate mb-1 group-hover:text-[var(--color-teal-dark)] transition-colors">
                    {guild.name} <span className="text-xs text-slate-400 font-normal ml-2">UID: {guild.id}</span>
                  </h3>
                  <div className="flex items-center text-xs text-slate-500 space-x-3">
                    <div className="flex items-center">
                      <MapPin size={12} className="mr-1" />
                      <span className="truncate max-w-[80px]">{guild.nationality || 'Global'}</span>
                    </div>
                    <div className="flex items-center">
                      <Users size={12} className="mr-1" />
                      <span>{guild.member_count || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {!isLoading && !searchQuery.trim() && recommended.length > 3 && (
            <button 
              onClick={() => {
                if (visibleCount >= recommended.length) {
                  setVisibleCount(3);
                } else {
                  setVisibleCount(prev => prev + 3);
                }
              }}
              className="w-full py-3 glass-active bg-white/50 border border-black/5 rounded-2xl text-slate-500 font-bold hover:bg-[var(--color-teal-dark)] hover:text-white hover:shadow-md transition-all"
            >
              {visibleCount >= recommended.length ? 'Collapse' : 'Show More'}
            </button>
          )}
          
          {!isLoading && (searchQuery.trim() ? searchResults : recommended)?.length === 0 && (
            <div className="text-center py-10 text-slate-400">
              No communities found.
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateCommunityModal 
          onClose={() => setShowCreateModal(false)}
          onCreated={(id) => onJoinCommunity(id)}
        />
      )}

      {previewGuildId && (
        <CommunityPreviewModal
          guildId={previewGuildId}
          onClose={() => setPreviewGuildId(null)}
          onJoined={(id) => onJoinCommunity(id)}
        />
      )}
    </div>
  );
}
