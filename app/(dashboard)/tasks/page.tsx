'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { useTaskStore } from '@/stores/useTaskStore'
import { useUserStore } from '@/stores/useUserStore'
import { TaskTable } from '@/components/tasks/TaskTable'
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog'

export default function TasksPage() {
    const { fetchTasks } = useTaskStore()
    const { currentWorkspace } = useUserStore()
    const [isCreateOpen, setIsCreateOpen] = useState(false)

    useEffect(() => {
        if (currentWorkspace) {
            fetchTasks()
        }
    }, [currentWorkspace, fetchTasks])

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Tasks</h1>
                    <p className="text-zinc-400">Manage all your tasks across projects</p>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
                >
                    <Plus size={18} />
                    New Task
                </button>
            </div>

            <TaskTable />

            <CreateTaskDialog
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
            />
        </div>
    )
}
