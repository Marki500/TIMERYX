import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'

interface TimeEntry {
    id: string
    start_time: string
    end_time: string | null
    description: string | null
    task: {
        title: string
        status: string
        project?: {
            name: string
            color: string
        }
    }
}

export function exportToCSV(entries: TimeEntry[], filename: string = 'time_entries.csv') {
    // Create CSV header
    const headers = ['Fecha', 'Hora', 'Tarea', 'Descripción', 'Proyecto', 'Estado', 'Duración (h)']

    // Create CSV rows
    const rows = entries.map(entry => {
        const start = new Date(entry.start_time)
        const end = entry.end_time ? new Date(entry.end_time) : new Date()
        const durationSeconds = Math.floor((end.getTime() - start.getTime()) / 1000)
        const durationHours = (durationSeconds / 3600).toFixed(2)

        const statusLabels: Record<string, string> = {
            todo: 'Por Hacer',
            in_progress: 'En Progreso',
            done: 'Completada'
        }

        return [
            format(start, 'dd/MM/yyyy'),
            format(start, 'HH:mm'),
            entry.task.title,
            entry.description || '-',
            entry.task.project?.name || '-',
            statusLabels[entry.task.status] || entry.task.status,
            durationHours
        ]
    })

    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Create blob and download
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

export function exportToPDF(entries: TimeEntry[], filename: string = 'time_entries.pdf') {
    const doc = new jsPDF()

    // Add title
    doc.setFontSize(18)
    doc.setTextColor(99, 102, 241) // primary-500
    doc.text('TIMERYX - Reporte de Tiempo', 14, 20)

    // Add date
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 28)

    // Prepare table data
    const statusLabels: Record<string, string> = {
        todo: 'Por Hacer',
        in_progress: 'En Progreso',
        done: 'Completada'
    }

    const tableData = entries.map(entry => {
        const start = new Date(entry.start_time)
        const end = entry.end_time ? new Date(entry.end_time) : new Date()
        const durationSeconds = Math.floor((end.getTime() - start.getTime()) / 1000)
        const hours = Math.floor(durationSeconds / 3600)
        const minutes = Math.floor((durationSeconds % 3600) / 60)
        const durationFormatted = `${hours}h ${minutes}m`

        return [
            format(start, 'dd/MM/yyyy'),
            format(start, 'HH:mm'),
            entry.task.title,
            entry.task.project?.name || '-',
            statusLabels[entry.task.status] || entry.task.status,
            durationFormatted
        ]
    })

    // Add table
    autoTable(doc, {
        head: [['Fecha', 'Hora', 'Tarea', 'Proyecto', 'Estado', 'Duración']],
        body: tableData,
        startY: 35,
        theme: 'grid',
        headStyles: {
            fillColor: [99, 102, 241], // primary-500
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold'
        },
        bodyStyles: {
            fontSize: 9,
            textColor: [50, 50, 50]
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        },
        margin: { top: 35 }
    })

    // Add footer with total
    const totalSeconds = entries.reduce((sum, entry) => {
        const start = new Date(entry.start_time)
        const end = entry.end_time ? new Date(entry.end_time) : new Date()
        return sum + Math.floor((end.getTime() - start.getTime()) / 1000)
    }, 0)

    const totalHours = Math.floor(totalSeconds / 3600)
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60)

    const finalY = (doc as any).lastAutoTable.finalY || 35
    doc.setFontSize(11)
    doc.setTextColor(0, 0, 0)
    doc.text(`Total de entradas: ${entries.length}`, 14, finalY + 10)
    doc.text(`Tiempo total: ${totalHours}h ${totalMinutes}m`, 14, finalY + 17)

    // Save PDF
    doc.save(filename)
}
