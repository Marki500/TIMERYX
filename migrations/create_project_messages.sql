-- Create project_messages table for real-time chat
CREATE TABLE IF NOT EXISTS project_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_edited BOOLEAN DEFAULT false
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_messages_project_created 
ON project_messages(project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_messages_user 
ON project_messages(user_id);

-- Enable RLS
ALTER TABLE project_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read messages from projects they have access to
CREATE POLICY "Users can read project messages they have access to"
ON project_messages FOR SELECT
USING (
    -- User is a workspace member with access to this project
    EXISTS (
        SELECT 1 FROM projects p
        JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
        WHERE p.id = project_messages.project_id
        AND wm.user_id = auth.uid()
    )
    OR
    -- User is a client with access to this project
    EXISTS (
        SELECT 1 FROM project_clients pc
        WHERE pc.project_id = project_messages.project_id
        AND pc.user_id = auth.uid()
    )
);

-- Policy: Users can create messages in projects they have access to
CREATE POLICY "Users can create messages in accessible projects"
ON project_messages FOR INSERT
WITH CHECK (
    -- User is a workspace member with access to this project
    EXISTS (
        SELECT 1 FROM projects p
        JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
        WHERE p.id = project_messages.project_id
        AND wm.user_id = auth.uid()
    )
    OR
    -- User is a client with access to this project
    EXISTS (
        SELECT 1 FROM project_clients pc
        WHERE pc.project_id = project_messages.project_id
        AND pc.user_id = auth.uid()
    )
);

-- Policy: Users can only update their own messages
CREATE POLICY "Users can update their own messages"
ON project_messages FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- NO DELETE POLICY - Messages cannot be deleted

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE project_messages;

COMMENT ON TABLE project_messages IS 'Chat messages for projects, accessible by workspace members and clients';
COMMENT ON COLUMN project_messages.is_edited IS 'Indicates if the message has been edited after creation';
