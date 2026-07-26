import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useDemoStore } from '../../stores/useDemoStore';
import { Store, Tag, Plus, Edit2, Trash2, Clock, AlertCircle, ChevronLeft } from 'lucide-react';

export const MerchantDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { setActiveView } = useDemoStore();
  
  const [merchantData, setMerchantData] = useState<any>(null);
  const [latestApp, setLatestApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [storeItems, setStoreItems] = useState<any[]>([]);
  
  // Modification Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editStoreName, setEditStoreName] = useState('');
  const [editMenuLink, setEditMenuLink] = useState('');
  const [vouchers, setVouchers] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      const mQ = query(collection(db, 'merchants'), where('ownerId', '==', user.uid));
      const mSnap = await getDocs(mQ);
      if (!mSnap.empty) {
        const mData = { id: mSnap.docs[0].id, ...mSnap.docs[0].data() };
        setMerchantData(mData);
        setEditStoreName(mData.storeName || '');
        setEditMenuLink(mData.menuLink || '');
        
        const iQ = query(collection(db, 'storeItems'), where('merchantId', '==', user.uid));
        const iSnap = await getDocs(iQ);
        const items = iSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setStoreItems(items);
        setVouchers(items.map(i => ({...i, originalId: i.id})));
      } else {
        const aQ = query(collection(db, 'applications'), where('merchantId', '==', user.uid));
        const aSnap = await getDocs(aQ);
        if (!aSnap.empty) {
          const apps = aSnap.docs.map(d => ({ id: d.id, ...d.data() as any })).sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || 0;
            const bTime = b.createdAt?.toMillis?.() || 0;
            return bTime - aTime;
          });
          setLatestApp(apps[0]);
        }
      }
      
      setLoading(false);
    };
    
    fetchData();
  }, [user]);

  const handleSubmitModification = async () => {
    if (!user || !merchantData) return;
    try {
      await addDoc(collection(db, 'applications'), {
        type: 'modification',
        merchantId: user.uid,
        merchantEmail: user.email,
        storeName: editStoreName,
        menuLink: editMenuLink,
        category: merchantData.category,
        location: merchantData.location,
        vouchers: vouchers,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      alert('Modification submitted for admin approval!');
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert('Failed to submit modification.');
    }
  };

  const handleAddVoucher = () => {
    setVouchers([...vouchers, {
      id: Date.now().toString(),
      name: 'New Voucher',
      desc: '',
      price: 100,
      stock: 50,
      icon: '🎟️',
      category: 'Vouchers',
      profileShow: true
    }]);
  };

  const handleRemoveVoucher = (idx: number) => {
    const newV = [...vouchers];
    newV.splice(idx, 1);
    setVouchers(newV);
  };

  const updateVoucher = (idx: number, field: string, value: any) => {
    const newV = [...vouchers];
    newV[idx] = { ...newV[idx], [field]: value };
    setVouchers(newV);
  };

  if (loading) return <div className="w-full h-full flex items-center justify-center bg-[#faf9f6]">Loading...</div>;

  if (!merchantData && !latestApp) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#faf9f6] p-8 text-center">
        <Store size={64} className="text-[#1d3539] mb-4" />
        <h2 className="text-2xl font-black text-[#1d3539] mb-4 uppercase">No Merchant Account</h2>
        <p className="text-[#5496a2] font-bold mb-8">You haven't applied to be a merchant yet.</p>
        <button onClick={() => setActiveView('merchant_onboarding')} className="bg-[#5496a2] text-white font-black px-6 py-3 rounded-xl border-2 border-[#1d3539] shadow-[4px_4px_0px_0px_#1d3539] active:translate-y-1 active:shadow-none hover:bg-[#80abb1] transition-all uppercase">Apply Now</button>
      </div>
    );
  }

  if (!merchantData && latestApp) {
    return (
      <div className="w-full h-full flex flex-col p-8 pt-24 bg-[#faf9f6] overflow-y-auto">
        <button onClick={() => setActiveView('landing')} className="flex items-center gap-2 text-[#1d3539] font-bold mb-8 hover:underline w-fit"><ChevronLeft /> Back to Home</button>
        <div className="max-w-2xl mx-auto w-full bg-white rounded-3xl border-4 border-[#1d3539] shadow-[8px_8px_0px_0px_#1d3539] p-8 text-center">
          {latestApp.status === 'pending' ? (
            <>
              <Clock size={64} className="mx-auto text-orange-500 mb-4" />
              <h2 className="text-3xl font-black text-[#1d3539] mb-2 uppercase">Application Under Review</h2>
              <p className="text-slate-600 font-bold">Your application for <span className="text-[#5496a2]">{latestApp.storeName}</span> is currently being reviewed by the platform admins.</p>
            </>
          ) : latestApp.status === 'rejected' ? (
            <>
              <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
              <h2 className="text-3xl font-black text-[#1d3539] mb-2 uppercase">Application Rejected</h2>
              <div className="bg-red-50 p-4 rounded-xl border-2 border-red-200 mb-6 text-left">
                <p className="text-xs font-bold text-red-500 uppercase mb-1">Reason for Rejection</p>
                <p className="text-slate-800 font-medium">{latestApp.rejectReason || 'No specific reason provided.'}</p>
              </div>
              <button onClick={() => setActiveView('merchant_onboarding')} className="bg-[#5496a2] text-white font-black px-6 py-3 rounded-xl border-2 border-[#1d3539] shadow-[4px_4px_0px_0px_#1d3539] active:translate-y-1 active:shadow-none hover:bg-[#80abb1] transition-all uppercase">Re-apply</button>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#faf9f6] p-8 pt-24 flex flex-col gap-6 overflow-y-auto">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border-4 border-[#1d3539] shadow-[4px_4px_0px_0px_#1d3539]">
        <div>
          <h1 className="text-3xl font-black text-[#1d3539] uppercase tracking-tight">Merchant Hub</h1>
          <p className="text-[#5496a2] font-bold mt-1">Manage your store and vouchers</p>
        </div>
        <button onClick={() => setActiveView('landing')} className="bg-white px-4 py-2 rounded-xl border-2 border-[#1d3539] font-bold text-[#1d3539] hover:bg-slate-50 transition-colors">Back to Home</button>
      </div>

      <div className="bg-white rounded-3xl border-4 border-[#1d3539] shadow-[4px_4px_0px_0px_#1d3539] p-6 mb-20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-[#1d3539] flex items-center gap-2"><Store className="text-[#5496a2]" /> Store Details</h2>
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-[#e9efce] text-[#1d3539] font-bold px-4 py-2 rounded-xl border-2 border-[#1d3539] hover:bg-[#d8e0b3] transition-colors shadow-[2px_2px_0px_0px_#1d3539] active:translate-y-1 active:shadow-none">
              <Edit2 size={16} /> Edit Store & Vouchers
            </button>
          )}
        </div>

        {!isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Store Name</p>
                <p className="text-lg font-bold text-[#1d3539]">{merchantData.storeName}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Menu / Link</p>
                <p className="text-lg font-bold text-[#5496a2] break-all">{merchantData.menuLink || 'None provided'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Category</p>
                <p className="text-lg font-bold text-[#1d3539]">{merchantData.category}</p>
              </div>
            </div>
            
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase mb-3">Live Point Store Vouchers</p>
              <div className="space-y-3">
                {storeItems.length === 0 ? <p className="text-sm italic text-slate-400">No vouchers currently live.</p> : storeItems.map(item => (
                  <div key={item.id} className="bg-slate-50 border-2 border-slate-200 rounded-xl p-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <p className="font-bold text-[#1d3539]">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-500">{item.price} 🪙</p>
                      <p className="text-xs font-bold text-slate-400">Stock: {item.stock}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex items-start gap-3">
              <AlertCircle className="text-blue-500 shrink-0" />
              <div>
                <p className="font-bold text-blue-900">Modification requires Approval</p>
                <p className="text-sm text-blue-700 mt-1">Any changes you make here will be sent to the Admin team for review.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-bold text-sm mb-1 text-[#1d3539]">Store Name</label>
                <input type="text" className="w-full border-2 border-[#1d3539] rounded-xl px-4 py-2 font-bold bg-white" value={editStoreName} onChange={e => setEditStoreName(e.target.value)} />
              </div>
              <div>
                <label className="block font-bold text-sm mb-1 text-[#1d3539]">Menu / Services Link</label>
                <input type="text" className="w-full border-2 border-[#1d3539] rounded-xl px-4 py-2 font-bold bg-white" value={editMenuLink} onChange={e => setEditMenuLink(e.target.value)} />
              </div>
            </div>

            <div className="pt-6 border-t-2 border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-[#1d3539] uppercase flex items-center gap-2"><Tag size={20} /> Vouchers</h3>
                <button onClick={handleAddVoucher} className="flex items-center gap-1 text-sm font-bold bg-[#e9efce] text-[#1d3539] px-3 py-1.5 rounded-lg border-2 border-[#1d3539] hover:bg-[#d8e0b3] shadow-[2px_2px_0px_0px_#1d3539] active:translate-y-1 active:shadow-none"><Plus size={16} /> Add Voucher</button>
              </div>
              
              <div className="space-y-4">
                {vouchers.map((v, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-xl border-2 border-slate-200 relative group">
                    <button onClick={() => handleRemoveVoucher(idx)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 transition-opacity"><Trash2 size={18} /></button>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Name</label>
                        <input type="text" className="w-full border-2 border-slate-300 rounded-lg px-3 py-1.5 font-bold" value={v.name} onChange={e => updateVoucher(idx, 'name', e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Description</label>
                        <input type="text" className="w-full border-2 border-slate-300 rounded-lg px-3 py-1.5 font-bold" value={v.desc || v.description} onChange={e => updateVoucher(idx, 'desc', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Price (Coins)</label>
                        <input type="number" className="w-full border-2 border-slate-300 rounded-lg px-3 py-1.5 font-bold" value={v.price} onChange={e => updateVoucher(idx, 'price', Number(e.target.value))} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Stock</label>
                        <input type="number" className="w-full border-2 border-slate-300 rounded-lg px-3 py-1.5 font-bold" value={v.stock} onChange={e => updateVoucher(idx, 'stock', Number(e.target.value))} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Icon</label>
                        <input type="text" className="w-full border-2 border-slate-300 rounded-lg px-3 py-1.5 font-bold text-center" value={v.icon} onChange={e => updateVoucher(idx, 'icon', e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button onClick={() => setIsEditing(false)} className="flex-1 bg-slate-100 text-slate-700 font-black px-6 py-4 rounded-xl border-2 border-slate-300 hover:bg-slate-200 transition-all uppercase">Cancel</button>
              <button onClick={handleSubmitModification} className="flex-[2] bg-[#5496a2] text-white font-black px-6 py-4 rounded-xl border-2 border-[#1d3539] shadow-[4px_4px_0px_0px_#1d3539] active:translate-y-1 active:shadow-none hover:bg-[#80abb1] transition-all uppercase">Submit for Approval</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
