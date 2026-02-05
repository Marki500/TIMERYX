-- =====================================================
-- TIMERYX - Complete Migration for Manual Time Entries
-- This migration adds all required RPC functions
-- =====================================================

-- 1. Function to create a workspace and add the creator as an admin member
CREATE OR REPLACE FUNCTION create_workspace(p_name TEXT, p_slug TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_workspace_id UUID;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    -- 1. Create Workspace
    INSERT INTO workspaces (name, slug, owner_id)
    VALUES (p_name, p_slug, v_user_id)
    RETURNING id INTO v_workspace_id;
    
    -- 2. Add User as Admin Member
    INSERT INTO workspace_members (workspace_id, user_id, role, joined_at)
    VALUES (v_workspace_id, v_user_id, 'admin', NOW());
    
    -- 3. Create Default 'General' Project
    INSERT INTO projects (workspace_id, name, color, budget_hours_monthly)
    VALUES (v_workspace_id, 'General', '#3b82f6', 0);
    
    RETURN v_workspace_id;
END;
$$;

-- 2. Function to add manual time entries
CREATE OR REPLACE FUNCTION add_manual_time_entry(
    p_task_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ,
    p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_entry_id UUID;
    v_has_permission BOOLEAN;
BEGIN
    -- Verify user has permission to add time entry for this task
    -- User must be a member or admin of the workspace containing the task
    SELECT EXISTS (
        SELECT 1 
        FROM workspace_members wm
        JOIN projects p ON p.workspace_id = wm.workspace_id
        JOIN tasks t ON t.project_id = p.id
        WHERE t.id = p_task_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('admin', 'member')
    ) INTO v_has_permission;

    IF NOT v_has_permission THEN
        RAISE EXCEPTION 'User does not have permission to add time entries for this task';
    END IF;

    -- Validate time range
    IF p_end_time <= p_start_time THEN
        RAISE EXCEPTION 'End time must be after start time';
    END IF;

    -- Create manual time entry
    INSERT INTO time_entries (
        task_id,
        user_id,
        start_time,
        end_time,
        description,
        is_manual
    ) VALUES (
        p_task_id,
        auth.uid(),
        p_start_time,
        p_end_time,
        p_description,
        TRUE
    )
    RETURNING id INTO v_entry_id;

    RETURN v_entry_id;
END;
$$;

-- 3. Helper function to check if user is workspace member
CREATE OR REPLACE FUNCTION is_workspace_member(p_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM workspace_members
        WHERE workspace_id = p_workspace_id
        AND user_id = auth.uid()
    );
END;
$$;
