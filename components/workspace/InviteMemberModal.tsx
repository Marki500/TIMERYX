'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/stores/useToast'
import { useUserStore } from '@/stores/useUserStore'

interface InviteMemberModalProps {
    isOpen: boolean
    onClose: () => void
    onInviteSuccess?: () => void
}

export function InviteMemberModal({ isOpen, onClose, onInviteSuccess }: InviteMemberModalProps) {
    const { currentWorkspace } = useUserStore()
    const [email, setEmail] = useState('')
    const [role, setRole] = useState('member')
    const [isInviting, setIsInviting] = useState(false)
    const { addToast } = useToast()
    const supabase = createClient()

    const handleInvite = async () => {
        if (!email.trim() || !currentWorkspace) return

        setIsInviting(true)

        try {
            const { inviteMember } = await import('@/app/actions/invite-member')
            const result = await inviteMember(currentWorkspace.id, email.trim(), role)

            if (result.error) {
                addToast(result.error, 'error')
            } else {
                addToast(result.warning || 'Invitación enviada correctamente', result.warning ? 'info' : 'success')
                onInviteSuccess?.()
                onClose()
                setEmail('')
                setRole('member')
            }

        } catch (error) {
            console.error('Error inviting member:', error)
            addToast('Error al enviar invitación', 'error')
        } finally {
            setIsInviting(false)
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
                        <h3 className="text-xl font-bold text-white">Invitar Miembro</h3>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                        >
                            <X className="w-4 h-4 text-zinc-400" />
                        </button>
                    </div>

                    <div className="space-y-5">
                        {/* Email Input */}
                        <div>
                            <label className="text-xs font-medium text-zinc-400 uppercase mb-2 block tracking-wider">
                                Correo Electrónico
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="usuario@ejemplo.com"
                                    autoFocus
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
                                />
                            </div>
                        </div>

                        {/* Role Select */}
                        <div>
                            <label className="text-xs font-medium text-zinc-400 uppercase mb-2 block tracking-wider">
                                Rol
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { value: 'member', label: 'Miembro' },
                                    { value: 'admin', label: 'Admin' },
                                    { value: 'client', label: 'Cliente' }
                                ].map((r) => (
                                    <button
                                        key={r.value}
                                        onClick={() => setRole(r.value)}
                                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${role === r.value
                                            ? 'bg-primary-500/10 border-primary-500 text-primary-400'
                                            : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'
                                            }`}
                                    >
                                        <Shield className="w-4 h-4" />
                                        <span className="capitalize text-sm">{r.label}</span>
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-zinc-500 mt-2">
                                {role === 'admin'
                                    ? 'Puede gestionar miembros, proyectos y tareas.'
                                    : role === 'client'
                                        ? 'Solo puede ver proyectos marcados como visibles. Sin acceso a herramientas internas.'
                                        : 'Puede crear y gestionar sus propias tareas y ver proyectos.'}
                            </p>
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
                                onClick={handleInvite}
                                disabled={!email.trim() || isInviting}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-indigo-500 text-white font-bold hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isInviting ? 'Enviando...' : 'Enviar Invitación'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
