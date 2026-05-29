'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, Folder, CheckSquare, Search, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useProjectStore } from '@/stores/useProjectStore'
import { useUserStore } from '@/stores/useUserStore'
import { useTaskStore } from '@/stores/useTaskStore'
import { useTranslation } from '@/stores/useLocaleStore'
import { cn } from '@/lib/utils'
import { format, set, addMinutes, eachDayOfInterval, getDay, startOfMonth, endOfMonth } from 'date-fns'

interface Task {
    id: string
    title: string
}

interface BulkTimeEntryModalProps {
    isOpen: boolean
    onClose: () => void
    selectedDate: Date | null
    onEntryAdded: () => void
}

export function BulkTimeEntryModal({ isOpen, onClose, selectedDate, onEntryAdded }: BulkTimeEntryModalProps) {
    const { projects, fetchProjects } = useProjectStore()
    const { currentWorkspace } = useUserStore()
    const { t, locale } = useTranslation()
    const supabaseRef = useRef(createClient())

    const [mounted, setMounted] = useState(false)
    const [selectedProjectId, setSelectedProjectId] = useState<string>('')
    const [tasks, setTasks] = useState<Task[]>([])
    const [selectedTaskId, setSelectedTaskId] = useState<string>('')
    const [hours, setHours] = useState<string>('')
    const [minutes, setMinutes] = useState<string>('0')
    const [description, setDescription] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // UI state
    const [showProjectDropdown, setShowProjectDropdown] = useState(false)
    const [showTaskDropdown, setShowTaskDropdown] = useState(false)
    const [projectSearch, setProjectSearch] = useState('')
    const [taskSearch, setTaskSearch] = useState('')

    // Inline task creation state
    const [isCreatingTask, setIsCreatingTask] = useState(false)
    const [newTaskTitle, setNewTaskTitle] = useState('')
    const [isCreatingTaskLoading, setIsCreatingTaskLoading] = useState(false)

    // Multi-day bulk logging state
    const [isMultiDay, setIsMultiDay] = useState(false)
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [weekdays, setWeekdays] = useState<Record<number, boolean>>({
        1: true, // Monday
        2: true, // Tuesday
        3: true, // Wednesday
        4: true, // Thursday
        5: true, // Friday
        6: false, // Saturday
        0: false  // Sunday
    })

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    useEffect(() => {
        if (isOpen && currentWorkspace) {
            fetchProjects(currentWorkspace.id)
            setSelectedProjectId('')
            setSelectedTaskId('')
            setHours('')
            setMinutes('0')
            setDescription('')
            setIsCreatingTask(false)
            setNewTaskTitle('')
            
            // Reset multi-day state
            setIsMultiDay(false)
            const initialDate = selectedDate || new Date()
            setStartDate(format(initialDate, 'yyyy-MM-dd'))
            setEndDate(format(endOfMonth(initialDate), 'yyyy-MM-dd'))
            setWeekdays({
                1: true,
                2: true,
                3: true,
                4: true,
                5: true,
                6: false,
                0: false
            })
        }
    }, [isOpen, currentWorkspace, fetchProjects, selectedDate])

    // Fetch tasks when project changes
    useEffect(() => {
        if (!selectedProjectId) {
            setTasks([])
            setSelectedTaskId('')
            return
        }

        const fetchProjectTasks = async () => {
            const { data, error } = await supabaseRef.current
                .from('tasks')
                .select('id, title')
                .eq('project_id', selectedProjectId)
                .order('created_at', { ascending: false })

            if (!error && data) {
                setTasks(data as Task[])
            }
        }

        setTaskSearch('')
        fetchProjectTasks()
    }, [selectedProjectId])

    const handleCreateTask = async () => {
        if (!newTaskTitle.trim() || !selectedProjectId) return
        setIsCreatingTaskLoading(true)
        try {
            const { createTask } = useTaskStore.getState()
            const newTask = await createTask({
                title: newTaskTitle.trim(),
                project_id: selectedProjectId,
                status: 'todo'
            })
            if (newTask) {
                // Add the newly created task to our local tasks state
                setTasks(prev => [newTask, ...prev])
                setSelectedTaskId(newTask.id)
                setIsCreatingTask(false)
                setNewTaskTitle('')
            }
        } catch (error) {
            console.error('Failed to quick-create task:', error)
        } finally {
            setIsCreatingTaskLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedTaskId) return
        
        const h = parseInt(hours) || 0
        const m = parseInt(minutes) || 0
        if (h === 0 && m === 0) return

        setIsSubmitting(true)
        try {
            if (isMultiDay) {
                // Bulk multi-day creation
                const start = new Date(startDate + 'T00:00:00')
                const end = new Date(endDate + 'T23:59:59')
                if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
                    setIsSubmitting(false)
                    return
                }

                const intervalDays = eachDayOfInterval({ start, end })
                const targetDays = intervalDays.filter(day => {
                    const dow = getDay(day) // 0 = Sun, 1 = Mon, ..., 6 = Sat
                    return weekdays[dow]
                })

                if (targetDays.length === 0) {
                    setIsSubmitting(false)
                    return
                }

                const totalMinutes = (h * 60) + m

                // Submit in parallel
                const promises = targetDays.map(day => {
                    const startTime = set(day, { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 })
                    const endTime = addMinutes(startTime, totalMinutes)

                    return (supabaseRef.current.rpc as any)('add_manual_time_entry', {
                        p_task_id: selectedTaskId,
                        p_start_time: startTime.toISOString(),
                        p_end_time: endTime.toISOString(),
                        p_description: description || null
                    })
                })

                const results = await Promise.all(promises)
                const errorResult = results.find(res => res.error)
                if (errorResult && errorResult.error) throw errorResult.error
            } else {
                if (!selectedDate) return
                // Set arbitrary start time at 09:00:00 for the selected date
                const startTime = set(selectedDate, { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 })
                const totalMinutes = (h * 60) + m
                const endTime = addMinutes(startTime, totalMinutes)

                const { error } = await (supabaseRef.current.rpc as any)('add_manual_time_entry', {
                    p_task_id: selectedTaskId,
                    p_start_time: startTime.toISOString(),
                    p_end_time: endTime.toISOString(),
                    p_description: description || null
                })

                if (error) throw error
            }

            onEntryAdded()
            onClose()
        } catch (error) {
            console.error('Failed to add time entry:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!mounted) return null

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-[#0F0F0F] border border-white/10 rounded-3xl shadow-2xl shadow-black/80 z-10 ring-1 ring-white/5"
                    >
                        <div className="relative p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] rounded-t-3xl">
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-tight">Add Time Entry</h2>
                                {selectedDate && (
                                    <p className="text-sm text-zinc-400">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
                                )}
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Toggle Multi-Day */}
                            <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl">
                                <div className="space-y-0.5">
                                    <span className="text-sm font-semibold text-white">
                                        {locale === 'es' ? 'Registrar en múltiples días' : 'Log on multiple days'}
                                    </span>
                                    <p className="text-xs text-zinc-500">
                                        {locale === 'es' 
                                            ? 'Registra esta actividad en varios días a la vez (ej. de lunes a viernes)' 
                                            : 'Log this activity across several days at once (e.g. Mon-Fri)'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsMultiDay(!isMultiDay)}
                                    className={cn(
                                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                        isMultiDay ? "bg-primary-500" : "bg-zinc-850"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                            isMultiDay ? "translate-x-5" : "translate-x-0"
                                        )}
                                    />
                                </button>
                            </div>

                            {isMultiDay && (
                                <div className="space-y-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-zinc-400">
                                                {locale === 'es' ? 'Fecha Inicio' : 'Start Date'}
                                            </label>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                required
                                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary-500/50"
                                                style={{ colorScheme: 'dark' }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-zinc-400">
                                                {locale === 'es' ? 'Fecha Fin' : 'End Date'}
                                            </label>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                required
                                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-primary-500/50"
                                                style={{ colorScheme: 'dark' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Weekdays selector */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-zinc-400">
                                            {locale === 'es' ? 'Días de la semana' : 'Days of the week'}
                                        </label>
                                        <div className="flex justify-between gap-1">
                                            {[
                                                { value: 1, label: locale === 'es' ? 'L' : 'M' },
                                                { value: 2, label: locale === 'es' ? 'M' : 'T' },
                                                { value: 3, label: locale === 'es' ? 'X' : 'W' },
                                                { value: 4, label: locale === 'es' ? 'J' : 'T' },
                                                { value: 5, label: locale === 'es' ? 'V' : 'F' },
                                                { value: 6, label: locale === 'es' ? 'S' : 'S' },
                                                { value: 0, label: locale === 'es' ? 'D' : 'S' }
                                            ].map((day) => {
                                                const isActive = weekdays[day.value]
                                                return (
                                                    <button
                                                        key={day.value}
                                                        type="button"
                                                        onClick={() => setWeekdays(prev => ({
                                                            ...prev,
                                                            [day.value]: !prev[day.value]
                                                        }))}
                                                        className={cn(
                                                            "w-8 h-8 rounded-full text-xs font-bold transition-all flex items-center justify-center border",
                                                            isActive
                                                                ? "bg-primary-500/20 border-primary-500 text-primary-400 shadow-[0_0_8px_rgba(56,189,248,0.2)]"
                                                                : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white"
                                                        )}
                                                    >
                                                        {day.label}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Project Selection */}
                            <div className="space-y-2 relative">
                                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                    <Folder size={14} /> Project
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowProjectDropdown(!showProjectDropdown)
                                        setShowTaskDropdown(false)
                                    }}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors text-left"
                                >
                                    {selectedProjectId 
                                        ? projects.find(p => p.id === selectedProjectId)?.name 
                                        : <span className="text-zinc-500">Select Project...</span>}
                                </button>

                                {showProjectDropdown && (
                                    <div className="absolute top-full left-0 mt-2 w-full bg-[#18181b] border border-white/10 rounded-xl shadow-xl overflow-hidden z-20">
                                        <div className="p-2 border-b border-white/5 flex items-center gap-2 px-3">
                                            <Search size={14} className="text-zinc-500" />
                                            <input
                                                autoFocus
                                                type="text"
                                                value={projectSearch}
                                                onChange={(e) => setProjectSearch(e.target.value)}
                                                placeholder="Search projects..."
                                                className="w-full bg-transparent py-1.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none"
                                            />
                                        </div>
                                        <div className="max-h-48 overflow-y-auto">
                                            {projects.filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase())).map((project) => (
                                                <button
                                                    key={project.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedProjectId(project.id)
                                                        setShowProjectDropdown(false)
                                                    }}
                                                    className="w-full text-left px-4 py-3 text-sm text-zinc-400 hover:bg-white/5 hover:text-white flex items-center gap-3"
                                                >
                                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                                                    {project.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Task Selection */}
                            <div className="space-y-2 relative">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                        <CheckSquare size={14} /> {locale === 'es' ? 'Tarea' : 'Task'}
                                    </label>
                                    {selectedProjectId && !isCreatingTask && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsCreatingTask(true)
                                                setNewTaskTitle('')
                                            }}
                                            className="text-xs text-primary-400 hover:text-primary-300 font-semibold transition-colors flex items-center gap-1"
                                        >
                                            <Plus size={12} /> {locale === 'es' ? 'Crear Tarea' : 'Create Task'}
                                        </button>
                                    )}
                                </div>

                                {isCreatingTask ? (
                                    <div className="flex gap-2">
                                        <input
                                            autoFocus
                                            type="text"
                                            value={newTaskTitle}
                                            onChange={(e) => setNewTaskTitle(e.target.value)}
                                            placeholder={locale === 'es' ? 'Escribe el nombre de la tarea...' : 'Enter task name...'}
                                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary-500/50"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault()
                                                    handleCreateTask()
                                                } else if (e.key === 'Escape') {
                                                    setIsCreatingTask(false)
                                                    setNewTaskTitle('')
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleCreateTask}
                                            disabled={!newTaskTitle.trim() || isCreatingTaskLoading}
                                            className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold rounded-xl transition-colors text-sm"
                                        >
                                            {isCreatingTaskLoading ? '...' : (locale === 'es' ? 'Crear' : 'Create')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsCreatingTask(false)
                                                setNewTaskTitle('')
                                            }}
                                            className="px-3 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors text-sm"
                                        >
                                            {locale === 'es' ? 'Cancelar' : 'Cancel'}
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            disabled={!selectedProjectId}
                                            onClick={() => {
                                                setShowTaskDropdown(!showTaskDropdown)
                                                setShowProjectDropdown(false)
                                            }}
                                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {selectedTaskId 
                                                ? tasks.find(t => t.id === selectedTaskId)?.title 
                                                : <span className="text-zinc-500">{!selectedProjectId ? (locale === 'es' ? 'Selecciona un proyecto primero' : 'Select a project first') : (locale === 'es' ? 'Seleccionar Tarea...' : 'Select Task...')}</span>}
                                        </button>

                                        {showTaskDropdown && (
                                            <div className="absolute top-full left-0 mt-2 w-full bg-[#18181b] border border-white/10 rounded-xl shadow-xl overflow-hidden z-20">
                                                <div className="p-2 border-b border-white/5 flex items-center gap-2 px-3">
                                                    <Search size={14} className="text-zinc-500" />
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        value={taskSearch}
                                                        onChange={(e) => setTaskSearch(e.target.value)}
                                                        placeholder={locale === 'es' ? 'Buscar tareas...' : 'Search tasks...'}
                                                        className="w-full bg-transparent py-1.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none"
                                                    />
                                                </div>
                                                <div className="max-h-48 overflow-y-auto">
                                                    {tasks.length === 0 ? (
                                                        <div className="px-4 py-3 text-sm text-zinc-500">{locale === 'es' ? 'No se encontraron tareas' : 'No tasks found in this project'}</div>
                                                    ) : (
                                                        tasks.filter(t => t.title.toLowerCase().includes(taskSearch.toLowerCase())).map((task) => (
                                                            <button
                                                                key={task.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedTaskId(task.id)
                                                                    setShowTaskDropdown(false)
                                                                }}
                                                                className="w-full text-left px-4 py-3 text-sm text-zinc-400 hover:bg-white/5 hover:text-white"
                                                            >
                                                                {task.title}
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Duration */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                    <Clock size={14} /> Duration
                                </label>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                value={hours}
                                                onChange={(e) => setHours(e.target.value)}
                                                placeholder="0"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary-500/50"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">h</span>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="0"
                                                max="59"
                                                value={minutes}
                                                onChange={(e) => setMinutes(e.target.value)}
                                                placeholder="0"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary-500/50"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">m</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                    Description (Optional)
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="What did you work on?"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary-500/50 resize-none h-24"
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 rounded-xl text-zinc-400 font-medium hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!selectedTaskId || (!hours && (!minutes || minutes === '0')) || isSubmitting}
                                    className="px-6 py-2 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/10 flex items-center gap-2"
                                >
                                    {isSubmitting ? 'Saving...' : 'Save Entry'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    )
}
