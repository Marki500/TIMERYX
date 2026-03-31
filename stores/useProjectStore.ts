'use client'

import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'

type Project = Database['public']['Tables']['projects']['Row']
type ProjectInsert = Database['public']['Tables']['projects']['Insert']
type ProjectUpdate = Database['public']['Tables']['projects']['Update']

interface ProjectState {
    projects: Project[]
    isLoading: boolean
    fetchProjects: (workspaceId: string) => Promise<void>
    createProject: (project: ProjectInsert) => Promise<{ data: Project | null, error: any }>
    updateProject: (id: string, project: ProjectUpdate) => Promise<{ data: Project | null, error: any }>
    deleteProject: (id: string) => Promise<void>
}

export const useProjectStore = create<ProjectState>((set, get) => ({
    projects: [],
    isLoading: false,

    fetchProjects: async (workspaceId) => {
        set({ isLoading: true })
        const supabase = createClient()

        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('workspace_id', workspaceId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching projects:', error)
            set({ projects: [] })
        } else {
            set({ projects: data || [] })
        }
        set({ isLoading: false })
    },

    createProject: async (project) => {
        set({ isLoading: true })
        const supabase = createClient()

        const { data, error } = await supabase
            .from('projects')
            // @ts-ignore
            .insert(project)
            .select()
            .single()

        if (error) {
            console.error('Error creating project:', error)
        } else if (data) {
            const { projects } = get()
            set({ projects: [data, ...projects] })
        }

        set({ isLoading: false })
        return { data, error }
    },

    updateProject: async (id, project) => {
        set({ isLoading: true })
        const supabase = createClient()

        const { data, error } = await supabase
            .from('projects')
            // @ts-ignore
            .update(project)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Error updating project:', error)
        } else if (data) {
            const { projects } = get()
            set({ projects: projects.map(p => p.id === id ? data : p) })
        }

        set({ isLoading: false })
        return { data, error }
    },

    deleteProject: async (id) => {
        const supabase = createClient()
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting project:', error)
        } else {
            const { projects } = get()
            set({ projects: projects.filter(p => p.id !== id) })
        }
    }
}))
