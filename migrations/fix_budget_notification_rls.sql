-- Fix RLS issue with notify_budget_exceeded function
-- This function needs SECURITY DEFINER to bypass RLS when creating notifications

CREATE OR REPLACE FUNCTION notify_budget_exceeded()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Run with function owner's privileges, bypassing RLS
SET search_path = public
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
        
        -- Create notification for each admin (only if admins exist)
        IF v_workspace_admins IS NOT NULL THEN
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
    END IF;
    
    RETURN NEW;
END;
$$;
