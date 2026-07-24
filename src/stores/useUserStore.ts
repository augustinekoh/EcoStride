import { create } from 'zustand'

interface UserState {
  userCoins: number
  totalCarbonSaved: number
  totalDistanceKm: number
  unlockedBadges: string[]
  setUserData: (data: Partial<UserState>) => void
  addCoins: (amount: number) => void
  deductCoins: (amount: number) => void
  addCarbonSaved: (amount: number) => void
}

export const useUserStore = create<UserState>((set) => ({
  userCoins: 0,
  totalCarbonSaved: 0,
  totalDistanceKm: 0,
  unlockedBadges: ['badge-01'],
  setUserData: (data) => set((state) => ({ ...state, ...data })),
  
  // These are now just optimistic local updates. 
  // Components should STILL call updateDoc() to persist to Firestore.
  addCoins: (amount) => set((state) => ({ userCoins: state.userCoins + amount })),
  deductCoins: (amount) => set((state) => ({ userCoins: state.userCoins - amount })),
  addCarbonSaved: (amount) => set((state) => ({ totalCarbonSaved: state.totalCarbonSaved + amount })),
}))
