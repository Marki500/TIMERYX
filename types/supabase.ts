export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'client'
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type NotificationType = 'task_assigned' | 'mention' | 'project_invite' | 'system'

type EmptyRelationships = []

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    display_name: string | null
                    avatar_url: string | null
                    bio: string | null
                    role: string
                    active_timer_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    display_name?: string | null
                    avatar_url?: string | null
                    bio?: string | null
                    role?: string
                    active_timer_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    display_name?: string | null
                    avatar_url?: string | null
                    bio?: string | null
                    role?: string
                    active_timer_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: EmptyRelationships
            }
            user_preferences: {
                Row: {
                    id: string
                    user_id: string
                    timezone: string
                    time_format: '12h' | '24h'
                    date_format: string
                    first_day_of_week: number
                    dashboard_cards: Json
                    theme: string
                    notifications_enabled: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    timezone?: string
                    time_format?: '12h' | '24h'
                    date_format?: string
                    first_day_of_week?: number
                    dashboard_cards?: Json
                    theme?: string
                    notifications_enabled?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    timezone?: string
                    time_format?: '12h' | '24h'
                    date_format?: string
                    first_day_of_week?: number
                    dashboard_cards?: Json
                    theme?: string
                    notifications_enabled?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: EmptyRelationships
            }
            workspaces: {
                Row: {
                    id: string
                    created_at: string
                    name: string
                    slug: string
                    owner_id: string
                    description: string | null
                    color: string | null
                    icon: string | null
                    updated_at: string
                }
                Insert: {
                    id?: string
                    created_at?: string
                    name: string
                    slug: string
                    owner_id: string
                    description?: string | null
                    color?: string | null
                    icon?: string | null
                    updated_at?: string
                }
                Update: {
                    id?: string
                    created_at?: string
                    name?: string
                    slug?: string
                    owner_id?: string
                    description?: string | null
                    color?: string | null
                    icon?: string | null
                    updated_at?: string
                }
                Relationships: EmptyRelationships
            }
            workspace_members: {
                Row: {
                    id: string
                    workspace_id: string
                    user_id: string
                    role: WorkspaceRole
                    invited_at: string
                    joined_at: string | null
                }
                Insert: {
                    id?: string
                    workspace_id: string
                    user_id: string
                    role?: WorkspaceRole
                    invited_at?: string
                    joined_at?: string | null
                }
                Update: {
                    id?: string
                    workspace_id?: string
                    user_id?: string
                    role?: WorkspaceRole
                    invited_at?: string
                    joined_at?: string | null
                }
                Relationships: EmptyRelationships
            }
            workspace_invitations: {
                Row: {
                    id: string
                    workspace_id: string
                    email: string
                    role: string
                    invited_by: string | null
                    token: string
                    expires_at: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    workspace_id: string
                    email: string
                    role?: string
                    invited_by?: string | null
                    token: string
                    expires_at: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    workspace_id?: string
                    email?: string
                    role?: string
                    invited_by?: string | null
                    token?: string
                    expires_at?: string
                    created_at?: string
                }
                Relationships: EmptyRelationships
            }
            projects: {
                Row: {
                    id: string
                    created_at: string
                    workspace_id: string
                    name: string
                    description: string | null
                    color: string
                    budget_hours_monthly: number
                    is_client_visible: boolean
                    url: string | null
                    updated_at: string
                }
                Insert: {
                    id?: string
                    created_at?: string
                    workspace_id: string
                    name: string
                    description?: string | null
                    color?: string
                    budget_hours_monthly?: number
                    is_client_visible?: boolean
                    url?: string | null
                    updated_at?: string
                }
                Update: {
                    id?: string
                    created_at?: string
                    workspace_id?: string
                    name?: string
                    description?: string | null
                    color?: string
                    budget_hours_monthly?: number
                    is_client_visible?: boolean
                    url?: string | null
                    updated_at?: string
                }
                Relationships: EmptyRelationships
            }
            project_clients: {
                Row: {
                    id: string
                    project_id: string
                    email: string
                    access_token: string
                    user_id: string | null
                    invited_by: string | null
                    created_at: string
                    last_accessed_at: string | null
                }
                Insert: {
                    id?: string
                    project_id: string
                    email: string
                    access_token: string
                    user_id?: string | null
                    invited_by?: string | null
                    created_at?: string
                    last_accessed_at?: string | null
                }
                Update: {
                    id?: string
                    project_id?: string
                    email?: string
                    access_token?: string
                    user_id?: string | null
                    invited_by?: string | null
                    created_at?: string
                    last_accessed_at?: string | null
                }
                Relationships: EmptyRelationships
            }
            tasks: {
                Row: {
                    id: string
                    created_at: string
                    project_id: string
                    title: string
                    description: string | null
                    priority: TaskPriority
                    status: TaskStatus
                    due_date: string | null
                    assigned_to: string | null
                    created_by: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    created_at?: string
                    project_id: string
                    title: string
                    description?: string | null
                    priority?: TaskPriority
                    status?: TaskStatus
                    due_date?: string | null
                    assigned_to?: string | null
                    created_by: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    created_at?: string
                    project_id?: string
                    title?: string
                    description?: string | null
                    priority?: TaskPriority
                    status?: TaskStatus
                    due_date?: string | null
                    assigned_to?: string | null
                    created_by?: string
                    updated_at?: string
                }
                Relationships: EmptyRelationships
            }
            time_entries: {
                Row: {
                    id: string
                    created_at: string
                    updated_at: string
                    task_id: string
                    user_id: string
                    start_time: string
                    end_time: string | null
                    is_manual: boolean
                    description: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    updated_at?: string
                    task_id: string
                    user_id: string
                    start_time: string
                    end_time?: string | null
                    is_manual?: boolean
                    description?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    updated_at?: string
                    task_id?: string
                    user_id?: string
                    start_time?: string
                    end_time?: string | null
                    is_manual?: boolean
                    description?: string | null
                }
                Relationships: EmptyRelationships
            }
            project_messages: {
                Row: {
                    id: string
                    project_id: string
                    user_id: string
                    message: string
                    created_at: string
                    updated_at: string
                    is_edited: boolean
                }
                Insert: {
                    id?: string
                    project_id: string
                    user_id: string
                    message: string
                    created_at?: string
                    updated_at?: string
                    is_edited?: boolean
                }
                Update: {
                    id?: string
                    project_id?: string
                    user_id?: string
                    message?: string
                    created_at?: string
                    updated_at?: string
                    is_edited?: boolean
                }
                Relationships: EmptyRelationships
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string
                    type: NotificationType
                    title: string
                    message: string
                    link: string | null
                    is_read: boolean
                    metadata: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    type: NotificationType
                    title: string
                    message: string
                    link?: string | null
                    is_read?: boolean
                    metadata?: Json
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    type?: NotificationType
                    title?: string
                    message?: string
                    link?: string | null
                    is_read?: boolean
                    metadata?: Json
                    created_at?: string
                }
                Relationships: EmptyRelationships
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            start_timer: {
                Args: {
                    p_task_id: string
                    p_description?: string | null
                }
                Returns: string
            }
            stop_timer: {
                Args: {
                    p_description?: string | null
                }
                Returns: void
            }
            add_manual_time_entry: {
                Args: {
                    p_task_id: string
                    p_start_time: string
                    p_end_time: string
                    p_description?: string | null
                }
                Returns: string
            }
            get_task_total_time: {
                Args: {
                    p_task_id: string
                }
                Returns: number
            }
            calculate_project_hours: {
                Args: {
                    p_project_id: string
                    p_month?: string
                }
                Returns: number
            }
            is_project_over_budget: {
                Args: {
                    p_project_id: string
                    p_month?: string
                }
                Returns: boolean
            }
            create_workspace: {
                Args: {
                    p_name: string
                    p_slug: string
                }
                Returns: string
            }
            get_user_workspace_ids: {
                Args: Record<string, never>
                Returns: string[]
            }
            get_tasks_with_duration: {
                Args: {
                    p_project_id?: string | null
                }
                Returns: (Database['public']['Tables']['tasks']['Row'] & {
                    total_duration: number
                })[]
            }
            get_client_projects: {
                Args: {
                    p_user_id: string
                }
                Returns: {
                    project_id: string
                    project_name: string
                    project_color: string
                    project_description: string
                    project_budget_hours_monthly: number
                    workspace_id: string
                    access_token: string
                }[]
            }
            get_project_by_token: {
                Args: {
                    p_token: string
                }
                Returns: {
                    project_id: string
                    project_name: string
                    project_color: string
                    project_description: string
                    project_budget_hours_monthly: number
                    client_email: string
                    client_user_id: string
                    workspace_id: string
                    allow_registration: boolean
                }[]
            }
            link_client_account: {
                Args: {
                    p_token: string
                    p_user_id: string
                }
                Returns: boolean
            }
            is_client_user: {
                Args: {
                    p_user_id: string
                }
                Returns: boolean
            }
            accept_workspace_invitation: {
                Args: {
                    p_token: string
                }
                Returns: string
            }
        }
        Enums: {
            workspace_role: WorkspaceRole
            task_status: TaskStatus
            task_priority: TaskPriority
            notification_type: NotificationType
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

// Helper type aliases for convenience
export type Tables<T extends keyof Database['public']['Tables']> =
    Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
    Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
    Database['public']['Tables'][T]['Update']

export type Functions<T extends keyof Database['public']['Functions']> =
    Database['public']['Functions'][T]
