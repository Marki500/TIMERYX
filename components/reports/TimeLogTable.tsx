'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDuration } from '@/lib/utils'
import { format } from 'date-fns'
import { Download, FileText, Plus, Edit2 } from 'lucide-react'
import { exportToCSV, exportToPDF, exportMonthlyProjectPDF } from '@/lib/export'
import { ManualTimeDialog } from '@/components/timer/ManualTimeDialog'
import { EditTimeEntryDialog, EntryToEdit } from '@/components/reports/EditTimeEntryDialog'

interface TimeEntryLog {
    id: string
    task_id: string
    created_at: string
    start_time: string
    end_time: string | null
    description: string | null
    task: {
        title: string
        status: string
        project_id?: string
        project?: {
            name: string
            color: string
        }
    }
}

export interface FilterState {
    dateRange: 'last7' | 'last30' | 'thisMonth' | 'custom'
    customStartDate?: string
    customEndDate?: string
    projectId?: string
    taskStatus?: 'todo' | 'in_progress' | 'done' | 'all'
}

interface TimeLogTableProps {
    filters?: FilterState
}

export function TimeLogTable({ filters }: TimeLogTableProps) {
    const [entries, setEntries] = useState<TimeEntryLog[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [addDate, setAddDate] = useState<string | null>(null)
    const [editEntry, setEditEntry] = useState<EntryToEdit | null>(null)

    const fetchEntries = async () => {
        setIsLoading(true)
        const supabase = createClient()

        let startDate = new Date()
        const endDate = new Date()

        if (filters?.dateRange === 'custom' && filters.customStartDate) {
            startDate = new Date(filters.customStartDate)
            if (filters.customEndDate) endDate.setTime(new Date(filters.customEndDate).getTime())
        } else if (filters?.dateRange === 'last30') {
            startDate.setDate(startDate.getDate() - 30)
        } else if (filters?.dateRange === 'thisMonth') {
            startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
        } else {
            startDate.setDate(startDate.getDate() - 7)
        }

        const { data, error } = await supabase
            .from('time_entries')
            .select(`
                id,
                task_id,
                created_at,
                start_time,
                end_time,
                description,
                task:tasks (
                    title,
                    status,
                    project_id,
                    project:projects (
                        name,
                        color
                    )
                )
            `)
            .gte('start_time', startDate.toISOString())
            .lte('start_time', endDate.toISOString())
            .order('start_time', { ascending: false })
            .limit(100)

        if (!error && data) {
            let filteredData = data as any[]

            if (filters?.projectId) {
                filteredData = filteredData.filter(e => e.task?.project_id === filters.projectId)
            }
            if (filters?.taskStatus && filters.taskStatus !== 'all') {
                filteredData = filteredData.filter(e => e.task?.status === filters.taskStatus)
            }

            setEntries(filteredData)
        }
        setIsLoading(false)
    }

    useEffect(() => { fetchEntries() }, [filters])

    if (isLoading) return <div className="h-40 bg-white/5 rounded-xl animate-pulse" />

    if (entries.length === 0) {
        return (
            <div className="bg-[#161616] border border-white/10 rounded-xl p-12 text-center">
                <p className="text-zinc-500">No se encontraron entradas de tiempo con los filtros seleccionados.</p>
            </div>
        )
    }

    // Group entries by date
    const grouped = entries.reduce<Record<string, TimeEntryLog[]>>((acc, entry) => {
        const key = format(new Date(entry.start_time), 'yyyy-MM-dd')
        if (!acc[key]) acc[key] = []
        acc[key].push(entry)
        return acc
    }, {})

    const statusColors: Record<string, string> = {
        todo: 'bg-zinc-500/20 text-zinc-400',
        in_progress: 'bg-blue-500/20 text-blue-400',
        done: 'bg-emerald-500/20 text-emerald-400',
    }
    const statusLabels: Record<string, string> = {
        todo: 'Por Hacer',
        in_progress: 'En Progreso',
        done: 'Completada',
    }

    return (
        <>
            <div className="space-y-4">
                {/* Export buttons */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <p className="text-sm text-zinc-400">
                        {entries.length} {entries.length === 1 ? 'entrada' : 'entradas'} encontradas
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => exportToCSV(entries, `timeryx_reporte_${format(new Date(), 'yyyy-MM-dd')}.csv`)}
                            className="px-4 py-2 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 hover:from-emerald-500/20 hover:to-teal-500/20 transition-all flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            <span className="font-medium">Exportar CSV</span>
                        </button>
                        <button
                            onClick={() => exportToPDF(entries, `timeryx_reporte_${format(new Date(), 'yyyy-MM-dd')}.pdf`)}
                            className="px-4 py-2 bg-gradient-to-br from-rose-500/10 to-pink-500/10 border border-rose-500/20 rounded-xl text-rose-400 hover:from-rose-500/20 hover:to-pink-500/20 transition-all flex items-center gap-2"
                        >
                            <FileText className="w-4 h-4" />
                            <span className="font-medium">Exportar PDF</span>
                        </button>
                        <button
                            onClick={() => exportMonthlyProjectPDF(entries, `timeryx_resumen_proyectos_${format(new Date(), 'yyyy-MM-dd')}.pdf`)}
                            className="px-4 py-2 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 hover:from-indigo-500/20 hover:to-purple-500/20 transition-all flex items-center gap-2"
                        >
                            <FileText className="w-4 h-4" />
                            <span className="font-medium">Resumen Proyectos (PDF)</span>
                        </button>
                    </div>
                </div>

                {/* Table grouped by day */}
                <div className="bg-[#161616] border border-white/10 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-white/5 text-zinc-400 border-b border-white/10">
                                <th className="px-6 py-3 font-medium">Task / Description</th>
                                <th className="px-6 py-3 font-medium">Project</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium text-right">Duration</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {Object.entries(grouped).map(([dateKey, dayEntries]) => {
                                const dayTotal = dayEntries.reduce((acc, e) => {
                                    if (!e.end_time) return acc
                                    return acc + Math.floor((new Date(e.end_time).getTime() - new Date(e.start_time).getTime()) / 1000)
                                }, 0)

                                return (
                                    <>
                                        {/* Date group header */}
                                        <tr key={`header-${dateKey}`} className="bg-white/[0.02]">
                                            <td colSpan={3} className="px-6 py-2.5">
                                                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                                    {format(new Date(dateKey + 'T12:00:00'), 'EEEE, MMMM d yyyy')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-2.5 text-right">
                                                <span className="text-xs font-mono text-zinc-500">{formatDuration(dayTotal)}</span>
                                            </td>
                                            <td className="px-6 py-2.5 text-right">
                                                <button
                                                    onClick={() => setAddDate(dateKey)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 transition-colors text-xs font-medium"
                                                >
                                                    <Plus size={12} />
                                                    Add
                                                </button>
                                            </td>
                                        </tr>

                                        {/* Entries for this day */}
                                        {dayEntries.map((entry) => {
                                            const start = new Date(entry.start_time)
                                            const end = entry.end_time ? new Date(entry.end_time) : new Date()
                                            const duration = Math.floor((end.getTime() - start.getTime()) / 1000)
                                            const taskStatus = entry.task?.status || 'unknown'
                                            const project = entry.task?.project

                                            return (
                                                <tr key={entry.id} className="hover:bg-white/5 transition-colors group">
                                                    <td className="px-6 py-3.5 text-white">
                                                        <div className="font-medium">{entry.task?.title || 'Tarea eliminada'}</div>
                                                        <div className="text-xs text-zinc-500 font-mono mt-0.5">
                                                            {format(start, 'HH:mm')} – {entry.end_time ? format(end, 'HH:mm') : '…'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3.5">
                                                        {project ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                                                                <span className="text-zinc-300">{project.name}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-zinc-600">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-3.5">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[taskStatus] || 'bg-zinc-500/20 text-zinc-400'}`}>
                                                            {statusLabels[taskStatus] || taskStatus}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3.5 text-right font-mono text-zinc-300">
                                                        {formatDuration(duration)}
                                                    </td>
                                                    <td className="px-6 py-3.5 text-right">
                                                        <button
                                                            onClick={() => setEditEntry({
                                                                id: entry.id,
                                                                task_id: entry.task_id,
                                                                start_time: entry.start_time,
                                                                end_time: entry.end_time || new Date().toISOString(),
                                                            })}
                                                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                                                            title="Edit entry"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add manual entry for a specific day */}
            <ManualTimeDialog
                isOpen={!!addDate}
                onClose={() => setAddDate(null)}
                preSelectedDate={addDate || undefined}
            />

            {/* Edit time entry */}
            <EditTimeEntryDialog
                isOpen={!!editEntry}
                onClose={() => setEditEntry(null)}
                entry={editEntry}
                onSaved={() => { setEditEntry(null); fetchEntries() }}
            />
        </>
    )
}
