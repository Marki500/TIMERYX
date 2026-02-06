'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/useUserStore'

export function ProfileForm() {
    const { profile, setProfile } = useUserStore()
    const [fullName, setFullName] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState('')

    useEffect(() => {
        if (profile?.full_name) {
            setFullName(profile.full_name)
        }
    }, [profile])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!profile) return

        setIsLoading(true)
        setMessage('')
        const supabase = createClient()

        const { error } = await (supabase
            .from('profiles') as any)
            .update({ full_name: fullName, updated_at: new Date().toISOString() })
            .eq('id', profile.id)

        if (error) {
            console.error('Error updating profile:', error)
            setMessage('Error updating profile')
        } else {
            setProfile({ ...profile, full_name: fullName })
            setMessage('Profile updated successfully')
        }
        setIsLoading(false)
    }

    if (!profile) return null

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
            <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Email</label>
                <input
                    type="email"
                    disabled
                    value={profile.email}
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-lg px-4 py-2 text-zinc-500 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-zinc-500">Email cannot be changed.</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Full Name</label>
                <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                    placeholder="Your name"
                />
            </div>

            <div className="flex items-center gap-4">
                <button
                    type="submit"
                    disabled={isLoading || !fullName}
                    className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
                {message && (
                    <span className={`text-sm ${message.includes('Error') ? 'text-red-400' : 'text-emerald-400'}`}>
                        {message}
                    </span>
                )}
            </div>
        </form>
    )
}
