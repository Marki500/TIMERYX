-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('task_assigned', 'mention', 'project_invite', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Allow system/service_role to insert (and potentially users if triggering from client, 
-- but usually notifications are server-side. For now, we might need insert policy for triggered actions 
-- if they run as the acting user. Let's allow authenticated users to insert if they have a valid reason, 
-- but simpler: open insert for authenticated users, but realistically we only want them to insert 
-- notifications for OTHERS, not themselves? No, usually you insert for others.
-- But RLS checks 'USING' for insert rows? standard RLS checks 'WITH CHECK'.
-- Let's allow authenticated users to insert notifications for ANYONE for now to facilitate 
-- client-side triggers (e.g. creating a task assigns it to someone -> create notification).
-- A stricter policy would check if they are in the same workspace/project, but for now:
CREATE POLICY "Users can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Create index for performance
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);
