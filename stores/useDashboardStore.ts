'use client'

import { create } from 'zustand'

export interface DayActivity {
    day: string
    hours: number
    percent: number
}

export interface RecentEntry {
    id: string
    title: string
    duration: number
    start_time: string
    task_title: string
}

export interface ProductivityStats {
    currentStreak: number
    averageDailyHours: number
    mostProductiveDay: string
    tasksCompletedThisWeek: number
}

interface DashboardState {
    refreshTrigger: number
    triggerRefresh: () => void

    // Data state
    weeklyData: DayActivity[]
    recentEntries: RecentEntry[]
    productivityStats: ProductivityStats
    isLoading: boolean

    setWeeklyData: (data: DayActivity[]) => void
    setRecentEntries: (entries: RecentEntry[]) => void
    setProductivityStats: (stats: ProductivityStats) => void
    setIsLoading: (loading: boolean) => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
    refreshTrigger: 0,
    triggerRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),

    weeklyData: [],
    recentEntries: [],
    productivityStats: {
        currentStreak: 0,
        averageDailyHours: 0,
        mostProductiveDay: '-',
        tasksCompletedThisWeek: 0
    },
    isLoading: true,

    setWeeklyData: (weeklyData) => set({ weeklyData }),
    setRecentEntries: (recentEntries) => set({ recentEntries }),
    setProductivityStats: (productivityStats) => set({ productivityStats }),
    setIsLoading: (isLoading) => set({ isLoading })
}))
