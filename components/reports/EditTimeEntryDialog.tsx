'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useTaskStore } from '@/stores/useTaskStore'
import { useProjectStore } from '@/stores/useProjectStore'
import { CustomSelect } from '@/components/ui/CustomSelect'

export interface EntryToEdit {
    id: string
    task_id: string
    start_time: string
    end_time: string
}

interface EditTimeEntryDialogProps {
    isOpen: boolean
    onClose: () => void
    entry: EntryToEdit | null
    onSaved: () => void
}

export function EditTimeEntryDialog({ isOpen, onClose, entry, onSaved }: EditTimeEntryDialogProps) {
    const { tasks } = useTaskStore()
    const { projects } = useProjectStore()

    const [selectedTaskId, setSelectedTaskId] = useState('')
    const [date, setDate] = useState('')
    const [hours, setHours] = useState('0')
    const [minutes, setMinutes] = useState('30')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => { setMounted(true); return () => setMounted(false) }, [])

    // Pre-fill form when entry changes
    useEffect(() => {
        if (!entry) return
        setSelectedTaskId(entry.task_id)
        setDate(entry.start_time.split('T')[0])
        const durationSeconds = Math.max(0, (new Date(entry.end_time).getTime() - new Date(entry.start_time).getTime()) / 1000)
        setHours(String(Math.floor(durationSeconds / 3600)))
        setMinutes(String(Math.floor((durationSeconds % 3600) / 60)))
    }, [entry])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!entry || !selectedTaskId) return

        setIsSubmitting(true)
        const supabase = createClient()

        const totalSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60
        const newStart = new Date(date + 'T12:00:00')
        const newEnd = new Date(newStart.getTime() + totalSeconds * 1000)

        const { error } = await (supabase
            .from('time_entries') as any)
            .update({
                task_id: selectedTaskId,
                start_time: newStart.toISOString(),
                end_time: newEnd.toISOString(),
            })
            .eq('id', entry.id)

        setIsSubmitting(false)

        if (!error) {
            onSaved()
            onClose()
        }
    }

    if (!mounted) return null

    const selectedTask = tasks.find(t => t.id === selectedTaskId)
    const selectedProject = selectedTask ? projects.find(p => p.id === selectedTask.project_id) : null

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />
                    <div className="fixed inset-0 flex items-center justify-center z-[101] p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#0F0F0F] border border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative pointer-events-auto"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent pointer-events-none" />

                            {/* Header */}
                            <div className="relative p-6 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-primary-400" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white">Edit Time Entry</h2>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="relative p-6 space-y-5">
                                {/* Task selector */}
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

                                {/* Date */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Date</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        required
                                        className="w-full px-4 py-2.5 bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>

                                {/* Duration */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-400">Duration</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <input
                                                type="number" min="0" max="23" value={hours}
                                                onChange={(e) => setHours(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center font-mono text-lg focus:outline-none focus:border-primary-500/50 focus:bg-white/10 transition-all"
                                            />
                                            <p className="text-xs text-zinc-500 text-center">Hours</p>
                                        </div>
                                        <div className="space-y-1">
                                            <input
                                                type="number" min="0" max="59" value={minutes}
                                                onChange={(e) => setMinutes(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center font-mono text-lg focus:outline-none focus:border-primary-500/50 focus:bg-white/10 transition-all"
                                            />
                                            <p className="text-xs text-zinc-500 text-center">Minutes</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors">
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !selectedTaskId}
                                        className="flex-1 px-4 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'Saving...' : 'Save changes'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    )
}
