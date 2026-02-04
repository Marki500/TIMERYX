-- ==============================================================================
-- FINAL SETUP SCRIPT
-- Run this in the Supabase SQL Editor to fix 404 errors and Permissions issues
-- ==============================================================================

-- 1. Ensure the Create Workspace RPC exists
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

-- 2. Ensure RLS Policies allow the RPC to work correctly (redundancy check)
-- Workspace Members: Allow Admins to View/Modify (Essential)
DROP POLICY IF EXISTS workspace_members_admin ON workspace_members;
CREATE POLICY workspace_members_admin ON workspace_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM workspace_members wm
            WHERE wm.workspace_id = workspace_members.workspace_id
            AND wm.user_id = auth.uid()
            AND wm.role = 'admin'
        )
    );

-- Projects: Allow Members to View
DROP POLICY IF EXISTS projects_select ON projects;
CREATE POLICY projects_select ON projects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_members wm
            WHERE wm.workspace_id = projects.workspace_id
            AND wm.user_id = auth.uid()
        )
    );

-- Projects: Allow Admins to Insert
DROP POLICY IF EXISTS projects_insert ON projects;
CREATE POLICY projects_insert ON projects
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM workspace_members wm
            WHERE wm.workspace_id = projects.workspace_id
            AND wm.user_id = auth.uid()
            AND wm.role IN ('admin', 'member')
        )
    );

-- 3. Grant Usage (Just in case)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
