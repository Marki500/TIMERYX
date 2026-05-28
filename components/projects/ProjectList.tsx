'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Folder, Clock, MoreVertical, Trash2, Settings, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { useProjectStore } from '@/stores/useProjectStore'
import { useUserStore } from '@/stores/useUserStore'
import { useTaskStore } from '@/stores/useTaskStore'
import { CreateProjectDialog } from './CreateProjectDialog'
import { EditProjectDialog } from './EditProjectDialog'
import { formatDuration } from '@/lib/utils'
import { ProjectIcon } from '@/components/ui/ProjectIcon'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/stores/useLocaleStore'

export function ProjectList() {
    const { t, locale } = useTranslation()
    const { projects, fetchProjects, deleteProject, isLoading } = useProjectStore()
    const { currentWorkspace } = useUserStore()
    const { tasks, fetchTasks } = useTaskStore()
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingProject, setEditingProject] = useState<any>(null)
    const [monthlyHours, setMonthlyHours] = useState<Record<string, number>>({})
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        if (currentWorkspace) {
            fetchProjects(currentWorkspace.id)
            // Fetch all tasks (no project filter) to calculate time for each project
            fetchTasks()
        }
    }, [currentWorkspace, fetchProjects, fetchTasks])

    useEffect(() => {
        async function fetchMonthlyHours() {
            if (!currentWorkspace) return
            const supabase = createClient()
            const now = new Date()
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
            
            const { data, error } = await supabase
                .from('time_entries')
                .select(`
                    start_time,
                    end_time,
                    tasks!inner(project_id)
                `)
                .gte('start_time', firstDay)
            
            if (!error && data) {
                const hours: Record<string, number> = {}
                data.forEach((entry: any) => {
                    const projId = entry.tasks?.project_id
                    if (!projId) return
                    
                    const end = entry.end_time ? new Date(entry.end_time).getTime() : Date.now()
                    const start = new Date(entry.start_time).getTime()
                    const durationInSeconds = (end - start) / 1000
                    
                    if (!hours[projId]) hours[projId] = 0
                    hours[projId] += Math.max(0, durationInSeconds / 3600)
                })
                setMonthlyHours(hours)
            }
        }
        fetchMonthlyHours()
    }, [currentWorkspace])

    if (!currentWorkspace) return null

    const filteredProjects = projects.filter((project) =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">{t('projects.title')}</h1>
                    <p className="text-zinc-400">
                        {locale === 'es' ? 'Administra tus proyectos y haz un seguimiento del progreso' : 'Manage your projects and track progress'}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            placeholder={t('projects.search_placeholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 w-full sm:w-64 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-primary-500 transition-colors text-sm"
                        />
                    </div>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors shrink-0"
                    >
                        <Plus size={18} />
                        {t('projects.new_project')}
                    </button>
                </div>
            </div>

            {isLoading && projects.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-48 bg-white/5 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-xl border border-white/10 border-dashed">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <Folder size={32} className="text-zinc-500" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">
                        {searchQuery ? t('common.no_projects') : (locale === 'es' ? 'Aún no hay proyectos' : 'No projects yet')}
                    </h3>
                    <p className="text-zinc-400 mb-6 max-w-sm text-center">
                        {searchQuery
                            ? (locale === 'es' ? 'Prueba con otra palabra de búsqueda.' : 'Try searching for something else.')
                            : (locale === 'es' ? 'Crea tu primer proyecto para empezar a realizar un seguimiento de las tareas y los presupuestos de tiempo.' : 'Create your first project to start tracking tasks and time budgets.')}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                        >
                            {t('projects.new_project')}
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <Link
                            href={`/projects/${project.id}`}
                            key={project.id}
                            className="group relative bg-[#161616] border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all hover:shadow-xl hover:shadow-black/50 block"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <ProjectIcon project={project} size="lg" />
                                    <div>
                                        <h3 className="text-white font-medium line-clamp-1">{project.name}</h3>
                                        <span className="text-xs text-zinc-500">
                                            {project.is_client_visible 
                                                ? (locale === 'es' ? 'Visible para el cliente' : 'Visible to Client') 
                                                : (locale === 'es' ? 'Interno' : 'Internal')}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            setEditingProject(project)
                                        }}
                                        className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg"
                                    >
                                        <Settings size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            confirm(locale === 'es' ? '¿Eliminar proyecto?' : 'Delete project?') && deleteProject(project.id)
                                        }}
                                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {(() => {
                                    // Calculate time from tasks for this project
                                    const projMonthlyHours = monthlyHours[project.id] || 0
                                    const budgetHours = project.budget_hours_monthly || 0
                                    const percentage = budgetHours > 0 ? (projMonthlyHours / budgetHours) * 100 : 0

                                    return (
                                        <div>
                                            <div className="flex items-center justify-between text-sm mb-2">
                                                <span className="text-zinc-400">{locale === 'es' ? 'Este Mes' : 'This Month'}</span>
                                                <span className="text-white font-mono">
                                                    {projMonthlyHours.toFixed(1)}h / {budgetHours}h
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${percentage > 100 ? 'bg-red-500' :
                                                        percentage > 80 ? 'bg-orange-500' :
                                                            'bg-primary-500'
                                                        }`}
                                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                                />
                                            </div>
                                            {percentage > 100 && (
                                                <div className="text-xs text-red-400 mt-1">
                                                    {(percentage - 100).toFixed(0)}% {locale === 'es' ? 'excedido' : 'over'}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })()}
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            <CreateProjectDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
            {editingProject && (
                <EditProjectDialog
                    isOpen={true}
                    onClose={() => setEditingProject(null)}
                    project={editingProject}
                />
            )}
        </div>
    )
}
