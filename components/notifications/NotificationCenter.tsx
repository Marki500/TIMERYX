'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Check, Trash2, X } from 'lucide-react'
import { useNotificationStore } from '@/stores/useNotificationStore'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/stores/useUserStore'

export function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false)
    const {
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        addNotification
    } = useNotificationStore()
    const { profile } = useUserStore()
    const dropdownRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const supabase = createClient()

    // Fetch initial notifications
    useEffect(() => {
        if (profile?.id) {
            fetchNotifications()
        }
    }, [profile?.id])

    // Realtime subscription
    useEffect(() => {
        if (!profile?.id) return

        const channel = supabase
            .channel('notifications-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${profile.id}`
                },
                (payload) => {
                    addNotification(payload.new as any)
                    // Optional: Play sound or show toast
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [profile?.id])

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleNotificationClick = async (id: string, link?: string | null) => {
        await markAsRead(id)
        if (link) {
            setIsOpen(false)
            router.push(link)
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 md:w-96 bg-background/60 backdrop-blur-3xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden z-50 ring-1 ring-white/5 support-backdrop-blur:bg-background/60"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <h3 className="font-semibold text-white">Notificaciones</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => markAllAsRead()}
                                    className="text-xs text-primary-400 hover:text-primary-300 transition-colors font-medium flex items-center gap-1"
                                >
                                    <Check size={14} />
                                    Marcar todo leído
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-zinc-500 flex flex-col items-center">
                                    <Bell size={32} className="mb-2 opacity-20" />
                                    <p className="text-sm">No tienes notificaciones nuevas</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            onClick={() => handleNotificationClick(notification.id, notification.link)}
                                            className={`p-4 hover:bg-white/5 transition-colors cursor-pointer relative group ${!notification.is_read ? 'bg-primary-500/[0.03]' : ''
                                                }`}
                                        >
                                            <div className="flex gap-3">
                                                <div className="mt-1 shrink-0">
                                                    {!notification.is_read && (
                                                        <div className="w-2 h-2 rounded-full bg-primary-500" />
                                                    )}
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <p className={`text-sm ${!notification.is_read ? 'text-white font-medium' : 'text-zinc-400'}`}>
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-xs text-zinc-500 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-[10px] text-zinc-600 font-mono pt-1">
                                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: es })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
