import { createClient } from '@/lib/supabase/server'

/**
 * Check if a user is a client (has project access but not workspace membership)
 */
export async function isClientUser(userId: string): Promise<boolean> {
    const supabase = await createClient()

    const { data } = await (supabase.rpc as any)('is_client_user', {
        p_user_id: userId
    })

    return data === true
}

/**
 * Check if a user is a workspace member
 */
export async function isMemberUser(userId: string): Promise<boolean> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('user_id', userId)
        .limit(1)

    return !error && data && data.length > 0
}

/**
 * Get all projects accessible to a client user
 */
export async function getClientProjects(userId: string) {
    const supabase = await createClient()

    const { data, error } = await (supabase.rpc as any)('get_client_projects', {
        p_user_id: userId
    })

    if (error) {
        console.error('Error fetching client projects:', error)
        return []
    }

    return data || []
}

/**
 * Get project details by access token (for non-authenticated access)
 */
export async function getProjectByToken(token: string) {
    const supabase = await createClient()

    const { data, error } = await (supabase.rpc as any)('get_project_by_token', {
        p_token: token
    })

    if (error || !data || data.length === 0) {
        return null
    }

    return data[0]
}

/**
 * Check if a user can access a specific project (either as member or client)
 */
export async function canAccessProject(userId: string, projectId: string): Promise<boolean> {
    const supabase = await createClient()

    // Check if user is a workspace member with access
    const { data: memberData } = await (supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', userId) as any)

    if (memberData && memberData.length > 0) {
        const workspaceIds = memberData.map((m: any) => m.workspace_id)

        const { data: projectData } = await (supabase
            .from('projects')
            .select('id')
            .eq('id', projectId)
            .in('workspace_id', workspaceIds)
            .limit(1) as any)

        if (projectData && projectData.length > 0) {
            return true
        }
    }

    // Check if user is a client with access to this project
    const { data: clientData } = await (supabase
        .from('project_clients')
        .select('id')
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .limit(1) as any)

    return clientData !== null && clientData.length > 0
}

/**
 * Link a user account to a project client invitation
 */
export async function linkClientAccount(token: string, userId: string): Promise<boolean> {
    const supabase = await createClient()

    const { data, error } = await (supabase.rpc as any)('link_client_account', {
        p_token: token,
        p_user_id: userId
    })

    if (error) {
        console.error('Error linking client account:', error)
        return false
    }

    return data === true
}

/**
 * Determine the default route for a user based on their role
 */
export async function getUserDefaultRoute(userId: string): Promise<string> {
    const isClient = await isClientUser(userId)

    if (isClient) {
        return '/client'
    }

    return '/dashboard'
}
