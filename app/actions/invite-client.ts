'use server'

import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

interface InviteClientResult {
    success: boolean
    error?: string
    accessToken?: string
    inviteLink?: string
}

/**
 * Invite a client to a specific project
 * Generates a unique access token and creates the invitation
 */
export async function inviteClient(
    projectId: string,
    email: string,
    allowRegistration: boolean = true
): Promise<InviteClientResult> {
    try {
        const supabase = await createClient()

        // Verify user has permission to invite clients to this project
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, error: 'Not authenticated' }
        }

        // Check if user is admin of the workspace containing this project
        const { data: project } = await supabase
            .from('projects')
            .select('workspace_id')
            .eq('id', projectId)
            .single()

        if (!project) {
            return { success: false, error: 'Project not found' }
        }

        const { data: membership } = await supabase
            .from('workspace_members')
            .select('role')
            .eq('workspace_id', project.workspace_id)
            .eq('user_id', user.id)
            .single()

        if (!membership || membership.role !== 'admin') {
            return { success: false, error: 'Only admins can invite clients' }
        }

        // Generate unique access token
        const accessToken = crypto.randomBytes(32).toString('hex')

        // Check if client already invited to this project
        const { data: existing } = await supabase
            .from('project_clients')
            .select('id, access_token')
            .eq('project_id', projectId)
            .eq('email', email.toLowerCase())
            .single()

        if (existing) {
            // Return existing invitation
            const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/client/invite/${existing.access_token}`
            return {
                success: true,
                accessToken: existing.access_token,
                inviteLink
            }
        }

        // Create new invitation
        const { error: insertError } = await supabase
            .from('project_clients')
            .insert({
                project_id: projectId,
                email: email.toLowerCase(),
                access_token: accessToken,
                invited_by: user.id,
                allow_registration: allowRegistration
            })

        if (insertError) {
            console.error('Error creating invitation:', insertError)
            return { success: false, error: 'Failed to create invitation' }
        }

        // Generate invite link
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/client/invite/${accessToken}`

        // TODO: Send email with invite link
        // await sendInvitationEmail(email, inviteLink, projectName)

        return {
            success: true,
            accessToken,
            inviteLink
        }

    } catch (error) {
        console.error('Error inviting client:', error)
        return { success: false, error: 'An unexpected error occurred' }
    }
}

/**
 * Revoke a client's access to a project
 */
export async function revokeClientAccess(
    projectId: string,
    clientEmail: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('project_clients')
            .delete()
            .eq('project_id', projectId)
            .eq('email', clientEmail.toLowerCase())

        if (error) {
            return { success: false, error: 'Failed to revoke access' }
        }

        return { success: true }

    } catch (error) {
        console.error('Error revoking client access:', error)
        return { success: false, error: 'An unexpected error occurred' }
    }
}

/**
 * Get all clients for a project
 */
export async function getProjectClients(projectId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('project_clients')
        .select(`
            id,
            email,
            access_token,
            user_id,
            created_at,
            last_accessed_at,
            profiles:user_id (
                full_name,
                avatar_url
            )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching project clients:', error)
        return []
    }

    return data || []
}
