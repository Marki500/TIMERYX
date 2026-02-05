'use client'

import { useState } from 'react'
import { WeeklySummary } from '@/components/reports/WeeklySummary'
import { TimeLogTable, FilterState } from '@/components/reports/TimeLogTable'
import { ReportFilters } from '@/components/reports/ReportFilters'

export default function ReportsPage() {
    const [filters, setFilters] = useState<FilterState>({
        dateRange: 'last7',
        taskStatus: 'all'
    })

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">Reports</h1>
                <p className="text-zinc-400">Analyze your time usage and review logs.</p>
            </div>

            <WeeklySummary />

            <ReportFilters onFilterChange={setFilters} />

            <div className="pt-8 border-t border-white/5">
                <h2 className="text-lg font-bold text-white mb-4">Time Log</h2>
                <TimeLogTable filters={filters} />
            </div>
        </div>
    )
}
