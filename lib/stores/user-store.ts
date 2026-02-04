import { create } from 'zustand'
import type { Database } from '../supabase/types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface UserState {
    user: Profile | null
    setUser: (user: Profile | null) => void
    clearUser: () => void
}

export const useUserStore = create<UserState>((set) => ({
    user: null,
    setUser: (user) => set({ user }),
    clearUser: () => set({ user: null }),
}))
