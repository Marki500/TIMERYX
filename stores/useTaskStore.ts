import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'

type Task = Database['public']['Tables']['tasks']['Row']
export type ViewMode = 'table' | 'kanban' | 'calendar'

interface TaskState {
    tasks: Task[]
    isLoading: boolean
    viewMode: ViewMode
    filterStatus: Task['status'] | 'all'

    // Actions
    setViewMode: (mode: ViewMode) => void
    fetchTasks: (projectId?: string) => Promise<void>
    createTask: (task: Partial<Task>) => Promise<Task | null>
    updateTask: (id: string, updates: Partial<Task>) => Promise<void>
    deleteTask: (id: string) => Promise<void>
}

export const useTaskStore = create<TaskState>((set, get) => ({
    tasks: [],
    isLoading: false,
    viewMode: 'table',
    filterStatus: 'all',

    setViewMode: (mode) => set({ viewMode: mode }),

    fetchTasks: async (projectId) => {
        set({ isLoading: true })
        const supabase = createClient()

        let query = supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false })

        if (projectId) {
            query = query.eq('project_id', projectId)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching tasks:', error)
        } else {
            set({ tasks: data || [] })
        }
        set({ isLoading: false })
    },

    createTask: async (task) => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return null

        // For demo purposes, if no project_id, we might fail or need a default.
        // Assuming UI handles project selection or we have a currentProject in another store.

        // Optimistic update? Maybe later.
        const { data, error } = await supabase
            .from('tasks')
            .insert({
                ...task,
                created_by: user.id,
            } as any) // Cast to any to avoid strict partial checks against Insert type for now
            .select()
            .single()

        if (error) {
            console.error('Error creating task:', error)
            return null
        }

        set((state) => ({ tasks: [data, ...state.tasks] }))
        return data
    },

    updateTask: async (id, updates) => {
        // Optimistic update
        set((state) => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
        }))

        const supabase = createClient()
        const { error } = await supabase
            .from('tasks')
            .update(updates as any)
            .eq('id', id)

        if (error) {
            console.error('Error updating task:', error)
            // Revert? (Not implemented for simplicity)
        }
    },

    deleteTask: async (id) => {
        set((state) => ({
            tasks: state.tasks.filter(t => t.id !== id)
        }))

        const supabase = createClient()
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id)

        if (error) console.error('Error deleting task:', error)
    }
}))
