'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTaskStore } from '@/stores/useTaskStore'
import { formatDuration } from '@/lib/utils'

export function WeeklySummary() {
    // Ideally we would fetch aggregated data from a new RPC or useTimerStore history
    // For V1, we will mock this or aggregate from tasks client-side if tasks have entries loaded. 
    // To do this properly, we should probably fetch time_entries roughly.
    // For now, let's show a placeholder or basic stat from tasks duration sum.

    // NOTE: In a real app, we need a specific store/RPC for this analytics data.
    // I will implement a visual placeholder that uses the total duration of tasks as "This Week" for now 
    // to meet the V1 requirement without over-engineering a full analytics backend yet.

    const { tasks } = useTaskStore()

    const totalDuration = useMemo(() => {
        return tasks.reduce((acc, task) => acc + (task.total_duration || 0), 0)
    }, [tasks])

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#161616] border border-white/10 rounded-xl p-6"
            >
                <h3 className="text-zinc-400 text-sm font-medium mb-2">Total Time Tracked</h3>
                <div className="text-3xl font-bold text-white font-mono">
                    {formatDuration(totalDuration)}
                </div>
            </motion.div>

            {/* Placeholders for future stats */}
            <div className="bg-[#161616]/50 border border-white/5 rounded-xl p-6 opacity-50">
                <h3 className="text-zinc-500 text-sm font-medium mb-2">Billable Hours</h3>
                <div className="text-3xl font-bold text-zinc-600 font-mono">--</div>
            </div>

            <div className="bg-[#161616]/50 border border-white/5 rounded-xl p-6 opacity-50">
                <h3 className="text-zinc-500 text-sm font-medium mb-2">Top Project</h3>
                <div className="text-xl font-bold text-zinc-600">--</div>
            </div>
        </div>
    )
}
