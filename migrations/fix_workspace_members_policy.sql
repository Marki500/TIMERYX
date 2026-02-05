-- Enable RLS on workspace_members (ensure it is on)
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies regarding SELECT if any (names might vary, so we just add a correct one)
-- Ideally we would DROP POLICY IF EXISTS "..." but we don't know the exact name.
-- However, adding a permissive policy works alongside others (OR logic usually, but Supabase is restrictive by default).
-- Wait, multiple policies are ORed. So if there is a "View own" policy, and we add "View same workspace", both apply (OR).
-- So users will see Own OR SameWorkspace (which covers Own).

DROP POLICY IF EXISTS "Users can view members of their workspaces" ON workspace_members;
DROP POLICY IF EXISTS "View members of joined workspaces" ON workspace_members;

CREATE POLICY "View members of joined workspaces"
ON workspace_members FOR SELECT
USING (
    workspace_id IN (
        SELECT workspace_id 
        FROM workspace_members 
        WHERE user_id = auth.uid()
    )
);

-- Also ensure users can see profiles of people in their workspace
-- (If profiles table has restrictive RLS)

CREATE POLICY "View profiles of workspace members"
ON profiles FOR SELECT
USING (
    id IN (
        SELECT user_id 
        FROM workspace_members 
        WHERE workspace_id IN (
            SELECT workspace_id 
            FROM workspace_members 
            WHERE user_id = auth.uid()
        )
    )
);
