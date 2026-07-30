import { format } from 'date-fns'
import type { ExportTimeEntry } from './types'

const STATUS_LABELS: Record<string, string> = {
    todo: 'Por Hacer',
    in_progress: 'En Progreso',
    done: 'Completada'
}

export function exportToCSV(entries: ExportTimeEntry[], filename: string = 'time_entries.csv') {
    const headers = ['Fecha', 'Hora', 'Tarea', 'Descripción', 'Proyecto', 'Estado', 'Duración (h)']

    const rows = entries.map(entry => {
        const start = new Date(entry.start_time)
        const end = entry.end_time ? new Date(entry.end_time) : new Date()
        const durationSeconds = Math.floor((end.getTime() - start.getTime()) / 1000)
        const durationHours = (durationSeconds / 3600).toFixed(2)

        return [
            format(start, 'dd/MM/yyyy'),
            format(start, 'HH:mm'),
            entry.task.title,
            entry.task.description || '-',
            entry.task.project?.name || '-',
            STATUS_LABELS[entry.task.status] || entry.task.status,
            durationHours
        ]
    })

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}
