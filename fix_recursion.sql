-- ==============================================================================
-- CRITICAL DATABASE FIXES
-- 1. Fix Infinite Recursion in RLS Policies
-- 2. Ensure create_workspace function exists
-- ==============================================================================

-- PART 1: FIX RLS RECURSION
-- The previous policy for workspace_members was checking itself, causing an infinite loop.
-- We will simplify it so users can AT LEAST see their own memberships, which is enough for the dashboard.

DROP POLICY IF EXISTS workspace_members_select ON workspace_members;
DROP POLICY IF EXISTS workspace_members_admin ON workspace_members;

-- Allow users to see ONLY their own memberships (Breaks the recursion)
CREATE POLICY workspace_members_select__own ON workspace_members
    FOR SELECT USING (user_id = auth.uid());

-- PART 2: ENSURE RPC FUNCTION EXISTS (If it failed before)
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
    
    -- 3. Create Default 'Inbox' Project
    INSERT INTO projects (workspace_id, name, color, budget_hours_monthly)
    VALUES (v_workspace_id, 'Inbox', '#3b82f6', 0);
    
    RETURN v_workspace_id;
END;
$$;

-- Grant permissions again just to be safe
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
