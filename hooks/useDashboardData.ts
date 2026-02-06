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
    const { refreshTrigger } = useDashboardStore()
    const [weeklyData, setWeeklyData] = useState<DayActivity[]>([])
    const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([])
    const [productivityStats, setProductivityStats] = useState<ProductivityStats>({
        currentStreak: 0,
        averageDailyHours: 0,
        mostProductiveDay: '-',
        tasksCompletedThisWeek: 0
    })
    const [isLoading, setIsLoading] = useState(true)

    const fetchData = useCallback(async () => {
        if (!currentWorkspace) return

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        setIsLoading(true)

        // Fetch time entries from the last 7 days
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)


        // Fetch time entries
        const { data: entries, error: entriesError } = await (supabase
            .from('time_entries')
            .select('*')
            .eq('user_id', user.id)
            .gte('start_time', sevenDaysAgo.toISOString())
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
            const taskMap = new Map(tasks?.map((t: any) => [t.id, t]) || [])

            // Aggregate by day for weekly chart
            const dayMap = new Map<string, number>()
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

            entries.forEach((entry: any) => {
                const date = new Date(entry.start_time)
                const dayName = days[date.getDay()]
                // Calculate duration from start_time and end_time
                const duration = entry.end_time
                    ? (new Date(entry.end_time).getTime() - new Date(entry.start_time).getTime()) / 1000
                    : 0
                const hours = duration / 3600
                dayMap.set(dayName, (dayMap.get(dayName) || 0) + hours)
            })

            // Create array for last 7 days
            const today = new Date().getDay()
            const weekData: DayActivity[] = []
            let maxHours = 0

            for (let i = 0; i < 7; i++) {
                const dayIndex = (today - 6 + i + 7) % 7
                const dayName = days[dayIndex]
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

            // 2. Average Daily Hours (last 7 days)
            const totalHours = weekData.reduce((sum, day) => sum + day.hours, 0)
            const avgHours = totalHours / 7

            // 3. Most Productive Day
            const maxDay = weekData.reduce((max, day) =>
                day.hours > max.hours ? day : max
                , weekData[0])
            const mostProductiveDayName = dayNames[days.indexOf(maxDay.day)]

            // 4. Tasks Completed This Week
            const completedTasks = entries.filter((entry: any) => {
                const taskData = Array.isArray(entry.tasks) ? entry.tasks[0] : entry.tasks
                return taskData?.status === 'done'
            }).length

            setProductivityStats({
                currentStreak: streak,
                averageDailyHours: avgHours,
                mostProductiveDay: mostProductiveDayName,
                tasksCompletedThisWeek: completedTasks
            })
        }

        setIsLoading(false)
    }, [currentWorkspace, refreshTrigger])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    return { weeklyData, recentEntries, productivityStats, isLoading, refresh: fetchData }
}
