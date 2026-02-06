'use client'

import { useState } from 'react'
import { Key, Download, Trash2, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function AccountSection() {
    const router = useRouter()
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleteConfirmText, setDeleteConfirmText] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)

    const handlePasswordReset = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user?.email) return

        const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
            redirectTo: `${window.location.origin}/auth/callback`
        })

        if (!error) {
            alert('Se ha enviado un email para restablecer tu contraseña')
        }
    }

    const handleExportData = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        // Fetch all user data
        const [
            { data: profile },
            { data: tasks },
            { data: projects },
            { data: timeEntries },
            { data: preferences }
        ] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', user.id).single(),
            supabase.from('tasks').select('*').eq('user_id', user.id),
            supabase.from('projects').select('*').eq('user_id', user.id),
            supabase.from('time_entries').select('*').eq('user_id', user.id),
            supabase.from('user_preferences').select('*').eq('user_id', user.id).single()
        ])

        const exportData = {
            profile,
            tasks,
            projects,
            timeEntries,
            preferences,
            exportedAt: new Date().toISOString()
        }

        // Download as JSON
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `timeryx_data_${new Date().toISOString().split('T')[0]}.json`
        link.click()
        URL.revokeObjectURL(url)
    }

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'ELIMINAR') {
            alert('Por favor escribe "ELIMINAR" para confirmar')
            return
        }

        setIsDeleting(true)
        const supabase = createClient()

        // Note: Actual account deletion should be handled server-side
        // This is a placeholder for the UI flow
        alert('La eliminación de cuenta debe ser procesada por el administrador. Contacta con soporte.')
        setIsDeleting(false)
        setShowDeleteConfirm(false)
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold text-white mb-4">Cuenta y Seguridad</h3>
            </div>

            {/* Password Reset */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20">
                <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <Key className="w-5 h-5 text-blue-400 mt-0.5" />
                        <div>
                            <h4 className="text-white font-medium mb-1">Cambiar Contraseña</h4>
                            <p className="text-zinc-400 text-sm">
                                Recibirás un email con instrucciones para cambiar tu contraseña
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handlePasswordReset}
                        className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition-colors"
                    >
                        Enviar Email
                    </button>
                </div>
            </div>

            {/* Export Data */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <Download className="w-5 h-5 text-emerald-400 mt-0.5" />
                        <div>
                            <h4 className="text-white font-medium mb-1">Exportar Todos los Datos</h4>
                            <p className="text-zinc-400 text-sm">
                                Descarga todos tus datos en formato JSON (GDPR)
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleExportData}
                        className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium transition-colors"
                    >
                        Descargar
                    </button>
                </div>
            </div>

            {/* Delete Account */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/20">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                    <div className="flex-1">
                        <h4 className="text-white font-medium mb-1">Zona Peligrosa</h4>
                        <p className="text-zinc-400 text-sm mb-3">
                            Eliminar tu cuenta es permanente y no se puede deshacer
                        </p>

                        {!showDeleteConfirm ? (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Eliminar Cuenta
                            </button>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-red-400 text-sm font-medium">
                                    Escribe "ELIMINAR" para confirmar:
                                </p>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    placeholder="ELIMINAR"
                                    className="w-full px-4 py-2 bg-white/5 border border-red-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleDeleteAccount}
                                        disabled={isDeleting || deleteConfirmText !== 'ELIMINAR'}
                                        className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        {isDeleting ? 'Eliminando...' : 'Confirmar Eliminación'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowDeleteConfirm(false)
                                            setDeleteConfirmText('')
                                        }}
                                        className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
