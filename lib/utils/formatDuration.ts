/**
 * Format duration in seconds to human-readable string
 * @param seconds - Duration in seconds
 * @returns Formatted string like "2h 30m 15s"
 */
export function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    const parts = []
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)

    return parts.join(' ')
}

/**
 * Format duration in seconds to short format
 * @param seconds - Duration in seconds
 * @returns Formatted string like "2:30:15"
 */
export function formatDurationShort(seconds: number): string {
    // Prevent negative values
    const safeSeconds = Math.max(0, Math.floor(seconds))

    const hours = Math.floor(safeSeconds / 3600)
    const minutes = Math.floor((safeSeconds % 3600) / 60)
    const secs = safeSeconds % 60

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format duration in minutes to human-readable string
 * @param minutes - Duration in minutes
 * @returns Formatted string like "2h 30m"
 */
export function formatDurationMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = Math.floor(minutes % 60)

    const parts = []
    if (hours > 0) parts.push(`${hours}h`)
    if (mins > 0 || parts.length === 0) parts.push(`${mins}m`)

    return parts.join(' ')
}

/**
 * Parse duration string to seconds
 * @param duration - Duration string like "2h 30m 15s"
 * @returns Duration in seconds
 */
export function parseDuration(duration: string): number {
    let seconds = 0

    const hoursMatch = duration.match(/(\d+)h/)
    const minutesMatch = duration.match(/(\d+)m/)
    const secondsMatch = duration.match(/(\d+)s/)

    if (hoursMatch) seconds += parseInt(hoursMatch[1]) * 3600
    if (minutesMatch) seconds += parseInt(minutesMatch[1]) * 60
    if (secondsMatch) seconds += parseInt(secondsMatch[1])

    return seconds
}
