'use client'

interface ProjectIconProps {
    project: {
        name: string
        color: string
        url?: string | null
    }
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

const sizeMap = {
    sm: { container: 'w-4 h-4', text: 'text-[8px]', favicon: 16 },
    md: { container: 'w-6 h-6', text: 'text-[10px]', favicon: 32 },
    lg: { container: 'w-10 h-10', text: 'text-sm', favicon: 128 },
}

export function ProjectIcon({ project, size = 'md', className = '' }: ProjectIconProps) {
    const s = sizeMap[size]

    if (project.url) {
        return (
            <img
                src={`https://www.google.com/s2/favicons?domain=${project.url}&sz=${s.favicon}`}
                alt={project.name}
                className={`${s.container} rounded-full object-contain bg-white/5 ${className}`}
            />
        )
    }

    return (
        <div
            className={`${s.container} rounded-full flex items-center justify-center text-white font-bold shrink-0 ${className}`}
            style={{ backgroundColor: project.color }}
        >
            <span className={s.text}>{project.name.charAt(0).toUpperCase()}</span>
        </div>
    )
}
