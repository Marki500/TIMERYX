-- =====================================================
-- CLEANUP STUCK TIMERS
-- Run this script to manually clear any stuck active timers
-- =====================================================

-- Clear all active_timer_id from profiles
UPDATE profiles
SET active_timer_id = NULL,
    updated_at = NOW()
WHERE active_timer_id IS NOT NULL;

-- Optional: Close any time_entries that don't have an end_time
-- (This will close all running timers)
UPDATE time_entries
SET end_time = NOW(),
    updated_at = NOW()
WHERE end_time IS NULL
AND is_manual = FALSE;
