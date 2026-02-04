import { formatDistanceToNow, format, differenceInSeconds } from 'date-fns'

/**
 * Format seconds into HH:MM:SS
 */
export function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format seconds into human-readable format (e.g., "2h 30m")
 */
export function formatDurationHuman(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
        return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
}

/**
 * Calculate elapsed seconds between two dates
 */
export function calculateElapsedSeconds(startTime: string, endTime?: string | null): number {
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    return differenceInSeconds(end, start)
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
    return format(new Date(date), 'MMM d, yyyy')
}

/**
 * Format datetime for display
 */
export function formatDateTime(date: string | Date): string {
    return format(new Date(date), 'MMM d, yyyy HH:mm')
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
}
