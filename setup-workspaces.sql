-- Function to create a workspace and add the creator as an admin member atomically
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
