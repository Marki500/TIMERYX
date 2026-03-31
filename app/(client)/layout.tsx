import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientPortalClientProvider } from '@/components/providers/ClientPortalClientProvider'

export default async function ClientLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check permissions
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
        // Workspace members go to dashboard
        redirect('/dashboard')
    }

    if (!hasClientAccess) {
        redirect('/login')
    }

    // Load Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return (
        <ClientPortalClientProvider initialProfile={profile}>
            {children}
        </ClientPortalClientProvider>
    )
}
