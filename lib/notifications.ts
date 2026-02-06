import { createClient } from '@/lib/supabase/client'

type CreateNotificationParams = {
    userId: string
    type: 'task_assigned' | 'mention' | 'project_invite' | 'system'
    title: string
    message: string
    link?: string
    metadata?: any
}

export async function sendNotification(notification: CreateNotificationParams) {
    const supabase = createClient()

    try {
        const { error } = await (supabase.from('notifications') as any).insert({
            user_id: notification.userId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            link: notification.link,
            metadata: notification.metadata,
            is_read: false
        })

        if (error) throw error
    } catch (error) {
        console.error('Error sending notification:', error)
    }
}
