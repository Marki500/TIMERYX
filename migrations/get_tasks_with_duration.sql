-- Function: Get tasks with total duration
CREATE OR REPLACE FUNCTION get_tasks_with_duration(
    p_project_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    project_id UUID,
    title TEXT,
    description TEXT,
    priority task_priority,
    status task_status,
    due_date TIMESTAMPTZ,
    assigned_to UUID,
    created_by UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    total_duration BIGINT -- Duration in seconds
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.project_id,
        t.title,
        t.description,
        t.priority,
        t.status,
        t.due_date,
        t.assigned_to,
        t.created_by,
        t.created_at,
        t.updated_at,
        COALESCE(SUM(EXTRACT(EPOCH FROM (
            COALESCE(te.end_time, NOW()) - te.start_time
        )))::BIGINT, 0) as total_duration
    FROM tasks t
    LEFT JOIN time_entries te ON t.id = te.task_id
    WHERE (p_project_id IS NULL OR t.project_id = p_project_id)
    GROUP BY t.id
    ORDER BY t.created_at DESC;
END;
$$;
