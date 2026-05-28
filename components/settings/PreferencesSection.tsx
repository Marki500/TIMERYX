'use client'

import { useState, useEffect } from 'react'
import { Save, Layout } from 'lucide-react'
import { useUserPreferences } from '@/stores/useUserPreferences'
import { CustomSelect } from '@/components/ui/CustomSelect'
import { useTranslation } from '@/stores/useLocaleStore'

export function PreferencesSection() {
    const { t, locale, setLocale } = useTranslation()
    const { preferences, updatePreferences, fetchPreferences } = useUserPreferences()
    const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('24h')
    const [dateFormat, setDateFormat] = useState('DD/MM/YYYY')
    const [firstDayOfWeek, setFirstDayOfWeek] = useState(1)
    const [notificationsEnabled, setNotificationsEnabled] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        fetchPreferences()
    }, [])

    useEffect(() => {
        if (preferences) {
            setTimeFormat(preferences.time_format)
            setDateFormat(preferences.date_format)
            setFirstDayOfWeek(preferences.first_day_of_week)
            setNotificationsEnabled(preferences.notifications_enabled)
        }
    }, [preferences])

    const handleSave = async () => {
        setIsSaving(true)
        await updatePreferences({
            time_format: timeFormat,
            date_format: dateFormat,
            first_day_of_week: firstDayOfWeek,
            notifications_enabled: notificationsEnabled
        })
        setIsSaving(false)
        alert(t('common.saved'))
    }

    const languageOptions = [
        { value: 'es', label: 'Español' },
        { value: 'en', label: 'English' }
    ]

    const timeFormatOptions = [
        { value: '12h', label: '12 horas (AM/PM)' },
        { value: '24h', label: '24 horas' }
    ]

    const dateFormatOptions = [
        { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
        { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
        { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
    ]

    const firstDayOptions = [
        { value: '0', label: 'Domingo' },
        { value: '1', label: 'Lunes' }
    ]

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold text-white mb-4">{t('settings.preferences')}</h3>
            </div>

            {/* Language Selection */}
            <div>
                <CustomSelect
                    label={t('settings.language')}
                    value={locale}
                    onChange={(value) => setLocale(value as 'es' | 'en')}
                    options={languageOptions}
                />
            </div>

            {/* Time Format */}
            <div>
                <CustomSelect
                    label={t('settings.time_format')}
                    value={timeFormat}
                    onChange={(value) => setTimeFormat(value as '12h' | '24h')}
                    options={timeFormatOptions}
                />
            </div>

            {/* Date Format */}
            <div>
                <CustomSelect
                    label={t('settings.date_format')}
                    value={dateFormat}
                    onChange={setDateFormat}
                    options={dateFormatOptions}
                />
            </div>

            {/* First Day of Week */}
            <div>
                <CustomSelect
                    label={t('settings.first_day')}
                    value={firstDayOfWeek.toString()}
                    onChange={(value) => setFirstDayOfWeek(parseInt(value))}
                    options={firstDayOptions}
                />
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div>
                    <p className="text-white font-medium">{t('settings.notifications')}</p>
                    <p className="text-zinc-500 text-sm">{t('settings.notifications_desc')}</p>
                </div>
                <button
                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                    className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${notificationsEnabled ? 'bg-primary-500' : 'bg-zinc-700'
                        }`}
                >
                    <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0'
                            }`}
                    />
                </button>
            </div>

            {/* Dashboard Cards Customization */}
            <div className="pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 mb-4">
                    <Layout className="w-5 h-5 text-primary-400" />
                    <h4 className="text-md font-bold text-white">{t('settings.dashboard_cards')}</h4>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-zinc-400 text-sm text-center">
                        {t('settings.dashboard_cards_soon')}
                    </p>
                    <p className="text-zinc-500 text-xs text-center mt-2">
                        {t('settings.dashboard_cards_desc')}
                    </p>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                    <Save className="w-4 h-4" />
                    {isSaving ? t('common.saving') : t('common.save')}
                </button>
            </div>
        </div>
    )
}

