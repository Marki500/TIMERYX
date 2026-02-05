'use client'

import { useState } from 'react'
import { TaskCalendar } from '@/components/tasks/TaskCalendar'
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog'

export default function CalendarPage() {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)

    const handleDateClick = (date: Date) => {
        setSelectedDate(date)
        setIsCreateOpen(true)
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

            <CreateTaskDialog
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                initialDate={selectedDate}
            />
        </div>
    )
}
