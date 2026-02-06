'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, UserPlus, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ClientInvitePage() {
    const params = useParams()
    const router = useRouter()
    const token = params.token as string
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [project, setProject] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [showRegister, setShowRegister] = useState(false)

    // Registration form
    const [fullName, setFullName] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [registering, setRegistering] = useState(false)
    const [registerError, setRegisterError] = useState<string | null>(null)

    useEffect(() => {
        async function loadInvitation() {
            try {
                // Check for existing session and sign out if present to ensure clean state
                const { data: { session } } = await supabase.auth.getSession()
                if (session) {
                    await supabase.auth.signOut()
                }

                // Get project by token using RPC function
                const { data: projectData, error: projectError } = await (supabase.rpc as any)('get_project_by_token', {
                    p_token: token
                })

                if (projectError || !projectData || projectData.length === 0) {
                    setError('Invalid or expired invitation link')
                    setLoading(false)
                    return
                }

                setProject(projectData[0])
                setLoading(false)
            } catch (err) {
                console.error('Error loading invitation:', err)
                setError('Failed to load invitation')
                setLoading(false)
            }
        }

        if (token) {
            loadInvitation()
        }
    }, [token])

    const handleViewProject = () => {
        router.push(`/client/project/${token}`)
    }

    const handleCreateAccount = async () => {
        if (!fullName.trim()) {
            setRegisterError('Please enter your name')
            return
        }

        if (password.length < 6) {
            setRegisterError('Password must be at least 6 characters')
            return
        }

        if (password !== confirmPassword) {
            setRegisterError('Passwords do not match')
            return
        }

        setRegistering(true)
        setRegisterError(null)

        try {
            // Create account
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: project.client_email,
                password: password,
                options: {
                    data: {
                        full_name: fullName
                    }
                }
            })

            if (signUpError) {
                // If user already exists, we can try to sign them in or just link if they are logged in (but we just signed out)
                // If the error implies user exists, we should probably tell them to login instead OR handle it gracefully if we can
                console.error('Signup error:', signUpError)
                setRegisterError(signUpError.message)
                setRegistering(false)
                return
            }

            if (!authData.user) {
                // Verify if session exists (auto-login successful)
                const { data: { session } } = await supabase.auth.getSession()

                if (!session) {
                    setRegisterError('Account created. Please check your email to confirm your account.')
                    setRegistering(false)
                    return
                }
            } else if (!authData.session) {
                setRegisterError('Account created. Please check your email to confirm your account before logging in.')
                setRegistering(false)
                return
            }

            const userId = authData.user?.id || (await supabase.auth.getUser()).data.user?.id

            if (!userId) {
                setRegisterError('Failed to retrieve user information')
                setRegistering(false)
                return
            }

            // Link account to project invitation using RPC
            const { data: linkData, error: linkError } = await (supabase.rpc as any)('link_client_account', {
                p_token: token,
                p_user_id: userId
            })

            if (linkError || !linkData) {
                setRegisterError('Account created but failed to link to project')
                setRegistering(false)
                return
            }

            // Redirect to client dashboard
            router.push('/client')

        } catch (err) {
            console.error('Registration error:', err)
            setRegisterError('An unexpected error occurred')
            setRegistering(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#1a0a2e] flex items-center justify-center">
                <div className="flex items-center gap-3 text-white">
                    <Loader2 className="animate-spin" size={24} />
                    <span>Loading invitation...</span>
                </div>
            </div>
        )
    }

    if (error || !project) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#1a0a2e] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Invalid Invitation</h2>
                    <p className="text-zinc-400">{error || 'This invitation link is invalid or has expired'}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#1a0a2e] flex items-center justify-center p-4">
            {/* Animated Background */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-[120px]"
                    animate={{
                        x: [0, 50, 0],
                        y: [0, 30, 0],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </div>

            <div className="relative z-10 w-full max-w-md">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl"
                >
                    {!showRegister ? (
                        <>
                            {/* Project Preview */}
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-blue-500 mx-auto mb-4 flex items-center justify-center">
                                    <div className="w-8 h-8 rounded-full" style={{ backgroundColor: project.project_color }} />
                                </div>
                                <h1 className="text-2xl font-bold text-white mb-2">You've been invited!</h1>
                                <p className="text-zinc-400">
                                    to view <span className="text-white font-semibold">{project.project_name}</span>
                                </p>
                            </div>

                            {/* Options */}
                            <div className="space-y-4">
                                <button
                                    type="button"
                                    onClick={handleViewProject}
                                    className="w-full py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-3 text-white font-medium group"
                                >
                                    <Eye size={20} className="group-hover:scale-110 transition-transform" />
                                    View Project Now
                                    <span className="text-xs text-zinc-500">(No account needed)</span>
                                </button>

                                {project.allow_registration && (
                                    <>
                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-white/10"></div>
                                            </div>
                                            <div className="relative flex justify-center text-xs">
                                                <span className="px-2 bg-zinc-900 text-zinc-500">or</span>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setShowRegister(true)}
                                            className="w-full py-4 rounded-xl bg-gradient-to-r from-primary-500 to-blue-500 hover:shadow-lg hover:shadow-primary-500/25 transition-all flex items-center justify-center gap-3 text-white font-bold group"
                                        >
                                            <UserPlus size={20} className="group-hover:scale-110 transition-transform" />
                                            Create Account for Permanent Access
                                        </button>
                                    </>
                                )}
                            </div>

                            <p className="text-xs text-zinc-500 text-center mt-6">
                                {project.allow_registration
                                    ? 'With an account, you can access this project anytime and use chat features'
                                    : 'Use the link above to view the project. Contact your project manager for permanent access.'
                                }
                            </p>
                        </>
                    ) : (
                        <>
                            {/* Registration Form */}
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-white mb-2">Create Your Account</h2>
                                <p className="text-sm text-zinc-400">for {project.client_email}</p>
                            </div>

                            {registerError && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                    {registerError}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-zinc-400 uppercase mb-2 block">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="John Doe"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-zinc-400 uppercase mb-2 block">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-zinc-400 uppercase mb-2 block">
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setShowRegister(false)}
                                        disabled={registering}
                                        className="flex-1 py-3 rounded-xl bg-white/5 text-zinc-400 font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleCreateAccount}
                                        disabled={registering}
                                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-blue-500 text-white font-bold hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {registering ? (
                                            <>
                                                <Loader2 className="animate-spin" size={18} />
                                                Creating...
                                            </>
                                        ) : (
                                            'Create Account'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    )
}
