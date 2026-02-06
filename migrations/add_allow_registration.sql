-- Add allow_registration field to project_clients table
-- This allows admins to control whether clients can create accounts

ALTER TABLE project_clients 
ADD COLUMN IF NOT EXISTS allow_registration BOOLEAN DEFAULT true;

COMMENT ON COLUMN project_clients.allow_registration IS 'Controls whether the client can create an account from the invitation link. If false, they can only view via the link without registering.';
