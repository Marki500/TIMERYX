import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { translations, Locale } from '@/lib/i18n/translations'
import { useState, useEffect } from 'react'

interface LocaleState {
    locale: Locale
    setLocale: (locale: Locale) => void
}

export const useLocaleStore = create<LocaleState>()(
    persist(
        (set) => ({
            locale: 'es', // Default to Spanish
            setLocale: (locale) => set({ locale }),
        }),
        {
            name: 'timeryx-locale-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
)

// A custom hook to avoid Next.js hydration mismatch errors when reading from localStorage
export function useTranslation() {
    const { locale, setLocale } = useLocaleStore()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Safely get a nested key from translation object
    const t = (key: string): string => {
        // Before mounting (on the server or during initial client render),
        // we can default to Spanish to match the initial Zustand state,
        // preventing hydration mismatch.
        const currentLocale = mounted ? locale : 'es'
        const keys = key.split('.')
        let result: any = translations[currentLocale]
        
        for (const k of keys) {
            if (result && typeof result === 'object' && k in result) {
                result = result[k]
            } else {
                return key // fallback to key itself if not found
            }
        }
        
        return typeof result === 'string' ? result : key
    }
    
    return { t, locale: mounted ? locale : 'es', setLocale, isMounted: mounted }
}
