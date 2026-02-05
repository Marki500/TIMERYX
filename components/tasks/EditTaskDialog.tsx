'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar as CalendarIcon, Flag, Trash2, Tag } from 'lucide-react'
import { useTaskStore } from '@/stores/useTaskStore'
import { useProjectStore } from '@/stores/useProjectStore'
import { useUserStore } from '@/stores/useUserStore'
import { cn } from '@/lib/utils'
import { Database } from '@/types/supabase'

type Task = Database['public']['Tables']['tasks']['Row']

interface EditTaskDialogProps {
    isOpen: boolean
    onClose: () => void
    task: Task | null
}

export function EditTaskDialog({ isOpen, onClose, task }: EditTaskDialogProps) {
    const { updateTask, deleteTask } = useTaskStore()
    const { projects, fetchProjects } = useProjectStore()
    const { currentWorkspace } = useUserStore()

    const [mounted, setMounted] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
    const [status, setStatus] = useState<'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'>('todo')
    const [dueDate, setDueDate] = useState('')
    const [selectedProjectId, setSelectedProjectId] = useState<string>('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showPriorityDropdown, setShowPriorityDropdown] = useState(false)
    const [showStatusDropdown, setShowStatusDropdown] = useState(false)
    const [showProjectDropdown, setShowProjectDropdown] = useState(false)

    // Hydration fix for Portal
    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    // Fetch projects on mount or workspace change
    useEffect(() => {
        if (currentWorkspace) {
            fetchProjects(currentWorkspace.id)
        }
    }, [currentWorkspace, fetchProjects])

    // Populate form when task changes
    useEffect(() => {
        if (task && isOpen) {
            setTitle(task.title || '')
            setDescription(task.description || '')
            setPriority(task.priority || 'medium')
            setStatus(task.status || 'todo')
            setDueDate(task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '')
            setSelectedProjectId(task.project_id || '')
        }
    }, [task, isOpen])

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            setShowPriorityDropdown(false)
            setShowStatusDropdown(false)
            setShowProjectDropdown(false)
        }

        if (showPriorityDropdown || showStatusDropdown || showProjectDropdown) {
            document.addEventListener('click', handleClickOutside)
            return () => document.removeEventListener('click', handleClickOutside)
        }
    }, [showPriorityDropdown, showStatusDropdown, showProjectDropdown])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim() || !task) return

        setIsSubmitting(true)
        try {
            await updateTask(task.id, {
                title,
                description,
                priority,
                status,
                project_id: selectedProjectId || undefined,
                due_date: dueDate ? new Date(dueDate).toISOString() : null,
            })

            onClose()
        } catch (error) {
            console.error('Failed to update task:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!task) return

        setIsSubmitting(true)
        try {
            await deleteTask(task.id)
            onClose()
        } catch (error) {
            console.error('Failed to delete task:', error)
        } finally {
            setIsSubmitting(false)
            setShowDeleteConfirm(false)
        }
    }

    if (!mounted || !task) return null

    // Use Portal to render outside of the Dashboard layout constraints
    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-[#0F0F0F] border border-white/10 rounded-3xl shadow-2xl shadow-black/80 z-10 overflow-hidden ring-1 ring-white/5"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />

                        <div className="relative p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <h2 className="text-xl font-bold text-white tracking-tight">Edit Task</h2>
                            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="What needs to be done?"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full bg-transparent text-2xl font-medium text-white placeholder-zinc-600 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <textarea
                                        placeholder="Add a description..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full bg-transparent text-zinc-400 placeholder-zinc-600 focus:outline-none resize-none min-h-[80px]"
                                    />
                                </div>

                                <div className="flex flex-wrap gap-3 pt-2">
                                    {/* Project Selector */}
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setShowProjectDropdown(!showProjectDropdown)
                                                setShowPriorityDropdown(false)
                                                setShowStatusDropdown(false)
                                            }}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium text-zinc-300 transition-colors border border-transparent hover:border-white/10"
                                        >
                                            <Tag size={14} className={cn(selectedProjectId ? "text-primary-400" : "text-zinc-500")} />
                                            {selectedProjectId
                                                ? projects.find(p => p.id === selectedProjectId)?.name || 'Project'
                                                : 'Select Project'}
                                        </button>
                                        {showProjectDropdown && (
                                            <div className="absolute top-full left-0 mt-2 w-48 bg-[#18181b] border border-white/10 rounded-xl shadow-xl overflow-hidden z-20 max-h-60 overflow-y-auto">
                                                {projects.length === 0 ? (
                                                    <div className="px-4 py-2 text-sm text-zinc-500">No projects found</div>
                                                ) : (
                                                    projects.map((project) => (
                                                        <button
                                                            key={project.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedProjectId(project.id)
                                                                setShowProjectDropdown(false)
                                                            }}
                                                            className="w-full text-left px-4 py-2 text-sm text-zinc-400 hover:bg-white/5 hover:text-white flex items-center gap-2"
                                                        >
                                                            <div
                                                                className="w-2 h-2 rounded-full"
                                                                style={{ backgroundColor: project.color }}
                                                            />
                                                            {project.name}
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Priority Selector */}
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setShowPriorityDropdown(!showPriorityDropdown)
                                                setShowProjectDropdown(false)
                                                setShowStatusDropdown(false)
                                            }}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium text-zinc-300 transition-colors border border-transparent hover:border-white/10"
                                        >
                                            <Flag size={14} className={cn(
                                                priority === 'urgent' ? "text-purple-400" :
                                                    priority === 'high' ? "text-red-400" :
                                                        priority === 'medium' ? "text-orange-400" : "text-blue-400"
                                            )} />
                                            <span className="capitalize">{priority} Priority</span>
                                        </button>
                                        {showPriorityDropdown && (
                                            <div className="absolute top-full left-0 mt-2 w-36 bg-[#18181b] border border-white/10 rounded-xl shadow-xl overflow-hidden z-20">
                                                {['low', 'medium', 'high', 'urgent'].map((p) => (
                                                    <button
                                                        key={p}
                                                        type="button"
                                                        onClick={() => {
                                                            setPriority(p as any)
                                                            setShowPriorityDropdown(false)
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm text-zinc-400 hover:bg-white/5 hover:text-white capitalize flex items-center gap-2"
                                                    >
                                                        <Flag size={12} className={cn(
                                                            p === 'urgent' ? "text-purple-400" :
                                                                p === 'high' ? "text-red-400" :
                                                                    p === 'medium' ? "text-orange-400" : "text-blue-400"
                                                        )} />
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Status Selector */}
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setShowStatusDropdown(!showStatusDropdown)
                                            }}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium text-zinc-300 transition-colors border border-transparent hover:border-white/10"
                                        >
                                            <span className={cn(
                                                "w-2 h-2 rounded-full",
                                                status === 'done' ? "bg-green-400" :
                                                    status === 'in_progress' ? "bg-blue-400" :
                                                        status === 'review' ? "bg-purple-400" :
                                                            status === 'cancelled' ? "bg-red-400" :
                                                                "bg-zinc-400"
                                            )} />
                                            <span className="capitalize">{status.replace('_', ' ')}</span>
                                        </button>
                                        {showStatusDropdown && (
                                            <div className="absolute top-full left-0 mt-2 w-40 bg-[#18181b] border border-white/10 rounded-xl shadow-xl overflow-hidden z-20">
                                                {['backlog', 'todo', 'in_progress', 'review', 'done', 'cancelled'].map((s) => (
                                                    <button
                                                        key={s}
                                                        type="button"
                                                        onClick={() => {
                                                            setStatus(s as any)
                                                            setShowStatusDropdown(false)
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm text-zinc-400 hover:bg-white/5 hover:text-white capitalize flex items-center gap-2"
                                                    >
                                                        <span className={cn(
                                                            "w-2 h-2 rounded-full",
                                                            s === 'done' ? "bg-green-400" :
                                                                s === 'in_progress' ? "bg-blue-400" :
                                                                    s === 'review' ? "bg-purple-400" :
                                                                        s === 'cancelled' ? "bg-red-400" :
                                                                            "bg-zinc-400"
                                                        )} />
                                                        {s.replace('_', ' ')}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Due Date */}
                                    <div className="relative">
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 hover:border-white/20 hover:from-white/[0.12] hover:to-white/[0.04] text-sm font-medium transition-all backdrop-blur-sm">
                                            <CalendarIcon size={14} className="text-zinc-400" />
                                            <input
                                                type="date"
                                                value={dueDate}
                                                onChange={(e) => setDueDate(e.target.value)}
                                                className="bg-transparent text-zinc-300 text-sm outline-none cursor-pointer"
                                                style={{
                                                    colorScheme: 'dark',
                                                    width: '140px'
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-between items-center gap-3 border-t border-white/5">
                                {/* Delete Button */}
                                {!showDeleteConfirm ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="px-4 py-2 rounded-xl text-red-400 font-medium hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                                    >
                                        <Trash2 size={16} />
                                        Delete
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-zinc-400">Are you sure?</span>
                                        <button
                                            type="button"
                                            onClick={handleDelete}
                                            disabled={isSubmitting}
                                            className="px-3 py-1.5 rounded-lg text-sm bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                                        >
                                            Yes, delete
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowDeleteConfirm(false)}
                                            className="px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}

                                <div className="flex gap-3 ml-auto">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-4 py-2 rounded-xl text-zinc-400 font-medium hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!title.trim() || isSubmitting}
                                        className="px-6 py-2 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/10"
                                    >
                                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    )
}
