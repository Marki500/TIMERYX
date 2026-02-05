-- Migration: Add manual time entry RPC function
-- This function allows adding manual time entries while properly checking permissions
-- Run this migration in your Supabase SQL Editor

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
