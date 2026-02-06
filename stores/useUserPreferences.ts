'use client'

import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'

export interface UserPreferences {
    id: string
    user_id: string
    timezone: string
    time_format: '12h' | '24h'
    date_format: string
    first_day_of_week: number
    dashboard_cards: string[]
    theme: 'dark' | 'light'
    notifications_enabled: boolean
    created_at: string
    updated_at: string
}

interface UserPreferencesState {
    preferences: UserPreferences | null
    isLoading: boolean
    fetchPreferences: () => Promise<void>
    updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>
}

export const useUserPreferences = create<UserPreferencesState>((set, get) => ({
    preferences: null,
    isLoading: false,

    fetchPreferences: async () => {
        set({ isLoading: true })
        const supabase = createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            set({ isLoading: false })
            return
        }

        const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (error) {
            // If no preferences exist, create default ones
            if (error.code === 'PGRST116') {
                const { data: newPrefs, error: insertError } = await (supabase
                    .from('user_preferences') as any)
                    .insert({ user_id: user.id })
                    .select()
                    .single()

                if (!insertError && newPrefs) {
                    set({ preferences: newPrefs as UserPreferences, isLoading: false })
                } else {
                    set({ isLoading: false })
                }
            } else {
                set({ isLoading: false })
            }
        } else {
            set({ preferences: data as UserPreferences, isLoading: false })
        }
    },

    updatePreferences: async (updates: Partial<UserPreferences>) => {
        const supabase = createClient()
        const currentPrefs = get().preferences

        if (!currentPrefs) return

        const { data, error } = await (supabase
            .from('user_preferences') as any)
            .update(updates)
            .eq('id', currentPrefs.id)
            .select()
            .single()

        if (!error && data) {
            set({ preferences: data as UserPreferences })
        }
    }
}))
