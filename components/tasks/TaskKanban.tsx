'use client'

import { useState } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { motion } from 'framer-motion'
import { MoreHorizontal, Plus, Edit2 } from 'lucide-react'
import { useTaskStore } from '@/stores/useTaskStore'
import { EditTaskDialog } from './EditTaskDialog'
import { cn } from '@/lib/utils'
import { Database } from '@/types/supabase'

type Task = Database['public']['Tables']['tasks']['Row']

const COLUMNS = [
    { id: 'todo', label: 'To Do', color: 'bg-zinc-500/20 text-zinc-400' },
    { id: 'in_progress', label: 'In Progress', color: 'bg-blue-500/20 text-blue-400' },
    { id: 'review', label: 'Review', color: 'bg-purple-500/20 text-purple-400' },
    { id: 'done', label: 'Done', color: 'bg-green-500/20 text-green-400' },
]

export function TaskKanban() {
    const { tasks, updateTask } = useTaskStore()
    const [editingTask, setEditingTask] = useState<Task | null>(null)

    const handleDrop = (taskId: string, targetStatus: string) => {
        updateTask(taskId, { status: targetStatus as any })
    }

    return (
        <>
            <div className="flex gap-6 h-[600px] overflow-x-auto pb-4">
                {COLUMNS.map((col) => (
                    <KanbanColumn
                        key={col.id}
                        status={col.id}
                        label={col.label}
                        color={col.color}
                        tasks={tasks.filter(t => t.status === col.id)}
                        onDrop={handleDrop}
                        onEditTask={setEditingTask}
                    />
                ))}
            </div>

            <EditTaskDialog
                isOpen={!!editingTask}
                onClose={() => setEditingTask(null)}
                task={editingTask}
            />
        </>
    )
}

function KanbanColumn({ status, label, color, tasks, onDrop, onEditTask }: any) {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: 'TASK',
        drop: (item: { id: string }) => onDrop(item.id, status),
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    }))

    return (
        <div
            ref={drop as any}
            className={cn(
                "flex-1 min-w-[300px] rounded-2xl bg-black/20 border border-white/5 flex flex-col transition-colors",
                isOver && "bg-white/5 border-white/10"
            )}
        >
            <div className="p-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", color.split(' ')[0].replace('/20', ''))} />
                    <span className="font-medium text-zinc-300">{label}</span>
                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-zinc-500">
                        {tasks.length}
                    </span>
                </div>
                <button className="text-zinc-500 hover:text-white transition-colors">
                    <Plus size={16} />
                </button>
            </div>

            <div className="p-3 flex-1 overflow-y-auto space-y-3">
                {tasks.map((task: any) => (
                    <KanbanCard key={task.id} task={task} onEdit={onEditTask} />
                ))}
            </div>
        </div>
    )
}

function KanbanCard({ task, onEdit }: any) {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'TASK',
        item: { id: task.id },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }))

    return (
        <motion.div
            ref={drag as any}
            layoutId={task.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: isDragging ? 0.5 : 1 }}
            onClick={() => onEdit(task)}
            className={cn(
                "p-4 rounded-xl bg-[#0A0A0A] border border-white/5 shadow-sm hover:border-white/10 cursor-pointer group",
                isDragging && "opacity-50"
            )}
        >
            <div className="flex items-start justify-between mb-2">
                <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-medium border uppercase tracking-wider",
                    task.priority === 'urgent' ? "bg-purple-500/10 text-purple-500 border-purple-500/20" :
                        task.priority === 'high' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                            task.priority === 'medium' ? "bg-orange-500/10 text-orange-500 border-orange-500/20" :
                                "bg-green-500/10 text-green-500 border-green-500/20"
                )}>
                    {task.priority}
                </span>
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onEdit(task)
                    }}
                    className="text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                >
                    <Edit2 size={14} />
                </button>
            </div>

            <h4 className="text-zinc-200 font-medium text-sm mb-3">{task.title}</h4>

            {task.due_date && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <span>📅 {new Date(task.due_date).toLocaleDateString()}</span>
                </div>
            )}
        </motion.div>
    )
}
