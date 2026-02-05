'use client'

import { motion } from 'framer-motion'
import { formatDuration } from '@/lib/utils'
import { useDashboardData } from '@/hooks/useDashboardData'

export function WeeklyActivityChart() {
    const { weeklyData, isLoading } = useDashboardData()

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center p-6 rounded-3xl bg-black/20 border border-white/5 backdrop-blur-md">
                <div className="text-zinc-500">Loading...</div>
            </div>
        )
    }

    const totalHours = weeklyData.reduce((sum, day) => sum + day.hours, 0)
    const totalMinutes = Math.round((totalHours % 1) * 60)
    const wholeHours = Math.floor(totalHours)

    return (
        <div className="h-full flex flex-col p-6 rounded-3xl bg-black/20 border border-white/5 backdrop-blur-md">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-lg font-bold text-white">Weekly Activity</h3>
                    <p className="text-sm text-zinc-400">Total time spent this week</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-white font-mono">
                        {wholeHours}h {totalMinutes}m
                    </div>
                    {/* <div className="text-xs font-medium text-emerald-400">+12% vs last week</div> */}
                </div>
            </div>

            <div className="flex items-end justify-between gap-4 h-48 w-full">
                {weeklyData.map((item, index) => (
                    <div key={item.day} className="flex flex-col items-center gap-3 flex-1 h-full justify-end group">
                        <div className="relative w-full h-full flex items-end justify-center">
                            {/* Tooltip */}
                            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black text-xs font-bold py-1 px-2 rounded-lg whitespace-nowrap z-10 pointer-events-none mb-2">
                                {item.hours.toFixed(1)}h
                            </div>

                            {/* Bar */}
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${item.percent}%` }}
                                transition={{ duration: 1, delay: index * 0.1, type: 'spring' }}
                                className={`w-full max-w-[40px] rounded-t-lg bg-gradient-to-t ${item.hours > 0
                                    ? 'from-primary-600/20 to-primary-500/80 hover:to-primary-400'
                                    : 'from-white/5 to-white/5'
                                    } transition-colors relative overflow-hidden`}
                            >
                                {/* Shine effect */}
                                <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </motion.div>
                        </div>
                        <span className="text-xs font-medium text-zinc-500 group-hover:text-white transition-colors">
                            {item.day}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
