import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useDemoStore } from '../../stores/useDemoStore';
import { useUserStore } from '../../stores/useUserStore';

export const AuthModal: React.FC = () => {
  const { user, loading, setUser } = useAuthStore();
  const { setMode, isWaitingForApproval, setIsWaitingForApproval, demoRequestRejected } = useDemoStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'merchant' | 'admin'>('user');
  const [error, setError] = useState('');

  // If the user is logged in and we are NOT waiting for demo approval, we can hide this modal
  if (user && !isWaitingForApproval) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      let userCredential;

      // Set a flag to tell App.tsx this is a fresh login, so it doesn't auto-approve based on old data
      if (email.toLowerCase() === 'ecostride_demo@gmail.com') {
        sessionStorage.setItem('freshDemoLogin', 'true');
      }

      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Save role to Firestore for new users (including demo, just in case)
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          role: role,
          createdAt: new Date().toISOString(),
          coins: 0,
          totalCarbonSaved: 1.66,
          totalDistanceKm: 8.3,
          guildId: 'None',
          activityHistory: [
            { date: new Date(Date.now() - 86400000 * 2).toISOString(), distance: 5.2 },
            { date: new Date(Date.now() - 86400000 * 1).toISOString(), distance: 3.1 }
          ],
          username: userCredential.user.email?.split('@')[0] || 'EcoExplorer'
        });
        
        // Initialize new user data in local store
        useUserStore.getState().setLocalData({
          totalDistanceKm: 8.3,
          totalCarbonSaved: 1.66,
          userCoins: 0,
          activityHistory: [
            { date: new Date(Date.now() - 86400000 * 2).toISOString(), distance: 5.2 },
            { date: new Date(Date.now() - 86400000 * 1).toISOString(), distance: 3.1 }
          ],
          username: userCredential.user.email?.split('@')[0] || 'EcoExplorer'
        });
      }

      // Intercept demo account for BOTH Login and Register
      if (email.toLowerCase() === 'ecostride_demo@gmail.com') {
        setIsWaitingForApproval(true);
        
        // Create pending request immediately to avoid delay
        await setDoc(doc(db, 'demo_requests', userCredential.user.uid), {
          email: userCredential.user.email,
          ipAddress: 'Fetching...',
          status: 'pending',
          requestedAt: new Date().toISOString()
        });

        // Fetch IP asynchronously and update the doc
        fetch('https://api.ipify.org?format=json')
          .then(res => res.json())
          .then(data => {
            setDoc(doc(db, 'demo_requests', userCredential.user.uid), {
              ipAddress: data.ip
            }, { merge: true }).catch(console.error);
          })
          .catch(() => console.log('IP fetch failed'));

        // Wait for approval via onSnapshot
        onSnapshot(doc(db, 'demo_requests', userCredential.user.uid), async (docSnap) => {
          if (docSnap.exists() && docSnap.data().status === 'approved') {
            setIsWaitingForApproval(false);
            
            // Hydrate UserStore from Firebase backend for Demo account
            const userDocSnap = await getDoc(doc(db, 'users', userCredential.user.uid));
            if (userDocSnap.exists()) {
              const data = userDocSnap.data();
              const history = data.activityHistory || [];
              const calculatedDistance = history.reduce((sum: number, h: any) => sum + h.distance, 0);
              
              useUserStore.getState().setLocalData({
                totalDistanceKm: calculatedDistance,
                totalCarbonSaved: calculatedDistance * 0.2,
                userCoins: data.coins || 0,
                activityHistory: history,
                username: data.username || data.email?.split('@')[0] || 'EcoExplorer',
                bio: data.bio || '',
                nationality: data.nationality || 'Global Citizen'
              });
            }

            setMode('demo');
            setUser(userCredential.user, 'user');
          }
        });
        return; // Stop further execution here, waiting for snapshot callback
      }

      // Fetch role from Firestore for normal users (if login)
      if (isLogin) {
        const docRef = doc(db, 'users', userCredential.user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setMode('explore');
          setUser(userCredential.user, data.role);
          
          // Hydrate UserStore from Firebase backend
          const history = data.activityHistory || [];
          const calculatedDistance = history.reduce((sum: number, h: any) => sum + h.distance, 0);
          
          useUserStore.getState().setLocalData({
            totalDistanceKm: calculatedDistance,
            totalCarbonSaved: calculatedDistance * 0.2,
            userCoins: data.coins || 0,
            activityHistory: history,
            username: data.username || data.email?.split('@')[0] || 'EcoExplorer',
            bio: data.bio || '',
            nationality: data.nationality || 'Global Citizen'
          });
        } else {
          setMode('explore');
          setUser(userCredential.user, 'user'); // Fallback
        }
      } else {
        // If normal user and registered, just proceed
        setMode('explore');
        setUser(userCredential.user, role);
      }
    } catch (err: any) {
      setIsWaitingForApproval(false);
      useDemoStore.getState().setIsWaitingForApproval(false);
      sessionStorage.removeItem('freshDemoLogin');
      setError(err.message);
    }
  };

  if (isWaitingForApproval) {
    if (demoRequestRejected) {
      return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[var(--color-teal-dark)]/20 backdrop-blur-md p-4 animate-in fade-in">
          <div className="glass-card p-8 max-w-sm w-full flex flex-col items-center border-red-400/50">
            <h2 className="text-3xl font-black text-center mb-4 uppercase tracking-tight text-red-500 drop-shadow-sm">
              Access Denied
            </h2>
            <div className="text-5xl mb-6">❌</div>
            <p className="text-center font-bold text-[var(--color-text-main)] mb-6">
              Your demo access request was rejected by the admin.
            </p>
            <button 
              onClick={async () => {
                if (user?.email?.toLowerCase() === 'ecostride_demo@gmail.com') {
                  try {
                    const { deleteDoc } = await import('firebase/firestore');
                    await deleteDoc(doc(db, 'demo_requests', user.uid));
                  } catch (e) {}
                }
                auth.signOut();
                window.location.reload();
              }}
              className="glass-active text-red-500 font-black px-6 py-3 rounded-xl w-full hover:-translate-y-1 transition-transform border border-red-400/30 shadow-sm"
            >
              TRY AGAIN
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[var(--color-teal-dark)]/20 backdrop-blur-md p-4 animate-in fade-in">
        <div className="glass-card p-8 max-w-sm w-full flex flex-col items-center">
          <h2 className="text-3xl font-black text-center mb-4 uppercase tracking-tight text-[var(--color-text-main)] drop-shadow-sm">
            Waiting for Admin
          </h2>
          <div className="animate-spin text-5xl mb-6">⏳</div>
          <p className="text-center font-bold text-[var(--color-text-main)]">
            Your demo access request has been sent to the Admin Dashboard. Please wait for approval to enter Demo Mode.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[var(--color-teal-dark)]/20 backdrop-blur-md p-4 animate-in fade-in">
      <div className="glass-card p-8 max-w-sm w-full">
        <h2 className="text-3xl font-black text-center mb-2 uppercase tracking-tight text-[var(--color-text-main)] drop-shadow-sm">
          {isLogin ? 'Welcome Back' : 'Join EcoStride'}
        </h2>
        <p className="text-center font-bold text-[var(--color-text-muted)] mb-6">
          {isLogin ? 'Login to continue your green quest' : 'Register to start earning rewards'}
        </p>

        {error && <div className="glass-active border-red-400/50 text-red-600 p-3 rounded-xl mb-4 text-sm font-bold shadow-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-bold text-sm mb-1 text-[var(--color-text-main)]">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full glass-active rounded-xl px-4 py-3 font-bold text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-teal-dark)]/50 transition-all border border-white/40" 
            />
          </div>
          <div>
            <label className="block font-bold text-sm mb-1 text-[var(--color-text-main)]">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full glass-active rounded-xl px-4 py-3 font-bold text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-teal-dark)]/50 transition-all border border-white/40" 
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block font-bold text-sm mb-1 text-[var(--color-text-main)]">Select Role</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full glass-active rounded-xl px-4 py-3 font-bold text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-teal-dark)]/50 transition-all border border-white/40"
              >
                <option value="user">🚴 Green Rider (User)</option>
                <option value="merchant">🏪 Store Owner (Merchant)</option>
              </select>
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-[var(--color-teal-dark)] text-white py-3.5 rounded-full font-black uppercase tracking-wide shadow-md hover:-translate-y-1 hover:shadow-lg active:translate-y-0 transition-all mt-6 border border-white/20"
          >
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] underline underline-offset-4 decoration-2 transition-colors"
          >
            {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
};
