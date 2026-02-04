export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    avatar_url: string | null
                    active_timer_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    avatar_url?: string | null
                    active_timer_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    active_timer_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            workspaces: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    owner_id: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    owner_id: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    owner_id?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            workspace_members: {
                Row: {
                    id: string
                    workspace_id: string
                    user_id: string
                    role: 'admin' | 'member' | 'client'
                    invited_at: string
                    joined_at: string | null
                }
                Insert: {
                    id?: string
                    workspace_id: string
                    user_id: string
                    role?: 'admin' | 'member' | 'client'
                    invited_at?: string
                    joined_at?: string | null
                }
                Update: {
                    id?: string
                    workspace_id?: string
                    user_id?: string
                    role?: 'admin' | 'member' | 'client'
                    invited_at?: string
                    joined_at?: string | null
                }
            }
            projects: {
                Row: {
                    id: string
                    workspace_id: string
                    name: string
                    description: string | null
                    budget_hours_monthly: number
                    is_client_visible: boolean
                    color: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    workspace_id: string
                    name: string
                    description?: string | null
                    budget_hours_monthly?: number
                    is_client_visible?: boolean
                    color?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    workspace_id?: string
                    name?: string
                    description?: string | null
                    budget_hours_monthly?: number
                    is_client_visible?: boolean
                    color?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            tasks: {
                Row: {
                    id: string
                    project_id: string
                    title: string
                    description: string | null
                    priority: 'low' | 'medium' | 'high' | 'urgent'
                    status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
                    due_date: string | null
                    assigned_to: string | null
                    created_by: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    project_id: string
                    title: string
                    description?: string | null
                    priority?: 'low' | 'medium' | 'high' | 'urgent'
                    status?: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
                    due_date?: string | null
                    assigned_to?: string | null
                    created_by: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    project_id?: string
                    title?: string
                    description?: string | null
                    priority?: 'low' | 'medium' | 'high' | 'urgent'
                    status?: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
                    due_date?: string | null
                    assigned_to?: string | null
                    created_by?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            time_entries: {
                Row: {
                    id: string
                    task_id: string
                    user_id: string
                    start_time: string
                    end_time: string | null
                    is_manual: boolean
                    description: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    task_id: string
                    user_id: string
                    start_time?: string
                    end_time?: string | null
                    is_manual?: boolean
                    description?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    task_id?: string
                    user_id?: string
                    start_time?: string
                    end_time?: string | null
                    is_manual?: boolean
                    description?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            messages: {
                Row: {
                    id: string
                    task_id: string
                    sender_id: string
                    content: string
                    is_read: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    task_id: string
                    sender_id: string
                    content: string
                    is_read?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    task_id?: string
                    sender_id?: string
                    content?: string
                    is_read?: boolean
                    created_at?: string
                }
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    message: string
                    type: string
                    is_read: boolean
                    related_task_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    title: string
                    message: string
                    type?: string
                    is_read?: boolean
                    related_task_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    message?: string
                    type?: string
                    is_read?: boolean
                    related_task_id?: string | null
                    created_at?: string
                }
            }
        }
        Functions: {
            start_timer: {
                Args: {
                    p_task_id: string
                    p_user_id: string
                    p_description?: string
                }
                Returns: string
            }
            stop_timer: {
                Args: {
                    p_user_id: string
                }
                Returns: boolean
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
        }
    }
}
