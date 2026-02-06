'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, StopCircle } from 'lucide-react'
import { useTimerStore } from '@/stores/useTimerStore'
import { cn } from '@/lib/utils'

export function TimerBar() {
    const { activeEntry, duration, fetchActiveTimer, stopTimer, tick, isLoading, taskTitle } = useTimerStore()

    // Initial fetch and interval
    useEffect(() => {
        fetchActiveTimer()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    if (!activeEntry) {
        return (
            <div className="absolute left-1/2 -translate-x-1/2 top-6">
                <motion.button
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="hidden md:flex bg-white/10 backdrop-blur-3xl px-6 py-2.5 rounded-full border border-white/20 shadow-lg shadow-black/20 items-center gap-3 hover:bg-white/15 transition-all group ring-1 ring-white/10"
                >
                    <div className="w-2 h-2 rounded-full bg-zinc-400 group-hover:bg-primary-400 transition-colors shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                    <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">Start a timer from a task</span>
                </motion.button>
            </div>
        )
    }

    return (
        <div className="absolute left-1/2 -translate-x-1/2 top-6 z-50">
            <motion.div
                layoutId="timer-pill"
                className="hidden md:flex bg-white/10 backdrop-blur-3xl px-6 py-2.5 rounded-full border border-white/20 shadow-2xl shadow-black/40 items-center gap-4 cursor-pointer hover:bg-white/15 transition-all ring-1 ring-white/10"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />

                    <div className="flex flex-col">
                        <span className="text-xs text-zinc-400 font-medium">Tracking</span>
                        <span className="text-sm font-bold text-white leading-none overflow-hidden max-w-[150px] truncate">
                            {/* We might need to join with Task title here if we had relationship, for now using description or Placeholder */}
                            {taskTitle || activeEntry.description || 'Untitled Task'}
                        </span>
                    </div>
                </div>

                <div className="h-4 w-px bg-white/10" />

                <span className="text-lg font-mono font-medium text-white tabular-nums tracking-widest text-shadow-glow">
                    {formatTime(duration)}
                </span>

                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        stopTimer()
                    }}
                    disabled={isLoading}
                    className="ml-2 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-colors"
                >
                    <StopCircle size={16} fill="currentColor" className="opacity-80" />
                </button>
            </motion.div>
        </div>
    )
}
