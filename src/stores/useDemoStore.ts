import { create } from 'zustand'

interface DemoState {
  currentMode: 'explore' | 'demo'
  demoProgress: number
  isAutoPlaying: boolean
  activeView: 'map' | 'merchant_dashboard' | 'merchant_onboarding'
  showReportModal: boolean
  completedDistanceKm: number
  isWaitingForApproval: boolean
  setIsWaitingForApproval: (val: boolean) => void
  demoRequestRejected: boolean
  setDemoRequestRejected: (val: boolean) => void
  setMode: (mode: 'explore' | 'demo') => void
  setProgress: (progress: number | ((prev: number) => number)) => void
  setIsAutoPlaying: (playing: boolean) => void
  setActiveView: (view: 'map' | 'merchant_dashboard' | 'merchant_onboarding') => void
  setShowReportModal: (show: boolean) => void
  setCompletedDistanceKm: (dist: number) => void
}

export const useDemoStore = create<DemoState>((set) => ({
  currentMode: 'explore',
  demoProgress: 0,
  isAutoPlaying: false,
  activeView: 'map',
  showReportModal: false,
  completedDistanceKm: 0,
  isWaitingForApproval: false,
  demoRequestRejected: false,
  setMode: (mode) => set({ currentMode: mode }),
  setIsWaitingForApproval: (val) => set({ isWaitingForApproval: val }),
  setDemoRequestRejected: (val) => set({ demoRequestRejected: val }),
  setProgress: (progress) => set((state) => ({ 
    demoProgress: typeof progress === 'function' ? progress(state.demoProgress) : progress 
  })),
  setIsAutoPlaying: (playing) => set({ isAutoPlaying: playing }),
  setActiveView: (view) => set({ activeView: view }),
  setShowReportModal: (show) => set({ showReportModal: show }),
  setCompletedDistanceKm: (dist) => set({ completedDistanceKm: dist }),
}))
