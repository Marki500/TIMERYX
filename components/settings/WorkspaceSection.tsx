'use client'

import { useState, useEffect } from 'react'
import { Save, Users, Trash2, AlertTriangle, Building, Palette } from 'lucide-react'
import { useUserStore } from '@/stores/useUserStore'
import { useProjectStore } from '@/stores/useProjectStore'
import { createClient } from '@/lib/supabase/client'
import { CustomSelect } from '@/components/ui/CustomSelect'
import { MembersList } from '@/components/workspace/MembersList'
import { InviteMemberModal } from '@/components/workspace/InviteMemberModal'
import { useToast } from '@/stores/useToast'
import { useRouter } from 'next/navigation'

export function WorkspaceSection() {
    const { currentWorkspace, setCurrentWorkspace, workspaces, setWorkspaces } = useUserStore()
    const { projects } = useProjectStore()
    const { addToast } = useToast()
    const router = useRouter()

    // Form State
    const [workspaceName, setWorkspaceName] = useState('')
    const [description, setDescription] = useState('')
    const [color, setColor] = useState('#3B82F6')
    const [defaultProjectId, setDefaultProjectId] = useState('')
    const [workingHoursStart, setWorkingHoursStart] = useState('09:00')
    const [workingHoursEnd, setWorkingHoursEnd] = useState('17:00')

    // UI State
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [showInviteModal, setShowInviteModal] = useState(false)
    const [refreshMembersKey, setRefreshMembersKey] = useState(0)
    const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)

    useEffect(() => {
        const fetchUserRole = async () => {
            if (!currentWorkspace?.id) return

            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                const { data } = await supabase
                    .from('workspace_members')
                    .select('role')
                    .eq('workspace_id', currentWorkspace.id)
                    .eq('user_id', user.id)
                    .single()

                if (data) setCurrentUserRole((data as any).role)
            }
        }

        if (currentWorkspace) {
            setWorkspaceName(currentWorkspace.name)
            setDescription(currentWorkspace.description || '')
            setColor(currentWorkspace.color || '#3B82F6')
            fetchUserRole()
        }
    }, [currentWorkspace])


    const handleSave = async () => {
        if (!currentWorkspace) return

        setIsSaving(true)
        const supabase = createClient()

        const { error } = await (supabase
            .from('workspaces') as any)
            .update({
                name: workspaceName,
                description: description,
                color: color
            })
            .eq('id', currentWorkspace.id)

        setIsSaving(false)

        if (!error) {
            addToast('Workspace actualizado correctamente', 'success')

            // Update store immediately
            const updated = {
                ...currentWorkspace,
                name: workspaceName,
                description: description,
                color: color
            }
            setCurrentWorkspace(updated)

            // Update workspaces list
            const updatedList = workspaces.map(w => w.id === updated.id ? updated : w)
            setWorkspaces(updatedList)
        } else {
            addToast('Error al actualizar el workspace', 'error')
        }
    }

    const handleDeleteWorkspace = async () => {
        if (!currentWorkspace) return

        // Prevent deleting the last workspace
        if (workspaces.length <= 1) {
            addToast('No puedes eliminar tu único workspace', 'error')
            setShowDeleteConfirm(false)
            return
        }

        setIsDeleting(true)
        const supabase = createClient()

        const { error } = await supabase
            .from('workspaces')
            .delete()
            .eq('id', currentWorkspace.id)

        setIsDeleting(false)
        setShowDeleteConfirm(false)

        if (!error) {
            addToast('Workspace eliminado', 'success')

            // Remove from store
            const newWorkspaces = workspaces.filter(w => w.id !== currentWorkspace.id)
            setWorkspaces(newWorkspaces)

            // Switch to another workspace
            if (newWorkspaces.length > 0) {
                setCurrentWorkspace(newWorkspaces[0])
                router.refresh()
            }
        } else {
            addToast('Error al eliminar el workspace', 'error')
        }
    }

    const projectOptions = [
        { value: '', label: 'Sin proyecto por defecto' },
        ...projects.map(p => ({ value: p.id, label: p.name }))
    ]

    const colors = [
        '#3B82F6', // Blue
        '#EF4444', // Red
        '#10B981', // Emerald
        '#F59E0B', // Amber
        '#8B5CF6', // Violet
        '#EC4899', // Pink
        '#6366F1', // Indigo
        '#14B8A6', // Teal
    ]

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Building className="w-5 h-5 text-primary-400" />
                    Configuración del Workspace
                </h3>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Workspace Name */}
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                        Nombre del Workspace
                    </label>
                    <input
                        type="text"
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all hover:bg-white/10 backdrop-blur-xl"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                        Descripción (Opcional)
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descripción breve de tu espacio de trabajo..."
                        rows={3}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all hover:bg-white/10 backdrop-blur-xl resize-none"
                    />
                </div>

                {/* Color Picker */}
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2 flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Color del Espacio
                    </label>
                    <div className="flex flex-wrap gap-3">
                        {colors.map((c) => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={`w-8 h-8 rounded-full transition-all ${color === c
                                    ? 'ring-2 ring-white ring-offset-2 ring-offset-[#09090b] scale-110'
                                    : 'hover:scale-110 hover:opacity-80'
                                    }`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Default Project & Working Hours Section (Grouped visually) */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                <h4 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Preferencias por defecto</h4>

                {/* Default Project */}
                <div>
                    <CustomSelect
                        label="Proyecto por Defecto"
                        value={defaultProjectId}
                        onChange={setDefaultProjectId}
                        options={projectOptions}
                    />
                    <p className="text-xs text-zinc-500 mt-2">
                        Las nuevas tareas se asignarán automáticamente a este proyecto
                    </p>
                </div>

                {/* Working Hours */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Hora de Inicio
                        </label>
                        <input
                            type="time"
                            value={workingHoursStart}
                            onChange={(e) => setWorkingHoursStart(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all hover:border-white/20 hover:from-white/[0.12] hover:to-white/[0.04] backdrop-blur-sm cursor-pointer"
                            style={{ colorScheme: 'dark' }}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">
                            Hora de Fin
                        </label>
                        <input
                            type="time"
                            value={workingHoursEnd}
                            onChange={(e) => setWorkingHoursEnd(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all hover:border-white/20 hover:from-white/[0.12] hover:to-white/[0.04] backdrop-blur-sm cursor-pointer"
                            style={{ colorScheme: 'dark' }}
                        />
                    </div>
                </div>
            </div>

            {/* Workspace Members */}
            <div className="pt-4 border-t border-white/10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary-400" />
                        <h4 className="text-md font-bold text-white">Miembros del Workspace</h4>
                    </div>
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="px-3 py-1.5 text-xs font-medium bg-primary-500/10 text-primary-400 border border-primary-500/20 rounded-lg hover:bg-primary-500/20 transition-colors flex items-center gap-2"
                    >
                        <Users className="w-3 h-3" />
                        Invitar Miembro
                    </button>
                </div>

                <MembersList key={refreshMembersKey} />
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-white/10">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-white rounded-xl font-medium transition-colors flex items-center gap-2 shadow-lg shadow-primary-500/20"
                >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>

            {/* Danger Zone: Delete Workspace - Only for Owners */}
            {currentUserRole === 'owner' && (
                <div className="pt-8 mt-8 border-t border-white/10">
                    <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6">
                        <h4 className="text-red-400 font-bold flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-5 h-5" />
                            Zona de Peligro
                        </h4>
                        <p className="text-red-400/70 text-sm mb-4">
                            Eliminar este workspace borrará todos los proyectos, tareas y registros de tiempo asociados. Esta acción no se puede deshacer.
                        </p>

                        {!showDeleteConfirm ? (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-medium transition-colors border border-red-500/20 flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Eliminar Workspace
                            </button>
                        ) : (
                            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <button
                                    onClick={handleDeleteWorkspace}
                                    disabled={isDeleting}
                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-red-500/20"
                                >
                                    {isDeleting ? 'Eliminando...' : 'Sí, eliminar permanentemente'}
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <InviteMemberModal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
                onInviteSuccess={() => setRefreshMembersKey(prev => prev + 1)}
            />
        </div>
    )
}
