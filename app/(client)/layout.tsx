'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/useUserStore'
import { LogOut, FolderKanban } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { setProfile } = useUserStore()
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        async function loadData() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            // Check if user is a workspace member (not a client)
            const { data: memberData } = await supabase
                .from('workspace_members')
                .select('id')
                .eq('user_id', user.id)
                .limit(1)

            const { data: clientData } = await supabase
                .from('project_clients')
                .select('id')
                .eq('user_id', user.id)
                .limit(1)

            const hasMemberAccess = memberData && memberData.length > 0
            const hasClientAccess = clientData && clientData.length > 0

            if (hasMemberAccess) {
                // Redirect workspace members to dashboard
                router.push('/dashboard')
                return
            }

            if (!hasClientAccess) {
                // User has no access at all
                router.push('/login')
                return
            }

            // Load Profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (profile) setProfile(profile)
        }

        loadData()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#1a0a2e] text-white">
            {/* Simplified Sidebar */}
            <div className="fixed left-0 top-0 h-full w-64 bg-white/[0.02] backdrop-blur-xl border-r border-white/10 p-6">
                {/* Logo */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                        TIMERYX
                    </h1>
                    <p className="text-xs text-zinc-500 mt-1">Client Portal</p>
                </div>

                {/* Navigation */}
                <nav className="space-y-2">
                    <Link href="/client">
                        <motion.div
                            whileHover={{ x: 4 }}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            <FolderKanban size={20} className="text-primary-400" />
                            <span>My Projects</span>
                        </motion.div>
                    </Link>
                </nav>

                {/* Logout Button */}
                <div className="absolute bottom-6 left-6 right-6">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors w-full text-zinc-400"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="ml-64 p-8">
                {children}
            </div>
        </div>
    )
}
