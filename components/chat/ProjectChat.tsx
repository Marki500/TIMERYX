'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Edit2, Check, X, Loader2 } from 'lucide-react'
import { useUserStore } from '@/stores/useUserStore'

interface Message {
    id: string
    project_id: string
    user_id: string
    message: string
    created_at: string
    updated_at: string
    is_edited: boolean
    profiles?: {
        full_name: string
        avatar_url?: string
        role?: 'member' | 'client'
    }
}

interface ProjectChatProps {
    projectId: string
    userType: 'member' | 'client' | 'guest'
}

export function ProjectChat({ projectId, userType }: ProjectChatProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editText, setEditText] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()
    const { profile } = useUserStore()

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    // Load messages
    useEffect(() => {
        loadMessages()

        // Subscribe to realtime updates
        const channel = supabase
            .channel(`project-messages-${projectId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'project_messages',
                    filter: `project_id=eq.${projectId}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        loadMessages() // Reload to get profile data
                    } else if (payload.eventType === 'UPDATE') {
                        setMessages(prev => prev.map(msg =>
                            msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
                        ))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [projectId])

    // Auto-scroll on new messages
    useEffect(() => {
        scrollToBottom()
    }, [messages])


    const loadMessages = async () => {
        setLoading(true)

        // First, get messages
        const { data: messagesData, error: messagesError } = await (supabase
            .from('project_messages')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true })
            .limit(100) as any)

        if (messagesError || !messagesData) {
            console.error('Error loading messages:', messagesError)
            setLoading(false)
            return
        }

        // Get unique user IDs
        const userIds = [...new Set(messagesData.map((m: any) => m.user_id))]

        // Fetch profiles for these users
        const { data: profilesData } = await (supabase
            .from('profiles')
            .select('id, full_name, display_name, avatar_url')
            .in('id', userIds) as any)

        // Check which users are workspace members
        const { data: membersData } = await (supabase
            .from('workspace_members')
            .select('user_id')
            .in('user_id', userIds) as any)

        const memberIds = new Set(membersData?.map((m: any) => m.user_id) || [])

        // Create a map of user_id -> profile with role
        const profilesMap = new Map(
            profilesData?.map((p: any) => [p.id, {
                ...p,
                // Prioritize display_name, fallback to full_name
                full_name: (p as any).display_name || p.full_name,
                role: memberIds.has(p.id) ? 'member' : 'client'
            }]) || []
        )

        // Combine messages with profiles
        const messagesWithProfiles = messagesData.map((msg: any) => ({
            ...msg,
            profiles: profilesMap.get(msg.user_id)
        }))

        setMessages(messagesWithProfiles)
        setLoading(false)
    }

    const sendMessage = async () => {
        if (!newMessage.trim() || sending) return

        setSending(true)
        const { error } = await supabase
            .from('project_messages')
            .insert({
                project_id: projectId,
                message: newMessage.trim(),
                user_id: profile?.id
            } as any)

        if (!error) {
            setNewMessage('')
        }
        setSending(false)
    }

    const startEdit = (msg: Message) => {
        setEditingId(msg.id)
        setEditText(msg.message)
    }

    const saveEdit = async () => {
        if (!editText.trim() || !editingId) return

        const { error } = await (supabase
            .from('project_messages') as any)
            .update({
                message: editText.trim(),
                is_edited: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', editingId)

        if (!error) {
            setEditingId(null)
            setEditText('')
        }
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditText('')
    }

    // Guest view - prompt to create account
    if (userType === 'guest') {
        return (
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary-500/10 mx-auto mb-4 flex items-center justify-center">
                    <Send className="w-8 h-8 text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Chat Requires Account</h3>
                <p className="text-zinc-400 text-sm mb-4">
                    Create a free account to communicate with your project team
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[600px] bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    <AnimatePresence>
                        {messages.map((msg) => {
                            const isOwn = msg.user_id === profile?.id
                            const isEditing = editingId === msg.id

                            return (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                                >
                                    {/* Avatar */}
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                        {msg.profiles?.full_name?.[0] || '?'}
                                    </div>

                                    {/* Message Content */}
                                    <div className={`flex-1 max-w-[70%] ${isOwn ? 'items-end' : ''}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-medium text-white">
                                                {msg.profiles?.full_name || 'Unknown'}
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${msg.profiles?.role === 'member'
                                                ? 'bg-blue-500/20 text-blue-400'
                                                : 'bg-green-500/20 text-green-400'
                                                }`}>
                                                {msg.profiles?.role === 'member' ? 'Member' : 'Client'}
                                            </span>
                                            <span className="text-xs text-zinc-500">
                                                {new Date(msg.created_at).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>

                                        {isEditing ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={editText}
                                                    onChange={(e) => setEditText(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                                    autoFocus
                                                />
                                                <button onClick={saveEdit} className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30">
                                                    <Check size={16} />
                                                </button>
                                                <button onClick={cancelEdit} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className={`rounded-2xl px-4 py-2 ${isOwn
                                                ? 'bg-primary-500/20 text-white'
                                                : 'bg-white/5 text-white'
                                                }`}>
                                                <p className="text-sm">{msg.message}</p>
                                                {msg.is_edited && (
                                                    <span className="text-xs text-zinc-500 italic mt-1 block">
                                                        (edited)
                                                    </span>
                                                )}
                                                {isOwn && !isEditing && (
                                                    <button
                                                        onClick={() => startEdit(msg)}
                                                        className="text-xs text-zinc-400 hover:text-white mt-1 flex items-center gap-1"
                                                    >
                                                        <Edit2 size={12} />
                                                        Edit
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-white/10 p-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-blue-500 text-white font-medium hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {sending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send size={18} />
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
