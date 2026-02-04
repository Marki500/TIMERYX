'use client'

import { useState, useEffect } from 'react'
import { useTaskStore } from '@/stores/useTaskStore'
import { useUserStore } from '@/stores/useUserStore'
import { createClient } from '@/lib/supabase/client'
import { TaskTable } from '@/components/tasks/TaskTable'
import { TaskKanban } from '@/components/tasks/TaskKanban'
import { TaskCalendar } from '@/components/tasks/TaskCalendar'
import { ViewSwitcher } from '@/components/tasks/ViewSwitcher'
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog'

export default function DashboardPage() {
    const { tasks, fetchTasks, createTask, viewMode } = useTaskStore()
    const { currentWorkspace } = useUserStore()
    const supabase = createClient()

    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)

    // Initial fetch (mock for now if no backend connectivity or empty DB)
    useEffect(() => {
        // Attempt fetch, if empty we might want to show empty state or seed
        fetchTasks()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const handleDateClick = (date: Date) => {
        setSelectedDate(date)
        setIsTaskModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsTaskModalOpen(false)
        setSelectedDate(null)
    }

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Buenas tardes, Marc</h1>
                    <p className="text-zinc-400 text-lg">Aquí tienes el resumen de tu productividad hoy.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsTaskModalOpen(true)}
                        className="px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10"
                    >
                        + Nueva Tarea
                    </button>
                </div>
            </div>

            <CreateTaskDialog
                isOpen={isTaskModalOpen}
                onClose={handleCloseModal}
                initialDate={selectedDate}
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Horas Totales', value: '6h 12m', change: '+12%', color: 'from-blue-500/20 to-indigo-500/20' },
                    { label: 'Proyectos Activos', value: '4', change: '2 terminados', color: 'from-emerald-500/20 to-teal-500/20' },
                    { label: 'Tareas Pendientes', value: `${tasks.filter(t => t.status === 'todo').length}`, change: `${tasks.filter(t => t.priority === 'high' && t.status !== 'done').length} Urgentes`, color: 'from-orange-500/20 to-red-500/20' },
                ].map((stat, i) => (
                    <div key={i} className={`p-6 rounded-3xl bg-gradient-to-br ${stat.color} border border-white/5 backdrop-blur-sm`}>
                        <h3 className="text-zinc-400 font-medium mb-1">{stat.label}</h3>
                        <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                        <div className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-white/80">
                            {stat.change}
                        </div>
                    </div>
                ))}
            </div>

            <ViewSwitcher />

            {/* Task Management Section */}
            <div className="flex flex-col gap-6">
                {/* Removed the h2 "Mis Tareas" and its surrounding div */}

                {/* Task Views */}
                <div className="min-h-[500px]">
                    {viewMode === 'table' && <TaskTable />}
                    {viewMode === 'kanban' && <TaskKanban />}
                    {viewMode === 'calendar' && (
                        <TaskCalendar onDateClick={handleDateClick} />
                    )}
                </div>
            </div>
        </div>
    )
}
