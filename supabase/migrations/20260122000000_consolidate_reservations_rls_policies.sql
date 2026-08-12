-- Migration: Consolidate Duplicate RLS Policies on Reservations Table
-- Created: 2026-01-22
-- Purpose: Remove duplicate RLS policies and consolidate into single, efficient policies

-- ============================================================================
-- STEP 1: Drop all existing RLS policies on reservations table
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can view all reservations" ON reservations;
DROP POLICY IF EXISTS "Authenticated users can view reservations" ON reservations;
DROP POLICY IF EXISTS "Admins and Professors can insert reservations" ON reservations;
DROP POLICY IF EXISTS "Authenticated users can create reservations" ON reservations;
DROP POLICY IF EXISTS "Users can update their own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can update own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can delete their own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can delete own reservations" ON reservations;

-- ============================================================================
-- STEP 2: Create consolidated, efficient RLS policies
-- ============================================================================

-- SELECT Policy: Authenticated users can view all reservations
CREATE POLICY "reservations_select_policy"
ON reservations
FOR SELECT
TO authenticated
USING (true);

-- INSERT Policy: Authenticated users (professors, admins, super_admins) can create reservations
CREATE POLICY "reservations_insert_policy"
ON reservations
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (
    has_role(auth.uid(), 'professor'::user_role) 
    OR has_role(auth.uid(), 'admin'::user_role) 
    OR has_role(auth.uid(), 'super_admin'::user_role)
  )
);

-- UPDATE Policy: Users can update their own reservations, or admins/super_admins can update any
CREATE POLICY "reservations_update_policy"
ON reservations
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() 
  OR EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  created_by = auth.uid() 
  OR EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- DELETE Policy: Users can delete their own reservations, or super_admins can delete any
CREATE POLICY "reservations_delete_policy"
ON reservations
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid() 
  OR EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

-- ============================================================================
-- STEP 3: Verify RLS is enabled
-- ============================================================================

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "reservations_select_policy" ON reservations IS 
'Allows all authenticated users to view all reservations';

COMMENT ON POLICY "reservations_insert_policy" ON reservations IS 
'Allows professors, admins, and super_admins to create reservations';

COMMENT ON POLICY "reservations_update_policy" ON reservations IS 
'Allows users to update their own reservations, or admins/super_admins to update any reservation';

COMMENT ON POLICY "reservations_delete_policy" ON reservations IS 
'Allows users to delete their own reservations, or super_admins to delete any reservation';
