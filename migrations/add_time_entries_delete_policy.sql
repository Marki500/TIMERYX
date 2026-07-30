-- Migration: Add DELETE policy for time_entries
-- The schema enables RLS on time_entries but never defined a DELETE policy,
-- so any DELETE operation is silently denied by RLS. This caused
-- "edit task duration" to fail when reducing time (the code tries to delete
-- existing entries) and "delete entry" actions from the reports.
--
-- Rules:
--   - Users can delete their own time entries.
--   - Workspace admins can delete any time entry in their workspace.

DROP POLICY IF EXISTS time_entries_delete ON time_entries;

CREATE POLICY time_entries_delete ON time_entries
    FOR DELETE USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM workspace_members wm
            JOIN projects p ON p.workspace_id = wm.workspace_id
            JOIN tasks t ON t.project_id = p.id
            WHERE t.id = time_entries.task_id
            AND wm.user_id = auth.uid()
            AND wm.role = 'admin'
        )
    );
