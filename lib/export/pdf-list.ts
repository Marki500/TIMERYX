import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import type { ExportTimeEntry } from './types'

const STATUS_LABELS: Record<string, string> = {
    todo: 'Por Hacer',
    in_progress: 'En Progreso',
    done: 'Completada'
}

export function exportToPDF(entries: ExportTimeEntry[], filename: string = 'time_entries.pdf') {
    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.setTextColor(99, 102, 241)
    doc.text('TIMERYX - Reporte de Tiempo', 14, 20)

    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 28)

    const tableData = entries.map(entry => {
        const start = new Date(entry.start_time)
        const end = entry.end_time ? new Date(entry.end_time) : new Date()
        const durationSeconds = Math.floor((end.getTime() - start.getTime()) / 1000)
        const hours = Math.floor(durationSeconds / 3600)
        const minutes = Math.floor((durationSeconds % 3600) / 60)
        const durationFormatted = `${hours}h ${minutes}m`
        const description = entry.task.description?.trim() ?? ''

        return [
            format(start, 'dd/MM/yyyy'),
            format(start, 'HH:mm'),
            entry.task.title,
            description,
            entry.task.project?.name || '-',
            STATUS_LABELS[entry.task.status] || entry.task.status,
            durationFormatted
        ]
    })

    autoTable(doc, {
        head: [['Fecha', 'Hora', 'Tarea', 'Descripción', 'Proyecto', 'Estado', 'Duración']],
        body: tableData,
        startY: 35,
        theme: 'grid',
        headStyles: {
            fillColor: [99, 102, 241],
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold'
        },
        bodyStyles: {
            fontSize: 9,
            textColor: [50, 50, 50],
            valign: 'top',
            cellPadding: 3
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        },
        columnStyles: {
            0: { cellWidth: 18 },
            1: { cellWidth: 14 },
            2: { cellWidth: 36 },
            3: { cellWidth: 58 },
            4: { cellWidth: 30 },
            5: { cellWidth: 22 },
            6: { cellWidth: 18, halign: 'right' }
        },
        didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 3) {
                const raw = (data.cell.raw ?? '').toString()
                if (raw.length > 0) {
                    data.cell.styles.fontStyle = 'italic'
                    data.cell.styles.textColor = [90, 90, 90]
                    data.cell.styles.lineColor = [230, 230, 235]
                } else {
                    data.cell.styles.textColor = [190, 190, 195]
                }
            }
        },
        margin: { top: 35 }
    })

    const totalSeconds = entries.reduce((sum, entry) => {
        const start = new Date(entry.start_time)
        const end = entry.end_time ? new Date(entry.end_time) : new Date()
        return sum + Math.floor((end.getTime() - start.getTime()) / 1000)
    }, 0)

    const totalHours = Math.floor(totalSeconds / 3600)
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60)

    const finalY = doc.lastAutoTable?.finalY ?? 35
    doc.setFontSize(11)
    doc.setTextColor(0, 0, 0)
    doc.text(`Total de entradas: ${entries.length}`, 14, finalY + 10)
    doc.text(`Tiempo total: ${totalHours}h ${totalMinutes}m`, 14, finalY + 17)

    doc.save(filename)
}
