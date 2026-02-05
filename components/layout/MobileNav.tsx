'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    LayoutGrid,
    CheckSquare,
    Folder,
    Clock,
    PieChart,
    Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTaskStore } from '@/stores/useTaskStore'

export function MobileNav() {
    const pathname = usePathname()
    // We can trigger "New Task" directly from here too if we want
    // But for now let's keep it simple navigation

    const links = [
        { href: '/dashboard', icon: LayoutGrid, label: 'Home' },
        { href: '/tasks', icon: CheckSquare, label: 'Tasks' },
        { href: '/timer', icon: Clock, label: 'Timer' }, // Or maybe open timer modal?
        { href: '/projects', icon: Folder, label: 'Projects' },
        { href: '/reports', icon: PieChart, label: 'Stats' },
    ]

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 lg:hidden w-auto">
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center gap-1.5 p-2 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50"
            >
                {links.map((link) => {
                    const isActive = pathname === link.href

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300",
                                isActive
                                    ? "text-white bg-white/15"
                                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                            )}
                        >
                            <link.icon size={20} strokeWidth={isActive ? 2.5 : 2} />

                            {isActive && (
                                <motion.div
                                    layoutId="activeMobileTab"
                                    className="absolute inset-0 bg-white/5 rounded-full border border-white/10"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </Link>
                    )
                })}

                {/* Floating "Add" Button in the island */}
                <div className="w-px h-8 bg-white/10 mx-1" />

                <button
                    className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-600 text-white shadow-lg shadow-primary-500/30 active:scale-95 transition-transform"
                    onClick={() => document.getElementById('create-task-trigger')?.click()}
                >
                    <Plus size={24} />
                </button>
            </motion.div>
        </div>
    )
}
