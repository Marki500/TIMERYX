'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDuration } from '@/lib/utils'
import { format } from 'date-fns'
import { Download, FileText } from 'lucide-react'
import { exportToCSV, exportToPDF } from '@/lib/export'

interface TimeEntryLog {
    id: string
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

    useEffect(() => {
        const fetchEntries = async () => {
            setIsLoading(true)
            const supabase = createClient()

            // Calculate date range
            let startDate = new Date()
            const endDate = new Date()

            if (filters?.dateRange === 'custom' && filters.customStartDate) {
                startDate = new Date(filters.customStartDate)
                if (filters.customEndDate) {
                    endDate.setTime(new Date(filters.customEndDate).getTime())
                }
            } else if (filters?.dateRange === 'last30') {
                startDate.setDate(startDate.getDate() - 30)
            } else if (filters?.dateRange === 'thisMonth') {
                startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
            } else {
                // Default: last 7 days
                startDate.setDate(startDate.getDate() - 7)
            }

            let query = supabase
                .from('time_entries')
                .select(`
                    id,
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

            const { data, error } = await query

            if (!error && data) {
                let filteredData = data as any[]

                // Filter by project
                if (filters?.projectId) {
                    filteredData = filteredData.filter(entry =>
                        entry.task?.project_id === filters.projectId
                    )
                }

                // Filter by task status
                if (filters?.taskStatus && filters.taskStatus !== 'all') {
                    filteredData = filteredData.filter(entry =>
                        entry.task?.status === filters.taskStatus
                    )
                }

                setEntries(filteredData)
            }
            setIsLoading(false)
        }

        fetchEntries()
    }, [filters])

    if (isLoading) {
        return <div className="h-40 bg-white/5 rounded-xl animate-pulse" />
    }

    if (entries.length === 0) {
        return (
            <div className="bg-[#161616] border border-white/10 rounded-xl p-12 text-center">
                <p className="text-zinc-500">No se encontraron entradas de tiempo con los filtros seleccionados.</p>
            </div>
        )
    }

    const handleExportCSV = () => {
        const filename = `timeryx_reporte_${format(new Date(), 'yyyy-MM-dd')}.csv`
        exportToCSV(entries, filename)
    }

    const handleExportPDF = () => {
        const filename = `timeryx_reporte_${format(new Date(), 'yyyy-MM-dd')}.pdf`
        exportToPDF(entries, filename)
    }

    return (
        <div className="space-y-4">
            {/* Export Buttons */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">
                    {entries.length} {entries.length === 1 ? 'entrada' : 'entradas'} encontradas
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportCSV}
                        className="px-4 py-2 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 hover:from-emerald-500/20 hover:to-teal-500/20 hover:border-emerald-500/30 transition-all flex items-center gap-2 group"
                    >
                        <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Exportar CSV</span>
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="px-4 py-2 bg-gradient-to-br from-rose-500/10 to-pink-500/10 border border-rose-500/20 rounded-xl text-rose-400 hover:from-rose-500/20 hover:to-pink-500/20 hover:border-rose-500/30 transition-all flex items-center gap-2 group"
                    >
                        <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Exportar PDF</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#161616] border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-white/5 text-zinc-400 border-b border-white/10">
                            <th className="px-6 py-3 font-medium">Date</th>
                            <th className="px-6 py-3 font-medium">Task / Description</th>
                            <th className="px-6 py-3 font-medium">Project</th>
                            <th className="px-6 py-3 font-medium">Status</th>
                            <th className="px-6 py-3 font-medium text-right">Duration</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {entries.map((entry) => {
                            const start = new Date(entry.start_time)
                            const end = entry.end_time ? new Date(entry.end_time) : new Date()
                            const duration = Math.floor((end.getTime() - start.getTime()) / 1000)

                            const statusColors = {
                                todo: 'bg-zinc-500/20 text-zinc-400',
                                in_progress: 'bg-blue-500/20 text-blue-400',
                                done: 'bg-emerald-500/20 text-emerald-400',
                                unknown: 'bg-zinc-500/20 text-zinc-400' // Added for unknown status
                            }

                            const statusLabels = {
                                todo: 'Por Hacer',
                                in_progress: 'En Progreso',
                                done: 'Completada',
                                unknown: 'Desconocido' // Added for unknown status
                            }

                            const taskTitle = entry.task?.title || 'Tarea eliminada o desconocida'
                            const taskStatus = entry.task?.status || 'unknown'
                            const project = entry.task?.project

                            return (
                                <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 text-zinc-400 whitespace-nowrap">
                                        {format(start, 'MMM d, yyyy')}
                                        <br />
                                        <span className="text-xs text-zinc-500">{format(start, 'HH:mm')}</span>
                                    </td>
                                    <td className="px-6 py-4 text-white">
                                        <div className="font-medium">{taskTitle}</div>
                                        {entry.description && (
                                            <div className="text-zinc-500 text-xs mt-0.5">{entry.description}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {project ? (
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: project.color }}
                                                />
                                                <span className="text-zinc-300">{project.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-zinc-600">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[taskStatus as keyof typeof statusColors] || 'bg-zinc-500/20 text-zinc-400'}`}>
                                            {statusLabels[taskStatus as keyof typeof statusLabels] || taskStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-zinc-300">
                                        {formatDuration(duration)}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
