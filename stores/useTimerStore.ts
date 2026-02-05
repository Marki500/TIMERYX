'use client'

import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'
import { useTaskStore } from './useTaskStore'
import { useDashboardStore } from './useDashboardStore'

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
    addManualEntry: (taskId: string, durationSeconds: number, date: string) => Promise<void>
}

const STORAGE_KEY = 'timeryx_active_timer'

export const useTimerStore = create<TimerState>((set, get) => ({
    activeEntry: null,
    taskTitle: null,
    isLoading: false,
    duration: 0,
    isPaused: false,
    pausedAt: null,

    loadFromStorage: async () => {
        if (typeof window === 'undefined') return

        // Instead of loading from localStorage, fetch from database
        // This ensures we always have the correct state
        await get().fetchActiveTimer()

        // Clean up any stale localStorage data
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            const { activeEntry } = get()
            // If there's no active entry in DB, clear localStorage
            if (!activeEntry) {
                localStorage.removeItem(STORAGE_KEY)
            }
        }
    },

    startTimer: async (taskId, taskTitle, description) => {
        set({ isLoading: true })
        const supabase = createClient()

        // Call RPC to start timer (handles stopping previous one)
        const { data, error } = await (supabase.rpc as any)('start_timer', {
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

        // Call RPC to stop timer
        const { error } = await supabase.rpc('stop_timer')

        if (error) {
            console.error('Error stopping timer via RPC:', error)

            // Fallback: try to manually clear the active_timer_id
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ active_timer_id: null })
                    .eq('id', user.id)

                if (updateError) {
                    console.error('Error clearing active_timer_id manually:', updateError)
                }
            }
        }

        // Refresh tasks to show updated duration
        await useTaskStore.getState().fetchTasks()

        // Clear state and localStorage
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

        // Trigger dashboard refresh
        useDashboardStore.getState().triggerRefresh()
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
            // Fetch the actual time entry with task title
            const { data: entry } = await supabase
                .from('time_entries')
                .select('*, task:tasks(title)')
                .eq('id', (profile as any).active_timer_id)
                .single()

            if (entry) {
                // Calculate initial duration
                const start = new Date((entry as any).start_time).getTime()
                const now = new Date().getTime()
                const seconds = Math.floor((now - start) / 1000)

                // Extract title from joined relation (supabase returns it as an object or array)
                const title = ((entry as any).task as any)?.title || null

                set({ activeEntry: entry, taskTitle: title, duration: seconds })
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
    },

    addManualEntry: async (taskId, durationSeconds, date) => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        // Create start and end times based on the date and duration
        const startTime = new Date(date + 'T12:00:00') // Default to noon
        const endTime = new Date(startTime.getTime() + durationSeconds * 1000)

        const { error } = await supabase
            .from('time_entries')
            .insert({
                user_id: user.id,
                task_id: taskId,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                is_manual: true
            } as any)

        if (error) {
            console.error('Error adding manual entry:', error)
            throw error
        }

        // Refresh tasks to update total_duration
        await useTaskStore.getState().fetchTasks()

        // Trigger dashboard refresh
        useDashboardStore.getState().triggerRefresh()
    }
}))
