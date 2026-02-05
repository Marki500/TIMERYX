'use client'

import { ActiveTimer } from '@/components/timer/ActiveTimer'
import { TimeLogTable } from '@/components/reports/TimeLogTable'

export default function TimeTrackingPage() {
    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">Time Tracking</h1>
                <p className="text-zinc-400">Manage your active timer and recent entries.</p>
            </div>

            {/* Note: ActiveTimer is already global, but maybe we show a big view here or weekly stats */}
            <div className="bg-[#161616] p-8 rounded-xl border border-white/10 flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary-500 animate-pulse" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Focus Mode</h2>
                <p className="text-zinc-400 text-center max-w-md">
                    Use the global timer in the bottom right to track tasks.
                    This page will act as a "Focus Mode" dashboard in the future.
                </p>
            </div>

            <div>
                <h2 className="text-lg font-bold text-white mb-4">Recent Activity</h2>
                <TimeLogTable />
            </div>
        </div>
    )
}
