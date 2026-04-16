'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
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

export function MonthlyCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [dailyHours, setDailyHours] = useState<Record<string, number>>({})
    const [isLoading, setIsLoading] = useState(false)

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
                    
                    const durationInSeconds = (new Date(entry.end_time).getTime() - startDate.getTime()) / 1000
                    const durationInHours = Math.max(0, durationInSeconds / 3600)
                    
                    if (!hoursMap[dayKey]) hoursMap[dayKey] = 0
                    hoursMap[dayKey] += durationInHours
                })
                setDailyHours(hoursMap)
            }
            setIsLoading(false)
        }
        fetchMonthData()
    }, [currentDate])

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
    
    // Generate calendar grid
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start, end })

    return (
        <div className="bg-[#161616] border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-500/10 text-primary-400 rounded-lg">
                        <CalendarIcon size={20} />
                    </div>
                    <h2 className="text-lg font-medium text-white">
                        {format(currentDate, 'MMMM yyyy')}
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={prevMonth}
                        className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button 
                        onClick={() => setCurrentDate(new Date())}
                        className="px-3 py-1.5 text-sm font-medium hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors"
                    >
                        Today
                    </button>
                    <button 
                        onClick={nextMonth}
                        className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-px bg-white/5 rounded-lg overflow-hidden border border-white/5">
                {/* Day headers */}
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="bg-[#161616] py-3 text-center text-xs font-medium text-zinc-500 uppercase">
                        {day}
                    </div>
                ))}

                {/* Calendar days */}
                {days.map((day, dayIdx) => {
                    const dayKey = format(day, 'yyyy-MM-dd')
                    const hours = dailyHours[dayKey] || 0
                    const isCurrentMonth = isSameMonth(day, currentDate)
                    
                    // Determine highlight intensity based on hours worked
                    let bgClass = "bg-[#161616]"
                    if (hours > 0) {
                        if (hours > 6) bgClass = "bg-primary-500/30"
                        else if (hours > 3) bgClass = "bg-primary-500/20"
                        else bgClass = "bg-primary-500/10"
                    }

                    return (
                        <div 
                            key={day.toString()}
                            className={`min-h-[100px] p-2 transition-colors ${bgClass} ${
                                !isCurrentMonth ? 'opacity-30' : ''
                            } hover:bg-white/5 border-t border-r border-white/5 ${
                                dayIdx % 7 === 6 ? 'border-r-0' : ''
                            }`}
                        >
                            <div className="flex flex-col h-full">
                                <div className={`text-sm font-medium mb-1 ${
                                    isToday(day) 
                                        ? 'w-7 h-7 bg-primary-500 text-white rounded-full flex items-center justify-center'
                                        : 'text-zinc-400 px-1 pt-1'
                                }`}>
                                    {format(day, 'd')}
                                </div>
                                {hours > 0 && (
                                    <div className="mt-auto px-1">
                                        <div className="text-xs font-semibold text-primary-400">
                                            {format(day, 'MMM d')}
                                        </div>
                                        <div className="text-xs text-zinc-300 font-mono mt-0.5">
                                            {hours.toFixed(1)}h logged
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
            
            <div className="mt-6 flex items-center justify-end gap-4 text-xs text-zinc-500">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-primary-500/10"></div>
                    <span>&lt; 3h</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-primary-500/20"></div>
                    <span>3h - 6h</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-primary-500/30"></div>
                    <span>&gt; 6h</span>
                </div>
            </div>
        </div>
    )
}
