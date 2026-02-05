'use client'

import { useState, useEffect } from 'react'
import { MoreVertical, Shield, Trash2, User } from 'lucide-react'
import { useUserStore } from '@/stores/useUserStore'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/stores/useToast'
import { cn } from '@/lib/utils'

interface Member {
    user_id: string
    role: 'owner' | 'admin' | 'member' | 'viewer'
    joined_at: string
    profiles: {
        email: string
        full_name: string | null
        avatar_url: string | null
    }
}

interface Invitation {
    id: string
    email: string
    role: 'owner' | 'admin' | 'member' | 'viewer'
    created_at: string
}

export function MembersList() {
    const { currentWorkspace } = useUserStore()
    const [members, setMembers] = useState<Member[]>([])
    const [invitations, setInvitations] = useState<Invitation[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { addToast } = useToast()
    const supabase = createClient()

    useEffect(() => {
        if (currentWorkspace) {
            fetchData()
        }
    }, [currentWorkspace])

    const fetchData = async () => {
        if (!currentWorkspace?.id) return
        setIsLoading(true)
        await Promise.all([fetchMembers(), fetchInvitations()])
        setIsLoading(false)
    }

    const fetchMembers = async () => {
        try {
            const { data, error } = await supabase
                .from('workspace_members')
                .select(`
                    user_id,
                    role,
                    joined_at,
                    profiles (
                        email,
                        full_name,
                        avatar_url
                    )
                `)
                .eq('workspace_id', currentWorkspace!.id)

            if (error) throw error
            setMembers(data as any)
        } catch (error) {
            console.error('Error fetching members:', error)
            addToast('Error al cargar miembros, intenta recargar la página', 'error')
        }
    }

    const fetchInvitations = async () => {
        try {
            const { data, error } = await supabase
                .from('workspace_invitations')
                .select('*')
                .eq('workspace_id', currentWorkspace!.id)

            if (error) throw error
            setInvitations(data as any)
        } catch (error) {
            console.error('Error fetching invitations:', error)
        }
    }

    const handleRevokeInvitation = async (id: string) => {
        if (!confirm('¿Cancelar esta invitación?')) return
        try {
            const { error } = await supabase.from('workspace_invitations').delete().eq('id', id)
            if (error) throw error
            setInvitations(invitations.filter(i => i.id !== id))
            addToast('Invitación cancelada', 'success')
        } catch (error) {
            addToast('Error al cancelar invitación', 'error')
        }
    }

    const handleRemoveMember = async (userId: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar a este miembro?')) return

        try {
            const { error } = await supabase
                .from('workspace_members')
                .delete()
                .eq('workspace_id', currentWorkspace?.id)
                .eq('user_id', userId)

            if (error) throw error

            setMembers(members.filter(m => m.user_id !== userId))
            addToast('Miembro eliminado', 'success')
        } catch (error) {
            addToast('Error al eliminar miembro', 'error')
        }
    }

    // ... handleRoleChange (omitted for brevity if unchanged, but I need to keep it or it will be lost if I replace the whole file? 
    // Wait, replace_file_content replaces a block. My EndLine is 168 (End of file). My StartLine is 21 (Start of function).
    // So I am replacing the whole function body. I must include handleRoleChange if I replace the block containing it.

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            const { error } = await supabase
                .from('workspace_members')
                .update({ role: newRole })
                .eq('workspace_id', currentWorkspace?.id)
                .eq('user_id', userId)

            if (error) throw error

            setMembers(members.map(m =>
                m.user_id === userId ? { ...m, role: newRole as any } : m
            ))
            addToast('Rol actualizado', 'success')
        } catch (error) {
            addToast('Error al actualizar rol', 'error')
        }
    }

    if (isLoading) {
        return <div className="text-zinc-500 text-sm p-4 text-center">Cargando equipo...</div>
    }

    return (
        <div className="space-y-6">
            {/* Active Members */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Miembros ({members.length})</h3>
                {members.map((member) => (
                    <div
                        key={member.user_id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center text-white font-medium border border-white/10">
                                {member.profiles.avatar_url ? (
                                    <img
                                        src={member.profiles.avatar_url}
                                        alt={member.profiles.full_name || ''}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <span>
                                        {member.profiles.full_name?.charAt(0).toUpperCase() || member.profiles.email.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>

                            <div>
                                <p className="text-sm font-medium text-white flex items-center gap-2">
                                    {member.profiles.full_name || 'Usuario'}
                                    {member.role === 'owner' && (
                                        <span className="text-[10px] bg-amber-500/20 text-amber-500 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-semibold">
                                            OWNER
                                        </span>
                                    )}
                                </p>
                                <p className="text-xs text-zinc-500">
                                    {member.profiles.email}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {member.role !== 'owner' && (
                                <div className="bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 px-2 py-1 rounded-lg text-xs font-medium">
                                    {member.role.toUpperCase()}
                                </div>
                            )}

                            {member.role !== 'owner' && (
                                <button
                                    onClick={() => handleRemoveMember(member.user_id)}
                                    className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                    title="Eliminar miembro"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Pending Invitations */}
            {invitations.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-white/10">
                    <h3 className="text-sm font-medium text-amber-500/80 uppercase tracking-wider">Invitaciones Pendientes ({invitations.length})</h3>
                    {invitations.map((invitation) => (
                        <div
                            key={invitation.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/10"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                                    <User size={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-zinc-300">
                                        {invitation.email}
                                    </p>
                                    <p className="text-xs text-amber-500/60">
                                        Invitado como {invitation.role}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => handleRevokeInvitation(invitation.id)}
                                className="text-xs text-red-400 hover:text-red-300 hover:underline"
                            >
                                Cancelar
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {members.length === 0 && (
                <div className="text-center py-8 text-zinc-500">
                    No hay información de miembros.
                </div>
            )}
        </div>
    )
}
