import type { jsPDF as JsPDFInstance } from 'jspdf'

declare module 'jspdf' {
    interface jsPDF {
        lastAutoTable?: {
            finalY: number
        }
    }
}

export interface ExportTimeEntry {
    id: string
    start_time: string
    end_time: string | null
    description: string | null
    task: {
        title: string
        description: string | null
        status: string
        project?: {
            name: string
            color: string
        }
    }
}

export type { JsPDFInstance }
