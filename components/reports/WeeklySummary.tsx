'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { formatDuration } from '@/lib/utils'

interface TopProject {
    name: string
    color: string
    seconds: number
}

export function WeeklySummary() {
    const [monthlySeconds, setMonthlySeconds] = useState(0)
    const [topProject, setTopProject] = useState<TopProject | null>(null)

    useEffect(() => {
        const supabase = createClient()

        async function fetchMonthlyStats() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const startOfMonth = new Date()
            startOfMonth.setDate(1)
            startOfMonth.setHours(0, 0, 0, 0)

            const { data } = await (supabase
                .from('time_entries')
                .select('start_time, end_time, task:tasks(project:projects(name, color))')
                .eq('user_id', user.id)
                .gte('start_time', startOfMonth.toISOString())
                .not('end_time', 'is', null) as any)

            if (data) {
                let total = 0
                const projectMap: Record<string, TopProject> = {}

                data.forEach((entry: any) => {
                    const dur = Math.max(0, (new Date(entry.end_time).getTime() - new Date(entry.start_time).getTime()) / 1000)
                    total += dur

                    const project = entry.task?.project
                    if (project?.name) {
                        if (!projectMap[project.name]) {
                            projectMap[project.name] = { name: project.name, color: project.color || '#6366f1', seconds: 0 }
                        }
                        projectMap[project.name].seconds += dur
                    }
                })

                setMonthlySeconds(total)

                const sorted = Object.values(projectMap).sort((a, b) => b.seconds - a.seconds)
                setTopProject(sorted[0] || null)
            }
        }

        fetchMonthlyStats()
    }, [])

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#161616] border border-white/10 rounded-xl p-6"
            >
                <h3 className="text-zinc-400 text-sm font-medium mb-2">Total Time Tracked</h3>
                <div className="text-3xl font-bold text-white font-mono">
                    {formatDuration(monthlySeconds)}
                </div>
                <p className="text-xs text-zinc-600 mt-1">This month</p>
            </motion.div>

            {/* Placeholder */}
            <div className="bg-[#161616]/50 border border-white/5 rounded-xl p-6 opacity-50">
                <h3 className="text-zinc-500 text-sm font-medium mb-2">Billable Hours</h3>
                <div className="text-3xl font-bold text-zinc-600 font-mono">--</div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[#161616] border border-white/10 rounded-xl p-6"
            >
                <h3 className="text-zinc-400 text-sm font-medium mb-2">Top Project</h3>
                {topProject ? (
                    <>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: topProject.color }} />
                            <div className="text-xl font-bold text-white truncate">{topProject.name}</div>
                        </div>
                        <p className="text-xs text-zinc-600 mt-1">{formatDuration(topProject.seconds)} this month</p>
                    </>
                ) : (
                    <div className="text-xl font-bold text-zinc-600">--</div>
                )}
            </motion.div>
        </div>
    )
}
