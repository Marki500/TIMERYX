'use client'

import { motion } from 'framer-motion'
import { FileText, MessageSquare, Code, CheckSquare, Layers, Clock } from 'lucide-react'
import { useDashboardData } from '@/hooks/useDashboardData'
import { formatDistanceToNow } from 'date-fns'

export function RecentActivity() {
    const { recentEntries, isLoading } = useDashboardData()

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center p-6 rounded-3xl bg-black/20 border border-white/5 backdrop-blur-md">
                <div className="text-zinc-500">Loading...</div>
            </div>
        )
    }

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        if (hours > 0) {
            return `${hours}h ${minutes}m`
        }
        return `${minutes}m`
    }

    return (
        <div className="h-full flex flex-col p-6 rounded-3xl bg-black/20 border border-white/5 backdrop-blur-md relative overflow-hidden">
            <h3 className="text-xl font-bold text-white mb-6 tracking-tight relative z-10">Recent Activity</h3>

            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {recentEntries.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                        No recent activity
                    </div>
                ) : (
                    recentEntries.map((entry, index) => (
                        <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-colors group cursor-pointer"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-primary-500/10 text-primary-400">
                                    <Clock size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-semibold text-zinc-200 truncate group-hover:text-white transition-colors">
                                            {entry.task_title}
                                        </h4>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-zinc-500">
                                        <span className="font-mono font-medium text-zinc-400">
                                            {formatDuration(entry.duration)}
                                        </span>
                                        <span>
                                            {formatDistanceToNow(new Date(entry.start_time), { addSuffix: true })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    )
}
