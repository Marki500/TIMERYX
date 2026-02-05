'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { useToast } from '@/stores/useToast'

export function ToastContainer() {
    const { toasts, removeToast } = useToast()

    const icons = {
        success: CheckCircle,
        error: XCircle,
        info: Info
    }

    const colors = {
        success: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-400',
        error: 'from-red-500/10 to-rose-500/10 border-red-500/20 text-red-400',
        info: 'from-blue-500/10 to-indigo-500/10 border-blue-500/20 text-blue-400'
    }

    return (
        <div className="fixed top-4 right-4 z-[100] space-y-2">
            <AnimatePresence>
                {toasts.map((toast) => {
                    const Icon = icons[toast.type]
                    return (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: -20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, x: 100 }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-br border backdrop-blur-sm shadow-lg min-w-[300px] ${colors[toast.type]}`}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            <p className="flex-1 text-sm font-medium text-white">{toast.message}</p>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="text-white/50 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )
                })}
            </AnimatePresence>
        </div>
    )
}
