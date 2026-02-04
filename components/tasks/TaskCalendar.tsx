'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday
} from 'date-fns'
import { ChevronLeft, ChevronRight, Clock, MoreHorizontal } from 'lucide-react'
import { useTaskStore } from '@/stores/useTaskStore'
import { cn } from '@/lib/utils'

interface TaskCalendarProps {
    onDateClick?: (date: Date) => void
}

export function TaskCalendar({ onDateClick }: TaskCalendarProps) {
    const { tasks } = useTaskStore()
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)

    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
    const resetToToday = () => setCurrentMonth(new Date())

    // Generate calendar grid
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })
    const weeks = []

    // Group days into weeks for easy rendering
    for (let i = 0; i < calendarDays.length; i += 7) {
        weeks.push(calendarDays.slice(i, i + 7))
    }

    // Filter tasks for specific days
    const getTasksForDay = (day: Date) => {
        return tasks.filter(task => {
            if (!task.due_date) return false
            return isSameDay(new Date(task.due_date), day)
        })
    }

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-white tracking-tight capitalize">
                        {format(currentMonth, 'MMMM yyyy')}
                    </h2>
                    <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/5">
                        <button onClick={prevMonth} className="p-1 hover:bg-white/10 rounded-md text-zinc-400 hover:text-white transition-colors">
                            <ChevronLeft size={16} />
                        </button>
                        <button onClick={resetToToday} className="px-3 py-1 text-xs font-medium text-zinc-400 hover:text-white transition-colors">
                            Today
                        </button>
                        <button onClick={nextMonth} className="p-1 hover:bg-white/10 rounded-md text-zinc-400 hover:text-white transition-colors">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 flex flex-col border border-white/10 rounded-2xl overflow-hidden bg-[#0A0A0A]/50 backdrop-blur-sm shadow-xl">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 border-b border-white/10 bg-white/[0.02]">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <div key={day} className="py-3 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="flex-1 grid grid-rows-5 lg:grid-rows-auto">
                    {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="grid grid-cols-7 min-h-[120px]">
                            {week.map((day, dayIndex) => {
                                const dayTasks = getTasksForDay(day)
                                const isCurrentMonth = isSameMonth(day, monthStart)
                                const isTodayDate = isToday(day)

                                return (
                                    <div
                                        key={day.toString()}
                                        onClick={() => onDateClick?.(day)}
                                        className={cn(
                                            "relative p-2 border-r border-b border-white/[0.05] transition-colors group cursor-pointer",
                                            !isCurrentMonth && "bg-white/[0.01] opacity-50 hover:opacity-100",
                                            isCurrentMonth && "hover:bg-white/[0.04]"
                                        )}
                                    >
                                        {/* Date Number */}
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={cn(
                                                "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                                                isTodayDate
                                                    ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30"
                                                    : "text-zinc-400 group-hover:text-white"
                                            )}>
                                                {format(day, 'd')}
                                            </span>
                                        </div>

                                        {/* Tasks List */}
                                        <div className="flex flex-col gap-1.5">
                                            {dayTasks.slice(0, 3).map(task => (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    key={task.id}
                                                    className={cn(
                                                        "px-2 py-1 rounded-md text-xs font-medium border truncate cursor-pointer hover:scale-[1.02] transition-transform",
                                                        task.priority === 'high'
                                                            ? "bg-red-500/10 text-red-300 border-red-500/20"
                                                            : task.priority === 'medium'
                                                                ? "bg-orange-500/10 text-orange-300 border-orange-500/20"
                                                                : "bg-blue-500/10 text-blue-300 border-blue-500/20"
                                                    )}
                                                >
                                                    {task.title}
                                                </motion.div>
                                            ))}
                                            {dayTasks.length > 3 && (
                                                <div className="px-2 py-1 text-[10px] text-zinc-500 font-medium">
                                                    + {dayTasks.length - 3} more
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div >
    )
}
