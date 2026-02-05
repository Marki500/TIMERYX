'use client'

import { useState, useEffect } from 'react'
import { Calendar } from 'lucide-react'
import { useProjectStore } from '@/stores/useProjectStore'
import { useUserStore } from '@/stores/useUserStore'
import { CustomSelect } from '@/components/ui/CustomSelect'

export interface FilterState {
    dateRange: 'last7' | 'last30' | 'thisMonth' | 'custom'
    customStartDate?: string
    customEndDate?: string
    projectId?: string
    taskStatus?: 'todo' | 'in_progress' | 'done' | 'all'
}

interface ReportFiltersProps {
    onFilterChange: (filters: FilterState) => void
}

export function ReportFilters({ onFilterChange }: ReportFiltersProps) {
    const { projects, fetchProjects } = useProjectStore()
    const { currentWorkspace } = useUserStore()

    const [filters, setFilters] = useState<FilterState>({
        dateRange: 'last7',
        taskStatus: 'all'
    })

    useEffect(() => {
        if (currentWorkspace) {
            fetchProjects(currentWorkspace.id)
        }
    }, [currentWorkspace])

    const handleFilterChange = (key: keyof FilterState, value: any) => {
        const newFilters = { ...filters, [key]: value }
        setFilters(newFilters)
        onFilterChange(newFilters)
    }

    const dateRangeOptions = [
        { value: 'last7', label: 'Últimos 7 días' },
        { value: 'last30', label: 'Últimos 30 días' },
        { value: 'thisMonth', label: 'Este mes' },
        { value: 'custom', label: 'Personalizado' }
    ]

    const statusOptions = [
        { value: 'all', label: 'Todos los estados' },
        { value: 'todo', label: 'Por Hacer' },
        { value: 'in_progress', label: 'En Progreso' },
        { value: 'done', label: 'Completadas' }
    ]

    const projectOptions = [
        { value: '', label: 'Todos los proyectos' },
        ...projects.map(p => ({ value: p.id, label: p.name }))
    ]

    return (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-primary-400" />
                <h3 className="text-lg font-bold text-white">Filtros</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Date Range Filter */}
                <CustomSelect
                    label="Rango de Fechas"
                    value={filters.dateRange}
                    onChange={(value) => handleFilterChange('dateRange', value)}
                    options={dateRangeOptions}
                />

                {/* Custom Date Inputs */}
                {filters.dateRange === 'custom' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Desde
                            </label>
                            <input
                                type="date"
                                value={filters.customStartDate || ''}
                                onChange={(e) => handleFilterChange('customStartDate', e.target.value)}
                                className="w-full px-4 py-2.5 bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all hover:border-white/20 hover:from-white/[0.12] hover:to-white/[0.04] backdrop-blur-sm"
                                style={{ colorScheme: 'dark' }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Hasta
                            </label>
                            <input
                                type="date"
                                value={filters.customEndDate || ''}
                                onChange={(e) => handleFilterChange('customEndDate', e.target.value)}
                                className="w-full px-4 py-2.5 bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all hover:border-white/20 hover:from-white/[0.12] hover:to-white/[0.04] backdrop-blur-sm"
                                style={{ colorScheme: 'dark' }}
                            />
                        </div>
                    </>
                )}

                {/* Project Filter */}
                <CustomSelect
                    label="Proyecto"
                    value={filters.projectId || ''}
                    onChange={(value) => handleFilterChange('projectId', value || undefined)}
                    options={projectOptions}
                />

                {/* Task Status Filter */}
                <CustomSelect
                    label="Estado de Tarea"
                    value={filters.taskStatus || 'all'}
                    onChange={(value) => handleFilterChange('taskStatus', value)}
                    options={statusOptions}
                />
            </div>
        </div>
    )
}
