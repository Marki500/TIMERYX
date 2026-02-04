'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Check, ChevronDown, Plus } from 'lucide-react'
import { useUserStore } from '@/stores/useUserStore'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export function WorkspaceSwitcher() {
    const [isOpen, setIsOpen] = useState(false)

    // Modal State
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [newWorkspaceName, setNewWorkspaceName] = useState('')
    const [isCreating, setIsCreating] = useState(false)

    const { workspaces, currentWorkspace, setCurrentWorkspace, setWorkspaces } = useUserStore()
    const supabase = createClient()

    const displayWorkspaces = workspaces

    const activeWorkspace = currentWorkspace || (displayWorkspaces.length > 0 ? displayWorkspaces[0] : null)

    const handleCreateWorkspace = async () => {
        if (!newWorkspaceName.trim()) return
        setIsCreating(true)

        try {
            const slug = newWorkspaceName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(7)

            const { data: workspaceId, error } = await supabase.rpc('create_workspace', {
                p_name: newWorkspaceName,
                p_slug: slug
            })

            if (error) throw error

            // Refresh workspaces list
            // Ideally we'd fetch from DB again, but for speed let's push optimistically or reload page
            // Let's force a reload for now to ensure all stores sync up or we could just refetch via store if we had that action
            window.location.reload()

        } catch (error) {
            console.error('Failed to create workspace:', error)
            alert('Failed to create workspace')
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <div className="relative z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors group border border-transparent hover:border-white/5"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold">
                        {activeWorkspace ? activeWorkspace.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-semibold text-white group-hover:text-primary-400 transition-colors">
                            {activeWorkspace?.name || 'No Workspace'}
                        </p>
                        <p className="text-xs text-zinc-500">{activeWorkspace ? 'Free Plan' : 'Select or Create'}</p>
                    </div>
                </div>
                <ChevronDown size={14} className={cn("text-zinc-500 transition-transform duration-300", isOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-full left-0 right-0 mt-2 p-2 bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-xl z-50 backdrop-blur-xl"
                        >
                            <div className="space-y-1">
                                {displayWorkspaces.map((ws: any) => (
                                    <button
                                        key={ws.id}
                                        onClick={() => {
                                            setCurrentWorkspace(ws)
                                            setIsOpen(false)
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-between p-2 rounded-xl text-sm transition-all",
                                            activeWorkspace?.id === ws.id
                                                ? "bg-white/10 text-white"
                                                : "text-zinc-400 hover:bg-white/5 hover:text-white"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold",
                                                activeWorkspace?.id === ws.id ? "bg-white text-black" : "bg-white/10 text-white/70"
                                            )}>
                                                {ws.name.charAt(0)}
                                            </div>
                                            <span>{ws.name}</span>
                                        </div>
                                        {activeWorkspace?.id === ws.id && <Check size={14} className="text-primary-400" />}
                                    </button>
                                ))}
                            </div>

                            <div className="h-px bg-white/5 my-2" />

                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="w-full flex items-center gap-3 p-2 rounded-xl text-sm text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
                            >
                                <div className="w-6 h-6 rounded-full border border-dashed border-zinc-600 flex items-center justify-center">
                                    <Plus size={12} />
                                </div>
                                Create Workspace
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Create Workspace Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => setShowCreateModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-sm bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 shadow-2xl z-10"
                        >
                            <h3 className="text-lg font-bold text-white mb-4">Create New Workspace</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-zinc-500 uppercase ml-1">Workspace Name</label>
                                    <input
                                        type="text"
                                        value={newWorkspaceName}
                                        onChange={(e) => setNewWorkspaceName(e.target.value)}
                                        placeholder="Acme Corp."
                                        autoFocus
                                        className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                                    />
                                </div>

                                <div className="pt-2 flex gap-3">
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 py-3 rounded-xl bg-white/5 text-zinc-400 font-medium hover:bg-white/10 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateWorkspace}
                                        disabled={!newWorkspaceName.trim() || isCreating}
                                        className="flex-1 py-3 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isCreating ? 'Creating...' : 'Create'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
