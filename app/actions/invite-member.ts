'use server'

import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export async function inviteMember(workspaceId: string, email: string, role: string) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
        console.error('RESEND_API_KEY is missing')
        return { error: 'Configuración de servidor incompleta (Falta API Key de Email)' }
    }

    const resend = new Resend(apiKey)
    const supabase = await createClient()

    try {
        // 1. Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { error: 'No autorizado' }
        }

        // 2. Get Workspace Details (Name) and Check Permissions
        // We check if current user is admin/owner of the workspace
        const { data: memberData, error: memberError } = await supabase
            .from('workspace_members')
            .select('role, workspaces(name)')
            .eq('workspace_id', workspaceId)
            .eq('user_id', user.id)
            .single() as any

        if (memberError || !memberData || !['owner', 'admin'].includes(memberData.role)) {
            return { error: 'No tienes permisos para invitar miembros a este workspace' }
        }

        const workspaceName = (memberData.workspaces as any)?.name || 'Workspace'

        // 3. Create Invitation Token & Record
        const token = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

        const { error: insertError } = await supabase
            .from('workspace_invitations')
            .insert({
                workspace_id: workspaceId,
                email: email,
                role: role,
                invited_by: user.id,
                token: token,
                expires_at: expiresAt.toISOString()
            } as any)

        if (insertError) {
            console.error('Error creating invitation:', insertError)
            return { error: 'Error al crear la invitación' }
        }

        // 4. Send Email via Resend
        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/accept-invite?token=${token}`

        try {
            const { data, error: emailError } = await resend.emails.send({
                from: 'Timeryx <onboarding@resend.dev>', // Use validated domain if available, or resend.dev for testing
                to: [email],
                subject: `Te han invitado a unirte a ${workspaceName} en Timeryx`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #3f3f46;">Invitación a Timeryx</h1>
                        <p>Has sido invitado a unirte al workspace <strong>${workspaceName}</strong>.</p>
                        <p>Haz clic en el siguiente botón para aceptar la invitación:</p>
                        <a href="${inviteUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 16px;">
                            Aceptar Invitación
                        </a>
                        <p style="margin-top: 32px; font-size: 12px; color: #71717a;">
                            Este enlace expirará en 7 días.<br>
                            Si no esperabas esta invitación, puedes ignorar este correo.
                        </p>
                    </div>
                `
            })

            if (emailError) {
                console.error('Resend Error:', emailError)
                return { error: 'Invitación creada, pero falló el envío del email.' }
            }
        } catch (emailEx) {
            console.error('Email Exception:', emailEx)
            // We don't rollback the DB insert, but warn the user
            return { warning: 'Invitación creada, pero hubo un problema enviando el correo.' }
        }

        return { success: true }

    } catch (error) {
        console.error('Server Action Error:', error)
        return { error: 'Error interno del servidor' }
    }
}
