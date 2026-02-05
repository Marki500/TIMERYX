'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/useUserStore'
import { format } from 'date-fns'

interface Member {
    user_id: string
    role: string
    joined_at: string
    profile: {
        email: string
        full_name: string | null
    }
}

export function WorkspaceMembers() {
    const { currentWorkspace } = useUserStore()
    const [members, setMembers] = useState<Member[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!currentWorkspace) return

        const fetchMembers = async () => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('workspace_members')
                .select(`
                    user_id,
                    role,
                    joined_at,
                    profile:profiles (
                        email,
                        full_name
                    )
                `)
                .eq('workspace_id', currentWorkspace.id)

            if (!error && data) {
                // Manually map the joined data to match our interface if Supabase types are generic
                const mappedMembers = data.map((item: any) => ({
                    user_id: item.user_id,
                    role: item.role,
                    joined_at: item.joined_at,
                    profile: item.profile
                }))
                setMembers(mappedMembers)
            }
            setIsLoading(false)
        }

        fetchMembers()
    }, [currentWorkspace])

    if (!currentWorkspace) return <div className="text-zinc-500">No workspace selected.</div>
    if (isLoading) return <div className="h-20 bg-white/5 rounded-xl animate-pulse" />

    return (
        <div className="overflow-hidden border border-white/10 rounded-lg">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="bg-white/5 text-zinc-400">
                        <th className="px-6 py-3 font-medium">Member</th>
                        <th className="px-6 py-3 font-medium">Role</th>
                        <th className="px-6 py-3 font-medium">Joined</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {members.map((member) => (
                        <tr key={member.user_id}>
                            <td className="px-6 py-4">
                                <div className="font-medium text-white">{member.profile?.full_name || 'Unknown'}</div>
                                <div className="text-zinc-500 text-xs">{member.profile?.email}</div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${member.role === 'admin'
                                        ? 'bg-primary-500/10 text-primary-400'
                                        : 'bg-zinc-800 text-zinc-400'
                                    }`}>
                                    {member.role}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-zinc-500">
                                {format(new Date(member.joined_at), 'MMM d, yyyy')}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
