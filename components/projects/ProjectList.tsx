'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Folder, Clock, MoreVertical, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useProjectStore } from '@/stores/useProjectStore'
import { useUserStore } from '@/stores/useUserStore'
import { CreateProjectDialog } from './CreateProjectDialog'
import { formatDuration } from '@/lib/utils' // Assuming this helper exists or I'll inline it

export function ProjectList() {
    const { projects, fetchProjects, deleteProject, isLoading } = useProjectStore()
    const { currentWorkspace } = useUserStore()
    const [isCreateOpen, setIsCreateOpen] = useState(false)

    useEffect(() => {
        if (currentWorkspace) {
            fetchProjects(currentWorkspace.id)
        }
    }, [currentWorkspace, fetchProjects])

    if (!currentWorkspace) return null

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Projects</h1>
                    <p className="text-zinc-400">Manage your projects and track progress</p>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
                >
                    <Plus size={18} />
                    New Project
                </button>
            </div>

            {isLoading && projects.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-48 bg-white/5 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-xl border border-white/10 border-dashed">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <Folder size={32} className="text-zinc-500" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No projects yet</h3>
                    <p className="text-zinc-400 mb-6 max-w-sm text-center">
                        Create your first project to start tracking tasks and time budgets.
                    </p>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    >
                        Create Project
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <Link
                            href={`/projects/${project.id}`}
                            key={project.id}
                            className="group relative bg-[#161616] border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all hover:shadow-xl hover:shadow-black/50 block"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                                        style={{ backgroundColor: project.color }}
                                    >
                                        {project.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-medium line-clamp-1">{project.name}</h3>
                                        <span className="text-xs text-zinc-500">
                                            {project.is_client_visible ? 'Visible to Client' : 'Internal'}
                                        </span>
                                    </div>
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            confirm('Delete project?') && deleteProject(project.id)
                                        }}
                                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between text-sm mb-2">
                                        <span className="text-zinc-400">Budget</span>
                                        <span className="text-white font-mono">{project.budget_hours_monthly}h/mo</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary-500 rounded-full"
                                            style={{ width: '0%' }} // TODO: Calculate actual progress
                                        />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            <CreateProjectDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
        </div>
    )
}
