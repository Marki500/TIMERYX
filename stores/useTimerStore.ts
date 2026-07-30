'use client'

import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'

type TimeEntry = Database['public']['Tables']['time_entries']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

type ActiveEntryWithTask = TimeEntry & {
    task: { title: string } | null
}

interface TimerState {
    activeEntry: TimeEntry | null
    taskTitle: string | null
    isLoading: boolean
    duration: number
    isPaused: boolean
    pausedAt: number | null

    startTimer: (taskId: string, taskTitle: string, description?: string) => Promise<void>
    stopTimer: () => Promise<void>
    pauseTimer: () => void
    resumeTimer: () => void
    fetchActiveTimer: () => Promise<void>
    tick: () => void
    loadFromStorage: () => Promise<void>
    addManualEntry: (taskId: string, durationSeconds: number, date: string) => Promise<void>
    setTaskDuration: (taskId: string, newTotalSeconds: number, targetDate?: string) => Promise<void>
}

const STORAGE_KEY = 'timeryx_active_timer'

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

    loadFromStorage: async () => {
        if (typeof window === 'undefined') return

        await get().fetchActiveTimer()

        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            const { activeEntry } = get()
            if (!activeEntry) {
                localStorage.removeItem(STORAGE_KEY)
            }
        }
    },

    startTimer: async (taskId, taskTitle, description) => {
        const tempEntryId = `temp-${Date.now()}`
        const now = new Date().toISOString()
        const tempEntry: TimeEntry = {
            id: tempEntryId,
            task_id: taskId,
            user_id: 'temp-user',
            start_time: now,
            end_time: null,
            description: description ?? null,
            is_manual: false,
            created_at: now,
            updated_at: now
        }

        set({
            activeEntry: tempEntry,
            taskTitle,
            duration: 0,
            isLoading: false,
            isPaused: false,
            pausedAt: null
        })

        const supabase = createClient()
        const { error } = await supabase.rpc('start_timer', {
            p_task_id: taskId,
            p_description: description ?? null
        })

        if (error) {
            console.error('Error starting timer:', error)
            set({
                activeEntry: null,
                taskTitle: null,
                duration: 0
            })
            return
        }

        await get().fetchActiveTimer()

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

        const taskId = previousState.activeEntry?.task_id
        if (taskId) {
            taskUpdateCallbacks.forEach(cb => cb(taskId, previousState.duration))
        }

        const supabase = createClient()
        const { error } = await supabase.rpc('stop_timer')

        if (error) {
            console.error('Error stopping timer via RPC:', error)

            set(previousState)
            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(previousState))
            }

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
        } else {
            refreshCallbacks.forEach(cb => cb())
        }
    },

    pauseTimer: () => {
        const { activeEntry } = get()
        if (!activeEntry) return

        set({ isPaused: true, pausedAt: Date.now() })

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

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('active_timer_id')
            .eq('id', user.id)
            .single<Pick<Profile, 'active_timer_id'>>()

        if (profileError || !profile?.active_timer_id) {
            if (!profileError) {
                set({ activeEntry: null, taskTitle: null, duration: 0 })
            }
            return
        }

        const { data: entry } = await supabase
            .from('time_entries')
            .select('*, task:tasks(title)')
            .eq('id', profile.active_timer_id)
            .single<ActiveEntryWithTask>()

        if (!entry) {
            set({ activeEntry: null, taskTitle: null, duration: 0 })
            return
        }

        const start = new Date(entry.start_time).getTime()
        const now = Date.now()
        const seconds = Math.max(0, Math.floor((now - start) / 1000))

        set({
            activeEntry: entry,
            taskTitle: entry.task?.title ?? null,
            duration: seconds
        })
    },

    tick: () => {
        const { activeEntry, isPaused } = get()
        if (activeEntry && !isPaused) {
            const start = new Date(activeEntry.start_time).getTime()
            const now = Date.now()
            const elapsed = Math.max(0, Math.floor((now - start) / 1000))
            set({ duration: elapsed })
        }
    },

    addManualEntry: async (taskId, durationSeconds, date) => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const startTime = new Date(date + 'T12:00:00')
        const endTime = new Date(startTime.getTime() + durationSeconds * 1000)

        const { error } = await supabase.rpc('add_manual_time_entry', {
            p_task_id: taskId,
            p_start_time: startTime.toISOString(),
            p_end_time: endTime.toISOString(),
            p_description: null
        })

        if (error) {
            console.error('Error adding manual entry:', error)
            throw error
        }

        refreshCallbacks.forEach(cb => cb())
    },

    setTaskDuration: async (taskId, newTotalSeconds, targetDate) => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data: entries, error: fetchError } = await supabase
            .from('time_entries')
            .select('*')
            .eq('task_id', taskId)
            .eq('user_id', user.id)
            .order('start_time', { ascending: false })

        if (fetchError) {
            console.error('Error fetching entries:', fetchError)
            throw fetchError
        }

        const list = entries ?? []
        const currentTotal = list.reduce((sum, e) => {
            if (!e.end_time) return sum
            const dur = (new Date(e.end_time).getTime() - new Date(e.start_time).getTime()) / 1000
            return sum + Math.max(0, dur)
        }, 0)

        const diff = newTotalSeconds - currentTotal

        if (Math.abs(diff) < 1) return

        if (diff > 0) {
            let startTime: Date

            if (targetDate) {
                startTime = new Date(targetDate + 'T12:00:00')
            } else {
                const { data: task } = await supabase
                    .from('tasks')
                    .select('created_at')
                    .eq('id', taskId)
                    .single<Pick<Database['public']['Tables']['tasks']['Row'], 'created_at'>>()

                if (task?.created_at) {
                    startTime = new Date(task.created_at)
                } else {
                    startTime = new Date()
                    startTime.setHours(12, 0, 0, 0)
                }
            }

            const endTime = new Date(startTime.getTime() + diff * 1000)

            const { error: insertError } = await supabase.rpc('add_manual_time_entry', {
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
            let remaining = Math.abs(diff)
            const idsToDelete: string[] = []
            let entryToShorten: { id: string; newEndTime: string } | null = null

            for (const entry of list) {
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

            if (idsToDelete.length > 0) {
                const { error: deleteError } = await supabase
                    .from('time_entries')
                    .delete()
                    .in('id', idsToDelete)

                if (deleteError) {
                    console.error('Error deleting time entries:', deleteError)
                    throw deleteError
                }
            }

            if (entryToShorten) {
                const { error: shortenError } = await supabase
                    .from('time_entries')
                    .update({ end_time: entryToShorten.newEndTime })
                    .eq('id', entryToShorten.id)

                if (shortenError) {
                    console.error('Error shortening time entry:', shortenError)
                    throw shortenError
                }
            }
        }

        refreshCallbacks.forEach(cb => cb())
    }
}))
