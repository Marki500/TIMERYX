'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Check, ChevronDown, Plus } from 'lucide-react'
import { useUserStore } from '@/stores/useUserStore'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { CreateWorkspaceModal } from './CreateWorkspaceModal'

export function WorkspaceSwitcher() {
    const [isOpen, setIsOpen] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [mounted, setMounted] = useState(false)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const [position, setPosition] = useState({ top: 0, left: 0 })

    const { workspaces, currentWorkspace, setCurrentWorkspace } = useUserStore()
    const displayWorkspaces = workspaces
    const activeWorkspace = currentWorkspace || (workspaces.length > 0 ? workspaces[0] : null)

    useEffect(() => {
        setMounted(true)
    }, [])

    const toggleDropdown = () => {
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect()
            setPosition({
                top: rect.bottom + 8,
                left: rect.left
            })
        }
        setIsOpen(!isOpen)
    }

    // Update position on scroll/resize if open
    useEffect(() => {
        if (!isOpen) return

        const updatePosition = () => {
            if (buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect()
                setPosition({
                    top: rect.bottom + 8,
                    left: rect.left
                })
            }
        }

        window.addEventListener('scroll', updatePosition)
        window.addEventListener('resize', updatePosition)
        return () => {
            window.removeEventListener('scroll', updatePosition)
            window.removeEventListener('resize', updatePosition)
        }
    }, [isOpen])

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={toggleDropdown}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-300 group"
            >
                <div className="flex items-center gap-2.5">
                    <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-black/20 ring-1 ring-white/20"
                        style={{ backgroundColor: (activeWorkspace as any)?.color || '#3B82F6' }}
                    >
                        {activeWorkspace?.name.charAt(0).toUpperCase() || 'W'}
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-sm font-semibold text-white/90 group-hover:text-white leading-none transition-colors">
                            {activeWorkspace?.name || 'Workspace'}
                        </span>
                        {(activeWorkspace as any)?.description && (
                            <span className="text-xs text-zinc-500 group-hover:text-zinc-400 leading-none mt-0.5 transition-colors">
                                {(activeWorkspace as any)?.description}
                            </span>
                        )}
                    </div>
                </div>
                <ChevronDown
                    size={16}
                    className={cn(
                        "text-zinc-500 group-hover:text-zinc-300 transition-transform duration-300 ml-1",
                        isOpen && "rotate-180 text-primary-400"
                    )}
                />
            </button>

            {mounted && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <>
                            <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
                            <motion.div
                                initial={{ opacity: 0, y: -8, scale: 0.96, filter: 'blur(4px)' }}
                                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, y: -8, scale: 0.96, filter: 'blur(4px)' }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                style={{
                                    top: position.top,
                                    left: position.left,
                                    position: 'fixed'
                                }}
                                className="w-72 bg-white/10 backdrop-blur-3xl border border-white/20 ring-1 ring-white/20 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-[9999]"
                            >
                                <div className="p-2 max-h-80 overflow-y-auto custom-scrollbar">
                                    <p className="px-3 py-2 text-[10px] font-bold text-white/70 uppercase tracking-widest text-shadow-sm">
                                        Active Workspace
                                    </p>
                                    {displayWorkspaces.map((ws: any) => {
                                        const isActive = activeWorkspace?.id === ws.id
                                        return (
                                            <button
                                                key={ws.id}
                                                onClick={() => {
                                                    setCurrentWorkspace(ws)
                                                    setIsOpen(false)
                                                }}
                                                className={cn(
                                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group mb-1",
                                                    isActive
                                                        ? "bg-white/10 text-white shadow-lg shadow-black/20"
                                                        : "text-zinc-400 hover:bg-white/5 hover:text-white"
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-300",
                                                        isActive
                                                            ? "text-white shadow-md shadow-black/20 ring-1 ring-white/20"
                                                            : "bg-white/5 text-zinc-500 group-hover:bg-white/10 group-hover:text-zinc-300"
                                                    )}
                                                    style={isActive && ws.color ? { backgroundColor: ws.color } : {}}
                                                >
                                                    {ws.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 text-left min-w-0">
                                                    <p className={cn("font-medium truncate transition-colors", isActive ? "text-white" : "text-zinc-300 group-hover:text-white")}>
                                                        {ws.name}
                                                    </p>
                                                    {(ws as any).description && (
                                                        <p className="text-xs text-zinc-500 truncate group-hover:text-zinc-400 transition-colors">
                                                            {(ws as any).description}
                                                        </p>
                                                    )}
                                                </div>
                                                {isActive && (
                                                    <Check size={16} className="text-white flex-shrink-0 drop-shadow-md" />
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>

                                <div className="border-t border-white/5 p-2 bg-black/20">
                                    <button
                                        onClick={() => {
                                            setShowCreateModal(true)
                                            setIsOpen(false)
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-400 hover:bg-primary-500/10 hover:text-primary-400 transition-all duration-300 group ring-1 ring-transparent hover:ring-primary-500/20"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary-500/20 group-hover:border-primary-500/30 transition-all duration-300">
                                            <Plus size={16} className="text-zinc-400 group-hover:text-primary-400 transition-colors" />
                                        </div>
                                        <span className="font-medium">Crear nuevo workspace</span>
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}

            <CreateWorkspaceModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
            />
        </div>
    )
}
