'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isToday,
    addMonths,
    subMonths,
    isSameMonth,
    isSameDay
} from 'date-fns'
import { es, enUS } from 'date-fns/locale'

import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { BulkTimeEntryModal } from './BulkTimeEntryModal'
import { useUserStore } from '@/stores/useUserStore'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/stores/useLocaleStore'

interface TimeEntry {
    id: string
    task_id: string
    start_time: string
    end_time: string | null
    description: string | null
    tasks: {
        title: string
        projects: {
            name: string
            color: string
        }
    }
}

export function TimesheetMonthView() {
    const { t, locale } = useTranslation()
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()))
    const [entries, setEntries] = useState<TimeEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { profile } = useUserStore()
    const supabaseRef = useRef(createClient())

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)

    const fetchEntries = useCallback(async () => {
        if (!profile) return

        setIsLoading(true)
        const start = startOfMonth(currentMonth)
        const end = endOfMonth(currentMonth)

        const { data, error } = await supabaseRef.current
            .from('time_entries')
            .select(`
                id, start_time, end_time, description,
                tasks (
                    title,
                    projects (
                        name,
                        color
                    )
                )
            `)
            .eq('user_id', profile.id)
            .gte('start_time', start.toISOString())
            .lte('start_time', end.toISOString())
            .not('end_time', 'is', null) // Only completed entries

        if (!error && data) {
            setEntries(data as unknown as TimeEntry[])
        }
        setIsLoading(false)
    }, [currentMonth, profile])

    useEffect(() => {
        fetchEntries()
    }, [fetchEntries])

    const handlePreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
    const handleToday = () => setCurrentMonth(startOfMonth(new Date()))

    const days = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth)
    })

    const handleAddEntryClick = (date: Date) => {
        setSelectedDate(date)
        setIsModalOpen(true)
    }

    // Helper to calculate total duration in minutes for a day
    const getDayEntries = (date: Date) => {
        return entries.filter(entry => isSameDay(new Date(entry.start_time), date))
    }

    const getDayTotalDuration = (dayEntries: TimeEntry[]) => {
        return dayEntries.reduce((total, entry) => {
            if (!entry.end_time) return total
            const start = new Date(entry.start_time).getTime()
            const end = new Date(entry.end_time).getTime()
            return total + (end - start) / (1000 * 60) // minutes
        }, 0)
    }

    const formatDuration = (minutes: number) => {
        const h = Math.floor(minutes / 60)
        const m = Math.round(minutes % 60)
        if (h === 0 && m === 0) return '0h'
        if (h === 0) return `${m}m`
        if (m === 0) return `${h}h`
        return `${h}h ${m}m`
    }

    // Calculate aggregated project statistics for visual representation
    const getProjectSummaries = () => {
        const summaries: Record<string, { name: string; color: string; minutes: number }> = {}
        let grandTotalMinutes = 0

        entries.forEach(entry => {
            if (!entry.end_time) return
            const project = entry.tasks?.projects
            const projectName = project?.name || (locale === 'es' ? 'Sin proyecto' : 'No Project')
            const projectColor = project?.color || '#a1a1aa'
            
            const start = new Date(entry.start_time).getTime()
            const end = new Date(entry.end_time).getTime()
            const durationMinutes = (end - start) / (1000 * 60)
            
            grandTotalMinutes += durationMinutes
            
            if (!summaries[projectName]) {
                summaries[projectName] = { name: projectName, color: projectColor, minutes: 0 }
            }
            summaries[projectName].minutes += durationMinutes
        })

        return {
            items: Object.values(summaries).sort((a, b) => b.minutes - a.minutes),
            grandTotalMinutes
        }
    }

    const dateFnsLocale = locale === 'es' ? es : enUS

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex items-center justify-between bg-[#161616] p-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-white capitalize">
                        {format(currentMonth, 'MMMM yyyy', { locale: dateFnsLocale })}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleToday}
                        className={cn(
                            "px-4 py-2 rounded-xl text-sm font-medium transition-colors border",
                            isSameMonth(currentMonth, new Date())
                                ? "bg-primary-500/20 text-primary-400 border-primary-500/30"
                                : "bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-white"
                        )}
                    >
                        {locale === 'es' ? 'Hoy' : 'Today'}
                    </button>
                    <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                        <button
                            onClick={handlePreviousMonth}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={handleNextMonth}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Visual Project Hours Summary */}
            {!isLoading && entries.length > 0 && (() => {
                const { items, grandTotalMinutes } = getProjectSummaries()
                if (items.length === 0) return null
                return (
                    <div className="bg-[#161616] p-5 rounded-2xl border border-white/10 space-y-4 shadow-xl shadow-black/25">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-zinc-400 tracking-wider uppercase">{t('timesheet.project_summary')}</h3>
                            <span className="text-xs text-zinc-500 font-medium">
                                {t('timesheet.total_hours')}: <strong className="text-white font-mono text-sm">{formatDuration(grandTotalMinutes)}</strong>
                            </span>
                        </div>
                        <div className="flex items-center gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {items.map((item) => (
                                <div 
                                    key={item.name} 
                                    className="flex flex-col gap-1.5 p-3.5 min-w-[180px] sm:min-w-[210px] rounded-xl bg-white/5 border border-white/5 hover:border-white/15 transition-all hover:bg-white/10 group cursor-default shadow-md"
                                >
                                    <div className="flex items-center gap-2 justify-between">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-2.5 h-2.5 rounded-full shrink-0 group-hover:scale-110 transition-transform" style={{ backgroundColor: item.color }} />
                                            <span className="font-semibold text-white text-xs truncate" title={item.name}>{item.name}</span>
                                        </div>
                                        <span className="font-mono text-zinc-300 text-xs font-bold shrink-0">{formatDuration(item.minutes)}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mt-1">
                                        <div 
                                            className="h-full rounded-full transition-all duration-700" 
                                            style={{ 
                                                backgroundColor: item.color,
                                                width: `${(item.minutes / grandTotalMinutes) * 100}%` 
                                            }} 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            })()}

            {/* Days Grid */}
            <div className="bg-[#161616] rounded-2xl border border-white/10 overflow-hidden shadow-xl shadow-black/25">
                <div className="grid grid-cols-[120px_1fr_120px] gap-4 p-4 border-b border-white/5 bg-white/[0.02] text-sm font-medium text-zinc-400">
                    <div>{locale === 'es' ? 'Fecha' : 'Date'}</div>
                    <div>{locale === 'es' ? 'Registros' : 'Entries'}</div>
                    <div className="text-right">{locale === 'es' ? 'Tiempo Total' : 'Total Time'}</div>
                </div>
                
                {isLoading ? (
                    <div className="p-12 text-center text-zinc-500 flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin mb-4" />
                        {locale === 'es' ? 'Cargando registros...' : 'Loading timesheet...'}
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {days.map((day) => {
                            const dayEntries = getDayEntries(day)
                            const totalMinutes = getDayTotalDuration(dayEntries)
                            const isCurrentDay = isToday(day)

                            return (
                                <div 
                                    key={day.toISOString()} 
                                    className={cn(
                                        "grid grid-cols-[120px_1fr_120px] gap-4 p-4 items-center group transition-colors",
                                        isCurrentDay ? "bg-primary-500/5" : "hover:bg-white/[0.02]"
                                    )}
                                >
                                    {/* Date Column */}
                                    <div>
                                        <div className={cn(
                                            "font-medium",
                                            isCurrentDay ? "text-primary-400" : "text-zinc-300"
                                        )}>
                                            {format(day, 'MMM d', { locale: dateFnsLocale })}
                                        </div>
                                        <div className="text-xs text-zinc-500 capitalize">
                                            {format(day, 'EEEE', { locale: dateFnsLocale })}
                                        </div>
                                    </div>

                                    {/* Entries Column */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        {dayEntries.length === 0 ? (
                                            <span className="text-sm text-zinc-600">{t('timesheet.no_entries')}</span>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {dayEntries.map((entry) => (
                                                    <div 
                                                        key={entry.id} 
                                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs text-zinc-300 hover:bg-white/10 transition-colors"
                                                    >
                                                        <div 
                                                            className="w-2 h-2 rounded-full"
                                                            style={{ backgroundColor: entry.tasks?.projects?.color || '#3b82f6' }}
                                                        />
                                                        <span className="font-medium max-w-[120px] truncate" title={entry.tasks?.title}>
                                                            {entry.tasks?.projects?.name}: {entry.tasks?.title}
                                                        </span>
                                                        <span className="text-zinc-500 flex items-center gap-1 ml-2">
                                                            <Clock size={10} />
                                                            {formatDuration(getDayTotalDuration([entry]))}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <button
                                            onClick={() => handleAddEntryClick(day)}
                                            className={cn(
                                                "p-1.5 rounded-lg border border-dashed transition-all",
                                                dayEntries.length === 0 
                                                    ? "opacity-100 border-white/20 text-zinc-400 hover:border-primary-500/50 hover:text-primary-400 hover:bg-primary-500/10" 
                                                    : "opacity-0 group-hover:opacity-100 border-white/20 text-zinc-400 hover:border-primary-500/50 hover:text-primary-400 hover:bg-primary-500/10"
                                            )}
                                            title={locale === 'es' ? 'Añadir registro' : 'Add Time Entry'}
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>

                                    {/* Total Column */}
                                    <div className="text-right">
                                        <span className={cn(
                                            "font-bold text-sm",
                                            totalMinutes > 0 ? "text-white" : "text-zinc-600"
                                        )}>
                                            {formatDuration(totalMinutes)}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            <BulkTimeEntryModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedDate={selectedDate}
                onEntryAdded={fetchEntries}
            />
        </div>
    )
}

