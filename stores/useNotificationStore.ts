import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'

type Notification = {
    id: string
    user_id: string
    type: 'task_assigned' | 'mention' | 'project_invite' | 'system'
    title: string
    message: string
    link?: string | null
    is_read: boolean
    created_at: string
    metadata?: any
}

interface NotificationState {
    notifications: Notification[]
    unreadCount: number
    isLoading: boolean
    fetchNotifications: () => Promise<void>
    markAsRead: (id: string) => Promise<void>
    markAllAsRead: () => Promise<void>
    addNotification: (notification: Notification) => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,

    fetchNotifications: async () => {
        set({ isLoading: true })
        const supabase = createClient()

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50)

            if (error) throw error

            const typedData = data as Notification[]

            set({
                notifications: typedData,
                unreadCount: typedData.filter(n => !n.is_read).length,
                isLoading: false
            })
        } catch (error) {
            console.error('Error fetching notifications:', error)
            set({ isLoading: false })
        }
    },

    markAsRead: async (id: string) => {
        const supabase = createClient()
        // Optimistic update
        set(state => {
            const updated = state.notifications.map(n =>
                n.id === id ? { ...n, is_read: true } : n
            )
            return {
                notifications: updated,
                unreadCount: updated.filter(n => !n.is_read).length
            }
        })

        try {
            const { error } = await (supabase
                .from('notifications') as any)
                .update({ is_read: true })
                .eq('id', id)

            if (error) throw error
        } catch (error) {
            console.error('Error marking notification as read:', error)
            // Revert on error could be implemented here
        }
    },

    markAllAsRead: async () => {
        const supabase = createClient()
        const { notifications } = get()
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)

        if (unreadIds.length === 0) return

        // Optimistic update
        set(state => ({
            notifications: state.notifications.map(n => ({ ...n, is_read: true })),
            unreadCount: 0
        }))

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { error } = await (supabase
                .from('notifications') as any)
                .update({ is_read: true })
                .eq('user_id', user.id)
                .in('id', unreadIds)

            if (error) throw error
        } catch (error) {
            console.error('Error marking all as read:', error)
        }
    },

    addNotification: (notification: Notification) => {
        set(state => {
            // Prevent duplicates
            if (state.notifications.some(n => n.id === notification.id)) return state

            const newNotifications = [notification, ...state.notifications]
            return {
                notifications: newNotifications,
                unreadCount: state.unreadCount + (notification.is_read ? 0 : 1)
            }
        })
    }
}))
