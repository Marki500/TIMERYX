import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'

export type Task = Database['public']['Tables']['tasks']['Row'] & {
    total_duration?: number
}
export type ViewMode = 'table' | 'kanban' | 'calendar'

interface TaskState {
    tasks: Task[]
    isLoading: boolean
    viewMode: ViewMode

    filterStatus: Task['status'] | 'all'
    currentProjectId: string | null

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
    currentProjectId: null,

    setViewMode: (mode) => set({ viewMode: mode }),

    fetchTasks: async (projectId) => {
        set({ isLoading: true, currentProjectId: projectId || null })
        const supabase = createClient()

        // Use RPC to get tasks with duration
        const { data, error } = await (supabase.rpc as any)('get_tasks_with_duration', {
            p_project_id: projectId || null
        })

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

        // OPTIMISTIC UPDATE
        const tempId = `temp-${Date.now()}`
        const optimisticTask: Task = {
            ...task,
            id: tempId,
            created_by: user.id,
            status: task.status || 'todo',
            priority: task.priority || 'medium',
            title: task.title || 'New Task',
            description: task.description || null,
            project_id: task.project_id || null,
            assigned_to: task.assigned_to || null,
            due_date: task.due_date || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            total_duration: 0
        } as Task

        const currentProjectId = get().currentProjectId
        if (!currentProjectId || optimisticTask.project_id === currentProjectId) {
            set((state) => ({ tasks: [optimisticTask, ...state.tasks] }))
        }

        const { data, error } = await (supabase
            .from('tasks') as any)
            .insert({
                ...task,
                created_by: user.id,
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating task:', error)
            // Rollback optimistic update
            set((state) => ({ tasks: state.tasks.filter(t => t.id !== tempId) }))
            return null
        }

        // Replace optimistic task with real task
        set((state) => ({
            tasks: state.tasks.map(t => t.id === tempId ? { ...data, total_duration: 0 } : t)
        }))

        // Check for assignment trigger
        if (data.assigned_to && data.assigned_to !== user.id) {
            const { sendNotification } = await import('@/lib/notifications')
            sendNotification({
                userId: data.assigned_to,
                type: 'task_assigned',
                title: 'New Task Assigned',
                message: `You have been assigned to a new task: ${data.title}`,
                link: `/projects/${data.project_id}`
            })
        }

        return data
    },

    updateTask: async (id, updates) => {
        // Optimistic update
        set((state) => {
            // If project changed and doesn't match current filter, remove it
            const currentProjectId = state.currentProjectId
            if (currentProjectId && updates.project_id && updates.project_id !== currentProjectId) {
                return { tasks: state.tasks.filter(t => t.id !== id) }
            }
            return {
                tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
            }
        })

        const supabase = createClient()
        const { error } = await (supabase
            .from('tasks') as any)
            .update(updates)
            .eq('id', id)

        if (error) {
            console.error('Error updating task:', error)
        } else {
            // Check for assignment trigger (running after update to ensure success)
            // We need previous state to know if it changed, which we grabbed optimistically or via find
            // For simplicity, we can just check if 'updates.assigned_to' exists.
            // Ideally we check if it's DIFFERENT from old value.
            const oldTask = get().tasks.find(t => t.id === id)
            if (updates.assigned_to && oldTask && updates.assigned_to !== oldTask.assigned_to) {
                const { data: { user } } = await supabase.auth.getUser()
                if (user && updates.assigned_to !== user.id) {
                    const { sendNotification } = await import('@/lib/notifications')
                    sendNotification({
                        userId: updates.assigned_to,
                        type: 'task_assigned',
                        title: 'Task Assigned',
                        message: `You have been assigned to task: ${oldTask.title}`, // Note: title might have changed too?
                        link: `/projects/${oldTask.project_id}`
                    })
                }
            }
        }
    },

    deleteTask: async (id) => {
        // Find task for potential rollback
        const taskToDelete = get().tasks.find(t => t.id === id)

        // Optimistic update
        set((state) => ({
            tasks: state.tasks.filter(t => t.id !== id)
        }))

        const supabase = createClient()
        const { data, error } = await (supabase
            .from('tasks') as any)
            .delete()
            .eq('id', id)
            .select()

        if (error || !data || data.length === 0) {
            console.error('Error deleting task:', error || 'No rows deleted (RLS or not found)')
            // Rollback optimistic update
            if (taskToDelete) {
                set((state) => ({
                    tasks: [...state.tasks, taskToDelete]
                }))
            }
            throw new Error(error?.message || 'No tienes permisos para borrar esta tarea o ya no existe.')
        }
    }
}))
