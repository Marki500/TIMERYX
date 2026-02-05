-- PART 1: Add new enum values (execute this first)
-- Add 'owner' and 'admin' to the workspace_role enum
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workspace_role') THEN
        BEGIN
            ALTER TYPE workspace_role ADD VALUE IF NOT EXISTS 'owner';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
        
        BEGIN
            ALTER TYPE workspace_role ADD VALUE IF NOT EXISTS 'admin';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    ELSE
        CREATE TYPE workspace_role AS ENUM ('owner', 'admin', 'member');
    END IF;
END $$;
