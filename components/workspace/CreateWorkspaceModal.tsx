'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/stores/useToast'

interface CreateWorkspaceModalProps {
    isOpen: boolean
    onClose: () => void
}

export function CreateWorkspaceModal({ isOpen, onClose }: CreateWorkspaceModalProps) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [color, setColor] = useState('#3B82F6')
    const [isCreating, setIsCreating] = useState(false)
    const { addToast } = useToast()
    const supabase = createClient()

    const handleCreate = async () => {
        if (!name.trim()) {
            addToast('El nombre es requerido', 'error')
            return
        }

        setIsCreating(true)

        try {
            const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(7)

            const { error } = await (supabase.rpc as any)('create_workspace', {
                p_name: name,
                p_slug: slug
            })

            if (error) throw error

            // Update workspace with description and color
            const { data: workspaces } = await supabase
                .from('workspaces')
                .select('*')
                .eq('slug', slug)
                .single() as any

            if (workspaces) {
                await (supabase
                    .from('workspaces') as any)
                    .update({
                        description: description || null,
                        color: color
                    })
                    .eq('id', workspaces.id)
            }

            addToast('Workspace creado correctamente', 'success')

            // Reload to fetch new workspace
            setTimeout(() => {
                window.location.reload()
            }, 500)

        } catch (error) {
            console.error('Error creating workspace:', error)
            addToast('Error al crear workspace', 'error')
        } finally {
            setIsCreating(false)
        }
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-md bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl z-10"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white">Crear Workspace</h3>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                        >
                            <X className="w-4 h-4 text-zinc-400" />
                        </button>
                    </div>

                    <div className="space-y-5">
                        {/* Name Input */}
                        <div>
                            <label className="text-xs font-medium text-zinc-400 uppercase mb-2 block tracking-wider">
                                Nombre del Workspace *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Mi Empresa"
                                autoFocus
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
                            />
                        </div>


                        {/* Color Picker */}
                        <div>
                            <label className="text-xs font-medium text-zinc-400 uppercase mb-2 block tracking-wider">
                                Color del Espacio
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {[
                                    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
                                    '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'
                                ].map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => setColor(c)}
                                        className={`w-6 h-6 rounded-full transition-all ${color === c
                                            ? 'ring-2 ring-white ring-offset-2 ring-offset-[#09090b] scale-110'
                                            : 'hover:scale-110 hover:opacity-80'
                                            }`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Description Input */}
                        <div>
                            <label className="text-xs font-medium text-zinc-400 uppercase mb-2 block tracking-wider">
                                Descripción (opcional)
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe tu workspace..."
                                rows={3}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all resize-none"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 rounded-xl bg-white/5 text-zinc-400 font-medium hover:bg-white/10 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={!name.trim() || isCreating}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-indigo-500 text-white font-bold hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCreating ? 'Creando...' : 'Crear'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div >
        </AnimatePresence >
    )
}
