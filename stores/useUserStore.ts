import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { Database } from '@/types/supabase'
import { UserRole } from '@/lib/permissions'

type Profile = Database['public']['Tables']['profiles']['Row']
type Workspace = Database['public']['Tables']['workspaces']['Row']

interface UserState {
    profile: Profile | null
    workspaces: Workspace[]
    currentWorkspace: Workspace | null
    currentRole: UserRole | null

    setProfile: (profile: Profile) => void
    setWorkspaces: (workspaces: Workspace[]) => void
    setCurrentWorkspace: (workspace: Workspace) => void
    setCurrentRole: (role: UserRole | null) => void
    clearUser: () => void
}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            profile: null,
            workspaces: [],
            currentWorkspace: null,
            currentRole: null,

            setProfile: (profile) => set({ profile }),
            setWorkspaces: (workspaces) => set({ workspaces }),
            setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
            setCurrentRole: (role) => set({ currentRole: role }),
            clearUser: () => set({ profile: null, workspaces: [], currentWorkspace: null, currentRole: null }),
        }),
        {
            name: 'timeryx-user-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
)
