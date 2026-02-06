'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Clock, TrendingUp, FolderKanban, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { formatDuration } from '@/lib/utils/formatDuration'

type ClientProject = {
    project_id: string
    project_name: string
    project_color: string
    project_budget_hours_monthly: number
    access_token: string
    total_duration?: number
    task_count?: number
}

export default function ClientDashboard() {
    const [projects, setProjects] = useState<ClientProject[]>([])
    const [loading, setLoading] = useState(true)
    const [userName, setUserName] = useState<string>('Client')
    const supabase = createClient()

    useEffect(() => {
        async function loadClientData() {
            setLoading(true)

            try {
                // Get current user
                const { data: { user } } = await supabase.auth.getUser()

                if (!user) {
                    window.location.href = '/login'
                    return
                }

                // Get user profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', user.id)
                    .single()

                if (profile?.full_name) {
                    setUserName(profile.full_name)
                }

                // Get client's projects using RPC
                const { data: clientProjects, error: projectsError } = await supabase.rpc('get_client_projects', {
                    p_user_id: user.id
                })

                if (!projectsError && clientProjects && clientProjects.length > 0) {
                    // Fetch tasks for each project to get duration and count
                    const projectsWithData = await Promise.all(
                        clientProjects.map(async (project: any) => {
                            const { data: tasks } = await (supabase.rpc as any)('get_tasks_with_duration', {
                                p_project_id: project.project_id
                            })

                            const totalDuration = tasks?.reduce((sum: number, task: any) =>
                                sum + (task.total_duration || 0), 0) || 0

                            return {
                                ...project,
                                total_duration: totalDuration,
                                task_count: tasks?.length || 0
                            }
                        })
                    )

                    setProjects(projectsWithData)
                }

                setLoading(false)
            } catch (error) {
                console.error('Error loading client data:', error)
                setLoading(false)
            }
        }

        loadClientData()
    }, [])

    const totalTimeThisMonth = projects.reduce((sum, p) => sum + (p.total_duration || 0), 0)
    const totalBudget = projects.reduce((sum, p) => sum + (p.project_budget_hours_monthly || 0), 0)

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex items-center gap-3 text-white">
                    <Loader2 className="animate-spin" size={24} />
                    <span>Loading your projects...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-4xl font-bold mb-2">
                    Welcome back, {userName}
                </h1>
                <p className="text-zinc-400">
                    Here's an overview of your projects
                </p>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                            <FolderKanban className="text-primary-400" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400">Your Projects</p>
                            <p className="text-2xl font-bold">{projects.length}</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <Clock className="text-blue-400" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400">Time This Month</p>
                            <p className="text-2xl font-bold">{formatDuration(totalTimeThisMonth)}</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <TrendingUp className="text-green-400" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400">Total Budget</p>
                            <p className="text-2xl font-bold">{totalBudget}h</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Projects Grid */}
            <div>
                <h2 className="text-2xl font-bold mb-6">Your Projects</h2>

                {projects.length === 0 ? (
                    <div className="text-center py-12 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl">
                        <FolderKanban size={48} className="mx-auto mb-4 text-zinc-600" />
                        <p className="text-zinc-400 mb-2">No projects assigned yet</p>
                        <p className="text-sm text-zinc-500">You'll see your projects here once you're invited to them</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project, index) => {
                            const budgetUsage = project.project_budget_hours_monthly > 0
                                ? ((project.total_duration || 0) / (project.project_budget_hours_monthly * 3600)) * 100
                                : 0

                            return (
                                <motion.div
                                    key={project.project_id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * index }}
                                >
                                    <Link href={`/client/${project.project_id}`}>
                                        <div className="group bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/[0.05] transition-all cursor-pointer">
                                            {/* Project Color & Name */}
                                            <div className="flex items-center gap-3 mb-4">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: project.project_color }}
                                                />
                                                <h3 className="font-semibold text-lg group-hover:text-primary-400 transition-colors">
                                                    {project.project_name}
                                                </h3>
                                            </div>

                                            {/* Stats */}
                                            <div className="space-y-3">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-zinc-400">Tasks</span>
                                                    <span className="font-medium">{project.task_count}</span>
                                                </div>

                                                <div className="flex justify-between text-sm">
                                                    <span className="text-zinc-400">Time Logged</span>
                                                    <span className="font-medium">
                                                        {formatDuration(project.total_duration || 0)}
                                                    </span>
                                                </div>

                                                {/* Budget Progress */}
                                                {project.project_budget_hours_monthly > 0 && (
                                                    <div>
                                                        <div className="flex justify-between text-xs text-zinc-400 mb-2">
                                                            <span>Budget</span>
                                                            <span>{Math.round(budgetUsage)}%</span>
                                                        </div>
                                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full transition-all ${budgetUsage > 100
                                                                    ? 'bg-red-500'
                                                                    : budgetUsage > 80
                                                                        ? 'bg-orange-500'
                                                                        : 'bg-blue-500'
                                                                    }`}
                                                                style={{ width: `${Math.min(budgetUsage, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
