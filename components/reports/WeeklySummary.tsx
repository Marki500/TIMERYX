'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { formatDuration } from '@/lib/utils'

export function WeeklySummary() {
    const [monthlySeconds, setMonthlySeconds] = useState(0)

    useEffect(() => {
        const supabase = createClient()

        async function fetchMonthlyTotal() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const startOfMonth = new Date()
            startOfMonth.setDate(1)
            startOfMonth.setHours(0, 0, 0, 0)

            const { data } = await (supabase
                .from('time_entries')
                .select('start_time, end_time')
                .eq('user_id', user.id)
                .gte('start_time', startOfMonth.toISOString())
                .not('end_time', 'is', null) as any)

            if (data) {
                const total = data.reduce((acc: number, entry: any) => {
                    const dur = (new Date(entry.end_time).getTime() - new Date(entry.start_time).getTime()) / 1000
                    return acc + Math.max(0, dur)
                }, 0)
                setMonthlySeconds(total)
            }
        }

        fetchMonthlyTotal()
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
