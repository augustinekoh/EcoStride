import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { useDemoStore } from '../../stores/useDemoStore';
import { useUserStore } from '../../stores/useUserStore';
import { db, auth } from '../../firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import merchantsData from '../../mock/merchants.json';

export const ImpactReportModal: React.FC = () => {
  const { showReportModal, setShowReportModal, setProgress, completedDistanceKm } = useDemoStore();
  const { addCoins, addCarbonSaved, addActivity } = useUserStore();
  
  const [stats, setStats] = useState({ distance: 0, carbon: 0, coins: 0 });

  useEffect(() => {
    if (showReportModal) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#86efac', '#fde047', '#7dd3fc', '#f472b6']
      });

      const dist = completedDistanceKm || 0;
      const carbon = dist * 0.2;
      const coins = Math.floor(carbon * 100);
      
      setStats({ distance: dist, carbon, coins });

      // Optimistic local update (now automatically syncs to Firestore via Zustand store)
      addCoins(coins);
      addActivity(dist); // Note: addActivity in UserStore calculates and adds the carbon using 0.2 multiplier
    }
  }, [showReportModal, completedDistanceKm, addCoins, addCarbonSaved]);

  if (!showReportModal) return null;

  return (
    <div className="absolute inset-0 z-[120] flex items-center justify-center bg-[var(--color-teal-dark)]/20 backdrop-blur-md p-4 animate-in fade-in">
      <div className="glass-card p-8 max-w-md w-full animate-in zoom-in slide-in-from-bottom-4 duration-300">
        <h2 className="text-3xl font-black text-center mb-6 uppercase tracking-tight text-[var(--color-text-main)] drop-shadow-sm">
          Journey Complete!
        </h2>
        
        <div className="space-y-4 mb-8">
          <div className="glass-active p-5 rounded-2xl flex justify-between items-center shadow-sm border border-white/40">
            <span className="font-bold text-sm text-[var(--color-text-muted)] uppercase tracking-wider">Distance</span>
            <span className="font-black text-2xl text-[var(--color-text-main)]">{stats.distance.toFixed(1)} km</span>
          </div>
          <div className="glass-active p-5 rounded-2xl flex justify-between items-center shadow-sm border border-white/40">
            <span className="font-bold text-sm text-[var(--color-text-muted)] uppercase tracking-wider">CO2 Saved</span>
            <span className="font-black text-2xl text-[var(--color-teal-dark)]">{stats.carbon.toFixed(2)} kg</span>
          </div>
          <div className="glass-active p-5 rounded-2xl flex justify-between items-center shadow-sm border border-white/40">
            <span className="font-bold text-sm text-[var(--color-text-muted)] uppercase tracking-wider">Coins Earned</span>
            <span className="font-black text-2xl text-orange-400">+{stats.coins} 🪙</span>
          </div>
        </div>

        {/* 
        <div className="bg-white p-4 rounded-2xl border-2 border-slate-900 border-dashed mb-6 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-brand-pink text-white text-xs font-bold px-2 py-1 rounded-bl-lg">UNLOCKED</div>
          <div className="text-4xl mb-2">{merchantsData[0].icon}</div>
          <div className="font-bold">{merchantsData[0].voucherTitle}</div>
          <div className="text-sm text-slate-500 mt-1">at {merchantsData[0].name}</div>
        </div> 
        */}

        <button 
          onClick={() => {
            setShowReportModal(false);
            setProgress(0);
          }}
          className="w-full bg-[var(--color-teal-dark)] text-white py-4 rounded-full font-black uppercase tracking-wide shadow-md hover:-translate-y-1 hover:shadow-lg active:translate-y-0 transition-all border border-white/20"
        >
          Claim Rewards & Continue
        </button>
      </div>
    </div>
  );
};
