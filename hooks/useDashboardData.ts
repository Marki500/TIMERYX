'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/useUserStore'
import { useDashboardStore } from '@/stores/useDashboardStore'

interface DayActivity {
    day: string
    hours: number
    percent: number
}

interface RecentEntry {
    id: string
    title: string
    duration: number
    start_time: string
    task_title: string
}

interface ProductivityStats {
    currentStreak: number
    averageDailyHours: number
    mostProductiveDay: string
    tasksCompletedThisWeek: number
}

export function useDashboardData() {
    const { currentWorkspace } = useUserStore()
    const {
        refreshTrigger,
        weeklyData,
        recentEntries,
        productivityStats,
        isLoading,
        setWeeklyData,
        setRecentEntries,
        setProductivityStats,
        setIsLoading
    } = useDashboardStore()

    const fetchData = useCallback(async () => {
        if (!currentWorkspace) return

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        try {
            setIsLoading(true)

            // Fetch time entries for the current week (starting Monday)
            const todayDate = new Date()
            const dayOfWeek = todayDate.getDay() // 0 = Sunday, 1 = Monday...
            const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
            const startOfWeek = new Date(todayDate)
            startOfWeek.setDate(todayDate.getDate() - daysSinceMonday)
            startOfWeek.setHours(0, 0, 0, 0)

            // Fetch time entries
            const { data: entries, error: entriesError } = await (supabase
                .from('time_entries')
                .select('*')
                .eq('user_id', user.id)
                .gte('start_time', startOfWeek.toISOString())
                .order('start_time', { ascending: false }) as any)

            if (entriesError) {
                console.error('Error fetching entries:', entriesError)
            }

            if (entries && entries.length > 0) {
                // Get unique task IDs
                const taskIds = [...new Set(entries.map((e: any) => e.task_id).filter(Boolean))] as string[]

                // Fetch tasks separately
                const { data: tasks } = await (supabase
                    .from('tasks')
                    .select('id, title, status')
                    .in('id', taskIds) as any)

                // Create a map of task_id -> task
                const taskMap = new Map(tasks?.map((t: any) => [t.id, t]) || []) as Map<string, any>

                // Aggregate by day for weekly chart (Monday to Sunday)
                const dayMap = new Map<string, number>()
                const jsDayToChartDay = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
                const chartDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

                entries.forEach((entry: any) => {
                    const date = new Date(entry.start_time)
                    const dayName = jsDayToChartDay[date.getDay()]
                    // Calculate duration from start_time and end_time
                    const duration = entry.end_time
                        ? (new Date(entry.end_time).getTime() - new Date(entry.start_time).getTime()) / 1000
                        : 0
                    const hours = duration / 3600
                    dayMap.set(dayName, (dayMap.get(dayName) || 0) + hours)
                })

                const weekData: any[] = [] // Using any to match store's internal state if needed
                let maxHours = 0

                for (const dayName of chartDays) {
                    const hours = dayMap.get(dayName) || 0
                    maxHours = Math.max(maxHours, hours)
                    weekData.push({
                        day: dayName,
                        hours,
                        percent: 0 // Will calculate after we know max
                    })
                }

                // Calculate percentages
                weekData.forEach(day => {
                    day.percent = maxHours > 0 ? (day.hours / maxHours) * 100 : 0
                })

                setWeeklyData(weekData)

                // Recent entries (top 5)
                const recent = entries.slice(0, 5).map((entry: any) => {
                    const duration = entry.end_time
                        ? (new Date(entry.end_time).getTime() - new Date(entry.start_time).getTime()) / 1000
                        : 0

                    // Get task from map
                    const task = entry.task_id ? taskMap.get(entry.task_id) : null as any
                    const taskTitle = task?.title || entry.description || 'Untitled Task'

                    return {
                        id: entry.id,
                        title: taskTitle,
                        duration,
                        start_time: entry.start_time,
                        task_title: taskTitle
                    }
                })

                setRecentEntries(recent)

                // Calculate productivity stats
                // 1. Current Streak (consecutive days with logged time)
                const { data: allEntries } = await supabase
                    .from('time_entries')
                    .select('start_time')
                    .eq('user_id', user.id)
                    .order('start_time', { ascending: false })

                let streak = 0
                if (allEntries && allEntries.length > 0) {
                    const uniqueDays = new Set<string>()
                    allEntries.forEach((entry: any) => {
                        const date = new Date(entry.start_time).toDateString()
                        uniqueDays.add(date)
                    })

                    const sortedDays = Array.from(uniqueDays).sort((a, b) =>
                        new Date(b).getTime() - new Date(a).getTime()
                    )

                    let currentDate = new Date()
                    currentDate.setHours(0, 0, 0, 0)

                    for (const day of sortedDays) {
                        const entryDate = new Date(day)
                        entryDate.setHours(0, 0, 0, 0)

                        const diffDays = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))

                        if (diffDays === streak) {
                            streak++
                        } else {
                            break
                        }
                    }
                }

                // 2. Average Daily Hours (this week up to today)
                const totalHours = weekData.reduce((sum, day) => sum + day.hours, 0)
                const daysElapsedThisWeek = daysSinceMonday + 1
                const avgHours = totalHours / Math.max(1, daysElapsedThisWeek) // Avoid division by zero

                // 3. Most Productive Day
                const maxDay = weekData.reduce((max, day) =>
                    day.hours > max.hours ? day : max
                    , weekData[0] || { hours: 0 })

                const fullDayNames: Record<string, string> = {
                    'Lun': 'Lunes', 'Mar': 'Martes', 'Mié': 'Miércoles',
                    'Jue': 'Jueves', 'Vie': 'Viernes', 'Sáb': 'Sábado', 'Dom': 'Domingo'
                }
                const mostProductiveDayName = maxDay.hours > 0 ? fullDayNames[maxDay.day] : '-'

                // 4. Tasks Completed This Week
                const completedTasks = entries.filter((entry: any) => {
                    const task = entry.task_id ? taskMap.get(entry.task_id) : null;
                    return task?.status === 'done';
                }).length

                setProductivityStats({
                    currentStreak: streak,
                    averageDailyHours: avgHours,
                    mostProductiveDay: mostProductiveDayName,
                    tasksCompletedThisWeek: completedTasks
                })
            }
        } catch (error) {
            console.error('Error in fetchData:', error)
        } finally {
            setIsLoading(false)
        }
    }, [currentWorkspace, refreshTrigger, setWeeklyData, setRecentEntries, setProductivityStats, setIsLoading])

    // We removed the automatic fetch on mount to prevent infinite loops 
    // when components are unmounted/remounted by their own loading state.
    // Fetching is now triggered explicitly by the main page.

    return { weeklyData, recentEntries, productivityStats, isLoading, refresh: fetchData }
}
