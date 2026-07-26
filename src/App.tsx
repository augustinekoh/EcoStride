import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDemoStore } from './stores/useDemoStore';
import { BottomNavBar } from './components/controls/BottomNavBar';
import { ProfileView } from './components/profile/ProfileView';
import { SettingsView } from './components/profile/SettingsView';
import { CityView } from './components/city/CityView';
import { LeaderboardModal } from './components/modals/LeaderboardModal';
import { LandingPage } from './components/landing/LandingPage';
import { RouteSimulator } from './components/controls/RouteSimulator';
import { MapView } from './components/map/MapView';
import { ImpactReportModal } from './components/modals/ImpactReportModal';
import { MerchantDashboard } from './components/merchant/MerchantDashboard';
import { MerchantOnboardingForm } from './components/merchant/MerchantOnboardingForm';
import { AuthModal } from './components/modals/AuthModal';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { useAuthStore } from './stores/useAuthStore';
import { auth, db } from './firebase';
import { onAuthStateChanged, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, deleteDoc, onSnapshot } from 'firebase/firestore';
import { useUserStore } from './stores/useUserStore';

function PublicApp() {
  const { activeView, isWaitingForApproval } = useDemoStore();
  const { user } = useAuthStore();

  if (!user || isWaitingForApproval) {
    return (
      <div className="w-screen h-screen overflow-hidden relative text-[var(--color-text-main)] font-sans transition-colors duration-500">
        <AuthModal />
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden relative text-[var(--color-text-main)] font-sans transition-colors duration-500">
      {activeView !== 'settings' && <BottomNavBar />}
      
      {activeView === 'landing' && <LandingPage />}
      {activeView === 'profile' && <ProfileView />}
      {activeView === 'settings' && <SettingsView />}
      {activeView === 'city' && <CityView />}
      {activeView === 'map' && (
        <>
          <MapView />
          <RouteSimulator />
          <ImpactReportModal />
        </>
      )}
      {activeView === 'merchant_dashboard' && <MerchantDashboard />}
      {activeView === 'merchant_onboarding' && <MerchantOnboardingForm />}
      {activeView === 'group' && (
        <div className="h-full w-full bg-brand-cream flex items-center justify-center p-8 text-center">
          <h2 className="text-3xl font-black uppercase text-slate-400">Group System Coming Soon!</h2>
        </div>
      )}

      <LeaderboardModal isOpen={activeView === 'leaderboard'} onClose={() => useDemoStore.getState().setActiveView('landing')} />
    </div>
  );
}

function AdminApp() {
  const { role } = useAuthStore();
  if (role !== 'admin') {
    return <AdminLogin />;
  }
  return <AdminDashboard />;
}

function App() {
  const { setUser, loading, setLoading } = useAuthStore();
  const { setLocalData } = useUserStore();

  useEffect(() => {
    // Passive cleanup of expired trees
    const cleanupTrees = async () => {
      try {
        const confSnap = await getDoc(doc(db, 'settings', 'game_config'));
        const days = confSnap.exists() ? (confSnap.data().treeResetIntervalDays || 7) : 7;
        const threshold = Date.now() - (days * 24 * 60 * 60 * 1000);
        
        const treesSnap = await getDocs(collection(db, 'trees'));
        treesSnap.forEach(async (treeDoc) => {
          if (treeDoc.data().plantedAt < threshold) {
            await deleteDoc(doc(db, 'trees', treeDoc.id));
          }
        });
      } catch (err) {
        console.error("Tree cleanup failed:", err);
      }
    };
    cleanupTrees();

    // Force session persistence so closing the tab or opening a new tab logs out the user
    setPersistence(auth, browserSessionPersistence).catch(console.error);
    
    let unsubUserDoc: any = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Setup real-time listener for points/carbon
        unsubUserDoc = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setLocalData({
              userCoins: data.coins || 0,
              totalCarbonSaved: data.totalCarbonSaved || 0,
              totalDistanceKm: data.totalDistanceKm || 0
            });
          }
        });

        // Setup real-time listener for trees planted by this user
        const unsubTrees = onSnapshot(collection(db, 'trees'), (snapshot) => {
          const userTrees = snapshot.docs.filter(doc => doc.data().authorId === user.uid);
          setLocalData({ totalTreesPlanted: userTrees.length });
        });

        // Store it so we can unsubscribe later
        (window as any).unsubTrees = unsubTrees;

        // First check if they are in the admins collection
        const adminSnap = await getDoc(doc(db, 'admins', user.uid));
        if (adminSnap.exists()) {
          setUser(user, 'admin');
        } else if (user.email?.toLowerCase() === 'ecostride_demo@gmail.com') {
          // Always listen to demo_requests via onSnapshot to prevent race condition 
          // where AuthModal.tsx sets it to pending AFTER App.tsx sees it as approved.
          onSnapshot(doc(db, 'demo_requests', user.uid), (docSnap) => {
            if (docSnap.exists()) {
              const status = docSnap.data().status;
              const isFresh = sessionStorage.getItem('freshDemoLogin') === 'true';
              
              if (status === 'approved' && !isFresh) {
                useDemoStore.getState().setDemoRequestRejected(false);
                useDemoStore.getState().setIsWaitingForApproval(false);
                useDemoStore.getState().setMode('demo');
                setUser(user, 'user');
              } else if (status === 'pending') {
                // Once it becomes pending, it's no longer a fresh login bypassing phase
                sessionStorage.removeItem('freshDemoLogin');
                useDemoStore.getState().setDemoRequestRejected(false);
                useDemoStore.getState().setIsWaitingForApproval(true);
              } else if (status === 'rejected' && !isFresh) {
                useDemoStore.getState().setDemoRequestRejected(true);
                useDemoStore.getState().setIsWaitingForApproval(true);
              } else if (isFresh) {
                // If it's a fresh login, force them to wait until AuthModal overwrites it to pending
                useDemoStore.getState().setIsWaitingForApproval(true);
              }
            } else {
              // If it doesn't exist yet, AuthModal is about to create it. We wait.
              useDemoStore.getState().setIsWaitingForApproval(true);
            }
          });
        } else {
          // Normal user check
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUser(user, docSnap.data().role);
          } else {
            setUser(user, 'user');
          }
        }
      } else {
        if (unsubUserDoc) unsubUserDoc();
        setUser(null, null);
        setLocalData({ userCoins: 0, totalCarbonSaved: 0, totalDistanceKm: 0 });
      }
      setLoading(false);
    });
    return () => {
      unsubscribe();
      if (unsubUserDoc) unsubUserDoc();
      if ((window as any).unsubTrees) (window as any).unsubTrees();
    };
  }, [setUser, setLoading, setLocalData]);

  // Dark Mode effect
  const isDarkMode = useUserStore(state => state.isDarkMode);
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  if (loading) return <div className="w-screen h-screen flex items-center justify-center font-bold text-xl transition-colors duration-500 text-[var(--color-text-main)]">Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicApp />} />
        <Route path="/admin" element={<AdminApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
