-- Drop the function first because we are changing the return type
DROP FUNCTION IF EXISTS get_project_by_token(text);

-- Recreate get_project_by_token to include allow_registration field
CREATE OR REPLACE FUNCTION get_project_by_token(p_token TEXT)
RETURNS TABLE (
    project_id UUID,
    project_name TEXT,
    project_color TEXT,
    project_description TEXT,
    project_budget_hours_monthly NUMERIC,
    client_email TEXT,
    client_user_id UUID,
    workspace_id UUID,
    allow_registration BOOLEAN
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
        p.workspace_id,
        pc.allow_registration
    FROM project_clients pc
    JOIN projects p ON p.id = pc.project_id
    WHERE pc.access_token = p_token;
    
    -- Update last accessed timestamp
    UPDATE project_clients 
    SET last_accessed_at = NOW() 
    WHERE access_token = p_token;
END;
$$ LANGUAGE plpgsql;
