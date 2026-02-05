-- Enhance workspaces table with additional fields
ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3B82F6',
ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT '🏢';

-- Handle the role column for workspace_members
DO $$ 
BEGIN
    -- Check if the workspace_role enum exists
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workspace_role') THEN
        -- Add 'owner' to the enum if it doesn't exist
        BEGIN
            ALTER TYPE workspace_role ADD VALUE IF NOT EXISTS 'owner';
            ALTER TYPE workspace_role ADD VALUE IF NOT EXISTS 'admin';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    ELSE
        -- If enum doesn't exist, create it
        CREATE TYPE workspace_role AS ENUM ('owner', 'admin', 'member');
        
        -- If role column doesn't exist, add it
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'workspace_members' AND column_name = 'role'
        ) THEN
            ALTER TABLE workspace_members
            ADD COLUMN role workspace_role DEFAULT 'member';
        END IF;
    END IF;
END $$;

-- Update existing workspace_members to set creator as owner
UPDATE workspace_members
SET role = 'owner'
WHERE user_id IN (
    SELECT owner_id FROM workspaces WHERE workspaces.id = workspace_members.workspace_id
);

-- Create indexes for faster workspace queries
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON workspace_members(workspace_id);
