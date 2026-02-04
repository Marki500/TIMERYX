-- =====================================================
-- FIX: Add INSERT policy for profiles
-- This allows users to create their own profile during registration
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS profiles_insert ON profiles;

-- Allow users to insert their own profile
CREATE POLICY profiles_insert ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
