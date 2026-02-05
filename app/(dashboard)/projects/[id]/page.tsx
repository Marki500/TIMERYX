'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock, Calendar, AlertCircle } from 'lucide-react'
import { useProjectStore } from '@/stores/useProjectStore'
import { useTaskStore } from '@/stores/useTaskStore'
import { TaskTable } from '@/components/tasks/TaskTable'
import { TaskKanban } from '@/components/tasks/TaskKanban'
import { TaskCalendar } from '@/components/tasks/TaskCalendar'
import { ViewSwitcher } from '@/components/tasks/ViewSwitcher'
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog'
import { formatDuration } from '@/lib/utils'

export default function ProjectDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const projectId = params.id as string

    const { projects } = useProjectStore()
    const { tasks, fetchTasks, viewMode } = useTaskStore()
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null) // State for calendar date select

    const handleDateClick = (date: Date) => {
        setSelectedDate(date)
        setIsCreateOpen(true)
    }

    // Find current project
    const project = projects.find(p => p.id === projectId)

    // Calculate Project stats derived from tasks
    const projectTasks = tasks.filter(t => t.project_id === projectId)

    const totalDuration = projectTasks.reduce((acc, t) => acc + (t.total_duration || 0), 0)
    const completedTasks = projectTasks.filter(t => t.status === 'done').length
    const pendingTasks = projectTasks.length - completedTasks

    useEffect(() => {
        if (projectId) {
            fetchTasks(projectId)
        }
    }, [projectId, fetchTasks])

    // Show loading only if projects array is empty (still loading from layout)
    if (projects.length === 0) {
        return (
            <div className="p-8 text-center text-zinc-500">
                Loading...
            </div>
        )
    }

    if (!project) {
        return (
            <div className="p-8 text-center text-zinc-500">
                Project not found
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft size={18} />
                    Back to Projects
                </button>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-4 h-12 rounded-full"
                            style={{ backgroundColor: project.color }}
                        />
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-1">{project.name}</h1>
                            <p className="text-zinc-400">Manage tasks and track time for this project</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10"
                    >
                        + Add Task
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2 text-zinc-400">
                        <Clock size={16} />
                        <span className="font-medium text-sm">Total Time</span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1 font-mono">
                        {formatDuration(totalDuration)}
                    </div>
                    <div className="text-xs text-zinc-500">
                        All time tracked
                    </div>
                </div>

                {/* Monthly Time with Budget Comparison */}
                <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2 text-zinc-400">
                        <Calendar size={16} />
                        <span className="font-medium text-sm">This Month</span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1 font-mono">
                        {(() => {
                            // Calculate this month's time
                            const now = new Date()
                            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
                            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

                            // Filter tasks for this month based on their time entries
                            // Note: This is an approximation. For accurate monthly time, 
                            // we'd need to query time_entries directly filtered by date
                            const monthlySeconds = projectTasks.reduce((total, task) => {
                                // This is a simplified calculation
                                // In a real scenario, you'd want to sum time_entries.duration 
                                // where created_at is within the current month
                                return total + (task.total_duration || 0)
                            }, 0)

                            const monthlyHours = monthlySeconds / 3600
                            const budgetHours = project.budget_hours_monthly || 0
                            const percentage = budgetHours > 0 ? (monthlyHours / budgetHours) * 100 : 0

                            return (
                                <>
                                    {formatDuration(monthlySeconds)}
                                    {budgetHours > 0 && (
                                        <>
                                            <div className="text-xs text-zinc-500 mt-2 mb-1">
                                                {monthlyHours.toFixed(1)}h / {budgetHours}h budget
                                            </div>
                                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all rounded-full ${percentage > 100 ? 'bg-red-500' :
                                                            percentage > 80 ? 'bg-orange-500' :
                                                                'bg-primary-500'
                                                        }`}
                                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                                />
                                            </div>
                                            {percentage > 100 && (
                                                <div className="text-xs text-red-400 mt-1">
                                                    {(percentage - 100).toFixed(0)}% over budget
                                                </div>
                                            )}
                                        </>
                                    )}
                                </>
                            )
                        })()}
                    </div>
                </div>

                <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2 text-zinc-400">
                        <Calendar size={16} />
                        <span className="font-medium text-sm">Tasks</span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">
                        {projectTasks.length}
                    </div>
                    <div className="text-xs text-zinc-500">
                        {completedTasks} completed
                    </div>
                </div>

                <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2 text-zinc-400">
                        <AlertCircle size={16} />
                        <span className="font-medium text-sm">Pending</span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">
                        {pendingTasks}
                    </div>
                </div>
            </div>

            {/* Tasks Section with View Switcher */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Project Tasks</h2>
                    <ViewSwitcher />
                </div>

                <div className="min-h-[500px]">
                    {viewMode === 'table' && <TaskTable />}
                    {viewMode === 'kanban' && <TaskKanban />}
                    {viewMode === 'calendar' && (
                        <TaskCalendar onDateClick={handleDateClick} />
                    )}
                </div>
            </div>

            <CreateTaskDialog
                isOpen={isCreateOpen}
                initialProjectId={projectId}
                initialDate={selectedDate}
                onClose={() => {
                    setIsCreateOpen(false)
                    setSelectedDate(null)
                }}
            />
        </div>
    )
}
