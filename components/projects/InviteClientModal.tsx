'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Link as LinkIcon, Check, Copy, UserPlus } from 'lucide-react'
import { inviteClient } from '@/app/actions/invite-client'
import { useToast } from '@/stores/useToast'

interface InviteClientModalProps {
    isOpen: boolean
    onClose: () => void
    projectId: string
    projectName: string
}

export function InviteClientModal({ isOpen, onClose, projectId, projectName }: InviteClientModalProps) {
    const [email, setEmail] = useState('')
    const [allowRegistration, setAllowRegistration] = useState(true)
    const [isInviting, setIsInviting] = useState(false)
    const [inviteLink, setInviteLink] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const { addToast } = useToast()

    const handleInvite = async () => {
        if (!email.trim()) return

        setIsInviting(true)

        try {
            const result = await inviteClient(projectId, email.trim(), allowRegistration)

            if (result.success && result.inviteLink) {
                setInviteLink(result.inviteLink)
                addToast('Client invited successfully!', 'success')
            } else {
                addToast(result.error || 'Failed to invite client', 'error')
            }
        } catch (error) {
            console.error('Error inviting client:', error)
            addToast('An unexpected error occurred', 'error')
        } finally {
            setIsInviting(false)
        }
    }

    const handleCopyLink = () => {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink)
            setCopied(true)
            addToast('Link copied to clipboard!', 'success')
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleClose = () => {
        setEmail('')
        setAllowRegistration(true)
        setInviteLink(null)
        setCopied(false)
        onClose()
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={handleClose}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-md bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl z-10"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-white">Invite Client</h3>
                            <p className="text-sm text-zinc-400 mt-1">to {projectName}</p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                        >
                            <X className="w-4 h-4 text-zinc-400" />
                        </button>
                    </div>

                    {!inviteLink ? (
                        <div className="space-y-5">
                            {/* Email Input */}
                            <div>
                                <label className="text-xs font-medium text-zinc-400 uppercase mb-2 block tracking-wider">
                                    Client Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="client@example.com"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
                                    />
                                </div>
                                <p className="text-xs text-zinc-500 mt-2">
                                    Client will receive a unique link to view this project
                                </p>
                            </div>

                            {/* Allow Registration Checkbox */}
                            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4">
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={allowRegistration}
                                        onChange={(e) => setAllowRegistration(e.target.checked)}
                                        className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 text-primary-500 focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-0 cursor-pointer"
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-white group-hover:text-primary-400 transition-colors">
                                            Allow client to create account
                                        </p>
                                        <p className="text-xs text-zinc-500 mt-1">
                                            Client can create a free account to access this project permanently and use chat features
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handleClose}
                                    className="flex-1 py-3 rounded-xl bg-white/5 text-zinc-400 font-medium hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleInvite}
                                    disabled={!email.trim() || isInviting}
                                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-indigo-500 text-white font-bold hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isInviting ? (
                                        'Inviting...'
                                    ) : (
                                        <>
                                            <UserPlus size={18} />
                                            Send Invite
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {/* Success Message */}
                            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <Check className="w-5 h-5 text-green-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white">Invitation Created!</p>
                                        <p className="text-sm text-zinc-400">for {email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Invite Link */}
                            <div>
                                <label className="text-xs font-medium text-zinc-400 uppercase mb-2 block tracking-wider">
                                    Invitation Link
                                </label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                    <input
                                        type="text"
                                        value={inviteLink}
                                        readOnly
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-24 py-3 text-white text-sm"
                                    />
                                    <button
                                        onClick={handleCopyLink}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 transition-colors flex items-center gap-1.5 text-sm font-medium"
                                    >
                                        {copied ? (
                                            <>
                                                <Check size={14} />
                                                Copied
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={14} />
                                                Copy
                                            </>
                                        )}
                                    </button>
                                </div>
                                <p className="text-xs text-zinc-500 mt-2">
                                    Share this link with your client. They can view the project or create an account.
                                </p>
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={handleClose}
                                className="w-full py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
