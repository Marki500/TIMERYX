-- ==============================================================================
-- DATABASE PERFORMANCE FIX: RESOLVE RLS RECURSION
-- This script fixes the "infinite loop" in workspace_members and profiles policies.
-- ==============================================================================

-- 1. Create a helper function to get workspace IDs securely
-- Using SECURITY DEFINER bypasses RLS for the internal query, breaking the chain.
CREATE OR REPLACE FUNCTION get_user_workspace_ids(p_user_id UUID)
RETURNS TABLE (workspace_id UUID) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT workspace_id 
    FROM workspace_members 
    WHERE user_id = p_user_id;
$$;

-- 2. Revoke and Grant permissions to ensure the function is accessible
REVOKE ALL ON FUNCTION get_user_workspace_ids(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_user_workspace_ids(UUID) TO authenticated, service_role;

-- 3. Update WORKSPACE_MEMBERS policy
-- Old policy was checking workspace_members itself, causing recursion.
DROP POLICY IF EXISTS "View members of joined workspaces" ON workspace_members;
DROP POLICY IF EXISTS "View members of joined workspaces_v2" ON workspace_members;
DROP POLICY IF EXISTS "Users can view members of their workspaces" ON workspace_members;

CREATE POLICY "View members of joined workspaces_v3"
ON workspace_members FOR SELECT
USING (
    workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
);

-- 4. Update PROFILES policy
-- Old policy might have been checking workspace_members -> profiles -> workspace_members.
DROP POLICY IF EXISTS "View profiles of workspace members" ON profiles;

CREATE POLICY "View profiles of workspace members_v2"
ON profiles FOR SELECT
USING (
    id IN (
        SELECT user_id 
        FROM workspace_members 
        WHERE workspace_id IN (SELECT get_user_workspace_ids(auth.uid()))
    )
    OR id = auth.uid()
);

-- 5. Update WORKSPACES policy
DROP POLICY IF EXISTS "workspaces_select" ON workspaces;

CREATE POLICY "workspaces_select_v2"
ON workspaces FOR SELECT
USING (
    id IN (SELECT get_user_workspace_ids(auth.uid()))
);

-- ==============================================================================
-- FIX COMPLETE
-- ==============================================================================
