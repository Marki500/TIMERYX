'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutGrid,
    CheckSquare,
    Folder,
    Clock,
    PieChart,
    Plus,
    Settings,
    LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function FloatingDock() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [hoveredLogout, setHoveredLogout] = useState(false)

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const links = [
        { href: '/dashboard', icon: LayoutGrid, label: 'Home' },
        { href: '/tasks', icon: CheckSquare, label: 'Tasks' },
        { href: '/projects', icon: Folder, label: 'Projects' },
        { href: '/timer', icon: Clock, label: 'Timer' },
        { href: '/reports', icon: PieChart, label: 'Reports' },
        { href: '/settings', icon: Settings, label: 'Settings' },
    ]

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-auto">
            <div className="relative flex items-end gap-2 p-2 rounded-2xl lg:rounded-3xl bg-white/10 backdrop-blur-3xl border border-white/20 shadow-2xl shadow-black/50 ring-1 ring-white/10">
                {links.map((link, index) => {
                    const isActive = pathname === link.href
                    const isHovered = hoveredIndex === index

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            className="relative group"
                        >
                            <motion.div
                                className={cn(
                                    "relative flex items-center justify-center rounded-xl lg:rounded-2xl transition-all duration-200",
                                    "w-12 h-12",
                                    "lg:w-14 lg:h-14",
                                    isActive
                                        ? "text-white bg-white/5"
                                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                                )}
                                whileHover={{
                                    scale: 1.15,
                                    y: -4,
                                    transition: { type: 'spring', stiffness: 400, damping: 25 }
                                }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <link.icon
                                    size={24}
                                    className={cn(
                                        "w-5 h-5 lg:w-6 lg:h-6 transition-all",
                                        isActive && "text-white"
                                    )}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />

                                {isActive && (
                                    <span className="hidden lg:block absolute -bottom-1 w-1 h-1 rounded-full bg-primary-400 shadow-[0_0_4px_rgba(56,189,248,0.8)]" />
                                )}
                            </motion.div>

                            <AnimatePresence>
                                {isHovered && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, x: "-50%" }}
                                        animate={{ opacity: 1, y: -12, x: "-50%" }}
                                        exit={{ opacity: 0, y: 5, x: "-50%" }}
                                        className="hidden lg:block absolute -top-2 left-1/2 px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-white/10 text-xs font-medium text-white whitespace-nowrap z-50 pointer-events-none backdrop-blur-md"
                                    >
                                        {link.label}
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900/90 rotate-45 border-r border-b border-white/10" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Link>
                    )
                })}

                {/* Divider */}
                <div className="w-px h-8 lg:h-10 bg-white/10 mx-1 lg:mx-2 self-center" />

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    onMouseEnter={() => setHoveredLogout(true)}
                    onMouseLeave={() => setHoveredLogout(false)}
                    className="relative flex items-center justify-center rounded-xl lg:rounded-2xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-12 h-12 lg:w-14 lg:h-14"
                >
                    <motion.div
                        whileHover={{
                            scale: 1.15,
                            y: -4,
                            transition: { type: 'spring', stiffness: 400, damping: 25 }
                        }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <LogOut size={24} className="w-5 h-5 lg:w-6 lg:h-6" />
                    </motion.div>

                    <AnimatePresence>
                        {hoveredLogout && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, x: "-50%" }}
                                animate={{ opacity: 1, y: -12, x: "-50%" }}
                                exit={{ opacity: 0, y: 5, x: "-50%" }}
                                className="hidden lg:block absolute -top-2 left-1/2 px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-white/10 text-xs font-medium text-white whitespace-nowrap z-50 pointer-events-none backdrop-blur-md"
                            >
                                Logout
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900/90 rotate-45 border-r border-b border-white/10" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </button>

                {/* Divider */}
                <div className="w-px h-8 lg:h-10 bg-white/10 mx-1 lg:mx-2 self-center" />

                {/* Create Action */}
                <button
                    className="flex items-center justify-center rounded-xl lg:rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 text-white shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-105 active:scale-95 transition-all w-12 h-12 lg:w-14 lg:h-14"
                    onClick={() => document.getElementById('create-task-trigger')?.click()}
                >
                    <Plus size={24} className="lg:w-7 lg:h-7" />
                </button>
            </div>
        </div>
    )
}
