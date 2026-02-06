'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Square, Minimize2, Maximize2, Clock } from 'lucide-react'
import { useTimerStore } from '@/stores/useTimerStore'
import { formatDurationShort } from '@/lib/utils/formatDuration'
import { cn } from '@/lib/utils'

export function ActiveTimer() {
    const { activeEntry, taskTitle, duration, isPaused, pauseTimer, resumeTimer, stopTimer, tick, loadFromStorage } = useTimerStore()
    const [isMinimized, setIsMinimized] = useState(false)

    // Load timer from storage on mount
    useEffect(() => {
        loadFromStorage()
    }, [loadFromStorage])

    // Tick every second
    useEffect(() => {
        if (!activeEntry) return

        const interval = setInterval(() => {
            tick()
        }, 1000)

        return () => clearInterval(interval)
    }, [activeEntry, tick])

    if (!activeEntry) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 100, opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50"
            >
                <div className={cn(
                    "bg-gradient-to-br from-[#0F0F0F] to-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden",
                    isMinimized ? "w-16 h-16" : "w-96"
                )}>
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent pointer-events-none" />

                    {isMinimized ? (
                        // Minimized view
                        <button
                            onClick={() => setIsMinimized(false)}
                            className="relative w-full h-full flex items-center justify-center text-white hover:bg-white/5 transition-colors"
                        >
                            <div className="flex flex-col items-center gap-1">
                                <Clock size={20} className={cn(
                                    "transition-colors",
                                    isPaused ? "text-zinc-400" : "text-primary-400 animate-pulse"
                                )} />
                                <span className="text-[10px] font-mono">{formatDurationShort(duration)}</span>
                            </div>
                        </button>
                    ) : (
                        // Expanded view
                        <div className="relative p-4 space-y-3">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        isPaused ? "bg-zinc-400" : "bg-red-500 animate-pulse"
                                    )} />
                                    <span className="text-xs text-zinc-400 uppercase tracking-wider">
                                        {isPaused ? 'Paused' : 'Tracking Time'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setIsMinimized(true)}
                                    className="p-1 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors"
                                >
                                    <Minimize2 size={14} />
                                </button>
                            </div>

                            {/* Task title */}
                            <div>
                                <h3 className="text-white font-medium text-sm line-clamp-2">
                                    {taskTitle || 'Untitled Task'}
                                </h3>
                            </div>

                            {/* Timer display */}
                            <div className="flex items-center justify-center py-2">
                                <span className="text-4xl font-mono font-bold text-white tabular-nums">
                                    {formatDurationShort(duration)}
                                </span>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-2">
                                {isPaused ? (
                                    <button
                                        onClick={resumeTimer}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors"
                                    >
                                        <Play size={16} fill="currentColor" />
                                        Resume
                                    </button>
                                ) : (
                                    <button
                                        onClick={pauseTimer}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-colors"
                                    >
                                        <Pause size={16} />
                                        Pause
                                    </button>
                                )}

                                <button
                                    onClick={() => {
                                        stopTimer()
                                    }}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium transition-colors border border-red-500/20"
                                >
                                    <Square size={16} fill="currentColor" />
                                    Stop
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
