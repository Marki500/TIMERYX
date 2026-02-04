'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { WorkspaceSwitcher } from '@/components/workspace/WorkspaceSwitcher'
import {
    LayoutDashboard,
    Clock,
    FolderKanban,
    MessageSquare,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    PieChart
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
    collapsed: boolean
    setCollapsed: (v: boolean) => void
}

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
    const pathname = usePathname()

    const links = [
        { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
        { href: '/dashboard/projects', label: 'Projects', icon: FolderKanban },
        { href: '/dashboard/time', label: 'Time Tracking', icon: Clock },
        { href: '/dashboard/chat', label: 'Messages', icon: MessageSquare },
        { href: '/dashboard/reports', label: 'Reports', icon: PieChart },
    ]

    return (
        <motion.div
            className={cn(
                "relative flex flex-col h-[calc(100vh-2rem)] my-4 ml-4 rounded-3xl z-20",
                "bg-black/5 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden",
                collapsed ? "w-20" : "w-64"
            )}
            initial={false}
            animate={{ width: collapsed ? 80 : 256 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            {/* Logo / Workspace Switcher Area */}
            <div className="flex items-center justify-center p-4 border-b border-white/5 min-h-[5rem]">
                {collapsed ? (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                        <Clock className="w-6 h-6 text-white" />
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full"
                    >
                        <WorkspaceSwitcher />
                    </motion.div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 flex flex-col gap-2 p-3 mt-4">
                {links.map((link) => {
                    const isActive = pathname === link.href
                    const Icon = link.icon

                    return (
                        <Link key={link.href} href={link.href}>
                            <div
                                className={cn(
                                    "relative flex items-center h-12 px-4 rounded-2xl transition-all duration-200 group",
                                    isActive
                                        ? "text-white"
                                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-primary-600/20 border border-primary-500/30 rounded-2xl"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}

                                <Icon className={cn("w-5 h-5 relative z-10", isActive && "text-primary-400")} />

                                {!collapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="ml-3 font-medium relative z-10"
                                    >
                                        {link.label}
                                    </motion.span>
                                )}
                            </div>
                        </Link>
                    )
                })}
            </nav>

            {/* User / Bottom Actions */}
            <div className="p-3 border-t border-white/5">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-full h-12 flex items-center justify-center rounded-2xl hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                >
                    {collapsed ? <ChevronRight size={20} /> : (
                        <div className="flex items-center gap-3 w-full px-2">
                            <ChevronLeft size={20} />
                            <span className="text-sm font-medium">Collapse</span>
                        </div>
                    )}
                </button>
            </div>
        </motion.div>
    )
}
