import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import type { ExportTimeEntry } from './types'

interface TaskSummary {
    title: string
    durationSeconds: number
    description: string | null
}

interface ProjectSummary {
    name: string
    color: string
    durationSeconds: number
    tasks: Record<string, TaskSummary>
}

function hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
        ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
        : [113, 113, 122]
}

function aggregate(entries: ExportTimeEntry[]) {
    const projectTotals: Record<string, ProjectSummary> = {}
    let totalSeconds = 0

    for (const entry of entries) {
        const start = new Date(entry.start_time)
        const end = entry.end_time ? new Date(entry.end_time) : new Date()
        const durationSeconds = Math.floor((end.getTime() - start.getTime()) / 1000)
        if (durationSeconds <= 0) continue

        totalSeconds += durationSeconds

        const projectId = entry.task.project?.name || 'sin_proyecto'
        const projectName = entry.task.project?.name || 'Sin Proyecto Asignado'
        const projectColor = entry.task.project?.color || '#71717a'
        const taskTitle = entry.task.title
        const taskDescription = entry.task.description?.trim() || null

        if (!projectTotals[projectId]) {
            projectTotals[projectId] = {
                name: projectName,
                color: projectColor,
                durationSeconds: 0,
                tasks: {}
            }
        }

        projectTotals[projectId].durationSeconds += durationSeconds

        if (!projectTotals[projectId].tasks[taskTitle]) {
            projectTotals[projectId].tasks[taskTitle] = {
                title: taskTitle,
                durationSeconds: 0,
                description: null
            }
        }
        projectTotals[projectId].tasks[taskTitle].durationSeconds += durationSeconds

        if (taskDescription) {
            const current = projectTotals[projectId].tasks[taskTitle].description
            if (!current || taskDescription.length > current.length) {
                projectTotals[projectId].tasks[taskTitle].description = taskDescription
            }
        }
    }

    return { projectTotals, totalSeconds }
}

function formatHM(seconds: number): string {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${h}h ${m}m`
}

export interface MonthlyProjectExportOptions {
    includeTotal: boolean
    filename: string
}

export function exportMonthlyProjectPDF(
    entries: ExportTimeEntry[],
    options: Partial<MonthlyProjectExportOptions> = {}
) {
    const { includeTotal = true, filename = 'resumen_mensual_proyectos.pdf' } = options

    const doc = new jsPDF()

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.setTextColor(99, 102, 241)
    doc.text('TIMERYX', 14, 22)

    doc.setFontSize(14)
    doc.setTextColor(60, 60, 60)
    doc.setFont('helvetica', 'normal')
    doc.text('Resumen Mensual por Proyecto y Tareas', 14, 30)

    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy')} a las ${format(new Date(), 'HH:mm')}`, 14, 38)

    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.5)
    doc.line(14, 43, 196, 43)

    const { projectTotals, totalSeconds } = aggregate(entries)

    const tableBody: any[] = []

    Object.values(projectTotals)
        .sort((a, b) => b.durationSeconds - a.durationSeconds)
        .forEach(project => {
            const pHours = Math.floor(project.durationSeconds / 3600)
            const pMinutes = Math.floor((project.durationSeconds % 3600) / 60)
            const pPercentage = totalSeconds > 0
                ? ((project.durationSeconds / totalSeconds) * 100).toFixed(1) + '%'
                : '0%'

            const projectRgb = hexToRgb(project.color)

            tableBody.push([{
                content: project.name.toUpperCase(),
                styles: { fontStyle: 'bold', fillColor: [248, 248, 250], textColor: projectRgb, cellPadding: { top: 4, bottom: 4, left: 4 } }
            }, {
                content: `${pHours}h ${pMinutes}m`,
                styles: { fontStyle: 'bold', fillColor: [248, 248, 250], textColor: [40, 40, 40], cellPadding: { top: 4, bottom: 4 } }
            }, {
                content: pPercentage,
                styles: { fontStyle: 'bold', fillColor: [248, 248, 250], textColor: [99, 102, 241], cellPadding: { top: 4, bottom: 4 } }
            }])

            Object.values(project.tasks)
                .sort((a, b) => b.durationSeconds - a.durationSeconds)
                .forEach(task => {
                    const tHours = Math.floor(task.durationSeconds / 3600)
                    const tMinutes = Math.floor((task.durationSeconds % 3600) / 60)
                    const tPercentage = project.durationSeconds > 0
                        ? ((task.durationSeconds / project.durationSeconds) * 100).toFixed(1) + '%'
                        : '0%'

                    tableBody.push([
                        { content: `      •  ${task.title}`, styles: { textColor: [80, 80, 80] } },
                        { content: `${tHours}h ${tMinutes}m`, styles: { textColor: [100, 100, 100] } },
                        { content: `${tPercentage} del proyecto`, styles: { textColor: [120, 120, 120], fontSize: 8 } }
                    ])

                    if (task.description) {
                        tableBody.push([
                            {
                                content: `          “${task.description}”`,
                                styles: {
                                    fontSize: 8,
                                    fontStyle: 'italic',
                                    textColor: [110, 110, 120],
                                    cellPadding: { top: 0, bottom: 4, left: 4, right: 4 }
                                }
                            },
                            { content: '', styles: { cellPadding: { top: 0, bottom: 4 } } },
                            { content: '', styles: { cellPadding: { top: 0, bottom: 4 } } }
                        ])
                    }
                })
        })

    autoTable(doc, {
        head: [['Proyecto / Tarea', 'Tiempo Dedicado', 'Proporción']],
        body: tableBody,
        startY: 52,
        theme: 'plain',
        headStyles: {
            fillColor: [15, 15, 15],
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold',
            cellPadding: 4,
            halign: 'left'
        },
        bodyStyles: {
            fontSize: 9,
            cellPadding: 3,
            lineColor: [240, 240, 240],
            lineWidth: { bottom: 0.1 }
        },
        columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 40 },
            2: { cellWidth: 40 }
        },
        margin: { top: 50, left: 14, right: 14 }
    })

    if (includeTotal) {
        const totalHours = Math.floor(totalSeconds / 3600)
        const totalMinutes = Math.floor((totalSeconds % 3600) / 60)

        const finalY = doc.lastAutoTable?.finalY ?? 52

        doc.setFillColor(245, 245, 250)
        doc.roundedRect(14, finalY + 10, 182, 16, 2, 2, 'F')

        doc.setFontSize(12)
        doc.setTextColor(40, 40, 40)
        doc.setFont('helvetica', 'normal')
        doc.text('Tiempo Total Facturable:', 20, finalY + 20)

        doc.setFontSize(14)
        doc.setTextColor(99, 102, 241)
        doc.setFont('helvetica', 'bold')
        doc.text(`${totalHours}h ${totalMinutes}m`, 85, finalY + 20)
    }

    doc.save(filename)
}
