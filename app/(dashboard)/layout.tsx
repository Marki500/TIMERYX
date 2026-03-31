import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { WorkspaceSwitcher } from '@/components/workspace/WorkspaceSwitcher'
import { TimerBar } from '@/components/timer/TimerBar'
import { DashboardClientProvider } from '@/components/providers/DashboardClientProvider'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check if user is a client only
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
        redirect('/client')
    }

    if (!hasMemberAccess) {
        redirect('/login')
    }

    // Load Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single() as { data: any }

    // Load Workspaces via Memberships
    const { data: members } = await supabase
        .from('workspace_members')
        .select(`
            workspace_id,
            role,
            workspaces:workspace_id ( * )
        `)
        .eq('user_id', user.id)

    let joinedWorkspaces: any[] = []
    let initialWorkspaceData = null

    if (members && members.length > 0) {
        joinedWorkspaces = members.map((m: any) => m.workspaces).filter(Boolean)

        if (joinedWorkspaces.length > 0) {
            const firstMembership: any = members.find((m: any) => m.workspaces?.id === joinedWorkspaces[0].id)
            initialWorkspaceData = {
                workspace: joinedWorkspaces[0],
                role: firstMembership?.role || null
            }
        }
    } else {
        // No workspaces found. Auto-create one for onboarding.
        const slug = `workspace-${Math.random().toString(36).substring(7)}`
        await (supabase.rpc as any)('create_workspace', {
            // @ts-ignore
            p_name: 'My Workspace',
            p_slug: slug
        })

        // This will require a refresh, but typically users fall into one or the other. Note in production
        // we might redirect to a setup page. We'll simply let the layout finish rendering.
    }

    return (
        <DashboardClientProvider
            initialProfile={profile}
            initialWorkspaces={joinedWorkspaces}
            initialWorkspaceData={initialWorkspaceData}
        >
            <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans selection:bg-primary-500/30 relative">
                {/* Background Ambience - Auroras */}
                <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                    <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-gradient-to-br from-indigo-500/30 via-blue-500/20 to-transparent rounded-full blur-3xl" />
                    <div className="absolute bottom-[-10%] right-[-5%] w-[60%] h-[60%] bg-gradient-to-tl from-purple-500/30 via-primary-500/20 to-transparent rounded-full blur-3xl" />
                    <div className="absolute top-[20%] right-[20%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-3xl" />
                </div>

                <div className="relative z-20 flex h-full w-full justify-center">
                    {/* Centered Content Area */}
                    <main className="flex-1 max-w-7xl relative flex flex-col h-screen overflow-hidden">
                        {/* Dynamic Island Area / Top Bar */}
                        <div className="h-24 px-6 md:px-8 flex items-center justify-between z-50 shrink-0">
                            <div className="flex items-center gap-4">
                                <WorkspaceSwitcher />
                            </div>

                            {/* Active Timer Pill (Dynamic Island Concept) */}
                            <TimerBar />

                            {/* User Profile / Notifications */}
                            <div className="flex items-center gap-4">
                                <ThemeToggle />
                                <NotificationCenter />
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
                            <div className="min-h-full bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative ring-1 ring-white/5">
                                {children}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </DashboardClientProvider>
    )
}
