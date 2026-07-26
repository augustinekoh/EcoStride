import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { auth, db } from '../firebase'
import { doc, setDoc } from 'firebase/firestore'

interface UserState {
  userCoins: number
  totalCarbonSaved: number
  totalDistanceKm: number
  streaks: number
  vouchersCollected: number
  challengesCompleted: number
  username: string
  firstName: string
  lastName: string
  email: string
  bio: string
  nationality: string
  totalTreesPlanted: number
  newsEnabled: boolean
  dailyReminderEnabled: boolean
  newFollowerEnabled: boolean
  shareActivity: boolean
  doNotDisturb: boolean
  isDarkMode: boolean
  notifications: { id: string; title: string; message: string; icon: string; time: string }[]
  unlockedBadges: string[]
  activityHistory: { date: string; distance: number }[]
  setUserData: (data: Partial<UserState>) => void
  setLocalData: (data: Partial<UserState>) => void
  addCoins: (amount: number) => void
  deductCoins: (amount: number) => void
  addCarbonSaved: (amount: number) => void
  addActivity: (distance: number) => void
  addNotification: (notif: { title: string; message: string; icon: string }) => void
  clearNotifications: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
  userCoins: 0,
  totalCarbonSaved: 1.66, 
  totalDistanceKm: 8.3, 
  streaks: 5, 
  vouchersCollected: 3, 
  challengesCompleted: 12, 
  username: 'EcoExplorer',
  firstName: 'Eco',
  lastName: 'Explorer',
  email: 'eco@example.com',
  bio: 'Passionate about saving the planet, one step at a time!',
  nationality: 'Global Citizen',
  totalTreesPlanted: 0,
  newsEnabled: false,
  dailyReminderEnabled: true,
  newFollowerEnabled: true,
  shareActivity: true,
  doNotDisturb: false,
  isDarkMode: false,
  notifications: [
    { id: '1', title: 'Welcome to EcoStride!', message: 'Start walking to save carbon and plant trees.', icon: '👋', time: new Date().toISOString() }
  ],
  unlockedBadges: ['badge-01'],
  activityHistory: [
    { date: new Date(Date.now() - 86400000 * 2).toISOString(), distance: 5.2 }, // 2 days ago
    { date: new Date(Date.now() - 86400000 * 1).toISOString(), distance: 3.1 }, // yesterday
  ],
  setLocalData: (data) => set((state) => ({ ...state, ...data })),
  setUserData: (data) => set((state) => {
    const newState = { ...state, ...data };
    // Sync to Firestore
    if (auth.currentUser) {
      setDoc(doc(db, 'users', auth.currentUser.uid), data, { merge: true }).catch(console.error);
    }
    return newState;
  }),
  
  // These are now synced with Firestore
  addCoins: (amount) => set((state) => {
    const newCoins = state.userCoins + amount;
    if (auth.currentUser) {
      setDoc(doc(db, 'users', auth.currentUser.uid), { coins: newCoins }, { merge: true }).catch(console.error);
    }
    return { userCoins: newCoins };
  }),
  deductCoins: (amount) => set((state) => {
    const newCoins = state.userCoins - amount;
    if (auth.currentUser) {
      setDoc(doc(db, 'users', auth.currentUser.uid), { coins: newCoins }, { merge: true }).catch(console.error);
    }
    return { userCoins: newCoins };
  }),
  addCarbonSaved: (amount) => set((state) => {
    const newTotal = state.totalCarbonSaved + amount;
    if (auth.currentUser) {
      setDoc(doc(db, 'users', auth.currentUser.uid), { totalCarbonSaved: newTotal }, { merge: true }).catch(console.error);
    }
    return { totalCarbonSaved: newTotal };
  }),
  addActivity: (distance) => set((state) => {
    // Group activity by day
    const todayStr = new Date().toISOString().split('T')[0];
    const newHistory = [...state.activityHistory];
    const todayIndex = newHistory.findIndex(h => h.date.split('T')[0] === todayStr);
    
    if (todayIndex >= 0) {
      newHistory[todayIndex] = {
        ...newHistory[todayIndex],
        distance: newHistory[todayIndex].distance + distance
      };
    } else {
      newHistory.push({ date: new Date().toISOString(), distance });
    }
    
    const newDist = newHistory.reduce((sum, h) => sum + h.distance, 0);
    const newCarbon = newDist * 0.2;
    
    if (auth.currentUser) {
      setDoc(doc(db, 'users', auth.currentUser.uid), {
        totalDistanceKm: newDist,
        totalCarbonSaved: newCarbon,
        activityHistory: newHistory
      }, { merge: true }).catch(console.error);
    }
    
    return {
      totalDistanceKm: newDist,
      totalCarbonSaved: newCarbon,
      activityHistory: newHistory
    };
  }),
  addNotification: (notif) => set((state) => ({
    notifications: [{ id: Date.now().toString(), time: new Date().toISOString(), ...notif }, ...state.notifications]
  })),
    clearNotifications: () => set({ notifications: [] }),
  }),
  {
    name: 'ecostride-user-storage',
  }
))
