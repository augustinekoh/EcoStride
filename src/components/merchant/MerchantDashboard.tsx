import React from 'react';
import { useDemoStore } from '../../stores/useDemoStore';
import { useMapStore } from '../../stores/useMapStore';
import { Users, TrendingUp, Tag, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

export const MerchantDashboard: React.FC = () => {
  const { setActiveView } = useDemoStore();
  const { territoryConquered, setTerritoryConquered } = useMapStore();

  const handleWeeklySettlement = () => {
    setTerritoryConquered(true);
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#86efac', '#fb923c']
    });
    alert("Territory Settlement Triggered! The district is now an Oasis Zone.");
  };

  return (
    <div className="w-full h-full bg-slate-100 p-8 pt-24 flex flex-col gap-6 overflow-y-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black mb-2">Merchant Dashboard</h1>
          <p className="text-slate-500 font-bold">85°C Energy Station (UTM Branch)</p>
        </div>
        <button 
          onClick={() => setActiveView('map')}
          className="bg-white px-4 py-2 rounded-xl border-2 border-slate-900 font-bold hover:bg-slate-50 transition-colors"
        >
          Back to Map
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border-comic shadow-comic flex flex-col gap-2">
          <div className="flex justify-between items-center text-slate-500 font-bold">
            Foot-Traffic Driven
            <Users size={20} />
          </div>
          <div className="text-4xl font-black text-slate-900">42 <span className="text-lg text-brand-green">+15%</span></div>
          <div className="text-sm text-slate-500">via Green Mobility</div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border-comic shadow-comic flex flex-col gap-2">
          <div className="flex justify-between items-center text-slate-500 font-bold">
            In-Store Conversion
            <TrendingUp size={20} />
          </div>
          <div className="text-4xl font-black text-slate-900">60.8%</div>
          <div className="text-sm text-slate-500">Higher than avg digital ads</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border-comic shadow-comic flex flex-col gap-2">
          <div className="flex justify-between items-center text-slate-500 font-bold">
            Vouchers Redeemed
            <Tag size={20} />
          </div>
          <div className="text-4xl font-black text-slate-900">28</div>
          <div className="text-sm text-slate-500">Today</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border-comic shadow-comic mt-4">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <ShieldCheck className="text-brand-green" /> Territory Conquest Control (Demo Pitch Only)
        </h2>
        <p className="text-slate-600 mb-6">
          Use this button during the live pitch to trigger the weekly settlement. 
          It will flip the territory color to the winning guild and activate the 30% OFF merchant perk globally on the map.
        </p>
        <button 
          onClick={handleWeeklySettlement}
          disabled={territoryConquered}
          className={`px-6 py-3 rounded-xl border-2 border-slate-900 font-black tracking-wide transition-all shadow-comic-hover ${territoryConquered ? 'bg-slate-300 text-slate-500' : 'bg-brand-green hover:bg-green-400'}`}
        >
          {territoryConquered ? 'Settlement Completed' : '⚔️ Simulate Weekly Settlement'}
        </button>
      </div>

    </div>
  );
};
