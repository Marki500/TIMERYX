'use client'

import { TimesheetMonthView } from '@/components/timesheet/TimesheetMonthView'
import { useTranslation } from '@/stores/useLocaleStore'

export default function TimesheetPage() {
    const { t, locale } = useTranslation()

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">{t('timesheet.title')}</h1>
                    <p className="text-zinc-400">
                        {locale === 'es' ? 'Visualiza y gestiona tus registros de horas del mes.' : 'View and manage your time entries for the month.'}
                    </p>
                </div>
            </div>

            <TimesheetMonthView />
        </div>
    )
}

