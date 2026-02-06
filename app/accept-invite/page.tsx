'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Suspense } from 'react'

function AcceptInviteContent() {
    const searchParams = useSearchParams()
    const token = searchParams.get('token')
    const router = useRouter()
    const supabase = createClient()

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('Verificando invitación...')

    useEffect(() => {
        if (!token) {
            setStatus('error')
            setMessage('Token de invitación inválido o faltante.')
            return
        }

        acceptInvitation()
    }, [token])

    const acceptInvitation = async () => {
        try {
            // 1. Verify Authentication
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                // If not logged in, redirect to login with return URL
                // We'll store the token in the URL param encoded in the return URL
                const returnUrl = encodeURIComponent(`/accept-invite?token=${token}`)
                router.push(`/login?next=${returnUrl}`)
                return
            }

            // 2. Validate Token and Get Key Details (via get_invitation function or direct select if policies allow)
            // Since we need to join, we might need a custom RPC or just select.
            // But 'workspace_invitations' policies allow reading if you are a member... wait.
            // If I am NOT a member yet, I cannot read the invitation table via standard policies I defined earlier?
            // "View invitations for workspace" policy required being a member.

            // Oops! The INVITED user cannot see the invitation row via RLS if they are not a member yet.
            // I need a way to validate the token.
            // SOLUTION: Use a Supabase Edge Function or RPC with security definer?
            // OR: Standard approach -> Client calls RPC `accept_invitation(token)`.

            // Let's assume we implement an RPC function `accept_workspace_invitation`.

            const { data, error } = await (supabase.rpc as any)('accept_workspace_invitation', {
                p_token: token
            })

            if (error) throw error

            setStatus('success')
            setMessage('Has sido añadido al workspace correctamente.')

            // Redirect to dashboard after delay
            setTimeout(() => {
                router.push('/')
                router.refresh()
            }, 2000)

        } catch (error: any) {
            console.error('Error accepting invitation:', error)
            setStatus('error')
            setMessage(error.message || 'Error al aceptar la invitación.')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
            <div className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-2xl p-8 text-center shadow-xl">
                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Procesando invitación</h2>
                        <p className="text-zinc-400">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2 text-green-400">¡Bienvenido!</h2>
                        <p className="text-zinc-400 mb-6">{message}</p>
                        <p className="text-sm text-zinc-500">Redirigiendo al dashboard...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2 text-red-400">Error</h2>
                        <p className="text-zinc-400 mb-6">{message}</p>
                        <button
                            onClick={() => router.push('/')}
                            className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg transition-colors"
                        >
                            Ir al Inicio
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function AcceptInvitePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <AcceptInviteContent />
        </Suspense>
    )
}
