-- Fix RLS Recursion by using a SECURITY DEFINER function

-- 1. Create a helper function to get my workspaces safely
CREATE OR REPLACE FUNCTION get_my_workspace_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT workspace_id
  FROM workspace_members
  WHERE user_id = auth.uid();
$$;

-- 2. Update workspace_members policy to use the function
DROP POLICY IF EXISTS "View members of joined workspaces" ON workspace_members;
DROP POLICY IF EXISTS "Members can view other members of the same workspace" ON workspace_members;

CREATE POLICY "View members of joined workspaces"
ON workspace_members FOR SELECT
USING (
    workspace_id IN ( SELECT get_my_workspace_ids() )
);

-- 3. Update profiles policy (if it exists and was causing issues)
DROP POLICY IF EXISTS "View profiles of workspace members" ON profiles;

CREATE POLICY "View profiles of workspace members"
ON profiles FOR SELECT
USING (
    id IN (
        SELECT user_id 
        FROM workspace_members 
        WHERE workspace_id IN ( SELECT get_my_workspace_ids() )
    )
);
