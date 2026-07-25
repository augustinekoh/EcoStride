import React, { useState } from 'react';
import { X, Search, Store, Ticket } from 'lucide-react';
import { useUserStore } from '../../stores/useUserStore';
import { useMapStore } from '../../stores/useMapStore';

interface UserMerchantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserMerchantModal: React.FC<UserMerchantModalProps> = ({ isOpen, onClose }) => {
  const { vouchersCollected } = useUserStore();
  const { merchants } = useMapStore();
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredMerchants = merchants.filter(m => 
    m.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
      <div className="bg-brand-cream border-4 border-slate-900 shadow-comic rounded-3xl w-full max-w-sm max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-90 duration-300 relative">
        
        {/* Header */}
        <div className="bg-brand-orange p-4 flex justify-between items-center text-slate-900 border-b-4 border-slate-900 shrink-0">
          <div className="flex items-center gap-2">
            <Store size={24} className="text-slate-900 drop-shadow-[1px_1px_0px_#fff]" />
            <h2 className="text-xl font-black uppercase tracking-wider text-slate-900 drop-shadow-[1px_1px_0px_#fff]">Eco Merchants</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-orange-500 rounded-full transition-colors active:scale-95 border-2 border-transparent hover:border-slate-900">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-4 overflow-y-auto pb-8">
          
          {/* Vouchers Collected */}
          <div className="bg-white border-2 border-slate-900 rounded-2xl p-3 shadow-comic flex items-center gap-3">
            <div className="bg-brand-pink p-2 rounded-xl border-2 border-slate-900">
              <Ticket size={24} className="text-slate-900" />
            </div>
            <div>
              <p className="text-xs font-black uppercase text-slate-500">My Vouchers</p>
              <p className="text-xl font-black text-slate-900">{vouchersCollected} Collected</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search stores..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-2 border-slate-900 rounded-2xl py-2 pl-10 pr-4 font-bold text-slate-900 shadow-[2px_2px_0px_0px_#0f172a] focus:outline-none focus:translate-y-[2px] focus:shadow-none transition-all"
            />
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Suggested / Nearby Stores */}
          <div>
            <h3 className="text-sm font-black uppercase text-slate-500 mb-2">Suggested Nearby</h3>
            <div className="space-y-3">
              {filteredMerchants.length > 0 ? (
                filteredMerchants.map((merchant) => (
                  <div key={merchant.id} className="bg-white border-2 border-slate-900 rounded-2xl p-3 shadow-[2px_2px_0px_0px_#0f172a] flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-slate-900">{merchant.storeName}</h4>
                      <p className="text-xs font-bold text-slate-500">{merchant.category}</p>
                    </div>
                    {merchant.offers && (
                      <span className="text-[10px] font-black uppercase bg-brand-green border-2 border-slate-900 px-2 py-1 rounded-full text-slate-900">
                        {merchant.offers}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300">
                  <p className="font-bold text-slate-400">No stores found.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
