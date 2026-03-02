'use client'

import { useEffect } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useUserStore } from '@/stores/useUserStore'
import { useProjectStore } from '@/stores/useProjectStore'
import { ToastContainer } from '@/components/ui/ToastContainer'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { ActiveTimer } from '@/components/timer/ActiveTimer'

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

            {/* Toast Notifications */}
            <ToastContainer />
        </DndProvider>
    )
}
