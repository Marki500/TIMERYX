'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Clock, CheckCircle2, Circle, AlertCircle, Loader2, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDuration } from '@/lib/utils/formatDuration'
import Link from 'next/link'

type Task = {
    id: string
    title: string
    status: 'todo' | 'in_progress' | 'done'
    total_duration?: number
    due_date?: string
}

export default function ClientProjectView() {
    const params = useParams()
    const token = params.token as string

    const [loading, setLoading] = useState(true)
    const [project, setProject] = useState<any>(null)
    const [tasks, setTasks] = useState<Task[]>([])
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        async function loadProject() {
            try {
                // Get project by token using RPC function
                const { data: projectData, error: projectError } = await supabase.rpc('get_project_by_token', {
                    p_token: token
                })

                if (projectError || !projectData || projectData.length === 0) {
                    setError('Invalid or expired access link')
                    setLoading(false)
                    return
                }

                setProject(projectData[0])

                // Fetch tasks for this project
                const { data: tasksData } = await (supabase.rpc as any)('get_tasks_with_duration', {
                    p_project_id: projectData[0].project_id
                })

                if (tasksData) {
                    setTasks(tasksData)
                }

                setLoading(false)
            } catch (err) {
                console.error('Error loading project:', err)
                setError('Failed to load project')
                setLoading(false)
            }
        }

        if (token) {
            loadProject()
        }
    }, [token])

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#1a0a2e] flex items-center justify-center">
                <div className="flex items-center gap-3 text-white">
                    <Loader2 className="animate-spin" size={24} />
                    <span>Loading project...</span>
                </div>
            </div>
        )
    }

    if (error || !project) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#1a0a2e] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
                    <p className="text-zinc-400">{error || 'Unable to load project'}</p>
                </div>
            </div>
        )
    }

    const totalDuration = tasks.reduce((sum, task) => sum + (task.total_duration || 0), 0)
    const budgetUsage = project.project_budget_hours_monthly > 0
        ? (totalDuration / (project.project_budget_hours_monthly * 3600)) * 100
        : 0

    const completedTasks = tasks.filter(t => t.status === 'done').length
    const totalTasks = tasks.length
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'done':
                return <CheckCircle2 size={18} className="text-green-500" />
            case 'in_progress':
                return <Circle size={18} className="text-blue-500 fill-blue-500/20" />
            default:
                return <Circle size={18} className="text-zinc-600" />
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'done':
                return 'Completed'
            case 'in_progress':
                return 'In Progress'
            default:
                return 'To Do'
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#1a0a2e] text-white">
            {/* Create Account Banner */}
            {!project.client_user_id && (
                <div className="bg-gradient-to-r from-primary-500/20 to-blue-500/20 border-b border-primary-500/20 backdrop-blur-xl">
                    <div className="max-w-5xl mx-auto px-8 py-4 flex items-center justify-between">
                        <div>
                            <p className="font-semibold">Want permanent access to this project?</p>
                            <p className="text-sm text-zinc-300">Create a free account to access anytime</p>
                        </div>
                        <Link href={`/client/invite/${token}`}>
                            <button className="px-5 py-2.5 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition-colors flex items-center gap-2">
                                <UserPlus size={18} />
                                Create Account
                            </button>
                        </Link>
                    </div>
                </div>
            )}

            <div className="max-w-5xl mx-auto p-8">
                {/* Project Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: project.project_color }}
                        />
                        <h1 className="text-4xl font-bold">{project.project_name}</h1>
                    </div>
                    {project.project_description && (
                        <p className="text-zinc-400">{project.project_description}</p>
                    )}
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <Clock className="text-blue-400" size={20} />
                            <p className="text-sm text-zinc-400">Time Logged</p>
                        </div>
                        <p className="text-3xl font-bold">{formatDuration(totalDuration)}</p>
                        {project.project_budget_hours_monthly > 0 && (
                            <p className="text-xs text-zinc-500 mt-1">
                                of {project.project_budget_hours_monthly}h budget
                            </p>
                        )}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <CheckCircle2 className="text-green-400" size={20} />
                            <p className="text-sm text-zinc-400">Progress</p>
                        </div>
                        <p className="text-3xl font-bold">{Math.round(progress)}%</p>
                        <p className="text-xs text-zinc-500 mt-1">
                            {completedTasks} of {totalTasks} tasks
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <AlertCircle className={`${budgetUsage > 100 ? 'text-red-400' : 'text-orange-400'}`} size={20} />
                            <p className="text-sm text-zinc-400">Budget Usage</p>
                        </div>
                        <p className={`text-3xl font-bold ${budgetUsage > 100 ? 'text-red-400' : ''}`}>
                            {Math.round(budgetUsage)}%
                        </p>
                        {budgetUsage > 100 && (
                            <p className="text-xs text-red-400 mt-1">Over budget</p>
                        )}
                    </motion.div>
                </div>

                {/* Budget Progress Bar */}
                {project.project_budget_hours_monthly > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8"
                    >
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-semibold">Monthly Budget</h3>
                            <span className="text-sm text-zinc-400">
                                {formatDuration(totalDuration)} / {project.project_budget_hours_monthly}h
                            </span>
                        </div>
                        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
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
                    </motion.div>
                )}

                {/* Tasks List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <h2 className="text-2xl font-bold mb-6">Tasks</h2>

                    {tasks.length === 0 ? (
                        <div className="text-center py-12 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl">
                            <p className="text-zinc-400">No tasks yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {tasks.map((task, index) => (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.05 * index }}
                                    className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                            {getStatusIcon(task.status)}
                                            <div className="flex-1">
                                                <h3 className="font-medium">{task.title}</h3>
                                                <div className="flex items-center gap-4 mt-1">
                                                    <span className="text-xs text-zinc-500">
                                                        {getStatusLabel(task.status)}
                                                    </span>
                                                    {task.due_date && (
                                                        <span className="text-xs text-zinc-500">
                                                            Due: {new Date(task.due_date).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {task.total_duration !== undefined && task.total_duration > 0 && (
                                            <div className="text-right">
                                                <p className="text-sm font-medium">
                                                    {formatDuration(task.total_duration)}
                                                </p>
                                                <p className="text-xs text-zinc-500">logged</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    )
}
