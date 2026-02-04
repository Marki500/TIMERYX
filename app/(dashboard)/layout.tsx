'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/useUserStore'
import { TimerBar } from '@/components/timer/TimerBar'

import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [collapsed, setCollapsed] = useState(false)
    const { setProfile, setWorkspaces, setCurrentWorkspace, currentWorkspace } = useUserStore()
    const supabase = createClient()

    useEffect(() => {
        async function loadData() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Load Profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (profile) setProfile(profile)

            // Load Workspaces via Memberships
            // Note: This is a simplified query. In a real app with RLS, querying 'workspaces' might be restricted
            // if not joined properly. Assuming 'workspace_members' approach or logic in 'workspaces'
            // For now, simpler: select all workspaces where I am a member.

            const { data: members } = await supabase
                .from('workspace_members')
                .select(`
           workspace_id,
           workspaces:workspace_id ( * )
        `)
                .eq('user_id', user.id)

            if (members && members.length > 0) {
                const joinedWorkspaces = members.map((m: any) => m.workspaces).filter(Boolean)
                setWorkspaces(joinedWorkspaces)

                if (joinedWorkspaces.length > 0 && !currentWorkspace) {
                    setCurrentWorkspace(joinedWorkspaces[0])
                }
            } else {
                // No workspaces found. Auto-create one for onboarding.
                console.log('No workspaces found. Auto-creating...')

                // Generate unique slug
                const slug = `workspace-${Math.random().toString(36).substring(7)}`
                const { data: workspaceId, error } = await supabase.rpc('create_workspace', {
                    p_name: 'My Workspace',
                    p_slug: slug
                })

                if (error) {
                    console.error('Error creating workspace:', error)
                    // Fallback: This might fail if RPC not created, but we need to try/alert
                } else if (workspaceId) {
                    // Refresh data
                    loadData()
                }
            }
        }

        loadData()
    }, []) // execute once on mount


    return (
        <div className="flex h-screen w-full bg-[#050505] text-foreground overflow-hidden font-sans selection:bg-primary-500/30 relative">
            {/* Background Ambience - Auroras */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-gradient-to-br from-indigo-500/80 via-blue-500/60 to-transparent rounded-full blur-[100px] animate-slow-glow" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[60%] h-[60%] bg-gradient-to-tl from-purple-500/80 via-primary-500/60 to-transparent rounded-full blur-[80px] animate-slow-glow" style={{ animationDelay: '4s' }} />
                <div className="absolute top-[20%] right-[20%] w-[40%] h-[40%] bg-blue-400/40 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s' }} />
                <div className="absolute inset-0 bg-noise opacity-[0.05] mix-blend-overlay" />
            </div>

            <div className="relative z-20 flex h-full w-full">
                <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

                <main className="flex-1 relative flex flex-col h-screen overflow-hidden">
                    {/* Dynamic Island Area / Top Bar */}
                    <div className="h-20 px-8 flex items-center justify-between z-10 shrink-0">
                        <div className="flex items-center gap-4">
                            {/* Breadcrumbs or Page Title could go here */}
                        </div>

                        {/* Active Timer Pill (Dynamic Island Concept) */}
                        <TimerBar />

                        {/* User Profile / Notifications */}
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10" />
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto px-6 pb-6 relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="h-full bg-black/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative"
                        >
                            {children}
                        </motion.div>
                    </div>
                </main>
            </div>
        </div>
    )
}
