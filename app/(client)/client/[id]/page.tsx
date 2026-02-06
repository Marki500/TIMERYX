'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock, CheckCircle2, Circle, AlertCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDuration } from '@/lib/utils/formatDuration'
import { ProjectChat } from '@/components/chat/ProjectChat'

type Task = {
    id: string
    title: string
    status: 'todo' | 'in_progress' | 'done'
    total_duration?: number
    due_date?: string
}

export default function ClientProjectDetailPage() {
    const params = useParams()
    const router = useRouter()
    const projectId = params.id as string
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [project, setProject] = useState<any>(null)
    const [tasks, setTasks] = useState<Task[]>([])
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadProject()
    }, [projectId])

    const loadProject = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            // Get client's projects to verify access
            const { data: clientProjects } = await supabase.rpc('get_client_projects', {
                p_user_id: user.id
            })

            const projectData = clientProjects?.find((p: any) => p.project_id === projectId)

            if (!projectData) {
                setError('Project not found or access denied')
                setLoading(false)
                return
            }

            setProject(projectData)

            // Fetch tasks
            const { data: tasksData } = await (supabase.rpc as any)('get_tasks_with_duration', {
                p_project_id: projectId
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex items-center gap-3 text-white">
                    <Loader2 className="animate-spin" size={24} />
                    <span>Loading project...</span>
                </div>
            </div>
        )
    }

    if (error || !project) {
        return (
            <div className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
                <p className="text-zinc-400">{error || 'Unable to load project'}</p>
            </div>
        )
    }

    const totalDuration = tasks.reduce((sum, task) => sum + (task.total_duration || 0), 0)
    const completedTasks = tasks.filter(t => t.status === 'done').length
    const totalTasks = tasks.length
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <button
                    onClick={() => router.push('/client')}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft size={18} />
                    Back to Dashboard
                </button>

                <div className="flex items-center gap-4">
                    <div
                        className="w-4 h-12 rounded-full"
                        style={{ backgroundColor: project.project_color }}
                    />
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1">{project.project_name}</h1>
                        <p className="text-zinc-400">View project progress and communicate with your team</p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Clock className="text-blue-400" size={20} />
                        <p className="text-sm text-zinc-400">Time Logged</p>
                    </div>
                    <p className="text-3xl font-bold text-white">{formatDuration(totalDuration)}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <CheckCircle2 className="text-green-400" size={20} />
                        <p className="text-sm text-zinc-400">Progress</p>
                    </div>
                    <p className="text-3xl font-bold text-white">{Math.round(progress)}%</p>
                    <p className="text-xs text-zinc-500 mt-1">
                        {completedTasks} of {totalTasks} tasks
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="text-orange-400" size={20} />
                        <p className="text-sm text-zinc-400">Active Tasks</p>
                    </div>
                    <p className="text-3xl font-bold text-white">{totalTasks - completedTasks}</p>
                </motion.div>
            </div>

            {/* Project Chat */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white">Project Chat</h2>
                <ProjectChat projectId={projectId} userType="client" />
            </div>

            {/* Tasks List */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white">Tasks</h2>

                {tasks.length === 0 ? (
                    <div className="text-center py-12 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl">
                        <p className="text-zinc-400">No tasks yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tasks.map((task) => (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-4"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                        {getStatusIcon(task.status)}
                                        <div className="flex-1">
                                            <h3 className="font-medium text-white">{task.title}</h3>
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
                                            <p className="text-sm font-medium text-white">
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
            </div>
        </div>
    )
}
