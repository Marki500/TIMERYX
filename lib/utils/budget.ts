/**
 * Calculate budget percentage used
 */
export function calculateBudgetPercentage(
    hoursUsed: number,
    budgetHours: number
): number {
    if (budgetHours === 0) return 0
    return Math.min((hoursUsed / budgetHours) * 100, 100)
}

/**
 * Get budget status color based on percentage
 */
export function getBudgetStatusColor(percentage: number): string {
    if (percentage >= 100) return 'danger'
    if (percentage >= 80) return 'warning'
    return 'success'
}

/**
 * Get budget status label
 */
export function getBudgetStatusLabel(percentage: number): string {
    if (percentage >= 100) return 'Over Budget'
    if (percentage >= 80) return 'Near Limit'
    return 'On Track'
}

/**
 * Format hours with decimal places
 */
export function formatHours(hours: number, decimals: number = 2): string {
    return hours.toFixed(decimals)
}
