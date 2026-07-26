import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthStore } from '../../stores/useAuthStore';
import Map, { Marker } from 'react-map-gl/mapbox';
import { MAPBOX_TOKEN } from '../../lib/mapboxAPI';

export const MerchantOnboardingForm: React.FC = () => {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    storeName: '',
    category: 'Food & Beverage',
    menuLink: '',
    subscriptionPlan: 'RM100/month',
    location: [103.6400, 1.5600] as [number, number],
    vouchers: [{
      id: Date.now().toString(),
      name: '',
      desc: '',
      price: 100,
      stock: 50,
      icon: '🎟️',
      category: 'Vouchers',
      profileShow: true
    }]
  });
  
  const [viewState, setViewState] = useState({
    longitude: 103.6400,
    latitude: 1.5600,
    zoom: 14
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  // Initialize with current location
  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lng = pos.coords.longitude;
        const lat = pos.coords.latitude;
        setFormData(prev => ({ ...prev, location: [lng, lat] }));
        setViewState(prev => ({ ...prev, longitude: lng, latitude: lat }));
        setIsLocating(false);
      },
      (err) => {
        console.error(err);
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    handleUseCurrentLocation();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    try {
      // Add proximity (current map center) and limit to Malaysia (assuming UTM demo) to heavily improve search relevance.
      const proximity = `${viewState.longitude},${viewState.latitude}`;
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?proximity=${proximity}&country=MY&access_token=${MAPBOX_TOKEN}`);
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        setFormData(prev => ({ ...prev, location: [lng, lat] }));
        setViewState(prev => ({ ...prev, longitude: lng, latitude: lat }));
      } else {
        alert('Location not found. Please try a different search term or drag the pin.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (formData.vouchers.length === 0 || !formData.vouchers[0].name) {
      setError("You must create at least one Point Store voucher.");
      return;
    }
    
    try {
      await addDoc(collection(db, 'applications'), {
        type: 'new',
        ...formData,
        merchantId: user.uid,
        merchantEmail: user.email,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (submitted) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-slate-100">
        <h1 className="text-4xl font-black text-brand-green mb-4">Application Submitted! 🎉</h1>
        <p className="text-lg font-bold text-slate-600 mb-8 max-w-lg">
          Your merchant application is under review by the Platform Admin. 
          You will be notified once you are approved to appear on the EcoStride Map.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col p-8 pt-24 bg-[#faf9f6] overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full bg-white rounded-3xl border-4 border-[#1d3539] shadow-[8px_8px_0px_0px_#1d3539] p-8 mb-20">
        <h1 className="text-3xl font-black text-[#1d3539] mb-2 uppercase tracking-tight drop-shadow-[2px_2px_0px_#80abb1]">Merchant Onboarding</h1>
        <p className="text-[#5496a2] font-bold mb-6">Join EcoStride and drive green foot traffic to your store.</p>
        
        {error && <div className="bg-red-100 p-3 rounded-lg text-red-700 font-bold mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-bold text-sm mb-1">Store Name</label>
            <input required type="text" className="w-full border-2 border-slate-900 rounded-xl px-4 py-2 font-bold" value={formData.storeName} onChange={(e) => setFormData({...formData, storeName: e.target.value})} />
          </div>
          <div>
            <label className="block font-bold text-sm mb-1">Store Category</label>
            <select className="w-full border-2 border-slate-900 rounded-xl px-4 py-2 font-bold bg-white" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
              <option>Food & Beverage</option>
              <option>Retail</option>
              <option>Services</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-sm mb-1">Menu / Services Link</label>
            <input type="url" placeholder="https://..." className="w-full border-2 border-slate-900 rounded-xl px-4 py-2 font-bold" value={formData.menuLink} onChange={(e) => setFormData({...formData, menuLink: e.target.value})} />
          </div>
          <div>
            <label className="block font-bold text-sm mb-1 text-[#1d3539]">Subscription Plan</label>
            <select className="w-full border-2 border-[#1d3539] rounded-xl px-4 py-2 font-bold bg-white" value={formData.subscriptionPlan} onChange={(e) => setFormData({...formData, subscriptionPlan: e.target.value})}>
              <option>RM100/month</option>
              <option>RM1000/year (Save RM200)</option>
            </select>
          </div>

          <div className="pt-6 border-t-2 border-slate-100 mt-6">
            <h2 className="text-xl font-black text-[#1d3539] mb-2 uppercase">🎁 Initial Point Store Voucher</h2>
            <p className="text-sm font-bold text-[#5496a2] mb-4">You must create at least one voucher for users to redeem using their EcoCoins.</p>
            
            <div className="bg-[#e9efce] p-4 rounded-xl border-2 border-[#1d3539] space-y-3">
              <div>
                <label className="block font-bold text-sm mb-1">Voucher Name</label>
                <input required type="text" placeholder="e.g. Free Coffee" className="w-full border-2 border-[#1d3539] rounded-lg px-3 py-2 font-bold bg-white" value={formData.vouchers[0].name} onChange={(e) => {
                  const newVouchers = [...formData.vouchers];
                  newVouchers[0].name = e.target.value;
                  setFormData({...formData, vouchers: newVouchers});
                }} />
              </div>
              <div>
                <label className="block font-bold text-sm mb-1">Description</label>
                <input required type="text" placeholder="e.g. Valid for all regular sized coffees" className="w-full border-2 border-[#1d3539] rounded-lg px-3 py-2 font-bold bg-white" value={formData.vouchers[0].desc} onChange={(e) => {
                  const newVouchers = [...formData.vouchers];
                  newVouchers[0].desc = e.target.value;
                  setFormData({...formData, vouchers: newVouchers});
                }} />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block font-bold text-sm mb-1">Price (Coins)</label>
                  <input required type="number" className="w-full border-2 border-[#1d3539] rounded-lg px-3 py-2 font-bold bg-white" value={formData.vouchers[0].price} onChange={(e) => {
                    const newVouchers = [...formData.vouchers];
                    newVouchers[0].price = Number(e.target.value);
                    setFormData({...formData, vouchers: newVouchers});
                  }} />
                </div>
                <div className="flex-1">
                  <label className="block font-bold text-sm mb-1">Stock Quantity</label>
                  <input required type="number" className="w-full border-2 border-[#1d3539] rounded-lg px-3 py-2 font-bold bg-white" value={formData.vouchers[0].stock} onChange={(e) => {
                    const newVouchers = [...formData.vouchers];
                    newVouchers[0].stock = Number(e.target.value);
                    setFormData({...formData, vouchers: newVouchers});
                  }} />
                </div>
                <div className="w-20">
                  <label className="block font-bold text-sm mb-1 text-center">Icon</label>
                  <input required type="text" className="w-full border-2 border-[#1d3539] rounded-lg px-3 py-2 font-bold bg-white text-center" value={formData.vouchers[0].icon} onChange={(e) => {
                    const newVouchers = [...formData.vouchers];
                    newVouchers[0].icon = e.target.value;
                    setFormData({...formData, vouchers: newVouchers});
                  }} />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t-2 border-slate-100">
            <div className="flex justify-between items-end mb-2">
              <label className="block font-bold text-sm">Store Location (Search or Drag Pin)</label>
              <button type="button" onClick={handleUseCurrentLocation} className="text-xs font-bold text-brand-green bg-green-100 px-3 py-1 rounded-full border border-brand-green hover:bg-brand-green hover:text-white transition-colors">
                {isLocating ? 'Locating...' : '📍 Use My Location'}
              </button>
            </div>
            
            <div className="flex gap-2 mb-2">
              <input type="text" placeholder="Search a place or address..." className="flex-1 border-2 border-slate-900 rounded-xl px-4 py-2 font-bold text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch(e as any)} />
              <button type="button" onClick={handleSearch} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-slate-800">Search</button>
            </div>

            <div className="w-full h-64 rounded-xl border-2 border-slate-900 overflow-hidden relative">
              <Map
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                mapStyle="mapbox://styles/mapbox/outdoors-v12"
                mapboxAccessToken={MAPBOX_TOKEN}
                onClick={(e) => setFormData({...formData, location: [e.lngLat.lng, e.lngLat.lat]})}
              >
                <Marker longitude={formData.location[0]} latitude={formData.location[1]} anchor="bottom" draggable onDragEnd={(e) => setFormData({...formData, location: [e.lngLat.lng, e.lngLat.lat]})}>
                  <div className="text-4xl hover:scale-110 cursor-grab active:cursor-grabbing transition-transform">📍</div>
                </Marker>
              </Map>
            </div>
            <p className="text-xs font-bold text-slate-500 mt-1 text-center">Drag the pin or click on the map to fine-tune your location.</p>
          </div>
          
          <button type="submit" className="w-full bg-[#5496a2] text-white hover:bg-[#80abb1] border-2 border-[#1d3539] py-4 rounded-full font-black text-lg tracking-wide shadow-[4px_4px_0px_0px_#1d3539] active:translate-y-1 active:shadow-none transition-all mt-6 uppercase">
            Submit Application
          </button>
        </form>
      </div>
    </div>
  );
};
