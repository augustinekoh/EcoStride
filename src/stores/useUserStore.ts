import { create } from 'zustand'

interface UserState {
  userCoins: number
  totalCarbonSaved: number
  totalDistanceKm: number
  streaks: number
  vouchersCollected: number
  challengesCompleted: number
  unlockedBadges: string[]
  activityHistory: { date: string; distance: number }[]
  setUserData: (data: Partial<UserState>) => void
  addCoins: (amount: number) => void
  deductCoins: (amount: number) => void
  addCarbonSaved: (amount: number) => void
  addActivity: (distance: number) => void
}

export const useUserStore = create<UserState>((set) => ({
  userCoins: 0,
  totalCarbonSaved: 0,
  totalDistanceKm: 0,
  streaks: 5, // mock data
  vouchersCollected: 3, // mock data
  challengesCompleted: 12, // mock data
  unlockedBadges: ['badge-01'],
  activityHistory: [
    { date: new Date(Date.now() - 86400000 * 2).toISOString(), distance: 5.2 }, // 2 days ago
    { date: new Date(Date.now() - 86400000 * 1).toISOString(), distance: 3.1 }, // yesterday
  ],
  setUserData: (data) => set((state) => ({ ...state, ...data })),
  
  // These are now just optimistic local updates. 
  // Components should STILL call updateDoc() to persist to Firestore.
  addCoins: (amount) => set((state) => ({ userCoins: state.userCoins + amount })),
  deductCoins: (amount) => set((state) => ({ userCoins: state.userCoins - amount })),
  addCarbonSaved: (amount) => set((state) => ({ totalCarbonSaved: state.totalCarbonSaved + amount })),
  addActivity: (distance) => set((state) => ({ 
    totalDistanceKm: state.totalDistanceKm + distance,
    activityHistory: [...state.activityHistory, { date: new Date().toISOString(), distance }] 
  })),
}))
