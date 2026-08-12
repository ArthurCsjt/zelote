-- Migration: Consolidate Duplicate RLS Policies on Profiles Table
-- Created: 2026-01-22
-- Purpose: Remove duplicate RLS policies and consolidate into single, efficient policies

-- ============================================================================
-- STEP 1: Drop all existing RLS policies on profiles table
-- ============================================================================

DROP POLICY IF EXISTS "User can view own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- ============================================================================
-- STEP 2: Create consolidated, efficient RLS policies
-- ============================================================================

-- SELECT Policy: Authenticated users can view all profiles
CREATE POLICY "profiles_select_policy"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- UPDATE Policy: Users can update their own profile, or super_admins can update any
CREATE POLICY "profiles_update_policy"
ON profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id 
  OR is_super_admin(auth.uid())
)
WITH CHECK (
  auth.uid() = id 
  OR is_super_admin(auth.uid())
);

-- ============================================================================
-- STEP 3: Verify RLS is enabled
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "profiles_select_policy" ON profiles IS 
'Allows all authenticated users to view all profiles';

COMMENT ON POLICY "profiles_update_policy" ON profiles IS 
'Allows users to update their own profile, or super_admins to update any profile';
