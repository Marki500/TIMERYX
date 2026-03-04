'use client'

import { useState, useEffect } from 'react'
import { X, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProjectStore } from '@/stores/useProjectStore'
import { createClient } from '@/lib/supabase/client'

interface EditProjectDialogProps {
    isOpen: boolean
    onClose: () => void
    project: any
}

const COLORS = [
    '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899',
]

export function EditProjectDialog({ isOpen, onClose, project }: EditProjectDialogProps) {
    const { fetchProjects, isLoading } = useProjectStore()
    const [name, setName] = useState(project.name)
    const [color, setColor] = useState(project.color)
    const [budget, setBudget] = useState(project.budget_hours_monthly?.toString() || '')
    const [url, setUrl] = useState(project.url || '')
    const [isClientVisible, setIsClientVisible] = useState(project.is_client_visible)

    useEffect(() => {
        setName(project.name)
        setColor(project.color)
        setBudget(project.budget_hours_monthly?.toString() || '')
        setUrl(project.url || '')
        setIsClientVisible(project.is_client_visible)
    }, [project])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const { updateProject } = useProjectStore.getState()

        const { error } = await updateProject(project.id, {
            name,
            color,
            budget_hours_monthly: Number(budget) || 0,
            is_client_visible: isClientVisible,
            url: url.trim() || null
        })

        if (!error) {
            onClose()
        }
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                    className="relative w-full max-w-md bg-[#161616] border border-white/10 rounded-xl p-6 shadow-2xl"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white">Edit Project</h2>
                        <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Project Name</label>
                            <input
                                type="text" required value={name} onChange={(e) => setName(e.target.value)}
                                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Color</label>
                            <div className="flex flex-wrap gap-2">
                                {COLORS.map((c) => (
                                    <button
                                        key={c} type="button" onClick={() => setColor(c)}
                                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-white' : 'border-transparent'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Website URL (for favicon)</label>
                            <div className="flex items-center gap-3">
                                {url.trim() ? (
                                    <img
                                        src={`https://www.google.com/s2/favicons?domain=${url.trim()}&sz=32`}
                                        alt="favicon" className="w-6 h-6 rounded"
                                    />
                                ) : <Globe className="w-6 h-6 text-zinc-600" />}
                                <input
                                    type="text" value={url} onChange={(e) => setUrl(e.target.value)}
                                    className="flex-1 bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none"
                                    placeholder="e.g. google.com"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Budget (Hours)</label>
                                <input
                                    type="number" min="0" value={budget} onChange={(e) => setBudget(e.target.value)}
                                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none"
                                />
                            </div>
                            <div className="flex items-center pt-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox" checked={isClientVisible} onChange={(e) => setIsClientVisible(e.target.checked)}
                                        className="w-4 h-4 rounded border-white/10 bg-zinc-900 text-primary-500"
                                    />
                                    <span className="text-sm text-zinc-400">Visible to Client</span>
                                </label>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-white">Cancel</button>
                            <button
                                type="submit" disabled={isLoading || !name}
                                className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
                            >
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
