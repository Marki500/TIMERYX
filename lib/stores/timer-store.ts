import { create } from 'zustand'
import type { Database } from '../supabase/types'

type TimeEntry = Database['public']['Tables']['time_entries']['Row']
type Task = Database['public']['Tables']['tasks']['Row']

interface TimerState {
    activeTimer: (TimeEntry & { task?: Task }) | null
    isRunning: boolean
    elapsedSeconds: number
    setActiveTimer: (timer: (TimeEntry & { task?: Task }) | null) => void
    startTimer: () => void
    stopTimer: () => void
    updateElapsed: (seconds: number) => void
    incrementElapsed: () => void
}

export const useTimerStore = create<TimerState>((set) => ({
    activeTimer: null,
    isRunning: false,
    elapsedSeconds: 0,
    setActiveTimer: (timer) =>
        set({
            activeTimer: timer,
            isRunning: timer !== null && timer.end_time === null,
            elapsedSeconds: timer
                ? Math.floor(
                    (new Date().getTime() - new Date(timer.start_time).getTime()) / 1000
                )
                : 0,
        }),
    startTimer: () => set({ isRunning: true }),
    stopTimer: () => set({ isRunning: false, activeTimer: null, elapsedSeconds: 0 }),
    updateElapsed: (seconds) => set({ elapsedSeconds: seconds }),
    incrementElapsed: () =>
        set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 })),
}))
