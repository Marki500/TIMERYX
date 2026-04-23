'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, X, Edit2, Plus, CheckSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isToday,
    addMonths,
    subMonths,
    startOfWeek,
    endOfWeek,
    isSameDay
} from 'date-fns'
import { formatDurationShort } from '@/lib/utils/formatDuration'
import { EditTimeEntryDialog, EntryToEdit } from '@/components/reports/EditTimeEntryDialog'
import { ManualTimeDialog } from '@/components/timer/ManualTimeDialog'
import { useTaskStore } from '@/stores/useTaskStore'

interface DayEntry {
    id: string
    task_id: string
    start_time: string
    end_time: string
    duration: number
    task_title: string
    project_name: string
    project_color: string
}

export function MonthlyCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [dailyHours, setDailyHours] = useState<Record<string, number>>({})
    const [isLoading, setIsLoading] = useState(false)
    const [selectedDay, setSelectedDay] = useState<Date | null>(null)
    const [dayEntries, setDayEntries] = useState<DayEntry[]>([])
    const [isDayLoading, setIsDayLoading] = useState(false)
    const [editEntry, setEditEntry] = useState<EntryToEdit | null>(null)
    const [addDate, setAddDate] = useState<string | null>(null)
    const [addMenuOpen, setAddMenuOpen] = useState(false)
    const [pendingLogDate, setPendingLogDate] = useState<string | null>(null)
    const addMenuRef = useRef<HTMLDivElement>(null)
    const { openCreateModal, tasks } = useTaskStore()
    const prevTasksLengthRef = useRef(tasks.length)

    // When a task is created while waiting to log time, auto-open ManualTimeDialog with it
    useEffect(() => {
        if (pendingLogDate && tasks.length > prevTasksLengthRef.current) {
            setAddDate(pendingLogDate)
            setPendingLogDate(null)
        }
        prevTasksLengthRef.current = tasks.length
    }, [tasks.length, pendingLogDate])

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
                setAddMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        async function fetchMonthData() {
            setIsLoading(true)
            const supabase = createClient()

            const monthStart = startOfMonth(currentDate)
            const monthEnd = endOfMonth(currentDate)

            const { data, error } = await supabase
                .from('time_entries')
                .select('start_time, end_time')
                .gte('start_time', monthStart.toISOString())
                .lte('start_time', monthEnd.toISOString())

            if (!error && data) {
                const hoursMap: Record<string, number> = {}
                data.forEach((entry: any) => {
                    if (!entry.end_time) return
                    const startDate = new Date(entry.start_time)
                    const dayKey = format(startDate, 'yyyy-MM-dd')
                    const durationInHours = Math.max(0, (new Date(entry.end_time).getTime() - startDate.getTime()) / 3600000)
                    hoursMap[dayKey] = (hoursMap[dayKey] || 0) + durationInHours
                })
                setDailyHours(hoursMap)
            }
            setIsLoading(false)
        }
        fetchMonthData()
    }, [currentDate])

    async function handleDayClick(day: Date) {
        if (selectedDay && isSameDay(day, selectedDay)) {
            setSelectedDay(null)
            setDayEntries([])
            return
        }

        setSelectedDay(day)
        setIsDayLoading(true)
        setDayEntries([])

        const supabase = createClient()
        const dayStart = new Date(day)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(day)
        dayEnd.setHours(23, 59, 59, 999)

        const { data } = await (supabase
            .from('time_entries')
            .select(`
                id,
                start_time,
                end_time,
                task:tasks(
                    title,
                    project:projects(name, color)
                )
            `)
            .gte('start_time', dayStart.toISOString())
            .lte('start_time', dayEnd.toISOString())
            .not('end_time', 'is', null)
            .order('start_time', { ascending: true }) as any)

        if (data) {
            const entries: DayEntry[] = data.map((e: any) => ({
                id: e.id,
                task_id: e.task_id,
                start_time: e.start_time,
                end_time: e.end_time,
                duration: (new Date(e.end_time).getTime() - new Date(e.start_time).getTime()) / 1000,
                task_title: e.task?.title || 'Untitled Task',
                project_name: e.task?.project?.name || 'No project',
                project_color: e.task?.project?.color || '#6366f1',
            }))
            setDayEntries(entries)
        }

        setIsDayLoading(false)
    }

    const nextMonth = () => { setCurrentDate(addMonths(currentDate, 1)); setSelectedDay(null) }
    const prevMonth = () => { setCurrentDate(subMonths(currentDate, 1)); setSelectedDay(null) }

    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start, end })

    const totalDaySeconds = dayEntries.reduce((acc, e) => acc + e.duration, 0)

    return (
        <div className="bg-[#161616] border border-white/5 rounded-xl p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-500/10 text-primary-400 rounded-lg">
                        <CalendarIcon size={20} />
                    </div>
                    <h2 className="text-lg font-medium text-white">
                        {format(currentDate, 'MMMM yyyy')}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={() => { setCurrentDate(new Date()); setSelectedDay(null) }} className="px-3 py-1.5 text-sm font-medium hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors">
                        Today
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-px bg-white/5 rounded-lg overflow-hidden border border-white/5">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="bg-[#161616] py-3 text-center text-xs font-medium text-zinc-500 uppercase">
                        {day}
                    </div>
                ))}

                {days.map((day, dayIdx) => {
                    const dayKey = format(day, 'yyyy-MM-dd')
                    const hours = dailyHours[dayKey] || 0
                    const isCurrentMonth = isSameMonth(day, currentDate)
                    const isSelected = selectedDay && isSameDay(day, selectedDay)
                    const hasEntries = hours > 0

                    let bgClass = 'bg-[#161616]'
                    if (isSelected) bgClass = 'bg-primary-500/25'
                    else if (hours > 6) bgClass = 'bg-primary-500/30'
                    else if (hours > 3) bgClass = 'bg-primary-500/20'
                    else if (hours > 0) bgClass = 'bg-primary-500/10'

                    return (
                        <div
                            key={day.toString()}
                            onClick={() => isCurrentMonth && handleDayClick(day)}
                            className={`min-h-[100px] p-2 transition-colors ${bgClass} ${!isCurrentMonth ? 'opacity-30' : 'cursor-pointer hover:brightness-125'
                                } border-t border-r border-white/5 ${dayIdx % 7 === 6 ? 'border-r-0' : ''} ${isSelected ? 'ring-1 ring-inset ring-primary-500/50' : ''}`}
                        >
                            <div className="flex flex-col h-full">
                                <div className={`text-sm font-medium mb-1 ${isToday(day)
                                    ? 'w-7 h-7 bg-primary-500 text-white rounded-full flex items-center justify-center'
                                    : 'text-zinc-400 px-1 pt-1'
                                    }`}>
                                    {format(day, 'd')}
                                </div>
                                {hours > 0 && (
                                    <div className="mt-auto px-1">
                                        <div className="text-xs text-zinc-300 font-mono mt-0.5">
                                            {hours.toFixed(1)}h
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-4 text-xs text-zinc-500">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-primary-500/10" /><span>&lt; 3h</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-primary-500/20" /><span>3h – 6h</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-primary-500/30" /><span>&gt; 6h</span></div>
            </div>

            {/* Day detail panel */}
            <AnimatePresence>
                {selectedDay && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="border border-white/10 rounded-xl overflow-hidden"
                    >
                        {/* Panel header */}
                        <div className="flex items-center justify-between px-5 py-4 bg-white/[0.03] border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <Clock size={16} className="text-primary-400" />
                                <span className="font-semibold text-white">
                                    {format(selectedDay, 'EEEE, MMMM d')}
                                </span>
                                {!isDayLoading && dayEntries.length > 0 && (
                                    <span className="text-sm text-zinc-400 font-mono">
                                        — {formatDurationShort(totalDaySeconds)} total
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative" ref={addMenuRef}>
                                    <button
                                        onClick={() => setAddMenuOpen(v => !v)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 transition-colors text-xs font-medium"
                                    >
                                        <Plus size={13} />
                                        Add
                                    </button>

                                    {addMenuOpen && (
                                        <div className="absolute right-0 top-full mt-1 w-44 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                                            <button
                                                onClick={() => { setAddDate(format(selectedDay!, 'yyyy-MM-dd')); setAddMenuOpen(false) }}
                                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors text-left"
                                            >
                                                <Clock size={14} className="text-primary-400 shrink-0" />
                                                Log time entry
                                            </button>
                                            <button
                                                onClick={() => { setPendingLogDate(format(selectedDay!, 'yyyy-MM-dd')); openCreateModal(selectedDay!, undefined); setAddMenuOpen(false) }}
                                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors text-left"
                                            >
                                                <CheckSquare size={14} className="text-green-400 shrink-0" />
                                                New task
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => { setSelectedDay(null); setDayEntries([]) }}
                                    className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-white transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Panel content */}
                        <div className="divide-y divide-white/5">
                            {isDayLoading ? (
                                <div className="px-5 py-8 text-center text-zinc-500 text-sm">Loading...</div>
                            ) : dayEntries.length === 0 ? (
                                <div className="px-5 py-8 text-center text-zinc-500 text-sm">No time entries for this day.</div>
                            ) : (
                                dayEntries.map((entry) => (
                                    <div key={entry.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors group">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.project_color }} />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{entry.task_title}</p>
                                                <p className="text-xs text-zinc-500">{entry.project_name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0 ml-4">
                                            <p className="text-sm font-mono text-zinc-400">{formatDurationShort(entry.duration)}</p>
                                            <button
                                                onClick={() => setEditEntry({ id: entry.id, task_id: entry.task_id, start_time: entry.start_time, end_time: entry.end_time })}
                                                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                                            >
                                                <Edit2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ManualTimeDialog
                isOpen={!!addDate}
                onClose={() => setAddDate(null)}
                preSelectedDate={addDate || undefined}
            />

            <EditTimeEntryDialog
                isOpen={!!editEntry}
                onClose={() => setEditEntry(null)}
                entry={editEntry}
                onSaved={async () => {
                    setEditEntry(null)
                    if (selectedDay) await handleDayClick(selectedDay)
                }}
            />
        </div>
    )
}
