'use client'

import { create } from 'zustand'

interface DashboardState {
    refreshTrigger: number
    triggerRefresh: () => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
    refreshTrigger: 0,
    triggerRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 }))
}))
