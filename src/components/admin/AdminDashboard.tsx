import React, { useEffect, useState } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, where, getDocs, doc, updateDoc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import Map, { Marker, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN } from '../../lib/mapboxAPI';
import { LayoutDashboard, Mail, Store, Users, FileCheck, Globe, LogOut } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trees, setTrees] = useState<any[]>([]);
  const [signposts, setSignposts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [resetInterval, setResetInterval] = useState<number>(7);
  const [isSaving, setIsSaving] = useState(false);
  const [editingCoins, setEditingCoins] = useState<{ [uid: string]: number }>({});
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedTree, setSelectedTree] = useState<any | null>(null);
  const [selectedSignpost, setSelectedSignpost] = useState<any | null>(null);
  const [demoRequests, setDemoRequests] = useState<any[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);
  
  // Store Management State
  const [storeItems, setStoreItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState<number | ''>('');
  const [newItemStock, setNewItemStock] = useState<number | ''>('');
  const [newItemIcon, setNewItemIcon] = useState('☕');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemMerchant, setNewItemMerchant] = useState('');
  const [newItemProfile, setNewItemProfile] = useState(true);
  
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Mailbox State
  const [mailTarget, setMailTarget] = useState<'all' | 'merchant_all' | 'user' | 'guild'>('all');
  const [mailTargetId, setMailTargetId] = useState('');
  const [mailTitle, setMailTitle] = useState('');
  const [mailContent, setMailContent] = useState('');
  const [expiresForNewUsers, setExpiresForNewUsers] = useState(false);
  const [sentMails, setSentMails] = useState<any[]>([]);

  const fetchApplications = async () => {
    const q = query(collection(db, 'applications'), where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setApplications(apps);
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();

    const unsubDemo = onSnapshot(query(collection(db, 'demo_requests'), where('status', '==', 'pending')), (snapshot) => {
      setDemoRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubTrees = onSnapshot(collection(db, 'trees'), (snapshot) => {
      setTrees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubSignposts = onSnapshot(collection(db, 'signposts'), (snapshot) => {
      setSignposts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubStore = onSnapshot(collection(db, 'storeItems'), (snapshot) => {
      setStoreItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubCat = onSnapshot(collection(db, 'storeCategories'), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubMerchants = onSnapshot(collection(db, 'merchants'), (snapshot) => {
      setMerchants(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubMails = onSnapshot(query(collection(db, 'mail'), where('sender', '==', 'Admin')), (snapshot) => {
      const sorted = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => b.createdAt - a.createdAt);
      setSentMails(sorted);
    });

    const fetchConfig = async () => {
      const docSnap = await getDocs(query(collection(db, 'settings')));
      const conf = docSnap.docs.find(d => d.id === 'game_config');
      if (conf) {
        setResetInterval(conf.data().treeResetIntervalDays || 7);
      }
    };
    fetchConfig();

    return () => {
      unsubDemo();
      unsubTrees();
      unsubSignposts();
      unsubUsers();
      unsubStore();
      unsubCat();
      unsubMerchants();
      unsubMails();
    };
  }, []);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    await setDoc(doc(db, 'settings', 'game_config'), { treeResetIntervalDays: resetInterval }, { merge: true });
    setIsSaving(false);
    alert('Settings saved!');
  };

  const handleDeleteTree = async (treeId: string) => {
    if (confirm('Delete this tree?')) {
      await deleteDoc(doc(db, 'trees', treeId));
    }
  };

  const handleDeleteSignpost = async (signpostId: string) => {
    if (confirm('Delete this signpost?')) {
      await deleteDoc(doc(db, 'signposts', signpostId));
    }
  };

  const handleClearAllTrees = async () => {
    if (confirm('Are you sure you want to delete ALL trees across the entire map? This cannot be undone!')) {
      for (const tree of trees) {
        await deleteDoc(doc(db, 'trees', tree.id));
      }
      alert('All trees cleared!');
    }
  };

  const handleUpdateCoins = async (uid: string) => {
    const newCoins = editingCoins[uid];
    if (newCoins !== undefined) {
      await updateDoc(doc(db, 'users', uid), { coins: newCoins });
      alert('User coins updated!');
    }
  };

  const handleApprove = async (app: any) => {
    await updateDoc(doc(db, 'applications', app.id), { status: 'approved' });
    await setDoc(doc(db, 'merchants', app.id), {
      storeName: app.storeName,
      category: app.category,
      offers: app.offers || '', 
      icon: app.icon || '🏪', 
      ownerId: app.merchantId,
      location: app.location || [103.6400, 1.5600],
      menuLink: app.menuLink || null
    }, { merge: true });

    if (app.vouchers && Array.isArray(app.vouchers)) {
      for (const voucher of app.vouchers) {
        const itemData = {
          name: voucher.name,
          description: voucher.desc,
          price: Number(voucher.price),
          stock: Number(voucher.stock),
          icon: voucher.icon,
          category: voucher.category || 'Vouchers',
          merchantId: app.merchantId,
          showInProfile: voucher.profileShow !== false,
          createdAt: Date.now()
        };
        if (app.type === 'modification' && voucher.originalId) {
          await updateDoc(doc(db, 'storeItems', voucher.originalId), itemData);
        } else {
          await setDoc(doc(collection(db, 'storeItems')), itemData);
        }
      }
    }

    await setDoc(doc(collection(db, 'mail')), {
      recipientType: 'user',
      recipientId: app.merchantId,
      title: app.type === 'modification' ? 'Store Update Approved 🎉' : 'Merchant Application Approved 🎉',
      content: app.type === 'modification' 
        ? `Your store updates for "${app.storeName}" have been approved and are now live!`
        : `Congratulations! Your merchant application for "${app.storeName}" has been approved.\n\nYou can now log out and log back in to see your merchant dashboard. Your store is now live on the map!`,
      sender: 'System',
      createdAt: Date.now()
    });
    fetchApplications();
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Enter the reason for rejection (this will be sent to the merchant's mailbox):");
    if (reason === null) return; 
    
    await updateDoc(doc(db, 'applications', id), { 
      status: 'rejected',
      rejectReason: reason || 'No reason provided.'
    });
    
    const appDoc = await getDoc(doc(db, 'applications', id));
    if (appDoc.exists()) {
      const appData = appDoc.data();
      await setDoc(doc(collection(db, 'mail')), {
        recipientType: 'user',
        recipientId: appData.merchantId,
        title: 'Merchant Application Update',
        content: `Your merchant application for "${appData.storeName}" was not approved.\n\nReason: ${reason || 'No reason provided.'}`,
        sender: 'System',
        createdAt: Date.now()
      });
    }
    fetchApplications();
  };

  const handleSendMail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mailTitle || !mailContent) {
      alert("Please enter title and content.");
      return;
    }
    if ((mailTarget === 'user' || mailTarget === 'guild') && !mailTargetId) {
      alert("Please enter a Target ID.");
      return;
    }

    await setDoc(doc(collection(db, 'mail')), {
      recipientType: mailTarget,
      recipientId: mailTarget === 'all' || mailTarget === 'merchant_all' ? null : mailTargetId,
      title: mailTitle,
      content: mailContent,
      sender: 'Admin',
      createdAt: Date.now(),
      expiresForNewUsers: mailTarget !== 'user' ? expiresForNewUsers : false
    });

    setMailTitle('');
    setMailContent('');
    setMailTargetId('');
    alert("Message sent successfully!");
  };

  const handleDeleteMail = async (id: string) => {
    if (confirm("Are you sure you want to recall (delete) this broadcast?")) {
      await deleteDoc(doc(db, 'mail', id));
    }
  };

  const handleApproveDemo = async (id: string) => {
    await updateDoc(doc(db, 'demo_requests', id), { status: 'approved' });
  };

  const handleRejectDemo = async (id: string) => {
    await updateDoc(doc(db, 'demo_requests', id), { status: 'rejected' });
  };

  const handleLabelChange = (appId: string, newLabel: string) => {
    setApplications(apps => apps.map(app => app.id === appId ? { ...app, offers: newLabel } : app));
  };

  const handleIconChange = (appId: string, newIcon: string) => {
    setApplications(apps => apps.map(app => app.id === appId ? { ...app, icon: newIcon } : app));
  };

  const handleVoucherPriceChange = (appId: string, voucherIndex: number, newPrice: number) => {
    setApplications(apps => apps.map(app => {
      if (app.id === appId && app.vouchers) {
        const newVouchers = [...app.vouchers];
        newVouchers[voucherIndex] = { ...newVouchers[voucherIndex], price: newPrice };
        return { ...app, vouchers: newVouchers };
      }
      return app;
    }));
  };

  const handleAddStoreItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemPrice || !newItemStock) return;
    
    const data = {
      name: newItemName,
      description: newItemDesc,
      price: Number(newItemPrice),
      stock: Number(newItemStock),
      icon: newItemIcon,
      category: newItemCategory,
      merchantId: newItemMerchant,
      showInProfile: newItemProfile,
      createdAt: Date.now()
    };
    
    if (editingItemId) {
      await updateDoc(doc(db, 'storeItems', editingItemId), data);
      setEditingItemId(null);
      alert('Store item updated!');
    } else {
      await setDoc(doc(collection(db, 'storeItems')), data);
      alert('Store item added!');
    }
    
    setNewItemName('');
    setNewItemDesc('');
    setNewItemPrice('');
    setNewItemStock('');
    setNewItemIcon('☕');
    setNewItemCategory('');
    setNewItemMerchant('');
    setNewItemProfile(true);
  };

  const handleEditInit = (item: any) => {
    setEditingItemId(item.id);
    setNewItemName(item.name);
    setNewItemDesc(item.description);
    setNewItemPrice(item.price);
    setNewItemStock(item.stock);
    setNewItemIcon(item.icon);
    setNewItemCategory(item.category || '');
    setNewItemMerchant(item.merchantId || '');
    setNewItemProfile(item.showInProfile !== false);
  };

  const handleDeleteStoreItem = async (id: string) => {
    if (confirm('Delete this store item?')) {
      await deleteDoc(doc(db, 'storeItems', id));
      if (editingItemId === id) setEditingItemId(null);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName) return;
    await setDoc(doc(collection(db, 'storeCategories')), { name: newCategoryName });
    setNewCategoryName('');
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Delete this category?')) {
      await deleteDoc(doc(db, 'storeCategories', id));
    }
  };

  const filteredUsers = users.filter(u => {
    if (!userSearchTerm) return true;
    const term = userSearchTerm.toLowerCase();
    return u.email?.toLowerCase().includes(term) || u.id.toLowerCase().includes(term);
  });

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'applications', label: 'Applications', icon: <FileCheck size={20} />, badge: applications.length + demoRequests.length },
    { id: 'store', label: 'Store Manager', icon: <Store size={20} /> },
    { id: 'users', label: 'Users & Economy', icon: <Users size={20} /> },
    { id: 'broadcasts', label: 'Broadcasts', icon: <Mail size={20} /> },
    { id: 'world', label: 'World Control', icon: <Globe size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 flex font-sans text-teal-950 relative overflow-hidden">
      
      {/* Sidebar */}
      <div className="w-64 bg-white/40 backdrop-blur-xl border-r border-white/60 flex flex-col sticky top-0 h-screen shadow-[4px_0_24px_rgba(0,0,0,0.05)] shrink-0 z-20">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-700 to-cyan-600 tracking-tight">EcoStride</h1>
          <p className="text-xs font-bold text-teal-700/70 uppercase tracking-wider mt-1">Admin Panel</p>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="flex flex-col gap-1 px-3">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all ${
                  activeTab === item.id 
                    ? 'bg-teal-500/15 text-teal-700 shadow-sm border border-teal-500/20' 
                    : 'text-teal-700/70 hover:bg-white/50 hover:text-teal-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  {item.label}
                </div>
                {item.badge && item.badge > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={() => auth.signOut()} 
            className="flex items-center gap-2 w-full px-4 py-3 rounded-xl font-bold text-teal-700/70 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto h-screen p-8 bg-transparent">
        <div className="max-w-7xl mx-auto">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="animate-in fade-in duration-300">
              <h2 className="text-3xl font-black text-teal-950 mb-8">Platform Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white/60 backdrop-blur-lg p-6 rounded-3xl shadow-xl shadow-teal-900/5 border border-white/80">
                  <p className="text-sm font-bold text-teal-700/70 uppercase tracking-wider mb-2">Total Users</p>
                  <p className="text-4xl font-black text-[#111111]">{users.length}</p>
                </div>
                <div className="bg-white/60 backdrop-blur-lg p-6 rounded-3xl shadow-xl shadow-teal-900/5 border border-white/80">
                  <p className="text-sm font-bold text-teal-700/70 uppercase tracking-wider mb-2">Active Merchants</p>
                  <p className="text-4xl font-black text-emerald-600">{merchants.length}</p>
                </div>
                <div className="bg-white/60 backdrop-blur-lg p-6 rounded-3xl shadow-xl shadow-teal-900/5 border border-white/80">
                  <p className="text-sm font-bold text-teal-700/70 uppercase tracking-wider mb-2">Planted Trees</p>
                  <p className="text-4xl font-black text-emerald-500">{trees.length}</p>
                </div>
                <div className="bg-white/60 backdrop-blur-lg p-6 rounded-3xl shadow-xl shadow-teal-900/5 border border-white/80">
                  <p className="text-sm font-bold text-teal-700/70 uppercase tracking-wider mb-2">Active Signposts</p>
                  <p className="text-4xl font-black text-orange-500">{signposts.length}</p>
                </div>
              </div>
            </div>
          )}

          {/* APPLICATIONS TAB */}
          {activeTab === 'applications' && (
            <div className="animate-in fade-in duration-300">
              <h2 className="text-3xl font-black text-teal-950 mb-8">Pending Applications</h2>
              
              <div className="bg-white/60 backdrop-blur-lg rounded-3xl shadow-xl shadow-teal-900/5 border border-white/80 p-6 mb-8">
                <h3 className="text-xl font-bold text-teal-950 mb-4 flex items-center gap-2">
                  Merchant Requests <span className="bg-urban-blue/20 text-teal-600 text-xs px-2 py-1 rounded-full">{applications.length}</span>
                </h3>
                
                <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar space-y-4">
                  {loading ? <p className="text-teal-700/70">Loading...</p> : applications.length === 0 ? <p className="text-teal-700/70 italic">No pending applications.</p> : (
                    applications.map((app) => (
                      <div key={app.id} className="bg-transparent p-5 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-[#111111]">{app.storeName} <span className="text-sm font-normal text-teal-700/70 ml-2">({app.category})</span></h4>
                          <p className="text-sm text-slate-600 mt-1">Plan: <span className="font-semibold">{app.subscriptionPlan}</span></p>
                          <p className="text-xs text-teal-700/70 mt-1">Email: {app.merchantEmail} | Link: {app.menuLink || 'N/A'}</p>
                          
                          <div className="mt-4 flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                              <label className="text-xs font-bold text-teal-700/70 uppercase">Map Label:</label>
                              <input 
                                type="text" 
                                value={app.offers || ''} 
                                onChange={(e) => handleLabelChange(app.id, e.target.value)}
                                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 w-40"
                                placeholder="e.g. OFF 10%"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-xs font-bold text-teal-700/70 uppercase">Icon:</label>
                              <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1">
                                {['🏪', '🍔', '☕', '🛍️', '🥦', '👟', '🎮'].map(icon => (
                                  <button
                                    key={icon}
                                    onClick={() => handleIconChange(app.id, icon)}
                                    className={`text-lg px-1.5 py-0.5 rounded transition-colors ${(app.icon || '🏪') === icon ? 'bg-urban-blue/20 shadow-sm' : 'hover:bg-white/60'}`}
                                  >
                                    {icon}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          {app.vouchers && app.vouchers.length > 0 && (
                            <div className="mt-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                              <h5 className="text-xs font-bold text-teal-700 uppercase mb-2">Proposed Vouchers</h5>
                              <div className="space-y-2">
                                {app.vouchers.map((v: any, vIdx: number) => (
                                  <div key={vIdx} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">{v.icon}</span>
                                      <div>
                                        <p className="font-bold text-slate-900">{v.name} <span className="text-xs font-normal text-slate-500">x{v.stock}</span></p>
                                        <p className="text-xs text-slate-500">{v.desc}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-orange-500">🪙</span>
                                      <input 
                                        type="number"
                                        className="w-16 border border-slate-300 rounded px-1 text-center font-bold outline-none"
                                        value={v.price}
                                        onChange={(e) => handleVoucherPriceChange(app.id, vIdx, Number(e.target.value))}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => handleReject(app.id)} className="bg-white border border-red-200 text-red-600 font-bold px-4 py-2 rounded-lg hover:bg-red-50 transition-colors">Reject</button>
                          <button onClick={() => handleApprove(app)} className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-lg shadow-teal-500/20 border-none text-white font-bold px-4 py-2 rounded-lg hover:bg-black shadow-sm transition-colors">Approve</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur-lg rounded-3xl shadow-xl shadow-teal-900/5 border border-white/80 p-6">
                <h3 className="text-xl font-bold text-teal-950 mb-4 flex items-center gap-2">
                  Demo Requests <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">{demoRequests.length}</span>
                </h3>
                
                <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                  {demoRequests.length === 0 ? <p className="text-teal-700/70 italic">No pending demo requests.</p> : (
                    demoRequests.map((req) => (
                      <div key={req.id} className="bg-transparent p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-teal-950">{req.email}</h4>
                          <p className="text-xs text-teal-700/70 mt-1">IP: <span className="font-mono text-teal-700/70">{req.ipAddress}</span> | Time: {new Date(req.requestedAt).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => handleRejectDemo(req.id)} className="bg-white border border-red-200 text-red-600 font-bold px-3 py-1.5 text-sm rounded-lg hover:bg-red-50 transition-colors">Reject</button>
                          <button onClick={() => handleApproveDemo(req.id)} className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-lg shadow-teal-500/20 border-none text-white font-bold px-3 py-1.5 text-sm rounded-lg hover:bg-black shadow-sm transition-colors">Approve</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STORE TAB */}
          {activeTab === 'store' && (
            <div className="animate-in fade-in duration-300">
              <h2 className="text-3xl font-black text-teal-950 mb-8">Store Manager</h2>
              
              <div className="bg-white/60 backdrop-blur-lg rounded-3xl shadow-xl shadow-teal-900/5 border border-white/80 p-6 mb-8">
                <h3 className="text-lg font-bold text-teal-950 mb-4">Categories</h3>
                <div className="flex flex-wrap gap-2 items-center">
                  {categories.map(cat => (
                    <span key={cat.id} className="bg-white/60 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 border border-slate-200">
                      {cat.name}
                      <button onClick={() => handleDeleteCategory(cat.id)} className="text-teal-700/70 hover:text-red-500 transition-colors">×</button>
                    </span>
                  ))}
                  <div className="flex gap-2 ml-2">
                    <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="New Category..." className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" />
                    <button onClick={handleAddCategory} className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-lg shadow-teal-500/20 border-none text-white font-bold px-4 py-1.5 rounded-lg text-sm hover:bg-black shadow-sm transition-colors">Add</button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <div className="bg-white/60 backdrop-blur-lg p-6 rounded-3xl shadow-xl shadow-teal-900/5 border border-white/80 sticky top-0">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-lg text-teal-950">{editingItemId ? 'Edit Item' : 'Create New Item'}</h3>
                      {editingItemId && <button onClick={() => setEditingItemId(null)} className="text-sm font-bold text-teal-700/70 hover:text-slate-600">Cancel</button>}
                    </div>
                    <form onSubmit={handleAddStoreItem} className="flex flex-col gap-4">
                      <div>
                        <label className="text-xs font-bold text-teal-700/70 uppercase">Item Name</label>
                        <input required type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="w-full mt-1 border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" placeholder="e.g. Free Coffee Voucher" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-teal-700/70 uppercase">Description</label>
                        <textarea required value={newItemDesc} onChange={e => setNewItemDesc(e.target.value)} className="w-full mt-1 border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none h-20" placeholder="Details..." />
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="text-xs font-bold text-teal-700/70 uppercase">Price</label>
                          <input required type="number" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value === '' ? '' : Number(e.target.value))} className="w-full mt-1 border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-bold text-teal-700/70 uppercase">Stock</label>
                          <input required type="number" value={newItemStock} onChange={e => setNewItemStock(e.target.value === '' ? '' : Number(e.target.value))} className="w-full mt-1 border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" />
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="text-xs font-bold text-teal-700/70 uppercase">Icon (Emoji)</label>
                          <input required type="text" value={newItemIcon} onChange={e => setNewItemIcon(e.target.value)} className="w-full mt-1 border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-center text-lg" />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-bold text-teal-700/70 uppercase">Category</label>
                          <select value={newItemCategory} onChange={e => setNewItemCategory(e.target.value)} className="w-full mt-1 border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white">
                            <option value="">None</option>
                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-teal-700/70 uppercase">Linked Merchant</label>
                        <select value={newItemMerchant} onChange={e => setNewItemMerchant(e.target.value)} className="w-full mt-1 border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white">
                          <option value="">General (None)</option>
                          {merchants.map(m => <option key={m.id} value={m.ownerId}>{m.storeName}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center gap-2 py-2">
                        <input type="checkbox" id="profileShow" checked={newItemProfile} onChange={e => setNewItemProfile(e.target.checked)} className="w-4 h-4 text-teal-600 rounded border-slate-300" />
                        <label htmlFor="profileShow" className="text-sm font-bold text-slate-700">Display item in user's profile</label>
                      </div>
                      <button type="submit" className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-lg shadow-teal-500/20 border-none text-white font-bold py-3 rounded-xl mt-2 hover:bg-black shadow-sm transition-colors">
                        {editingItemId ? 'Update Item' : 'Add Item'}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="bg-white/60 backdrop-blur-lg p-6 rounded-3xl shadow-xl shadow-teal-900/5 border border-white/80">
                    <h3 className="font-bold text-lg text-teal-950 mb-6">Inventory Grid</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                      {storeItems.length === 0 && <p className="text-teal-700/70 italic">No items in the store yet.</p>}
                      {storeItems.map(item => (
                        <div key={item.id} className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
                          {item.stock <= 0 && <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-bl-lg tracking-wider">OUT OF STOCK</div>}
                          <div className="flex gap-4">
                            <div className="text-3xl bg-transparent p-3 rounded-xl h-fit border border-slate-100">{item.icon}</div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-teal-950 truncate">{item.name}</h4>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.category && <span className="bg-teal-500/15 text-teal-700 shadow-sm border border-teal-500/20 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">{item.category}</span>}
                                {item.merchantId && <span className="bg-emerald-50 text-emerald-600 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">Linked</span>}
                              </div>
                              <p className="text-xs text-teal-700/70 mt-2 line-clamp-2">{item.description}</p>
                              <div className="flex items-center gap-3 mt-3 text-xs font-bold">
                                <span className="text-orange-500">🪙 {item.price}</span>
                                <span className={item.stock > 0 ? "text-emerald-500" : "text-red-500"}>📦 {item.stock} left</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                            <button onClick={() => handleEditInit(item)} className="flex-1 bg-transparent hover:bg-white/60 text-slate-700 py-1.5 rounded-lg font-bold text-xs transition-colors border border-slate-200">
                              Edit
                            </button>
                            <button onClick={() => handleDeleteStoreItem(item.id)} className="flex-1 bg-white hover:bg-red-50 text-red-500 hover:text-red-600 py-1.5 rounded-lg font-bold text-xs transition-colors border border-red-100">
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black text-teal-950">User Economy</h2>
                <input 
                  type="text" 
                  placeholder="Search email or ID..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 w-64 shadow-sm"
                />
              </div>
              
              <div className="bg-white/60 backdrop-blur-lg rounded-3xl shadow-xl shadow-teal-900/5 border border-white/80 overflow-hidden">
                <div className="max-h-[700px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-transparent sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-6 py-4 font-bold text-teal-700/70 uppercase text-xs tracking-wider">User</th>
                        <th className="px-6 py-4 font-bold text-teal-700/70 uppercase text-xs tracking-wider">Role</th>
                        <th className="px-6 py-4 font-bold text-teal-700/70 uppercase text-xs tracking-wider">Stats</th>
                        <th className="px-6 py-4 font-bold text-teal-700/70 uppercase text-xs tracking-wider">Coins</th>
                        <th className="px-6 py-4 font-bold text-teal-700/70 uppercase text-xs tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.length === 0 && (
                        <tr><td colSpan={5} className="px-6 py-8 text-center text-teal-700/70 italic">No users found.</td></tr>
                      )}
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="hover:bg-transparent/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-teal-950">{u.email}</div>
                            <div className="text-xs text-teal-700/70 font-mono mt-0.5">{u.id}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                              u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                              u.role === 'merchant' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-white/60 text-slate-600'
                            }`}>
                              {u.role || 'user'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs text-slate-600">Trees: <span className="font-bold text-teal-950">{u.totalTreesPlanted || 0}</span></div>
                            <div className="text-xs text-slate-600">Saved: <span className="font-bold text-teal-950">{u.totalCarbonSaved || 0}g</span></div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-orange-500 font-black">🪙</span>
                              <input 
                                type="number" 
                                className="w-20 bg-white border border-slate-300 rounded-md px-2 py-1 text-sm font-bold text-teal-950 outline-none focus:border-teal-500"
                                value={editingCoins[u.id] !== undefined ? editingCoins[u.id] : (u.coins || 0)}
                                onChange={(e) => setEditingCoins({...editingCoins, [u.id]: Number(e.target.value)})}
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => handleUpdateCoins(u.id)}
                              className="bg-teal-500/15 text-teal-700 shadow-sm border border-teal-500/20 hover:bg-urban-blue/20 hover:text-teal-600 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                            >
                              Save Coins
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* BROADCASTS TAB */}
          {activeTab === 'broadcasts' && (
            <div className="animate-in fade-in duration-300">
              <h2 className="text-3xl font-black text-teal-950 mb-8">Broadcast Center</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white/60 backdrop-blur-lg rounded-3xl shadow-xl shadow-teal-900/5 border border-white/80 p-6 h-fit">
                  <h3 className="text-xl font-bold text-teal-950 mb-6 flex items-center gap-2">
                    <Mail size={24} className="text-teal-600" /> Compose Message
                  </h3>
                  <form onSubmit={handleSendMail} className="flex flex-col gap-5">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-teal-700/70 uppercase tracking-wider mb-2">Target Audience</label>
                        <select 
                          value={mailTarget}
                          onChange={(e) => setMailTarget(e.target.value as any)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-teal-950 font-bold outline-none focus:border-teal-500"
                        >
                          <option value="all">All Users</option>
                          <option value="merchant_all">All Merchants</option>
                          <option value="user">Specific User (UID)</option>
                          <option value="guild">Specific Guild (ID)</option>
                        </select>
                      </div>
                      
                      {(mailTarget === 'user' || mailTarget === 'guild') && (
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-teal-700/70 uppercase tracking-wider mb-2">Target ID</label>
                          <input 
                            type="text" 
                            value={mailTargetId}
                            onChange={(e) => setMailTargetId(e.target.value)}
                            placeholder={mailTarget === 'user' ? "User UID..." : "Guild ID..."}
                            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-teal-950 font-bold outline-none focus:border-teal-500"
                          />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-teal-700/70 uppercase tracking-wider mb-2">Message Title</label>
                      <input 
                        type="text" 
                        value={mailTitle}
                        onChange={(e) => setMailTitle(e.target.value)}
                        placeholder="e.g. Server Maintenance..."
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-teal-950 outline-none focus:border-teal-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-teal-700/70 uppercase tracking-wider mb-2">Content</label>
                      <textarea 
                        value={mailContent}
                        onChange={(e) => setMailContent(e.target.value)}
                        placeholder="Type your message here..."
                        rows={5}
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-teal-950 outline-none focus:border-teal-500 resize-none"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 bg-transparent p-3 rounded-lg border border-slate-200">
                      <input 
                        type="checkbox" 
                        id="expiresForNew"
                        checked={expiresForNewUsers}
                        onChange={(e) => setExpiresForNewUsers(e.target.checked)}
                        className="w-4 h-4 text-teal-600 rounded border-slate-300"
                        disabled={mailTarget === 'user'}
                      />
                      <label htmlFor="expiresForNew" className={`text-sm font-bold ${mailTarget === 'user' ? 'text-teal-700/70' : 'text-slate-700'}`}>
                        Only send to currently registered users (Future users won't see this)
                      </label>
                    </div>
                    
                    <button 
                      type="submit"
                      className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-lg shadow-teal-500/20 border-none text-white font-black px-6 py-3.5 rounded-xl hover:bg-black transition-colors shadow-sm mt-2"
                    >
                      Send Broadcast 📤
                    </button>
                  </form>
                </div>

                <div className="bg-white/60 backdrop-blur-lg rounded-3xl shadow-xl shadow-teal-900/5 border border-white/80 p-6 flex flex-col">
                  <h3 className="text-xl font-bold text-teal-950 mb-6">Sent Broadcasts</h3>
                  <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                    {sentMails.length === 0 ? (
                      <p className="text-teal-700/70 italic">No broadcasts sent yet.</p>
                    ) : (
                      sentMails.map(mail => (
                        <div key={mail.id} className="bg-transparent rounded-xl p-4 border border-slate-200 relative group hover:border-slate-300 transition-colors">
                          <button 
                            onClick={() => handleDeleteMail(mail.id)}
                            className="absolute top-4 right-4 bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 px-3 py-1 rounded-lg text-xs font-bold transition-colors opacity-0 group-hover:opacity-100"
                          >
                            Recall / Delete
                          </button>
                          
                          <h4 className="font-bold text-teal-950 flex items-center gap-2 pr-24">
                            {mail.title} 
                            {mail.expiresForNewUsers && <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Current Users Only</span>}
                          </h4>
                          <p className="text-xs text-teal-700/70 mt-1 font-mono">To: {mail.recipientType} {mail.recipientId ? `(${mail.recipientId})` : ''}</p>
                          <p className="text-sm text-slate-600 mt-3 line-clamp-3 leading-relaxed">{mail.content}</p>
                          <p className="text-[10px] font-bold text-teal-700/70 mt-3 uppercase tracking-wider">{new Date(mail.createdAt).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* WORLD CONTROL TAB */}
          {activeTab === 'world' && (
            <div className="animate-in fade-in duration-300">
              <h2 className="text-3xl font-black text-teal-950 mb-8">World Control</h2>
              
              <div className="bg-white/60 backdrop-blur-lg rounded-3xl shadow-xl shadow-teal-900/5 border border-white/80 p-6 mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-teal-950">Global Game Settings</h3>
                  <p className="text-sm text-teal-700/70">Configure global mechanics</p>
                </div>
                <div className="flex items-center gap-4 bg-transparent p-2 rounded-xl border border-slate-200">
                  <label className="text-sm font-bold text-slate-700 pl-2">Tree Reset Interval (Days):</label>
                  <input 
                    type="number" 
                    value={resetInterval} 
                    onChange={(e) => setResetInterval(Number(e.target.value))}
                    className="w-20 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-center text-teal-950 font-bold outline-none focus:border-teal-500"
                  />
                  <button 
                    onClick={handleSaveConfig}
                    className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-lg shadow-teal-500/20 border-none text-white font-bold px-5 py-1.5 rounded-lg hover:bg-black transition-colors shadow-sm"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur-lg rounded-3xl shadow-xl shadow-teal-900/5 border border-white/80 p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-bold text-teal-950 text-lg">Interactive Map Manager</h3>
                    <p className="text-sm text-teal-700/70">Click on any marker to manage it</p>
                  </div>
                  <button 
                    onClick={handleClearAllTrees}
                    className="bg-white border border-red-200 text-red-600 font-bold px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    Force Clear All Trees
                  </button>
                </div>
                
                <div className="w-full h-[600px] rounded-2xl overflow-hidden border border-slate-200 relative shadow-inner">
                  <Map
                    mapboxAccessToken={MAPBOX_TOKEN}
                    initialViewState={{
                      longitude: 103.6400,
                      latitude: 1.5600,
                      zoom: 14,
                      pitch: 45
                    }}
                    mapStyle="mapbox://styles/mapbox/light-v11" // Switch to light map style for admin
                  >
                    {trees.map((tree) => (
                      <Marker
                        key={tree.id}
                        longitude={tree.location[0]}
                        latitude={tree.location[1]}
                        onClick={(e) => {
                          e.originalEvent.stopPropagation();
                          setSelectedTree(tree);
                          setSelectedSignpost(null);
                        }}
                      >
                        <div className="text-3xl cursor-pointer hover:scale-125 transition-transform origin-bottom drop-shadow-md">
                          🌳
                        </div>
                      </Marker>
                    ))}
                    
                    {signposts.map((post) => (
                      <Marker
                        key={post.id}
                        longitude={post.location[0]}
                        latitude={post.location[1]}
                        onClick={(e) => {
                          e.originalEvent.stopPropagation();
                          setSelectedSignpost(post);
                          setSelectedTree(null);
                        }}
                      >
                        <div className="text-3xl cursor-pointer hover:scale-125 transition-transform origin-bottom drop-shadow-md">
                          🪧
                        </div>
                      </Marker>
                    ))}
                    
                    {selectedSignpost && (
                      <Popup
                        longitude={selectedSignpost.location[0]}
                        latitude={selectedSignpost.location[1]}
                        anchor="bottom"
                        onClose={() => setSelectedSignpost(null)}
                        className="admin-popup"
                      >
                        <div className="p-3 text-teal-950 min-w-[200px] font-sans">
                          <h3 className="font-black text-lg text-orange-600 mb-2">Signpost Data</h3>
                          <p className="font-bold text-sm mb-3 bg-orange-50 p-2 rounded-lg border border-orange-100">{selectedSignpost.message}</p>
                          <p className="text-xs text-teal-700/70 truncate" title={selectedSignpost.authorId}>Author: <span className="font-mono">{selectedSignpost.authorId}</span></p>
                          <p className="text-xs text-teal-700/70 mb-4">{new Date(selectedSignpost.createdAt?.toMillis ? selectedSignpost.createdAt.toMillis() : selectedSignpost.createdAt).toLocaleString()}</p>
                          <button 
                            onClick={() => {
                              handleDeleteSignpost(selectedSignpost.id);
                              setSelectedSignpost(null);
                            }}
                            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg transition-colors shadow-sm"
                          >
                            Delete Signpost
                          </button>
                        </div>
                      </Popup>
                    )}

                    {selectedTree && (
                      <Popup
                        longitude={selectedTree.location[0]}
                        latitude={selectedTree.location[1]}
                        anchor="bottom"
                        onClose={() => setSelectedTree(null)}
                        className="admin-popup"
                      >
                        <div className="p-3 text-teal-950 min-w-[200px] font-sans">
                          <h3 className="font-black text-lg text-emerald-600 mb-2">Tree Data</h3>
                          <p className="text-sm text-slate-600 mb-1">Guild: <span className="font-bold text-teal-950">{selectedTree.guildId}</span></p>
                          <p className="text-xs text-teal-700/70 truncate" title={selectedTree.authorId}>Planter: <span className="font-mono">{selectedTree.authorId}</span></p>
                          <p className="text-xs text-teal-700/70 mb-4">{new Date(selectedTree.plantedAt).toLocaleString()}</p>
                          <button 
                            onClick={() => {
                              handleDeleteTree(selectedTree.id);
                              setSelectedTree(null);
                            }}
                            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg transition-colors shadow-sm"
                          >
                            Delete Tree
                          </button>
                        </div>
                      </Popup>
                    )}
                  </Map>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
