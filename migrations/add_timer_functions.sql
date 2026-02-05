-- =====================================================
-- TIMER RPC FUNCTIONS MIGRATION
-- Add timer management functions to Supabase
-- =====================================================

-- Start a new timer for a task
CREATE OR REPLACE FUNCTION start_timer(
    p_task_id UUID,
    p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_entry_id UUID;
    v_current_timer_id UUID;
BEGIN
    -- Get current active timer if any
    SELECT active_timer_id INTO v_current_timer_id
    FROM profiles
    WHERE id = auth.uid();

    -- Stop current timer if exists
    IF v_current_timer_id IS NOT NULL THEN
        PERFORM stop_timer();
    END IF;

    -- Create new time entry
    INSERT INTO time_entries (
        task_id,
        user_id,
        start_time,
        description,
        is_manual
    ) VALUES (
        p_task_id,
        auth.uid(),
        NOW(),
        p_description,
        FALSE
    )
    RETURNING id INTO v_entry_id;

    -- Update profile with active timer
    UPDATE profiles
    SET active_timer_id = v_entry_id,
        updated_at = NOW()
    WHERE id = auth.uid();

    RETURN v_entry_id;
END;
$$;

-- Stop the currently active timer
CREATE OR REPLACE FUNCTION stop_timer(
    p_description TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_timer_id UUID;
BEGIN
    -- Get active timer
    SELECT active_timer_id INTO v_timer_id
    FROM profiles
    WHERE id = auth.uid();

    IF v_timer_id IS NULL THEN
        RETURN; -- No active timer
    END IF;

    -- Update time entry with end time
    UPDATE time_entries
    SET 
        end_time = NOW(),
        description = COALESCE(p_description, description),
        updated_at = NOW()
    WHERE id = v_timer_id
    AND user_id = auth.uid();

    -- Clear active timer from profile
    UPDATE profiles
    SET active_timer_id = NULL,
        updated_at = NOW()
    WHERE id = auth.uid();
END;
$$;

-- Get total time logged for a task (in seconds)
CREATE OR REPLACE FUNCTION get_task_total_time(
    p_task_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_seconds INTEGER;
BEGIN
    SELECT COALESCE(
        SUM(EXTRACT(EPOCH FROM (end_time - start_time))::INTEGER),
        0
    )
    INTO v_total_seconds
    FROM time_entries
    WHERE task_id = p_task_id
    AND end_time IS NOT NULL;

    RETURN v_total_seconds;
END;
$$;

