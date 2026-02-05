'use client'

import { motion } from 'framer-motion'
import { LayoutList, KanbanSquare, CalendarDays } from 'lucide-react'
import { useTaskStore, ViewMode } from '@/stores/useTaskStore'
import { cn } from '@/lib/utils'

interface ViewSwitcherProps {
    excludedViews?: ViewMode[]
}

export function ViewSwitcher({ excludedViews = [] }: ViewSwitcherProps) {
    const { viewMode, setViewMode } = useTaskStore()

    const allViews: { id: ViewMode; label: string; icon: any }[] = [
        { id: 'table', label: 'List', icon: LayoutList },
        { id: 'kanban', label: 'Board', icon: KanbanSquare },
        { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    ]

    const views = allViews.filter(view => !excludedViews.includes(view.id))

    return (
        <div className="flex p-1 bg-black/20 backdrop-blur-md rounded-xl border border-white/5">
            {views.map((view) => {
                const isActive = viewMode === view.id
                const Icon = view.icon

                return (
                    <button
                        key={view.id}
                        onClick={() => setViewMode(view.id)}
                        className={cn(
                            "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors z-10",
                            isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="activeView"
                                className="absolute inset-0 bg-white/10 rounded-lg border border-white/5 -z-10"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <Icon size={16} />
                        <span>{view.label}</span>
                    </button>
                )
            })}
        </div>
    )
}
