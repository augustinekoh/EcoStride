import React, { useState } from 'react';
import { useUserStore } from '../../stores/useUserStore';
import { Search, Flame, Map as MapIcon, Trophy, Leaf, Activity, ChevronLeft, ChevronRight } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { totalDistanceKm, streaks, totalCarbonSaved, challengesCompleted } = useUserStore();
  const [currentGoalIndex, setCurrentGoalIndex] = useState(0);

  const goals = [
    { label: "This Week", value: `${totalDistanceKm} km`, icon: <Activity size={40} className="text-slate-900 drop-shadow-[2px_2px_0px_#fff]" />, bg: "bg-brand-blue" },
    { label: "Streak", value: `${streaks} Days`, icon: <Flame size={40} className="text-slate-900 drop-shadow-[2px_2px_0px_#fff]" />, bg: "bg-brand-orange" },
    { label: "Reduced", value: `${totalCarbonSaved} kg`, icon: <Leaf size={40} className="text-slate-900 drop-shadow-[2px_2px_0px_#fff]" />, bg: "bg-brand-green" },
    { label: "Achievements", value: `${challengesCompleted}`, icon: <Trophy size={40} className="text-slate-900 drop-shadow-[2px_2px_0px_#fff]" />, bg: "bg-brand-yellow" }
  ];

  const nextGoal = () => setCurrentGoalIndex((prev) => (prev + 1) % goals.length);
  const prevGoal = () => setCurrentGoalIndex((prev) => (prev - 1 + goals.length) % goals.length);

  return (
    <div className="h-full w-full bg-brand-cream p-4 md:p-8 font-sans pb-32 overflow-y-auto">
      
      {/* Motivational Quote */}
      <div className="mb-8 mt-4">
        <h2 className="text-5xl font-black text-slate-900 leading-tight uppercase tracking-tighter drop-shadow-[2px_2px_0px_#fff]">
          Step into a<br/>
          <span className="italic font-black text-brand-green">greener tomorrow.</span>
        </h2>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <input 
          type="text" 
          placeholder="Search activities, locations..." 
          className="w-full bg-white border-comic rounded-3xl py-4 pl-12 pr-4 font-bold text-slate-900 shadow-comic focus:outline-none focus:translate-y-[2px] focus:shadow-none transition-all"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
      </div>

      {/* Goal Crusher (Single View Carousel) */}
      <div className="mb-8 mt-10">
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight drop-shadow-[1px_1px_0px_#fff]">Goal Crusher</h3>
          <div className="flex gap-2">
            <button onClick={prevGoal} className="w-10 h-10 rounded-full border-comic shadow-[2px_2px_0px_0px_#0f172a] bg-white flex items-center justify-center hover:bg-slate-100 active:translate-y-[2px] active:shadow-none transition-all">
              <ChevronLeft size={24} />
            </button>
            <button onClick={nextGoal} className="w-10 h-10 rounded-full border-comic shadow-[2px_2px_0px_0px_#0f172a] bg-white flex items-center justify-center hover:bg-slate-100 active:translate-y-[2px] active:shadow-none transition-all">
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
        
        <div className={`w-full ${goals[currentGoalIndex].bg} border-comic rounded-3xl p-6 relative overflow-hidden h-48 flex flex-col justify-between shadow-comic transition-colors`}>
          <div>
            <p className="text-sm font-black text-slate-800 uppercase tracking-wide">{goals[currentGoalIndex].label}</p>
            <p className="text-5xl font-black text-slate-900 mt-2">{goals[currentGoalIndex].value}</p>
          </div>
          <div className="absolute right-4 bottom-4 bg-white/50 p-4 rounded-full border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a]">
            {goals[currentGoalIndex].icon}
          </div>
        </div>
      </div>

      {/* Activity History */}
      <div className="mt-8">
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight drop-shadow-[1px_1px_0px_#fff]">Recent Activities</h3>
          <button className="text-sm font-bold text-slate-500 hover:text-slate-900 uppercase tracking-wide">View all</button>
        </div>

        <div className="space-y-4">
          
          <div className="bg-white border-comic rounded-3xl p-5 flex items-center justify-between hover:bg-slate-50 transition-colors shadow-comic-hover cursor-pointer active:translate-y-[2px] active:shadow-none">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full border-2 border-slate-900 flex items-center justify-center bg-brand-pink shadow-[2px_2px_0px_0px_#0f172a]">
                <Activity size={24} className="text-slate-900" />
              </div>
              <div>
                <p className="font-black text-slate-900 text-xl uppercase tracking-tight">Ran</p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Today</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-black text-brand-green text-xl">8.8 km</p>
              <p className="text-xs text-slate-500 font-bold mt-1">45:32</p>
            </div>
          </div>

          <div className="bg-white border-comic rounded-3xl p-5 flex items-center justify-between hover:bg-slate-50 transition-colors shadow-comic-hover cursor-pointer active:translate-y-[2px] active:shadow-none">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full border-2 border-slate-900 flex items-center justify-center bg-brand-blue shadow-[2px_2px_0px_0px_#0f172a]">
                <MapIcon size={24} className="text-slate-900" />
              </div>
              <div>
                <p className="font-black text-slate-900 text-xl uppercase tracking-tight">Cycle</p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Yesterday</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-black text-brand-green text-xl">24.5 km</p>
              <p className="text-xs text-slate-500 font-bold mt-1">1:12:15</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
