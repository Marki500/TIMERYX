export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    avatar_url: string | null
                    active_timer_id: string | null
                    role: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    avatar_url?: string | null
                    active_timer_id?: string | null
                    role?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    active_timer_id?: string | null
                    role?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            workspaces: {
                Row: {
                    id: string
                    created_at: string
                    name: string
                    slug: string
                    owner_id: string
                }
                Insert: {
                    id?: string
                    created_at?: string
                    name: string
                    slug: string
                    owner_id: string
                }
                Update: {
                    id?: string
                    created_at?: string
                    name?: string
                    slug?: string
                    owner_id?: string
                }
            }
            workspace_members: {
                Row: {
                    workspace_id: string
                    user_id: string
                    role: 'admin' | 'member' | 'client'
                    joined_at: string
                }
                Insert: {
                    workspace_id: string
                    user_id: string
                    role?: 'admin' | 'member' | 'client'
                    joined_at?: string
                }
                Update: {
                    workspace_id?: string
                    user_id?: string
                    role?: 'admin' | 'member' | 'client'
                    joined_at?: string
                }
            }
            projects: {
                Row: {
                    id: string
                    created_at: string
                    workspace_id: string
                    name: string
                    color: string
                    budget_hours_monthly: number
                    is_client_visible: boolean
                }
                Insert: {
                    id?: string
                    created_at?: string
                    workspace_id: string
                    name: string
                    color?: string
                    budget_hours_monthly?: number
                    is_client_visible?: boolean
                }
                Update: {
                    id?: string
                    created_at?: string
                    workspace_id?: string
                    name?: string
                    color?: string
                    budget_hours_monthly?: number
                    is_client_visible?: boolean
                }
            }
            tasks: {
                Row: {
                    id: string
                    created_at: string
                    project_id: string
                    title: string
                    description: string | null
                    priority: 'low' | 'medium' | 'high' | 'urgent'
                    status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
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
                    priority?: 'low' | 'medium' | 'high' | 'urgent'
                    status?: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
                    due_date?: string | null
                    assigned_to?: string | null
                    created_by: string
                }
                Update: {
                    id?: string
                    created_at?: string
                    project_id?: string
                    title?: string
                    description?: string | null
                    priority?: 'low' | 'medium' | 'high' | 'urgent'
                    status?: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
                    due_date?: string | null
                    assigned_to?: string | null
                    created_by?: string
                    updated_at?: string
                }
            }
            time_entries: {
                Row: {
                    id: string
                    created_at: string
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
                    task_id?: string
                    user_id?: string
                    start_time?: string
                    end_time?: string | null
                    is_manual?: boolean
                    description?: string | null
                }
            }
        }
    }
    Functions: {
        start_timer: {
            Args: {
                p_task_id: string
                p_description?: string
            }
            Returns: void
        }
        stop_timer: {
            Args: Record<string, never>
            Returns: void
        }
        is_project_over_budget: {
            Args: {
                p_project_id: string
            }
            Returns: boolean
        }
        create_workspace: {
            Args: {
                p_name: string
                p_slug: string
            }
            Returns: string // UUID
        }
    }
}
