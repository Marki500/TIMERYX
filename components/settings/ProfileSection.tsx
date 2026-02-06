'use client'

import { useState, useEffect, useRef } from 'react'
import { Camera, Save, Upload } from 'lucide-react'
import { useUserStore } from '@/stores/useUserStore'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/stores/useToast'
import { CustomSelect } from '@/components/ui/CustomSelect'

export function ProfileSection() {
    const { profile, setProfile } = useUserStore()
    const { addToast } = useToast()
    const [displayName, setDisplayName] = useState('')
    const [bio, setBio] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')
    const [timezone, setTimezone] = useState('UTC')
    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const fetchProfile = async () => {
            if (!profile) return

            const supabase = createClient()
            const { data } = await supabase
                .from('profiles')
                .select('display_name, bio, avatar_url')
                .eq('id', profile.id)
                .single()

            if (data) {
                setDisplayName((data as any).display_name || '')
                setBio((data as any).bio || '')
                setAvatarUrl((data as any).avatar_url || '')
            }
        }

        fetchProfile()
    }, [profile])

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !profile) return

        setIsUploading(true)
        const supabase = createClient()

        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${profile.id}-${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, file, { upsert: true })

        if (uploadError) {
            addToast('Error al subir la imagen', 'error')
            setIsUploading(false)
            return
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName)

        // Update profile
        const { error: updateError } = await (supabase
            .from('profiles') as any)
            .update({ avatar_url: publicUrl })
            .eq('id', profile.id)

        if (!updateError) {
            setAvatarUrl(publicUrl)
            addToast('Avatar actualizado correctamente', 'success')

            // Update store
            setProfile({ ...profile, avatar_url: publicUrl } as any)
        } else {
            addToast('Error al actualizar el avatar', 'error')
        }

        setIsUploading(false)
    }

    const handleSave = async () => {
        if (!profile) return

        setIsSaving(true)
        const supabase = createClient()

        const { error } = await (supabase
            .from('profiles') as any)
            .update({
                display_name: displayName,
                bio: bio
            })
            .eq('id', profile.id)

        setIsSaving(false)

        if (!error) {
            addToast('Perfil actualizado correctamente', 'success')

            // Update store so changes reflect everywhere
            setProfile({
                ...profile,
                display_name: displayName,
                bio: bio
            } as any)
        } else {
            addToast('Error al actualizar el perfil', 'error')
        }
    }

    const timezones = [
        'UTC',
        'Europe/Madrid',
        'Europe/London',
        'America/New_York',
        'America/Los_Angeles',
        'America/Mexico_City',
        'Asia/Tokyo'
    ]

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold text-white mb-4">Información del Perfil</h3>
            </div>

            {/* Avatar Upload */}
            <div className="flex items-center gap-6">
                <div className="relative">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="w-24 h-24 rounded-full object-cover border-2 border-primary-500/20"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                            {displayName?.charAt(0).toUpperCase() || profile?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    )}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="absolute bottom-0 right-0 p-2 bg-primary-500 rounded-full text-white hover:bg-primary-600 transition-colors disabled:bg-primary-500/50"
                    >
                        {isUploading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Camera className="w-4 h-4" />
                        )}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                    />
                </div>
                <div>
                    <p className="text-white font-medium break-all">{displayName || profile?.email}</p>
                    <p className="text-zinc-500 text-sm">Haz click en el icono para cambiar tu avatar</p>
                </div>
            </div>

            {/* Display Name */}
            <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Nombre para mostrar
                </label>
                <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all hover:bg-white/10 backdrop-blur-xl"
                />
            </div>

            {/* Bio */}
            <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                    Biografía
                </label>
                <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Cuéntanos sobre ti..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all hover:bg-white/10 backdrop-blur-xl resize-none"
                />
            </div>

            {/* Timezone */}
            <CustomSelect
                label="Zona Horaria"
                value={timezone}
                onChange={setTimezone}
                options={timezones.map(tz => ({ value: tz, label: tz }))}
            />

            {/* Save Button */}
            <div className="flex justify-end pt-4">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
        </div>
    )
}
