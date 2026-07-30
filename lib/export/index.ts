import type { ExportTimeEntry } from './types'
import { exportToCSV } from './csv'
import { exportToPDF } from './pdf-list'
import { exportMonthlyProjectPDF } from './pdf-monthly'

export type { ExportTimeEntry }

export function exportMonthlyProjectNoTotalPDF(entries: ExportTimeEntry[], filename: string = 'resumen_mensual_proyectos_sin_total.pdf') {
    return exportMonthlyProjectPDF(entries, { includeTotal: false, filename })
}

export {
    exportToCSV,
    exportToPDF,
    exportMonthlyProjectPDF
}
