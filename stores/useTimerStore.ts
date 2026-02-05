'use client'

import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'

type TimeEntry = Database['public']['Tables']['time_entries']['Row']

interface TimerState {
    activeEntry: TimeEntry | null
    taskTitle: string | null
    isLoading: boolean
    duration: number // in seconds
    isPaused: boolean
    pausedAt: number | null

    startTimer: (taskId: string, taskTitle: string, description?: string) => Promise<void>
    stopTimer: () => Promise<void>
    pauseTimer: () => void
    resumeTimer: () => void
    fetchActiveTimer: () => Promise<void>
    tick: () => void
    loadFromStorage: () => void
}

const STORAGE_KEY = 'timeryx_active_timer'

export const useTimerStore = create<TimerState>((set, get) => ({
    activeEntry: null,
    taskTitle: null,
    isLoading: false,
    duration: 0,
    isPaused: false,
    pausedAt: null,

    loadFromStorage: () => {
        if (typeof window === 'undefined') return

        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            try {
                const data = JSON.parse(stored)
                set({
                    activeEntry: data.activeEntry,
                    taskTitle: data.taskTitle,
                    duration: data.duration,
                    isPaused: data.isPaused,
                    pausedAt: data.pausedAt
                })
            } catch (error) {
                console.error('Failed to load timer from storage:', error)
                localStorage.removeItem(STORAGE_KEY)
            }
        }
    },

    startTimer: async (taskId, taskTitle, description) => {
        set({ isLoading: true })
        const supabase = createClient()

        // Call RPC to start timer (handles stopping previous one)
        const { data, error } = await supabase.rpc('start_timer', {
            p_task_id: taskId,
            p_description: description
        })

        if (error) {
            console.error('Error starting timer:', error)
            set({ isLoading: false })
            return
        }

        // Refresh active timer
        await get().fetchActiveTimer()
        set({ taskTitle, isLoading: false, isPaused: false, pausedAt: null })

        // Save to localStorage
        if (typeof window !== 'undefined') {
            const state = get()
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                activeEntry: state.activeEntry,
                taskTitle: state.taskTitle,
                duration: state.duration,
                isPaused: state.isPaused,
                pausedAt: state.pausedAt
            }))
        }
    },

    stopTimer: async () => {
        set({ isLoading: true })
        const supabase = createClient()

        const { error } = await supabase.rpc('stop_timer')

        if (error) {
            console.error('Error stopping timer:', error)
        }

        set({
            activeEntry: null,
            taskTitle: null,
            duration: 0,
            isLoading: false,
            isPaused: false,
            pausedAt: null
        })

        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY)
        }
    },

    pauseTimer: () => {
        const { activeEntry } = get()
        if (!activeEntry) return

        set({ isPaused: true, pausedAt: Date.now() })

        // Save to localStorage
        if (typeof window !== 'undefined') {
            const state = get()
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                activeEntry: state.activeEntry,
                taskTitle: state.taskTitle,
                duration: state.duration,
                isPaused: state.isPaused,
                pausedAt: state.pausedAt
            }))
        }
    },

    resumeTimer: () => {
        const { activeEntry } = get()
        if (!activeEntry) return

        set({ isPaused: false, pausedAt: null })

        // Save to localStorage
        if (typeof window !== 'undefined') {
            const state = get()
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                activeEntry: state.activeEntry,
                taskTitle: state.taskTitle,
                duration: state.duration,
                isPaused: state.isPaused,
                pausedAt: state.pausedAt
            }))
        }
    },

    fetchActiveTimer: async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get user profile to check active_timer_id
        const { data: profile } = await supabase
            .from('profiles')
            .select('active_timer_id')
            .eq('id', user.id)
            .single()

        if (profile?.active_timer_id) {
            // Fetch the actual time entry
            const { data: entry } = await supabase
                .from('time_entries')
                .select('*')
                .eq('id', profile.active_timer_id as string)
                .single()

            if (entry) {
                // Calculate initial duration
                const start = new Date(entry.start_time).getTime()
                const now = new Date().getTime()
                const seconds = Math.floor((now - start) / 1000)

                set({ activeEntry: entry, duration: seconds })
            }
        } else {
            set({ activeEntry: null, taskTitle: null, duration: 0 })
        }
    },

    tick: () => {
        const { activeEntry, isPaused } = get()
        if (activeEntry && !isPaused) {
            set((state) => ({ duration: state.duration + 1 }))

            // Update localStorage periodically
            if (typeof window !== 'undefined') {
                const state = get()
                localStorage.setItem(STORAGE_KEY, JSON.stringify({
                    activeEntry: state.activeEntry,
                    taskTitle: state.taskTitle,
                    duration: state.duration,
                    isPaused: state.isPaused,
                    pausedAt: state.pausedAt
                }))
            }
        }
    }
}))
