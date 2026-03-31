'use client'
import { TaskCalendar } from '@/components/tasks/TaskCalendar'
import { useTaskStore } from '@/stores/useTaskStore'

export default function CalendarPage() {
    const { openCreateModal } = useTaskStore()

    const handleDateClick = (date: Date) => {
        openCreateModal(date)
    }

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Calendar</h1>
                    <p className="text-zinc-400">View tasks by due date</p>
                </div>
            </div>

            <div className="h-[calc(100vh-200px)]">
                <TaskCalendar onDateClick={handleDateClick} />
            </div>
        </div>
    )
}
