-- Create project_clients table for project-based client access
-- This table manages client invitations to specific projects

CREATE TABLE IF NOT EXISTS project_clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    access_token TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    invited_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ,
    
    -- Ensure one email per project
    UNIQUE(project_id, email)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_clients_token ON project_clients(access_token);
CREATE INDEX IF NOT EXISTS idx_project_clients_user ON project_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_project_clients_project ON project_clients(project_id);
CREATE INDEX IF NOT EXISTS idx_project_clients_email ON project_clients(email);

-- RLS Policies
ALTER TABLE project_clients ENABLE ROW LEVEL SECURITY;

-- Clients can view their own records (by user_id or token)
CREATE POLICY "Clients can view their own project access"
    ON project_clients
    FOR SELECT
    USING (
        auth.uid() = user_id
    );

-- Workspace members can view project clients for their workspace projects
CREATE POLICY "Members can view project clients"
    ON project_clients
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
            WHERE p.id = project_clients.project_id
            AND wm.user_id = auth.uid()
        )
    );

-- Only workspace admins can insert/update/delete project clients
CREATE POLICY "Admins can manage project clients"
    ON project_clients
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
            WHERE p.id = project_clients.project_id
            AND wm.user_id = auth.uid()
            AND wm.role = 'admin'
        )
    );

-- Function to get project by access token (for public access)
CREATE OR REPLACE FUNCTION get_project_by_token(p_token TEXT)
RETURNS TABLE (
    project_id UUID,
    project_name TEXT,
    project_color TEXT,
    project_description TEXT,
    project_budget_hours_monthly NUMERIC,
    client_email TEXT,
    client_user_id UUID,
    workspace_id UUID
) 
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.color,
        p.description,
        p.budget_hours_monthly,
        pc.email,
        pc.user_id,
        p.workspace_id
    FROM project_clients pc
    JOIN projects p ON p.id = pc.project_id
    WHERE pc.access_token = p_token;
    
    -- Update last accessed timestamp
    UPDATE project_clients 
    SET last_accessed_at = NOW() 
    WHERE access_token = p_token;
END;
$$ LANGUAGE plpgsql;

-- Function to get client's projects (for authenticated clients)
CREATE OR REPLACE FUNCTION get_client_projects(p_user_id UUID)
RETURNS TABLE (
    project_id UUID,
    project_name TEXT,
    project_color TEXT,
    project_description TEXT,
    project_budget_hours_monthly NUMERIC,
    workspace_id UUID,
    access_token TEXT
) 
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.color,
        p.description,
        p.budget_hours_monthly,
        p.workspace_id,
        pc.access_token
    FROM project_clients pc
    JOIN projects p ON p.id = pc.project_id
    WHERE pc.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to link user account to project client invitation
CREATE OR REPLACE FUNCTION link_client_account(
    p_token TEXT,
    p_user_id UUID
)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
DECLARE
    v_email TEXT;
    v_user_email TEXT;
BEGIN
    -- Get the email from the invitation
    SELECT email INTO v_email
    FROM project_clients
    WHERE access_token = p_token;
    
    IF v_email IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get the user's email
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = p_user_id;
    
    -- Verify emails match
    IF LOWER(v_email) != LOWER(v_user_email) THEN
        RETURN FALSE;
    END IF;
    
    -- Link the account
    UPDATE project_clients
    SET user_id = p_user_id
    WHERE access_token = p_token;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is a client (not a workspace member)
CREATE OR REPLACE FUNCTION is_client_user(p_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
BEGIN
    -- User is a client if they have project_clients records but no workspace_members records
    RETURN EXISTS (
        SELECT 1 FROM project_clients WHERE user_id = p_user_id
    ) AND NOT EXISTS (
        SELECT 1 FROM workspace_members WHERE user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql;
