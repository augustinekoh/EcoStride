import React, { useState, useEffect } from 'react';
import leaderboardData from '../../mock/leaderboard.json';
import { X, Trophy, TrendingUp, Calendar, Map as MapIcon, Shield } from 'lucide-react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { UserProfileModal } from './UserProfileModal';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'weekly' | 'guild' | 'monthly' | 'total'>('weekly');
  const [realPlayers, setRealPlayers] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        try {
          const snapshot = await getDocs(collection(db, 'users'));
          const users = snapshot.docs.map(doc => {
            const data = doc.data();
            const emailSum = (data.email || '').split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
            return {
              id: doc.id,
              name: data.email ? data.email.split('@')[0] : 'Unknown Player',
              avatar: '👤',
              location: [103.64 + (emailSum % 100) * 0.0001, 1.56 + (emailSum % 100) * 0.0001],
              weeklyPoints: data.coins || 0,
              monthlyPoints: data.coins || 0,
              totalMileageKm: data.totalDistanceKm || 0,
              treesPlanted: 0, // Fallback for sample
              guildName: data.guildId && data.guildId !== 'None' ? data.guildId : 'Explorer',
              isRisingStar: emailSum % 2 === 0,
              ...data
            };
          });
          setRealPlayers(users);
        } catch (err) {
          console.error("Failed to fetch users:", err);
        }
      };
      fetchUsers();
    }
  }, [isOpen]);

  if (!isOpen && !selectedPlayer) return null;

  const { guilds } = leaderboardData;

  const getSortedPlayers = () => {
    const list = [...leaderboardData.players, ...realPlayers];
    const uniqueList = Array.from(new Map(list.map(item => [item.id, item])).values());
    switch (activeTab) {
      case 'weekly':
        return uniqueList.sort((a, b) => b.weeklyPoints - a.weeklyPoints).slice(0, 20);
      case 'monthly':
        return uniqueList.sort((a, b) => b.monthlyPoints - a.monthlyPoints).slice(0, 20);
      case 'total':
        return uniqueList.sort((a, b) => b.totalMileageKm - a.totalMileageKm).slice(0, 20);
      default:
        return uniqueList.slice(0, 20);
    }
  };

  const getSortedGuilds = () => {
    return [...guilds].sort((a, b) => b.power - a.power);
  };

  const handlePlayerClick = (player: any) => {
    setSelectedPlayer(player);
  };

  const renderPlayerList = () => {
    const sorted = getSortedPlayers();
    return (
      <div className="space-y-3 mt-4">
        {sorted.map((player, idx) => (
          <div 
            key={player.id} 
            onClick={() => handlePlayerClick(player)}
            className="flex items-center gap-3 bg-white/80 backdrop-blur-md p-3 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0f172a] cursor-pointer hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#0f172a] transition-all"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-slate-900 border-2 border-slate-900 bg-brand-yellow">
              {idx + 1}
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-slate-900 bg-slate-100 flex items-center justify-center text-2xl">
              {player.avatar}
            </div>
            <div className="flex-1 overflow-hidden">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 truncate">
                {player.name}
                {player.isRisingStar && activeTab === 'weekly' && <span className="bg-brand-orange text-white text-[10px] px-1.5 py-0.5 rounded-full uppercase shrink-0">Rising</span>}
              </h3>
              <p className="text-xs font-bold text-slate-500 truncate">{player.guildName}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-black text-brand-green text-lg">
                {activeTab === 'weekly' ? player.weeklyPoints : activeTab === 'monthly' ? player.monthlyPoints : player.totalMileageKm}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                {activeTab === 'total' ? 'KM' : 'PTS'}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderGuildList = () => {
    const sampleGuilds = [
      { id: 'g1', name: 'Eco Warriors', treesPlanted: 142, members: 12 },
      { id: 'g2', name: 'Nature Knights', treesPlanted: 98, members: 8 },
      { id: 'g3', name: 'Green Guardians', treesPlanted: 56, members: 5 }
    ];

    return (
      <div className="space-y-4">
        {sampleGuilds.map((guild, index) => (
          <div key={guild.id} className="bg-slate-700/50 rounded-2xl p-4 flex items-center border-2 border-slate-700 hover:border-brand-green transition-colors cursor-pointer">
            <div className="w-12 text-center text-xl font-black text-brand-yellow">
              #{index + 1}
            </div>
            <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-2xl border-2 border-slate-600 mr-4">
              🛡️
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-white text-lg">{guild.name}</h4>
              <p className="text-xs text-slate-400">{guild.members} Active Members</p>
            </div>
            <div className="text-right">
              <div className="font-black text-brand-green text-xl flex items-center gap-1">
                {guild.treesPlanted} 🌳
              </div>
              <div className="text-xs text-slate-400 font-bold uppercase">Trees Planted</div>
            </div>
          </div>
        ))}
        <div className="text-center text-sm font-bold text-slate-500 mt-4">
          Guild system and territory wars are coming in the next update!
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
      <div className="bg-brand-cream border-4 border-slate-900 shadow-comic rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-90 duration-300 relative">
        
        <div className="bg-slate-900 p-4 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-2">
            <Trophy className="text-brand-yellow" size={24} />
            <h2 className="text-xl font-black uppercase tracking-wider text-brand-yellow">Leaderboards</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex p-2 bg-slate-800 gap-1 overflow-x-auto no-scrollbar shrink-0">
          <button 
            onClick={() => setActiveTab('weekly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${activeTab === 'weekly' ? 'bg-brand-green text-slate-900' : 'text-slate-400 hover:text-white'}`}
          >
            <TrendingUp size={14} /> Weekly
          </button>
          <button 
            onClick={() => setActiveTab('monthly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${activeTab === 'monthly' ? 'bg-brand-yellow text-slate-900' : 'text-slate-400 hover:text-white'}`}
          >
            <Calendar size={14} /> Monthly Coins
          </button>
          <button 
            onClick={() => setActiveTab('total')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${activeTab === 'total' ? 'bg-brand-green text-slate-900' : 'text-slate-400 hover:text-white'}`}
          >
            <MapIcon size={14} /> Total Distance
          </button>
          <button 
            onClick={() => setActiveTab('guild')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${activeTab === 'guild' ? 'bg-brand-pink text-slate-900' : 'text-slate-400 hover:text-white'}`}
          >
            <Shield size={14} /> Guild Trees
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {activeTab === 'guild' ? renderGuildList() : renderPlayerList()}
        </div>

      </div>
      <UserProfileModal isOpen={!!selectedPlayer} onClose={() => setSelectedPlayer(null)} player={selectedPlayer} />
    </div>
  );
};
