'use client'

import { WeeklyActivityChart } from './WeeklyActivityChart'
import { RecentActivity } from './RecentActivity'
import { ActivityChartSkeleton, RecentActivitySkeleton } from './DashboardSkeletons'
import { useDashboardData } from '@/hooks/useDashboardData'

export function WeeklyActivityChartWrapper() {
    const { isLoading } = useDashboardData()
    if (isLoading) return <ActivityChartSkeleton />
    return <WeeklyActivityChart />
}

export function RecentActivityWrapper() {
    const { isLoading } = useDashboardData()
    if (isLoading) return <RecentActivitySkeleton />
    return <RecentActivity />
}
