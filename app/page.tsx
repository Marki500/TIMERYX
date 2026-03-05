'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Sparkles } from 'lucide-react'

export default function AuthPage() {
    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error

            if (data.user) {
                router.push('/dashboard')
                router.refresh()
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during login')
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            })

            if (authError) throw authError

            if (authData.user) {
                router.push('/dashboard')
                router.refresh()
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during registration')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setEmail('')
        setPassword('')
        setFullName('')
        setError(null)
    }

    const switchTab = (tab: 'login' | 'register') => {
        setActiveTab(tab)
        resetForm()
    }

    return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary-100/50 dark:to-primary-950/20">
                {/* Floating Orbs */}
                <motion.div
                    className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 dark:bg-primary-500/10 rounded-full blur-3xl"
                    animate={{
                        x: [0, 30, 0],
                        y: [0, 20, 0],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                <motion.div
                    className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-3xl"
                    animate={{
                        x: [0, -30, 0],
                        y: [0, -20, 0],
                    }}
                    transition={{
                        duration: 12,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </div>

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-md">
                {/* Logo/Header with Glass Effect */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 backdrop-blur-xl border border-white/20 dark:border-white/10 mb-6 shadow-2xl">
                        <Clock className="w-10 h-10 text-primary-500 dark:text-primary-400" strokeWidth={1.5} />
                    </div>
                    <h1 className="text-6xl font-bold bg-gradient-to-r from-primary-800 via-primary-600 to-primary-400 dark:from-white dark:via-primary-200 dark:to-primary-400 bg-clip-text text-transparent mb-3 tracking-tight">
                        TIMERYX
                    </h1>
                    <p className="text-muted-foreground text-lg font-light">
                        Track time. Manage projects. Stay productive.
                    </p>
                </motion.div>

                {/* Auth Card with Enhanced Glassmorphism */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="relative"
                >
                    {/* Glow Effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary-500/20 to-blue-500/20 dark:from-primary-500/10 dark:to-blue-500/10 rounded-3xl blur-lg" />

                    {/* Main Card */}
                    <div className="glass relative p-8 rounded-3xl">
                        {/* Tabs with iOS Style */}
                        <div className="flex gap-1 mb-8 p-1.5 bg-background/50 dark:bg-white/[0.05] rounded-2xl border border-border">
                            <button
                                onClick={() => switchTab('login')}
                                className="relative flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300"
                            >
                                {activeTab === 'login' && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-lg"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className={`relative z-10 transition-colors ${activeTab === 'login' ? 'text-white' : 'text-muted-foreground'
                                    }`}>
                                    Sign In
                                </span>
                            </button>
                            <button
                                onClick={() => switchTab('register')}
                                className="relative flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300"
                            >
                                {activeTab === 'register' && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-lg"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className={`relative z-10 transition-colors ${activeTab === 'register' ? 'text-white' : 'text-muted-foreground'
                                    }`}>
                                    Sign Up
                                </span>
                            </button>
                        </div>

                        {/* Forms */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: activeTab === 'login' ? -20 : 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: activeTab === 'login' ? 20 : -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <form onSubmit={activeTab === 'login' ? handleLogin : handleRegister} className="space-y-5">
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-danger-500/10 backdrop-blur-xl border border-danger-500/20 text-danger-700 dark:text-danger-400 px-4 py-3 rounded-xl text-sm"
                                        >
                                            {error}
                                        </motion.div>
                                    )}

                                    {activeTab === 'register' && (
                                        <div>
                                            <label htmlFor="fullName" className="block text-sm font-medium mb-2 text-foreground">
                                                Full Name
                                            </label>
                                            <input
                                                id="fullName"
                                                type="text"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                required
                                                className="w-full px-4 py-3.5 bg-background/50 dark:bg-white/[0.05] backdrop-blur-xl border border-border dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all text-foreground placeholder:text-muted-foreground/50"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium mb-2 text-foreground">
                                            Email
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full px-4 py-3.5 bg-background/50 dark:bg-white/[0.05] backdrop-blur-xl border border-border dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all text-foreground placeholder:text-muted-foreground/50"
                                            placeholder="you@example.com"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium mb-2 text-foreground">
                                            Password
                                        </label>
                                        <input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={6}
                                            className="w-full px-4 py-3.5 bg-background/50 dark:bg-white/[0.05] backdrop-blur-xl border border-border dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all text-foreground placeholder:text-muted-foreground/50"
                                            placeholder="••••••••"
                                        />
                                        {activeTab === 'register' && (
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Must be at least 6 characters
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="group relative w-full overflow-hidden bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium py-3.5 px-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-primary-500/25"
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            {loading ? (
                                                <>
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                                    />
                                                    {activeTab === 'login' ? 'Signing in...' : 'Creating account...'}
                                                </>
                                            ) : (
                                                <>
                                                    {activeTab === 'login' ? 'Sign In' : 'Sign Up'}
                                                    <Sparkles className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </>
                                            )}
                                        </span>
                                    </button>
                                </form>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Footer */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center text-xs text-muted-foreground mt-8"
                >
                    By continuing, you agree to our Terms of Service and Privacy Policy
                </motion.p>
            </div>
        </div>
    )
}
