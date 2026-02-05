'use client'

import { useState } from 'react'
import { User, Settings, Bell, Lock } from 'lucide-react'
import { ProfileSection } from '@/components/settings/ProfileSection'
import { WorkspaceSection } from '@/components/settings/WorkspaceSection'
import { PreferencesSection } from '@/components/settings/PreferencesSection'
import { AccountSection } from '@/components/settings/AccountSection'

type SettingsTab = 'profile' | 'workspace' | 'preferences' | 'account'

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

    const tabs = [
        { id: 'profile' as const, label: 'Perfil', icon: User },
        { id: 'workspace' as const, label: 'Workspace', icon: Settings },
        { id: 'preferences' as const, label: 'Preferencias', icon: Bell },
        { id: 'account' as const, label: 'Cuenta', icon: Lock }
    ]

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">Configuración</h1>
                <p className="text-zinc-400">Gestiona tu perfil, workspace y preferencias</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar Tabs */}
                <div className="lg:col-span-1">
                    <div className="p-2 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-sm space-y-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full px-4 py-3 rounded-xl text-left transition-all flex items-center gap-3 ${activeTab === tab.id
                                            ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                                            : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium">{tab.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3">
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-sm">
                        {activeTab === 'profile' && <ProfileSection />}
                        {activeTab === 'workspace' && <WorkspaceSection />}
                        {activeTab === 'preferences' && <PreferencesSection />}
                        {activeTab === 'account' && <AccountSection />}
                    </div>
                </div>
            </div>
        </div>
    )
}
