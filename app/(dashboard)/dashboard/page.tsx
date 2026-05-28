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
import { WeeklyActivityChartWrapper, RecentActivityWrapper } from '@/components/dashboard/DashboardDataWrappers'
import { ActivityChartSkeleton, RecentActivitySkeleton, DashboardStatsSkeleton } from '@/components/dashboard/DashboardSkeletons'
import { useDashboardData } from '@/hooks/useDashboardData'
import { Suspense } from 'react'

import { useTranslation } from '@/stores/useLocaleStore'

export default function DashboardPage() {
    const { t, locale } = useTranslation()
    const { tasks, fetchTasks, createTask, viewMode, openCreateModal } = useTaskStore()
    const { currentWorkspace, profile } = useUserStore()
    const { projects, fetchProjects } = useProjectStore()
    const { productivityStats, refresh } = useDashboardData()
    const supabase = createClient()

    const [greetingKey, setGreetingKey] = useState('dashboard.greeting_morning')

    useEffect(() => {
        if (currentWorkspace) {
            fetchTasks()
            fetchProjects(currentWorkspace.id)
            refresh() // Fetch dashboard stats/data
        }
    }, [currentWorkspace, refresh, fetchTasks, fetchProjects])

    useEffect(() => {
        const hour = new Date().getHours()
        if (hour < 12) setGreetingKey('dashboard.greeting_morning')
        else if (hour < 20) setGreetingKey('dashboard.greeting_afternoon')
        else setGreetingKey('dashboard.greeting_evening')
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
        openCreateModal(date)
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Welcome Section with Date */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
                <div>
                    <p className="text-zinc-500 font-medium mb-1">
                        {new Date().toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                        {t(greetingKey)}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-400">
                            {(profile as any)?.display_name || profile?.email?.split('@')[0] || 'User'}
                        </span>
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => openCreateModal()}
                        className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-all hover:scale-105 shadow-xl shadow-white/5 active:scale-95"
                    >
                        + {t('common.new_task')}
                    </button>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Current Streak */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 backdrop-blur-sm relative overflow-hidden group">
                    {/* Glow effect */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-75" />

                    <h3 className="text-zinc-400 font-medium mb-1 relative z-10">{t('dashboard.current_streak')}</h3>
                    <div className="text-4xl font-bold text-white mb-2 font-mono tracking-tight relative z-10">
                        {productivityStats.currentStreak} 🔥
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-xs font-bold text-amber-300 border border-amber-500/20 relative z-10">
                        <span>{productivityStats.currentStreak === 1 ? t('dashboard.consecutive_days_one') : t('dashboard.consecutive_days_other')}</span>
                    </div>
                </div>

                {/* Average Daily Hours */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-indigo-500/20 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-75" />

                    <h3 className="text-zinc-400 font-medium mb-1 relative z-10">{t('dashboard.daily_average')}</h3>
                    <div className="text-4xl font-bold text-white mb-2 font-mono tracking-tight relative z-10">
                        {productivityStats.averageDailyHours.toFixed(1)}h
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 text-xs font-bold text-indigo-300 border border-indigo-500/20 relative z-10">
                        <span>{t('dashboard.last_7_days')}</span>
                    </div>
                </div>

                {/* Most Productive Day */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-75" />

                    <h3 className="text-zinc-400 font-medium mb-1 relative z-10">{t('dashboard.most_productive_day')}</h3>
                    <div className="text-2xl font-bold text-white mb-2 relative z-10">{productivityStats.mostProductiveDay}</div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-300 border border-emerald-500/20 relative z-10">
                        <span>{t('dashboard.this_week')}</span>
                    </div>
                </div>

                {/* Tasks Completed This Week */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-75" />

                    <h3 className="text-zinc-400 font-medium mb-1 relative z-10">{t('dashboard.completed_tasks')}</h3>
                    <div className="text-4xl font-bold text-white mb-2 relative z-10">{productivityStats.tasksCompletedThisWeek}</div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 text-xs font-bold text-purple-300 border border-purple-500/20 relative z-10">
                        <span>{t('dashboard.this_week')}</span>
                    </div>
                </div>
            </div>

            {/* Activity Chart & Tasks Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-[350px] lg:h-[450px]">
                    <Suspense fallback={<ActivityChartSkeleton />}>
                        <WeeklyActivityChartWrapper />
                    </Suspense>
                </div>
                <div className="h-[350px] lg:h-[450px]">
                    <Suspense fallback={<RecentActivitySkeleton />}>
                        <RecentActivityWrapper />
                    </Suspense>
                </div>
            </div>

            {/* Task Management Section - Full Width */}
            <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">{t('dashboard.project_tasks')}</h2>
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
