import React, { useEffect, useState } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, where, getDocs, doc, updateDoc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import Map, { Marker, Popup } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN } from '../../lib/mapboxAPI';

export const AdminDashboard: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trees, setTrees] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [resetInterval, setResetInterval] = useState<number>(7);
  const [isSaving, setIsSaving] = useState(false);
  const [editingCoins, setEditingCoins] = useState<{ [uid: string]: number }>({});
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedTree, setSelectedTree] = useState<any | null>(null);
  const [demoRequests, setDemoRequests] = useState<any[]>([]);

  const fetchApplications = async () => {
    const q = query(collection(db, 'applications'), where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setApplications(apps);
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();

    // Fetch demo requests real-time
    const unsubDemo = onSnapshot(query(collection(db, 'demo_requests'), where('status', '==', 'pending')), (snapshot) => {
      setDemoRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch trees real-time
    const unsubTrees = onSnapshot(collection(db, 'trees'), (snapshot) => {
      setTrees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch users real-time
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch game config
    const fetchConfig = async () => {
      const docRef = doc(db, 'settings', 'game_config');
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
      unsubUsers();
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
    // 1. Update application status
    await updateDoc(doc(db, 'applications', app.id), { status: 'approved' });
    
    // 2. Add to approved merchants collection using the unique app ID so they don't overwrite each other
    await setDoc(doc(db, 'merchants', app.id), {
      storeName: app.storeName,
      category: app.category,
      offers: app.offers, // This will be the admin-edited label
      icon: app.icon || '🏪', // Admin-edited icon
      ownerId: app.merchantId,
      location: app.location || [103.6400, 1.5600]
    });

    // 3. Refresh
    fetchApplications();
  };

  const handleReject = async (id: string) => {
    await updateDoc(doc(db, 'applications', id), { status: 'rejected' });
    fetchApplications();
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

  return (
    <div className="w-full min-h-screen bg-slate-900 p-8 text-white font-sans">
      <div className="flex justify-between items-center mb-8 border-b-2 border-slate-700 pb-4">
        <h1 className="text-3xl font-black text-brand-green">EcoStride Platform Admin</h1>
        <button onClick={() => auth.signOut()} className="bg-slate-800 px-4 py-2 rounded-lg font-bold hover:bg-slate-700">Logout</button>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-6">Pending Merchant Applications ({applications.length})</h2>
        
        {loading ? <p>Loading...</p> : (
          <div className="space-y-4">
            {applications.length === 0 && <p className="text-slate-400">No pending applications.</p>}
            
            {applications.map((app) => (
              <div key={app.id} className="bg-slate-700 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-brand-yellow">{app.storeName} <span className="text-sm font-normal text-slate-300 ml-2">({app.category})</span></h3>
                  <p className="text-sm text-slate-300 mt-1">Plan: {app.subscriptionPlan}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <label className="text-sm font-bold text-slate-300">Map Label:</label>
                    <input 
                      type="text" 
                      value={app.offers || ''} 
                      onChange={(e) => handleLabelChange(app.id, e.target.value)}
                      className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:border-brand-green outline-none w-48"
                      placeholder="e.g. OFF 10%"
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <label className="text-sm font-bold text-slate-300">Map Icon:</label>
                    <div className="flex gap-1">
                      {['🏪', '🍔', '☕', '🛍️', '🥦', '👟', '🎮'].map(icon => (
                        <button
                          key={icon}
                          onClick={() => handleIconChange(app.id, icon)}
                          className={`text-xl p-1 rounded transition-colors ${(app.icon || '🏪') === icon ? 'bg-brand-green bg-opacity-30 border border-brand-green' : 'hover:bg-slate-700 hover:scale-110'}`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Email: {app.merchantEmail} | Link: {app.menuLink}</p>
                  {app.location && (
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <span>📍 Coordinates: {app.location[1].toFixed(5)}, {app.location[0].toFixed(5)}</span>
                      <a href={`https://www.google.com/maps/search/?api=1&query=${app.location[1]},${app.location[0]}`} target="_blank" rel="noreferrer" className="text-brand-green hover:text-green-400 underline ml-2">
                        View on Google Maps
                      </a>
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(app)} className="bg-brand-green text-slate-900 font-bold px-4 py-2 rounded-lg hover:bg-green-400">Approve</button>
                  <button onClick={() => handleReject(app.id)} className="bg-red-500 text-white font-bold px-4 py-2 rounded-lg hover:bg-red-600">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 mt-8">
        <h2 className="text-xl font-bold mb-6 text-brand-yellow flex items-center gap-2">
          Demo Access Requests ({demoRequests.length})
        </h2>
        
        <div className="space-y-4">
          {demoRequests.length === 0 && <p className="text-slate-400">No pending demo requests.</p>}
          
          {demoRequests.map((req) => (
            <div key={req.id} className="bg-slate-700 p-4 rounded-xl flex justify-between items-center border border-brand-yellow/30">
              <div>
                <h3 className="font-bold text-lg text-white">{req.email}</h3>
                <p className="text-sm text-slate-300 mt-1">IP Address: <span className="font-mono text-brand-yellow">{req.ipAddress}</span></p>
                <p className="text-xs text-slate-400 mt-1">Requested At: {new Date(req.requestedAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleApproveDemo(req.id)} className="bg-brand-yellow text-slate-900 font-bold px-4 py-2 rounded-lg hover:bg-yellow-400">Approve</button>
                <button onClick={() => handleRejectDemo(req.id)} className="bg-red-500 text-white font-bold px-4 py-2 rounded-lg hover:bg-red-600">Reject</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 mt-8">
        <h2 className="text-xl font-bold mb-6 text-brand-green">Global Game Settings</h2>
        <div className="flex items-center gap-4">
          <label className="font-bold text-slate-300">Tree Reset Interval (Days):</label>
          <input 
            type="number" 
            value={resetInterval} 
            onChange={(e) => setResetInterval(Number(e.target.value))}
            className="bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white w-24 text-center"
          />
          <button 
            onClick={handleSaveConfig}
            className="bg-brand-yellow text-slate-900 font-bold px-6 py-2 rounded-lg hover:bg-yellow-400"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-brand-green">Territory Trees Management ({trees.length})</h2>
          <button 
            onClick={handleClearAllTrees}
            className="bg-red-500 text-white font-bold px-4 py-2 rounded-lg hover:bg-red-600"
          >
            Force Clear All Trees
          </button>
        </div>
        
        <div className="w-full h-[500px] rounded-2xl overflow-hidden border-4 border-slate-700 relative">
          <Map
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={{
              longitude: 103.6400,
              latitude: 1.5600,
              zoom: 14,
              pitch: 45
            }}
            mapStyle="mapbox://styles/mapbox/dark-v11"
          >
            {trees.map((tree) => (
              <Marker
                key={tree.id}
                longitude={tree.location[0]}
                latitude={tree.location[1]}
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setSelectedTree(tree);
                }}
              >
                <div className="text-3xl cursor-pointer hover:scale-125 transition-transform origin-bottom drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
                  🌳
                </div>
              </Marker>
            ))}
            
            {selectedTree && (
              <Popup
                longitude={selectedTree.location[0]}
                latitude={selectedTree.location[1]}
                anchor="bottom"
                onClose={() => setSelectedTree(null)}
                className="admin-tree-popup"
              >
                <div className="p-2 text-slate-900 min-w-[200px]">
                  <h3 className="font-black text-lg text-brand-green mb-1">Tree Data</h3>
                  <p className="font-bold text-sm">Guild: {selectedTree.guildId}</p>
                  <p className="text-xs text-slate-600 truncate" title={selectedTree.authorId}>By: {selectedTree.authorId}</p>
                  <p className="text-xs text-slate-500 mb-3">{new Date(selectedTree.plantedAt).toLocaleString()}</p>
                  <button 
                    onClick={() => {
                      handleDeleteTree(selectedTree.id);
                      setSelectedTree(null);
                    }}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg shadow-comic-hover active:translate-y-1 transition-all"
                  >
                    Delete Tree
                  </button>
                </div>
              </Popup>
            )}
          </Map>
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 mt-8 mb-12 flex flex-col max-h-[800px]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
          <h2 className="text-xl font-bold text-brand-green">User Economy Management ({users.length})</h2>
          <input 
            type="text" 
            placeholder="Search email or ID..."
            value={userSearchTerm}
            onChange={(e) => setUserSearchTerm(e.target.value)}
            className="bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white w-full md:w-64 focus:outline-none focus:border-brand-green"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2">
          {users
            .filter(u => u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) || u.id.includes(userSearchTerm))
            .map(user => (
            <div key={user.id} className="bg-slate-700 p-4 rounded-xl flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <p className="font-bold text-white truncate max-w-[200px]" title={user.email}>{user.email}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${user.role === 'merchant' ? 'bg-brand-pink text-white' : 'bg-brand-green text-slate-900'}`}>
                  {user.role || 'user'}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-300">
                <span>Distance: {user.totalDistanceKm?.toFixed(1) || 0} km</span>
                <span>CO2: {user.totalCarbonSaved?.toFixed(2) || 0} kg</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="font-bold text-brand-yellow">🪙 Coins:</span>
                <input 
                  type="number" 
                  value={editingCoins[user.id] !== undefined ? editingCoins[user.id] : (user.coins || 0)}
                  onChange={(e) => setEditingCoins({ ...editingCoins, [user.id]: Number(e.target.value) })}
                  className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white flex-1 min-w-0"
                />
                <button 
                  onClick={() => handleUpdateCoins(user.id)}
                  className="bg-brand-green text-slate-900 font-bold px-3 py-1 rounded text-sm hover:bg-green-400"
                >
                  Save
                </button>
              </div>
            </div>
          ))}
          {users.length === 0 && <p className="text-slate-400">No users registered yet.</p>}
          {users.length > 0 && users.filter(u => u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) || u.id.includes(userSearchTerm)).length === 0 && (
            <p className="text-slate-400">No users match your search.</p>
          )}
        </div>
      </div>

    </div>
  );
};
