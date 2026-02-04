-- =====================================================
-- TIMERYX - DATABASE SCHEMA
-- SaaS Project Management & Time Tracking System
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE workspace_role AS ENUM ('admin', 'member', 'client');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_status AS ENUM ('backlog', 'todo', 'in_progress', 'review', 'done', 'cancelled');

-- =====================================================
-- TABLES
-- =====================================================

-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    active_timer_id UUID, -- FK to time_entries, ensures only ONE active timer
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspaces (Multi-tenant)
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace Members (Junction table with role)
CREATE TABLE workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role workspace_role NOT NULL DEFAULT 'member',
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ,
    UNIQUE(workspace_id, user_id)
);

-- Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    budget_hours_monthly DECIMAL(10, 2) DEFAULT 0, -- Monthly hour budget
    is_client_visible BOOLEAN DEFAULT FALSE, -- Controls client portal access
    color TEXT DEFAULT '#3B82F6', -- For UI customization
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority task_priority DEFAULT 'medium',
    status task_status DEFAULT 'todo',
    due_date TIMESTAMPTZ,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time Entries
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ, -- NULL means timer is running
    is_manual BOOLEAN DEFAULT FALSE, -- Manual vs automatic timer
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: end_time must be after start_time
    CONSTRAINT valid_time_range CHECK (end_time IS NULL OR end_time > start_time)
);

-- Messages (Real-time chat per task)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- info, warning, error, success
    is_read BOOLEAN DEFAULT FALSE,
    related_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES (Performance optimization)
-- =====================================================

CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_projects_workspace ON projects(workspace_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_time_entries_task ON time_entries(task_id);
CREATE INDEX idx_time_entries_user ON time_entries(user_id);
CREATE INDEX idx_time_entries_active ON time_entries(user_id) WHERE end_time IS NULL;
CREATE INDEX idx_messages_task ON messages(task_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_notifications_user ON notifications(user_id) WHERE is_read = FALSE;

-- =====================================================
-- RPC FUNCTIONS (Business Logic)
-- =====================================================

-- Function: Start a new timer (stops any active timer first)
CREATE OR REPLACE FUNCTION start_timer(
    p_task_id UUID,
    p_user_id UUID,
    p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_active_timer_id UUID;
    v_new_timer_id UUID;
BEGIN
    -- Get current active timer
    SELECT active_timer_id INTO v_active_timer_id
    FROM profiles
    WHERE id = p_user_id;
    
    -- Stop active timer if exists
    IF v_active_timer_id IS NOT NULL THEN
        UPDATE time_entries
        SET end_time = NOW()
        WHERE id = v_active_timer_id AND end_time IS NULL;
    END IF;
    
    -- Create new timer
    INSERT INTO time_entries (task_id, user_id, description, start_time)
    VALUES (p_task_id, p_user_id, p_description, NOW())
    RETURNING id INTO v_new_timer_id;
    
    -- Update profile with new active timer
    UPDATE profiles
    SET active_timer_id = v_new_timer_id
    WHERE id = p_user_id;
    
    RETURN v_new_timer_id;
END;
$$;

-- Function: Stop the active timer
CREATE OR REPLACE FUNCTION stop_timer(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_active_timer_id UUID;
BEGIN
    -- Get active timer
    SELECT active_timer_id INTO v_active_timer_id
    FROM profiles
    WHERE id = p_user_id;
    
    IF v_active_timer_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Stop the timer
    UPDATE time_entries
    SET end_time = NOW()
    WHERE id = v_active_timer_id;
    
    -- Clear active timer from profile
    UPDATE profiles
    SET active_timer_id = NULL
    WHERE id = p_user_id;
    
    RETURN TRUE;
END;
$$;

-- Function: Calculate total hours consumed for a project in a given month
CREATE OR REPLACE FUNCTION calculate_project_hours(
    p_project_id UUID,
    p_month DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_hours DECIMAL;
    v_start_date DATE;
    v_end_date DATE;
BEGIN
    -- Calculate month boundaries
    v_start_date := DATE_TRUNC('month', p_month);
    v_end_date := DATE_TRUNC('month', p_month) + INTERVAL '1 month';
    
    -- Sum hours from completed time entries
    SELECT COALESCE(
        SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600), 
        0
    ) INTO v_total_hours
    FROM time_entries te
    JOIN tasks t ON te.task_id = t.id
    WHERE t.project_id = p_project_id
        AND te.end_time IS NOT NULL
        AND te.start_time >= v_start_date
        AND te.start_time < v_end_date;
    
    RETURN ROUND(v_total_hours, 2);
END;
$$;

-- Function: Check if project is over budget
CREATE OR REPLACE FUNCTION is_project_over_budget(
    p_project_id UUID,
    p_month DATE DEFAULT CURRENT_DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_consumed_hours DECIMAL;
    v_budget_hours DECIMAL;
BEGIN
    -- Get budget
    SELECT budget_hours_monthly INTO v_budget_hours
    FROM projects
    WHERE id = p_project_id;
    
    -- Get consumed hours
    v_consumed_hours := calculate_project_hours(p_project_id, p_month);
    
    RETURN v_consumed_hours > v_budget_hours;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER workspaces_updated_at BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER time_entries_updated_at BEFORE UPDATE ON time_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: Create notification when project exceeds budget
CREATE OR REPLACE FUNCTION notify_budget_exceeded()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_project_id UUID;
    v_workspace_admins UUID[];
    v_admin_id UUID;
BEGIN
    -- Get project ID
    SELECT t.project_id INTO v_project_id
    FROM tasks t
    WHERE t.id = NEW.task_id;
    
    -- Check if over budget
    IF is_project_over_budget(v_project_id) THEN
        -- Get workspace admins
        SELECT ARRAY_AGG(wm.user_id) INTO v_workspace_admins
        FROM workspace_members wm
        JOIN projects p ON p.workspace_id = wm.workspace_id
        WHERE p.id = v_project_id AND wm.role = 'admin';
        
        -- Create notification for each admin
        FOREACH v_admin_id IN ARRAY v_workspace_admins
        LOOP
            INSERT INTO notifications (user_id, title, message, type, related_task_id)
            VALUES (
                v_admin_id,
                'Budget Alert',
                'Project has exceeded monthly budget hours',
                'warning',
                NEW.task_id
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER check_budget_on_time_entry
    AFTER INSERT OR UPDATE ON time_entries
    FOR EACH ROW
    WHEN (NEW.end_time IS NOT NULL)
    EXECUTE FUNCTION notify_budget_exceeded();

-- Trigger: Send notification on new message
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_task_assigned_to UUID;
BEGIN
    -- Get task assignee
    SELECT assigned_to INTO v_task_assigned_to
    FROM tasks
    WHERE id = NEW.task_id;
    
    -- Notify assignee if not the sender
    IF v_task_assigned_to IS NOT NULL AND v_task_assigned_to != NEW.sender_id THEN
        INSERT INTO notifications (user_id, title, message, type, related_task_id)
        VALUES (
            v_task_assigned_to,
            'New Message',
            'You have a new message on your task',
            'info',
            NEW.task_id
        );
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER notify_on_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_message();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view and update their own profile
CREATE POLICY profiles_select ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY profiles_update ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Workspaces: Members can view their workspaces
CREATE POLICY workspaces_select ON workspaces
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_id = workspaces.id
            AND user_id = auth.uid()
        )
    );

-- Workspaces: Only owners can update
CREATE POLICY workspaces_update ON workspaces
    FOR UPDATE USING (owner_id = auth.uid());

-- Workspaces: Any authenticated user can create
CREATE POLICY workspaces_insert ON workspaces
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Workspace Members: View members of your workspaces
CREATE POLICY workspace_members_select ON workspace_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_members wm
            WHERE wm.workspace_id = workspace_members.workspace_id
            AND wm.user_id = auth.uid()
        )
    );

-- Workspace Members: Admins can insert/update/delete
CREATE POLICY workspace_members_admin ON workspace_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM workspace_members wm
            WHERE wm.workspace_id = workspace_members.workspace_id
            AND wm.user_id = auth.uid()
            AND wm.role = 'admin'
        )
    );

-- Projects: Members can view, admins can modify
CREATE POLICY projects_select ON projects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_members wm
            WHERE wm.workspace_id = projects.workspace_id
            AND wm.user_id = auth.uid()
        )
    );

CREATE POLICY projects_insert ON projects
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM workspace_members wm
            WHERE wm.workspace_id = projects.workspace_id
            AND wm.user_id = auth.uid()
            AND wm.role IN ('admin', 'member')
        )
    );

CREATE POLICY projects_update ON projects
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM workspace_members wm
            WHERE wm.workspace_id = projects.workspace_id
            AND wm.user_id = auth.uid()
            AND wm.role = 'admin'
        )
    );

-- Tasks: Members can view and modify, clients can only view if project is client-visible
CREATE POLICY tasks_select ON tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_members wm
            JOIN projects p ON p.workspace_id = wm.workspace_id
            WHERE p.id = tasks.project_id
            AND wm.user_id = auth.uid()
            AND (
                wm.role IN ('admin', 'member')
                OR (wm.role = 'client' AND p.is_client_visible = TRUE)
            )
        )
    );

CREATE POLICY tasks_insert ON tasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM workspace_members wm
            JOIN projects p ON p.workspace_id = wm.workspace_id
            WHERE p.id = tasks.project_id
            AND wm.user_id = auth.uid()
            AND wm.role IN ('admin', 'member')
        )
    );

CREATE POLICY tasks_update ON tasks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM workspace_members wm
            JOIN projects p ON p.workspace_id = wm.workspace_id
            WHERE p.id = tasks.project_id
            AND wm.user_id = auth.uid()
            AND wm.role IN ('admin', 'member')
        )
    );

-- Time Entries: Users can view their own and workspace members can view all
CREATE POLICY time_entries_select ON time_entries
    FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM workspace_members wm
            JOIN projects p ON p.workspace_id = wm.workspace_id
            JOIN tasks t ON t.project_id = p.id
            WHERE t.id = time_entries.task_id
            AND wm.user_id = auth.uid()
            AND wm.role IN ('admin', 'member')
        )
    );

CREATE POLICY time_entries_insert ON time_entries
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM workspace_members wm
            JOIN projects p ON p.workspace_id = wm.workspace_id
            JOIN tasks t ON t.project_id = p.id
            WHERE t.id = time_entries.task_id
            AND wm.user_id = auth.uid()
            AND wm.role IN ('admin', 'member')
        )
    );

CREATE POLICY time_entries_update ON time_entries
    FOR UPDATE USING (user_id = auth.uid());

-- Messages: Task participants can view and send
CREATE POLICY messages_select ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_members wm
            JOIN projects p ON p.workspace_id = wm.workspace_id
            JOIN tasks t ON t.project_id = p.id
            WHERE t.id = messages.task_id
            AND wm.user_id = auth.uid()
            AND (
                wm.role IN ('admin', 'member')
                OR (wm.role = 'client' AND p.is_client_visible = TRUE)
            )
        )
    );

CREATE POLICY messages_insert ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM workspace_members wm
            JOIN projects p ON p.workspace_id = wm.workspace_id
            JOIN tasks t ON t.project_id = p.id
            WHERE t.id = messages.task_id
            AND wm.user_id = auth.uid()
        )
    );

-- Notifications: Users can view and update their own
CREATE POLICY notifications_select ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY notifications_update ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- INITIAL DATA / SEED (Optional)
-- =====================================================

-- You can add seed data here for testing
-- Example:
-- INSERT INTO profiles (id, email, full_name) VALUES (...);

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================

COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE workspaces IS 'Multi-tenant workspaces for organizations';
COMMENT ON TABLE workspace_members IS 'Junction table linking users to workspaces with roles';
COMMENT ON TABLE projects IS 'Projects within workspaces with monthly budget tracking';
COMMENT ON TABLE tasks IS 'Tasks within projects';
COMMENT ON TABLE time_entries IS 'Time tracking entries for tasks';
COMMENT ON TABLE messages IS 'Real-time chat messages per task';
COMMENT ON TABLE notifications IS 'User notifications for various events';

COMMENT ON COLUMN profiles.active_timer_id IS 'Ensures only ONE active timer per user';
COMMENT ON COLUMN projects.budget_hours_monthly IS 'Monthly hour budget for cost control';
COMMENT ON COLUMN projects.is_client_visible IS 'Controls visibility in client portal';
COMMENT ON COLUMN time_entries.is_manual IS 'Distinguishes manual vs automatic time entries';
