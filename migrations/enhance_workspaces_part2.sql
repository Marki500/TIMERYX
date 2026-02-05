-- PART 2: Update workspaces and workspace_members (execute this after part 1)

-- Enhance workspaces table with additional fields
ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3B82F6',
ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT '🏢';

-- Update existing workspace_members to set creator as owner
UPDATE workspace_members
SET role = 'owner'
WHERE user_id IN (
    SELECT owner_id FROM workspaces WHERE workspaces.id = workspace_members.workspace_id
);

-- Create indexes for faster workspace queries
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON workspace_members(workspace_id);
