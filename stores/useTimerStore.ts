import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'

type TimeEntry = Database['public']['Tables']['time_entries']['Row']

interface TimerState {
    activeEntry: TimeEntry | null
    isLoading: boolean
    duration: number // in seconds

    startTimer: (taskId: string, description?: string) => Promise<void>
    stopTimer: () => Promise<void>
    fetchActiveTimer: () => Promise<void>
    tick: () => void
}

export const useTimerStore = create<TimerState>((set, get) => ({
    activeEntry: null,
    isLoading: false,
    duration: 0,

    startTimer: async (taskId, description) => {
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
        set({ isLoading: false })
    },

    stopTimer: async () => {
        set({ isLoading: true })
        const supabase = createClient()

        const { error } = await supabase.rpc('stop_timer')

        if (error) {
            console.error('Error stopping timer:', error)
        }

        set({ activeEntry: null, duration: 0, isLoading: false })
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
                .eq('id', profile.active_timer_id as string) // Cast to string to resolve potential type mismatch with UUID
                .single()

            if (entry) {
                // Calculate initial duration
                const start = new Date(entry.start_time).getTime()
                const now = new Date().getTime()
                const seconds = Math.floor((now - start) / 1000)

                set({ activeEntry: entry, duration: seconds })
            }
        } else {
            set({ activeEntry: null, duration: 0 })
        }
    },

    tick: () => {
        const { activeEntry } = get()
        if (activeEntry) {
            set((state) => ({ duration: state.duration + 1 }))
        }
    }
}))
