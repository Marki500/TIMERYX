'use client'

import { useEffect } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useUserStore } from '@/stores/useUserStore'
import { useProjectStore } from '@/stores/useProjectStore'
import { useTimerStore, registerTimerSyncCallbacks } from '@/stores/useTimerStore'
import { useTaskStore } from '@/stores/useTaskStore'
import { useDashboardStore } from '@/stores/useDashboardStore'
import { ToastContainer } from '@/components/ui/ToastContainer'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { ActiveTimer } from '@/components/timer/ActiveTimer'
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog'
import { createClient } from '@/lib/supabase/client'

export function DashboardClientProvider({
    children,
    initialProfile,
    initialWorkspaces,
    initialWorkspaceData
}: {
    children: React.ReactNode
    initialProfile: any
    initialWorkspaces: any[]
    initialWorkspaceData: any | null // { workspace, role }
}) {
    const {
        setProfile,
        setWorkspaces,
        setCurrentWorkspace,
        setCurrentRole,
        currentWorkspace
    } = useUserStore()

    const { fetchProjects } = useProjectStore()
    const { fetchActiveTimer, loadFromStorage } = useTimerStore()

    // Load active timer once on mount (avoids duplicate fetches from TimerBar + ActiveTimer)
    useEffect(() => {
        loadFromStorage()
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Sync timer side-effects: refresh tasks and dashboard when timer data changes
    useEffect(() => {
        const unregister = registerTimerSyncCallbacks(
            // onRefresh: called after stop/manual entry/duration change
            () => {
                const taskStore = useTaskStore.getState()
                taskStore.fetchTasks(taskStore.currentProjectId || undefined)
                useDashboardStore.getState().triggerRefresh()
            },
            // onTaskUpdate: optimistic duration update right after stop
            (taskId, addedSeconds) => {
                const taskStore = useTaskStore.getState()
                const task = taskStore.tasks.find(t => t.id === taskId)
                if (task) {
                    taskStore.updateTask(taskId, {
                        total_duration: (task.total_duration || 0) + addedSeconds
                    })
                }
            }
        )
        return unregister
    }, [])

    // Realtime: sync timer when another device (e.g. mobile app) changes it
    useEffect(() => {
        const supabase = createClient()
        let userId: string | null = null

        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) return
            userId = user.id

            const channel = supabase
                .channel('timer-sync')
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${userId}`,
                }, () => {
                    fetchActiveTimer()
                })
                .subscribe()

            return () => { supabase.removeChannel(channel) }
        })
    }, [fetchActiveTimer])

    // Hydrate store on mount with server data
    useEffect(() => {
        if (initialProfile) setProfile(initialProfile)

        if (initialWorkspaces && initialWorkspaces.length > 0) {
            setWorkspaces(initialWorkspaces)

            // Only set if not already set by hydration persistence
            if (!currentWorkspace && initialWorkspaceData) {
                setCurrentWorkspace(initialWorkspaceData.workspace)
                setCurrentRole(initialWorkspaceData.role)
            }
        }
    }, [])

    // Fetch projects when current workspace changes
    useEffect(() => {
        if (currentWorkspace?.id) {
            fetchProjects(currentWorkspace.id)
        }
    }, [currentWorkspace?.id, fetchProjects])

    return (
        <DndProvider backend={HTML5Backend}>
            {children}
            {/* Unified Floating Dock */}
            <FloatingDock />

            {/* Floating Active Timer */}
            <ActiveTimer />

            {/* Global Modals */}
            <CreateTaskDialog />

            {/* Toast Notifications */}
            <ToastContainer />
        </DndProvider>
    )
}
