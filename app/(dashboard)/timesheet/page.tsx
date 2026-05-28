import { TimesheetMonthView } from '@/components/timesheet/TimesheetMonthView'

export const metadata = {
    title: 'Timesheet | Timeryx',
    description: 'Manage and review your monthly timesheet.',
}

export default function TimesheetPage() {
    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Monthly Timesheet</h1>
                    <p className="text-zinc-400">View and manage your time entries for the month.</p>
                </div>
            </div>

            <TimesheetMonthView />
        </div>
    )
}
