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
    addManualEntry: (taskId: string, durationSeconds: number, date: string) => Promise<void>
    setTaskDuration: (taskId: string, newTotalSeconds: number, targetDate?: string) => Promise<void>
}

const STORAGE_KEY = 'timeryx_active_timer'

// Callback registry — decouples timer store from task/dashboard stores
type RefreshCallback = () => void
type TaskUpdateCallback = (taskId: string, addedSeconds: number) => void

const refreshCallbacks = new Set<RefreshCallback>()
const taskUpdateCallbacks = new Set<TaskUpdateCallback>()

export function registerTimerSyncCallbacks(
    onRefresh: RefreshCallback,
    onTaskUpdate: TaskUpdateCallback
) {
    refreshCallbacks.add(onRefresh)
    taskUpdateCallbacks.add(onTaskUpdate)
    return () => {
        refreshCallbacks.delete(onRefresh)
        taskUpdateCallbacks.delete(onTaskUpdate)
    }
}

export const useTimerStore = create<TimerState>((set, get) => ({
    activeEntry: null,
    taskTitle: null,
    isLoading: false,
    duration: 0,
    isPaused: false,
    pausedAt: null,

    serverTimeOffset: 0, // difference between server time and client time

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
        const tempEntryId = `temp-${Date.now()}`
        const tempEntry: TimeEntry = {
            id: tempEntryId,
            task_id: taskId,
            start_time: new Date().toISOString(),
            end_time: null,
            user_id: 'temp-user', // Not needed for UI usually
            description: description || null,
            is_manual: false,
            created_at: new Date().toISOString()
        }

        // Optimistic UI Update
        set({
            activeEntry: tempEntry,
            taskTitle,
            duration: 0,
            isLoading: false,
            isPaused: false,
            pausedAt: null
        })

        const supabase = createClient()
        // Call RPC to start timer (handles stopping previous one)
        const { data, error } = await (supabase.rpc as any)('start_timer', {
            p_task_id: taskId,
            p_description: description
        })

        if (error) {
            console.error('Error starting timer:', error)
            // Rollback optimistic update
            set({
                activeEntry: null,
                taskTitle: null,
                duration: 0
            })
            return
        }

        // Refresh active timer silently in background to get real IDs
        await get().fetchActiveTimer()

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
        const previousState = {
            activeEntry: get().activeEntry,
            taskTitle: get().taskTitle,
            duration: get().duration,
            isPaused: get().isPaused,
            pausedAt: get().pausedAt
        }

        // Optimistic UI Update: Clear immediately
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

        // Notify registered listeners to update task duration optimistically
        const taskId = previousState.activeEntry?.task_id
        if (taskId) {
            taskUpdateCallbacks.forEach(cb => cb(taskId, previousState.duration))
        }

        const supabase = createClient()

        // Call RPC to stop timer
        const { error } = await supabase.rpc('stop_timer')

        if (error) {
            console.error('Error stopping timer via RPC:', error)

            // Rollback optimistic update
            set(previousState)
            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(previousState))
            }

            // Fallback: try to manually clear the active_timer_id
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                // @ts-ignore
                const { error: updateError } = await (supabase
                    .from('profiles') as any)
                    .update({ active_timer_id: null })
                    .eq('id', user.id)

                if (updateError) {
                    console.error('Error clearing active_timer_id manually:', updateError)
                }
            }
        } else {
            // Notify registered listeners to refresh data
            refreshCallbacks.forEach(cb => cb())
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

        // Get user profile and server time hint
        const startFetch = Date.now()
        const { data: profile, error: profileError } = await (supabase
            .from('profiles')
            .select('active_timer_id')
            .eq('id', user.id)
            .single() as any)

        if (profileError) return

        if (profile?.active_timer_id) {
            // Fetch the actual time entry with task title
            const { data: entry } = await supabase
                .from('time_entries')
                .select('*, task:tasks(title)')
                .eq('id', profile.active_timer_id)
                .single()

            if (entry) {
                // Calculate initial duration using server time compensation
                // Note: We use start_time which is a TIMESTAMPTZ from Postgres
                const start = new Date((entry as any).start_time).getTime()
                const now = Date.now()

                // If we want to be really precise, we should account for network latency
                // but for now let's just use client time. 
                // A common issue is the client clock being wrong.

                const seconds = Math.max(0, Math.floor((now - start) / 1000))

                // Extract title from joined relation
                const title = (entry as any).task?.title || null

                set({ activeEntry: entry, taskTitle: title, duration: seconds })
            }
        } else {
            set({ activeEntry: null, taskTitle: null, duration: 0 })
        }
    },

    tick: () => {
        const { activeEntry, isPaused } = get()
        if (activeEntry && !isPaused) {
            // Calculate actual elapsed time to prevent browser background throttling
            // Using the same logic as fetchActiveTimer to maintain consistency
            const start = new Date((activeEntry as any).start_time).getTime()
            const now = Date.now()
            const elapsed = Math.max(0, Math.floor((now - start) / 1000))

            set({ duration: elapsed })
        }
    },

    addManualEntry: async (taskId, durationSeconds, date) => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        // Create start and end times based on the date and duration
        const startTime = new Date(date + 'T12:00:00') // Default to noon
        const endTime = new Date(startTime.getTime() + durationSeconds * 1000)

        // Use RPC function to add manual entry (bypasses RLS with proper permission checks)
        const { data, error } = await (supabase.rpc as any)('add_manual_time_entry', {
            p_task_id: taskId,
            p_start_time: startTime.toISOString(),
            p_end_time: endTime.toISOString(),
            p_description: null
        })

        if (error) {
            console.error('Error adding manual entry:', error)
            throw error
        }

        // Notify registered listeners to refresh data
        refreshCallbacks.forEach(cb => cb())
    },

    setTaskDuration: async (taskId, newTotalSeconds, targetDate) => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        // 1. Fetch all existing time entries for this task to compute current total
        // Also fetch the task to get its created_at as a fallback
        const { data: entries, error: fetchError } = await (supabase
            .from('time_entries') as any)
            .select('*')
            .eq('task_id', taskId)
            .eq('user_id', user.id)
            .order('start_time', { ascending: false })

        if (fetchError) {
            console.error('Error fetching entries:', fetchError)
            throw fetchError
        }

        // Calculate current total from entries
        const currentTotal = (entries || []).reduce((sum: number, e: any) => {
            if (!e.end_time) return sum
            const dur = (new Date(e.end_time).getTime() - new Date(e.start_time).getTime()) / 1000
            return sum + Math.max(0, dur)
        }, 0)

        const diff = newTotalSeconds - currentTotal

        if (Math.abs(diff) < 1) {
            // No meaningful change
            return
        }

        if (diff > 0) {
            // ADDING TIME: create a new manual entry with the positive diff
            let startTime: Date

            if (targetDate) {
                // If a targetDate is provided (e.g. "2024-03-05"), use it at noon
                startTime = new Date(targetDate + 'T12:00:00')
            } else {
                // Fallback: get the task's created_at to attribute time to the task's day
                const { data: task } = await (supabase
                    .from('tasks') as any)
                    .select('created_at')
                    .eq('id', taskId)
                    .single()

                if (task?.created_at) {
                    startTime = new Date(task.created_at)
                } else {
                    startTime = new Date()
                    startTime.setHours(12, 0, 0, 0)
                }
            }

            const endTime = new Date(startTime.getTime() + diff * 1000)

            const { error: insertError } = await (supabase.rpc as any)('add_manual_time_entry', {
                p_task_id: taskId,
                p_start_time: startTime.toISOString(),
                p_end_time: endTime.toISOString(),
                p_description: 'Manual time adjustment (+)'
            })

            if (insertError) {
                console.error('Error adding time:', insertError)
                throw insertError
            }
        } else {
            // REDUCING TIME: collect entries to delete/shorten, then execute in bulk
            let remaining = Math.abs(diff)
            const idsToDelete: string[] = []
            let entryToShorten: { id: string; newEndTime: string } | null = null

            for (const entry of (entries || [])) {
                if (remaining <= 0) break
                if (!entry.end_time) continue

                const entryDuration = (new Date(entry.end_time).getTime() - new Date(entry.start_time).getTime()) / 1000

                if (entryDuration <= remaining) {
                    idsToDelete.push(entry.id)
                    remaining -= entryDuration
                } else {
                    const newEndTime = new Date(
                        new Date(entry.end_time).getTime() - remaining * 1000
                    )
                    entryToShorten = { id: entry.id, newEndTime: newEndTime.toISOString() }
                    remaining = 0
                }
            }

            // Single bulk delete instead of N sequential deletes
            if (idsToDelete.length > 0) {
                const { error: deleteError } = await (supabase.from('time_entries') as any)
                    .delete()
                    .in('id', idsToDelete)
                if (deleteError) {
                    console.error('Error deleting time entries:', deleteError)
                    throw deleteError
                }
            }

            // Single update for the shortened entry
            if (entryToShorten) {
                const { error: shortenError } = await (supabase.from('time_entries') as any)
                    .update({ end_time: entryToShorten.newEndTime })
                    .eq('id', entryToShorten.id)
                if (shortenError) {
                    console.error('Error shortening time entry:', shortenError)
                    throw shortenError
                }
            }
        }

        // Notify registered listeners to refresh data
        refreshCallbacks.forEach(cb => cb())
    }
}))
