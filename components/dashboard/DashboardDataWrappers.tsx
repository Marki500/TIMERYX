'use client'

import { WeeklyActivityChart } from './WeeklyActivityChart'
import { RecentActivity } from './RecentActivity'
import { useDashboardData } from '@/hooks/useDashboardData'

export function WeeklyActivityChartWrapper() {
    const { weeklyData, isLoading } = useDashboardData()
    // By throwing the promise, Suspense catches it and shows the fallback
    if (isLoading) {
        throw new Promise(resolve => setTimeout(resolve, 100)) // Artificial throw to trigger suspense if data is loading asynchronously via hook
    }
    return <WeeklyActivityChart />
}

export function RecentActivityWrapper() {
    const { recentEntries, isLoading } = useDashboardData()
    if (isLoading) {
        throw new Promise(resolve => setTimeout(resolve, 100))
    }
    return <RecentActivity />
}
