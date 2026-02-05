'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, Calendar as CalendarIcon } from 'lucide-react'
import { useTaskStore } from '@/stores/useTaskStore'
import { useTimerStore } from '@/stores/useTimerStore'
import { useProjectStore } from '@/stores/useProjectStore'
import { CustomSelect } from '@/components/ui/CustomSelect'

interface ManualTimeDialogProps {
    isOpen: boolean
    onClose: () => void
    preSelectedTaskId?: string
}

export function ManualTimeDialog({ isOpen, onClose, preSelectedTaskId }: ManualTimeDialogProps) {
    const { tasks } = useTaskStore()
    const { projects } = useProjectStore()
    const { addManualEntry } = useTimerStore()

    const [selectedTaskId, setSelectedTaskId] = useState(preSelectedTaskId || '')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [hours, setHours] = useState('0')
    const [minutes, setMinutes] = useState('30')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Update selectedTaskId when preSelectedTaskId changes
    useEffect(() => {
        if (preSelectedTaskId) {
            setSelectedTaskId(preSelectedTaskId)
        }
    }, [preSelectedTaskId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedTaskId) return

        setIsSubmitting(true)
        const totalSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60

        try {
            await addManualEntry(selectedTaskId, totalSeconds, date)
            onClose()
            // Reset form
            setHours('0')
            setMinutes('30')
            if (!preSelectedTaskId) {
                setSelectedTaskId('')
            }
        } catch (error) {
            console.error('Failed to add manual entry:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const selectedTask = tasks.find(t => t.id === selectedTaskId)
    const selectedProject = selectedTask ? projects.find(p => p.id === selectedTask.project_id) : null

    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    if (!mounted) return null

    const dialogContent = (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Dialog */}
                    <div className="fixed inset-0 flex items-center justify-center z-[101] p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#0F0F0F] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative pointer-events-auto"
                        >
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent pointer-events-none" />

                            {/* Header */}
                            <div className="relative p-6 border-b border-white/5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                                            <Clock className="w-5 h-5 text-primary-400" />
                                        </div>
                                        <h2 className="text-xl font-bold text-white">Log Time Manually</h2>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="relative p-6 space-y-5">
                                {/* Task Display/Selector */}
                                <div className="space-y-2">
                                    {preSelectedTaskId && selectedTask ? (
                                        <>
                                            <label className="text-sm font-medium text-zinc-400">Task</label>
                                            <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white">
                                                <div className="font-medium">{selectedTask.title}</div>
                                                {selectedProject && (
                                                    <div className="text-xs text-zinc-500 mt-1">{selectedProject.name}</div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <CustomSelect
                                            label="Task"
                                            value={selectedTaskId}
                                            onChange={setSelectedTaskId}
                                            options={[
                                                { value: '', label: 'Select a task...' },
                                                ...tasks.map((task) => {
                                                    const project = projects.find(p => p.id === task.project_id)
                                                    return {
                                                        value: task.id,
                                                        label: `${task.title}${project ? ` (${project.name})` : ''}`
                                                    }
                                                })
                                            ]}
                                            placeholder="Select a task..."
                                        />
                                    )}
                                </div>

                                {/* Date Picker */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Date</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            required
                                            className="w-full px-4 py-2.5 bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all hover:border-white/20 hover:from-white/[0.12] hover:to-white/[0.04] backdrop-blur-sm cursor-pointer"
                                            style={{ colorScheme: 'dark' }}
                                        />
                                        <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Duration Input */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Duration</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <input
                                                type="number"
                                                min="0"
                                                max="23"
                                                value={hours}
                                                onChange={(e) => setHours(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center font-mono text-lg focus:outline-none focus:border-primary-500/50 focus:bg-white/10 transition-all"
                                            />
                                            <p className="text-xs text-zinc-500 text-center">Hours</p>
                                        </div>
                                        <div className="space-y-1">
                                            <input
                                                type="number"
                                                min="0"
                                                max="59"
                                                step="5"
                                                value={minutes}
                                                onChange={(e) => setMinutes(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center font-mono text-lg focus:outline-none focus:border-primary-500/50 focus:bg-white/10 transition-all"
                                            />
                                            <p className="text-xs text-zinc-500 text-center">Minutes</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !selectedTaskId}
                                        className="flex-1 px-4 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'Logging...' : 'Log Time'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )

    return createPortal(dialogContent, document.body)
}
