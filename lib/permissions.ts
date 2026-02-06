// Permission helper functions for role-based access control

export type UserRole = 'admin' | 'member' | 'client'

/**
 * Check if user is a client
 */
export function isClient(role: UserRole | null | undefined): boolean {
    return role === 'client'
}

/**
 * Check if user is an admin
 */
export function isAdmin(role: UserRole | null | undefined): boolean {
    return role === 'admin'
}

/**
 * Check if user can edit projects
 */
export function canEditProject(role: UserRole | null | undefined): boolean {
    return role === 'admin' || role === 'member'
}

/**
 * Check if user can create/delete projects
 */
export function canManageProjects(role: UserRole | null | undefined): boolean {
    return role === 'admin'
}

/**
 * Check if user can view internal data (time entries, reports, etc.)
 */
export function canViewInternalData(role: UserRole | null | undefined): boolean {
    return role === 'admin' || role === 'member'
}

/**
 * Check if user can use timer
 */
export function canUseTimer(role: UserRole | null | undefined): boolean {
    return role === 'admin' || role === 'member'
}

/**
 * Check if user can manage workspace members
 */
export function canManageMembers(role: UserRole | null | undefined): boolean {
    return role === 'admin'
}

/**
 * Check if user can access settings
 */
export function canAccessSettings(role: UserRole | null | undefined): boolean {
    return role === 'admin' || role === 'member'
}

/**
 * Filter projects to only show client-visible ones
 */
export function filterClientVisibleProjects<T extends { is_client_visible?: boolean }>(
    projects: T[],
    role: UserRole | null | undefined
): T[] {
    if (isClient(role)) {
        return projects.filter(p => p.is_client_visible === true)
    }
    return projects
}

/**
 * Get the default route for a user based on their role
 */
export function getDefaultRoute(role: UserRole | null | undefined): string {
    if (isClient(role)) {
        return '/client'
    }
    return '/dashboard'
}

/**
 * Check if user should be redirected based on current path and role
 */
export function shouldRedirect(
    currentPath: string,
    role: UserRole | null | undefined
): { shouldRedirect: boolean; redirectTo: string | null } {
    const isClientRoute = currentPath.startsWith('/client')
    const isDashboardRoute = currentPath.startsWith('/dashboard')

    // Client trying to access dashboard routes
    if (isClient(role) && isDashboardRoute) {
        return { shouldRedirect: true, redirectTo: '/client' }
    }

    // Non-client trying to access client routes
    if (!isClient(role) && isClientRoute) {
        return { shouldRedirect: true, redirectTo: '/dashboard' }
    }

    return { shouldRedirect: false, redirectTo: null }
}
