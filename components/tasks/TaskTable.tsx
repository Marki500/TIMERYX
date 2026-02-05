'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MoreHorizontal, Play, CheckCircle2, Circle, AlertCircle, Edit2 } from 'lucide-react'
import { useTaskStore } from '@/stores/useTaskStore'
import { useTimerStore } from '@/stores/useTimerStore'
import { EditTaskDialog } from './EditTaskDialog'
import { cn } from '@/lib/utils'
import { Database } from '@/types/supabase'

type Task = Database['public']['Tables']['tasks']['Row']

export function TaskTable() {
    const { tasks, isLoading } = useTaskStore()
    const { startTimer, activeEntry } = useTimerStore()
    const [editingTask, setEditingTask] = useState<Task | null>(null)

    if (isLoading) return <div className="text-white/50 p-8">Loading tasks...</div>

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                <p className="text-zinc-500 mb-4">No tasks found</p>
                <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-500 transition-colors">
                    Create your first task
                </button>
            </div>
        )
    }

    return (
        <div className="w-full overflow-hidden rounded-3xl border border-white/5 bg-black/20 backdrop-blur-md">
            <table className="w-full text-left border-collapse">
                <thead className="bg-white/5 text-zinc-400 text-xs font-medium uppercase tracking-wider">
                    <tr>
                        <th className="px-6 py-4">Task</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Priority</th>
                        <th className="px-6 py-4">Due Date</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
                    {tasks.map((task) => {
                        const isTracking = activeEntry?.task_id === task.id // This would require activeEntry to store task_id, let's assume it does or we check description match for now
                        // Actually activeEntry has task_id in the DB schema!

                        return (
                            <motion.tr
                                key={task.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                                className="group transition-colors"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <button className="text-zinc-600 hover:text-primary-500 transition-colors">
                                            <Circle size={18} />
                                        </button>
                                        <span className={cn("font-medium text-white", task.status === 'done' && "line-through text-zinc-500")}>
                                            {task.title}
                                        </span>
                                    </div>
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
                                            onClick={() => setEditingTask(task)}
                                            className="p-2 rounded-lg bg-white/5 hover:bg-blue-500 hover:text-white transition-colors"
                                            title="Edit Task"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </div>
                                </td>
                            </motion.tr>
                        )
                    })}
                </tbody>
            </table>

            <EditTaskDialog
                isOpen={!!editingTask}
                onClose={() => setEditingTask(null)}
                task={editingTask}
            />
        </div>
    )
}
