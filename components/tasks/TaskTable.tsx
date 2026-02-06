'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MoreHorizontal, Play, CheckCircle2, Circle, AlertCircle, Edit2, Trash2, Search, ArrowUpDown, Clock } from 'lucide-react'
import { useTaskStore } from '@/stores/useTaskStore'
import { useTimerStore } from '@/stores/useTimerStore'
import { EditTaskDialog } from './EditTaskDialog'
import { CreateTaskDialog } from './CreateTaskDialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ManualTimeDialog } from '@/components/timer/ManualTimeDialog'
import { useProjectStore } from '@/stores/useProjectStore'
import { useUserStore } from '@/stores/useUserStore'
import { cn } from '@/lib/utils'
import { Database } from '@/types/supabase'
import { staggerContainer, staggerItem } from '@/lib/animations'

type Task = Database['public']['Tables']['tasks']['Row']

export function TaskTable() {
    const { tasks, isLoading } = useTaskStore()
    const { startTimer, activeEntry } = useTimerStore()
    const { projects } = useProjectStore()
    const { currentWorkspace } = useUserStore()
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
    const [manualTimeTaskId, setManualTimeTaskId] = useState<string | null>(null)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

    const [searchQuery, setSearchQuery] = useState('')
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc'
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
    }

    const filteredAndSortedTasks = [...tasks]
        .filter(task => {
            if (!searchQuery) return true
            return task.title.toLowerCase().includes(searchQuery.toLowerCase())
        })
        .sort((a, b) => {
            if (!sortConfig) return 0

            const { key, direction } = sortConfig
            const modifier = direction === 'asc' ? 1 : -1

            if (key === 'project') {
                const pA = projects.find(p => p.id === a.project_id)?.name || ''
                const pB = projects.find(p => p.id === b.project_id)?.name || ''
                return pA.localeCompare(pB) * modifier
            }
            if (key === 'status') return a.status.localeCompare(b.status) * modifier
            if (key === 'priority') {
                const map = { urgent: 4, high: 3, medium: 2, low: 1 }
                return ((map[a.priority as keyof typeof map] || 0) - (map[b.priority as keyof typeof map] || 0)) * modifier
            }
            if (key === 'duration') return ((a.total_duration || 0) - (b.total_duration || 0)) * modifier
            if (key === 'dueDate') {
                const dA = a.due_date ? new Date(a.due_date).getTime() : 0
                const dB = b.due_date ? new Date(b.due_date).getTime() : 0
                return (dA - dB) * modifier
            }
            return (a.title || '').localeCompare(b.title || '') * modifier
        })

    if (isLoading) return <div className="text-white/50 p-8">Loading tasks...</div>

    if (tasks.length === 0) {
        return (
            <>
                <div className="flex flex-col items-center justify-center h-64 border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                    <p className="text-zinc-500 mb-4">No tasks found</p>
                    <button
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-500 transition-colors"
                    >
                        Create your first task
                    </button>
                </div>

                <CreateTaskDialog
                    isOpen={isCreateDialogOpen}
                    onClose={() => setIsCreateDialogOpen(false)}
                    initialDate={null}
                    initialProjectId={undefined}
                />
            </>
        )
    }

    const formatDuration = (seconds: number) => {
        if (!seconds) return '-'
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        return `${h}h ${m}m`
    }

    return (
        <div className="space-y-4">
            {/* Search Input */}
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" size={16} />
                <input
                    type="text"
                    placeholder="Search tasks by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:bg-white/[0.05] focus:border-white/10 transition-all shadow-sm"
                />
            </div>

            <div className="w-full overflow-hidden rounded-3xl border border-white/5 bg-black/20 backdrop-blur-md">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="bg-white/5 text-zinc-400 text-xs font-medium uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('title')}>
                                    <div className="flex items-center gap-1">Task {sortConfig?.key === 'title' && <ArrowUpDown size={12} />}</div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('project')}>
                                    <div className="flex items-center gap-1">Project {sortConfig?.key === 'project' && <ArrowUpDown size={12} />}</div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('status')}>
                                    <div className="flex items-center gap-1">Status {sortConfig?.key === 'status' && <ArrowUpDown size={12} />}</div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('priority')}>
                                    <div className="flex items-center gap-1">Priority {sortConfig?.key === 'priority' && <ArrowUpDown size={12} />}</div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('duration')}>
                                    <div className="flex items-center gap-1">Duration {sortConfig?.key === 'duration' && <ArrowUpDown size={12} />}</div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('dueDate')}>
                                    <div className="flex items-center gap-1">Due Date {sortConfig?.key === 'dueDate' && <ArrowUpDown size={12} />}</div>
                                </th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <motion.tbody
                            className="divide-y divide-white/5 text-sm text-zinc-300"
                            variants={staggerContainer}
                            initial="hidden"
                            animate="visible"
                        >
                            {filteredAndSortedTasks.map((task) => {
                                const isTracking = activeEntry?.task_id === task.id
                                const displayDuration = isTracking
                                    ? (task.total_duration || 0) + (useTimerStore.getState().duration || 0)
                                    : (task.total_duration || 0)

                                const project = projects.find(p => p.id === task.project_id)

                                return (
                                    <motion.tr
                                        key={task.id}
                                        variants={staggerItem}
                                        whileHover={{
                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                            transition: { duration: 0.2 }
                                        }}
                                        className="group transition-colors cursor-pointer"
                                    >
                                        <td className="px-6 py-4 font-medium text-white">
                                            <div className="flex items-center gap-3">
                                                <button className="text-zinc-600 hover:text-primary-500 transition-colors">
                                                    <Circle size={18} />
                                                </button>
                                                <span className={cn(task.status === 'done' && "line-through text-zinc-500")}>
                                                    {task.title}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {project ? (
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ backgroundColor: project.color }}
                                                    />
                                                    <span className="text-zinc-400">{project.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-zinc-600 italic">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                                task.status === 'done' ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                                    task.status === 'in_progress' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                                        "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                                            )}>
                                                {task.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {task.priority === 'high' && <AlertCircle size={14} className="text-red-400" />}
                                                <span className={cn(
                                                    task.priority === 'high' ? "text-red-400" :
                                                        task.priority === 'medium' ? "text-orange-400" :
                                                            "text-green-400"
                                                )}>
                                                    {task.priority}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-zinc-400">
                                            {formatDuration(task.total_duration || 0)}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500">
                                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => startTimer(task.id, task.title)}
                                                    className="p-2 rounded-lg bg-white/5 hover:bg-primary-500 hover:text-white transition-colors"
                                                    title="Start Timer"
                                                >
                                                    <Play size={14} fill="currentColor" />
                                                </button>
                                                <button
                                                    onClick={() => setManualTimeTaskId(task.id)}
                                                    className="p-2 rounded-lg bg-white/5 hover:bg-green-500 hover:text-white transition-colors"
                                                    title="Add Manual Time"
                                                >
                                                    <Clock size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setEditingTask(task)}
                                                    className="p-2 rounded-lg bg-white/5 hover:bg-blue-500 hover:text-white transition-colors"
                                                    title="Edit Task"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setDeletingTaskId(task.id)}
                                                    className="p-2 rounded-lg bg-white/5 hover:bg-red-500 hover:text-white transition-colors"
                                                    title="Delete Task"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                )
                            })}
                        </motion.tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4 p-4">
                    {filteredAndSortedTasks.map((task) => {
                        const project = projects.find(p => p.id === task.project_id)
                        return (
                            <div key={task.id} className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <button className="text-zinc-600 hover:text-primary-500 transition-colors">
                                            <Circle size={20} />
                                        </button>
                                        <div>
                                            <h4 className={cn("font-medium text-white", task.status === 'done' && "line-through text-zinc-500")}>
                                                {task.title}
                                            </h4>
                                            {project && (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
                                                    <span className="text-xs text-zinc-400">{project.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <span className={cn(
                                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                        task.status === 'done' ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                            task.status === 'in_progress' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                                                "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                                    )}>
                                        {task.status.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-sm text-zinc-400 pt-2 border-t border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            {task.priority === 'high' && <AlertCircle size={14} className="text-red-400" />}
                                            <span className={cn(
                                                task.priority === 'high' ? "text-red-400" :
                                                    task.priority === 'medium' ? "text-orange-400" :
                                                        "text-green-400"
                                            )}>
                                                {task.priority}
                                            </span>
                                        </div>
                                        <div className="font-mono">
                                            {formatDuration(task.total_duration || 0)}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => startTimer(task.id, task.title)} className="p-2 hover:bg-white/10 rounded-lg text-primary-400">
                                            <Play size={16} />
                                        </button>
                                        <button onClick={() => setEditingTask(task)} className="p-2 hover:bg-white/10 rounded-lg text-blue-400">
                                            <Edit2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <EditTaskDialog
                isOpen={!!editingTask}
                onClose={() => setEditingTask(null)}
                task={editingTask}
            />

            <ConfirmDialog
                isOpen={!!deletingTaskId}
                onCancel={() => setDeletingTaskId(null)}
                onConfirm={async () => {
                    if (deletingTaskId) {
                        await useTaskStore.getState().deleteTask(deletingTaskId)
                        setDeletingTaskId(null)
                    }
                }}
                title="Delete Task"
                message="Are you sure you want to delete this task? This action cannot be undone."
            />

            <ManualTimeDialog
                isOpen={!!manualTimeTaskId}
                onClose={() => setManualTimeTaskId(null)}
                preSelectedTaskId={manualTimeTaskId || undefined}
            />
        </div>
    )
}
