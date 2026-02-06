'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock, CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { formatDuration } from '@/lib/utils/formatDuration'

type Project = {
    id: string
    name: string
    color: string
    budget_hours_monthly: number
    description?: string
}

type Task = {
    id: string
    title: string
    status: 'todo' | 'in_progress' | 'done'
    total_duration?: number
    due_date?: string
}

export default function ClientProjectDetail() {
    const params = useParams()
    const router = useRouter()
    const [project, setProject] = useState<Project | null>(null)
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function loadProject() {
            if (!params.id) return

            setLoading(true)

            // Fetch project (must be client-visible)
            const { data: projectData, error } = await supabase
                .from('projects')
                .select('*')
                .eq('id', params.id)
                .eq('is_client_visible', true)
                .single()

            if (error || !projectData) {
                router.push('/client')
                return
            }

            setProject(projectData)

            // Fetch tasks
            const { data: tasksData } = await (supabase.rpc as any)('get_tasks_with_duration', {
                p_project_id: params.id
            })

            if (tasksData) {
                setTasks(tasksData)
            }

            setLoading(false)
        }

        loadProject()
    }, [params.id])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-zinc-400">Loading project...</div>
            </div>
        )
    }

    if (!project) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-zinc-400">Project not found</div>
            </div>
        )
    }

    const totalDuration = tasks.reduce((sum, task) => sum + (task.total_duration || 0), 0)
    const budgetUsage = project.budget_hours_monthly > 0
        ? (totalDuration / (project.budget_hours_monthly * 3600)) * 100
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
        <div className="max-w-5xl mx-auto">
            {/* Back Button */}
            <Link href="/client">
                <motion.button
                    whileHover={{ x: -4 }}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6"
                >
                    <ArrowLeft size={20} />
                    <span>Back to Projects</span>
                </motion.button>
            </Link>

            {/* Project Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: project.color }}
                    />
                    <h1 className="text-4xl font-bold">{project.name}</h1>
                </div>
                {project.description && (
                    <p className="text-zinc-400">{project.description}</p>
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
                    {project.budget_hours_monthly > 0 && (
                        <p className="text-xs text-zinc-500 mt-1">
                            of {project.budget_hours_monthly}h budget
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
            {project.budget_hours_monthly > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8"
                >
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold">Monthly Budget</h3>
                        <span className="text-sm text-zinc-400">
                            {formatDuration(totalDuration)} / {project.budget_hours_monthly}h
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
                                className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:bg-white/[0.05] transition-all"
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
    )
}
