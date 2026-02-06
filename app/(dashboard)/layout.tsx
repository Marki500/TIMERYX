'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/useUserStore'
import { useProjectStore } from '@/stores/useProjectStore'
import { TimerBar } from '@/components/timer/TimerBar'
import { ActiveTimer } from '@/components/timer/ActiveTimer'
import { ToastContainer } from '@/components/ui/ToastContainer'
import { WorkspaceSwitcher } from '@/components/workspace/WorkspaceSwitcher'

import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { setProfile, setWorkspaces, setCurrentWorkspace, setCurrentRole, currentWorkspace, currentRole, profile } = useUserStore()
    const { fetchProjects } = useProjectStore()
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        async function loadData() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Check if user is a client (has project_clients but no workspace_members)
            const { data: clientData } = await supabase
                .from('project_clients')
                .select('id')
                .eq('user_id', user.id)
                .limit(1)

            const { data: memberData } = await supabase
                .from('workspace_members')
                .select('id')
                .eq('user_id', user.id)
                .limit(1)

            const hasClientAccess = clientData && clientData.length > 0
            const hasMemberAccess = memberData && memberData.length > 0

            if (hasClientAccess && !hasMemberAccess) {
                // User is a client only, redirect to client portal
                router.push('/client')
                return
            }

            if (!hasMemberAccess) {
                // User has no access, redirect to login
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

            // Load Workspaces via Memberships
            const { data: members } = await supabase
                .from('workspace_members')
                .select(`
           workspace_id,
           role,
           workspaces:workspace_id ( * )
        `)
                .eq('user_id', user.id)

            if (members && members.length > 0) {
                const joinedWorkspaces = members.map((m: any) => m.workspaces).filter(Boolean)
                setWorkspaces(joinedWorkspaces)

                if (joinedWorkspaces.length > 0 && !currentWorkspace) {
                    setCurrentWorkspace(joinedWorkspaces[0])
                    // Set role for first workspace
                    const firstMembership: any = members.find((m: any) => m.workspaces?.id === joinedWorkspaces[0].id)
                    if (firstMembership?.role) {
                        setCurrentRole(firstMembership.role)
                    }
                }
            } else {
                // No workspaces found. Auto-create one for onboarding.
                console.log('No workspaces found. Auto-creating...')

                // Generate unique slug
                const slug = `workspace-${Math.random().toString(36).substring(7)}`
                const { data: workspaceId, error } = await (supabase.rpc as any)('create_workspace', {
                    // @ts-ignore - Supabase types might be out of sync
                    p_name: 'My Workspace',
                    p_slug: slug
                })

                if (error) {
                    console.error('Error creating workspace:', error)
                } else if (workspaceId) {
                    // Refresh data
                    loadData()
                }
            }
        }

        loadData()
    }, []) // execute once on mount

    // Load projects when workspace changes and update role
    useEffect(() => {
        async function updateWorkspaceData() {
            if (!currentWorkspace?.id) return

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fetch user's role in current workspace
            const { data: membership } = await supabase
                .from('workspace_members')
                .select('role')
                .eq('workspace_id', currentWorkspace.id)
                .eq('user_id', user.id)
                .single() as any

            if (membership?.role) {
                setCurrentRole(membership.role as any)
            }

            // Fetch projects
            fetchProjects(currentWorkspace.id)
        }

        updateWorkspaceData()
    }, [currentWorkspace?.id, fetchProjects, setCurrentRole])

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="flex h-screen w-full bg-[#050505] text-foreground overflow-hidden font-sans selection:bg-primary-500/30 relative">
                {/* Background Ambience - Auroras */}
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-gradient-to-br from-indigo-500/80 via-blue-500/60 to-transparent rounded-full blur-[100px] animate-slow-glow" />
                    <div className="absolute bottom-[-10%] right-[-5%] w-[60%] h-[60%] bg-gradient-to-tl from-purple-500/80 via-primary-500/60 to-transparent rounded-full blur-[80px] animate-slow-glow" style={{ animationDelay: '4s' }} />
                    <div className="absolute top-[20%] right-[20%] w-[40%] h-[40%] bg-blue-400/40 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s' }} />
                    <div className="absolute inset-0 bg-noise opacity-[0.05] mix-blend-overlay" />
                </div>

                <div className="relative z-20 flex h-full w-full justify-center">
                    {/* Centered Content Area */}
                    <main className="flex-1 max-w-7xl relative flex flex-col h-screen overflow-hidden">
                        {/* Dynamic Island Area / Top Bar */}
                        <div className="h-24 px-6 md:px-8 flex items-center justify-between z-10 shrink-0">
                            <div className="flex items-center gap-4">
                                <WorkspaceSwitcher />
                            </div>

                            {/* Active Timer Pill (Dynamic Island Concept) */}
                            <TimerBar />

                            {/* User Profile / Notifications */}
                            <div className="flex items-center gap-4">
                                {profile?.avatar_url ? (
                                    <img
                                        src={profile.avatar_url}
                                        alt="Profile"
                                        className="w-10 h-10 rounded-full object-cover border border-white/10"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold border border-white/10">
                                        {profile?.email?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-32 relative z-10 custom-scrollbar">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="min-h-full bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative ring-1 ring-white/5"
                            >
                                {children}
                            </motion.div>
                        </div>
                    </main>
                </div>

                {/* Unified Floating Dock */}
                <FloatingDock />

                {/* Floating Active Timer */}
                <ActiveTimer />

                {/* Toast Notifications */}
                <ToastContainer />
            </div>
        </DndProvider>
    )
}
