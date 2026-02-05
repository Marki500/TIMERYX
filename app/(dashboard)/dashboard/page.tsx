'use client'

import { useState, useEffect } from 'react'
import { useTaskStore } from '@/stores/useTaskStore'
import { useUserStore } from '@/stores/useUserStore'
import { createClient } from '@/lib/supabase/client'
import { TaskTable } from '@/components/tasks/TaskTable'
import { TaskKanban } from '@/components/tasks/TaskKanban'
import { TaskCalendar } from '@/components/tasks/TaskCalendar'
import { ViewSwitcher } from '@/components/tasks/ViewSwitcher'
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog'

import { useProjectStore } from '@/stores/useProjectStore'
import { formatDuration } from '@/lib/utils'

import { WeeklyActivityChart } from '@/components/dashboard/WeeklyActivityChart'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { useDashboardData } from '@/hooks/useDashboardData'

export default function DashboardPage() {
    const { tasks, fetchTasks, createTask, viewMode } = useTaskStore()
    const { currentWorkspace, profile } = useUserStore()
    const { projects, fetchProjects } = useProjectStore()
    const { productivityStats } = useDashboardData()
    const supabase = createClient()

    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [greeting, setGreeting] = useState('Buenos días')

    useEffect(() => {
        if (currentWorkspace) {
            fetchTasks()
            fetchProjects(currentWorkspace.id)
        }
    }, [currentWorkspace])

    useEffect(() => {
        const hour = new Date().getHours()
        if (hour < 12) setGreeting('Buenos días')
        else if (hour < 20) setGreeting('Buenas tardes')
        else setGreeting('Buenas noches')
    }, [])

    // Ensure we don't get stuck in Kanban view since it's disabled here
    useEffect(() => {
        if (viewMode === 'kanban') {
            useTaskStore.getState().setViewMode('table')
        }
    }, [viewMode])

    // Calculate Stats
    const totalDuration = tasks.reduce((acc, t) => acc + (t.total_duration || 0), 0)
    const activeProjects = projects.length // Simple count for now
    const pendingTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled').length
    const highPriorityTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'done').length

    const handleDateClick = (date: Date) => {
        setSelectedDate(date)
        setIsTaskModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsTaskModalOpen(false)
        setSelectedDate(null)
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Welcome Section with Date */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
                <div>
                    <p className="text-zinc-500 font-medium mb-1">
                        {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                        {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-400">
                            {(profile as any)?.display_name || profile?.email?.split('@')[0] || 'User'}
                        </span>
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsTaskModalOpen(true)}
                        className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-all hover:scale-105 shadow-xl shadow-white/5 active:scale-95"
                    >
                        + Nueva Tarea
                    </button>
                </div>
            </div>

            <CreateTaskDialog
                isOpen={isTaskModalOpen}
                onClose={handleCloseModal}
                initialDate={selectedDate}
            />

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Current Streak */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 backdrop-blur-sm relative overflow-hidden group">
                    {/* Glow effect */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-75" />

                    <h3 className="text-zinc-400 font-medium mb-1 relative z-10">Racha Actual</h3>
                    <div className="text-4xl font-bold text-white mb-2 font-mono tracking-tight relative z-10">
                        {productivityStats.currentStreak} 🔥
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-xs font-bold text-amber-300 border border-amber-500/20 relative z-10">
                        <span>{productivityStats.currentStreak === 1 ? 'día' : 'días'} consecutivos</span>
                    </div>
                </div>

                {/* Average Daily Hours */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-indigo-500/20 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-75" />

                    <h3 className="text-zinc-400 font-medium mb-1 relative z-10">Promedio Diario</h3>
                    <div className="text-4xl font-bold text-white mb-2 font-mono tracking-tight relative z-10">
                        {productivityStats.averageDailyHours.toFixed(1)}h
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 text-xs font-bold text-indigo-300 border border-indigo-500/20 relative z-10">
                        <span>últimos 7 días</span>
                    </div>
                </div>

                {/* Most Productive Day */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-75" />

                    <h3 className="text-zinc-400 font-medium mb-1 relative z-10">Día Más Productivo</h3>
                    <div className="text-2xl font-bold text-white mb-2 relative z-10">{productivityStats.mostProductiveDay}</div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-300 border border-emerald-500/20 relative z-10">
                        <span>esta semana</span>
                    </div>
                </div>

                {/* Tasks Completed This Week */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-75" />

                    <h3 className="text-zinc-400 font-medium mb-1 relative z-10">Tareas Completadas</h3>
                    <div className="text-4xl font-bold text-white mb-2 relative z-10">{productivityStats.tasksCompletedThisWeek}</div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 text-xs font-bold text-purple-300 border border-purple-500/20 relative z-10">
                        <span>esta semana</span>
                    </div>
                </div>
            </div>

            {/* Activity Chart & Tasks Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-[350px] lg:h-[450px]">
                    <WeeklyActivityChart />
                </div>
                <div className="h-[350px] lg:h-[450px]">
                    <RecentActivity />
                </div>
            </div>

            {/* Task Management Section - Full Width */}
            <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Project Tasks</h2>
                    <ViewSwitcher excludedViews={['kanban']} />
                </div>

                <div className="min-h-[400px]">
                    {viewMode === 'table' && <TaskTable />}
                    {viewMode === 'calendar' && (
                        <TaskCalendar onDateClick={handleDateClick} />
                    )}
                </div>
            </div>

            {/* If we remove the grid above, we can just stack them with better spacing */}
            <div className="space-y-6">
                {/* Re-layouting to keep it simple as per V1 */}
            </div>
        </div>
    )
}
