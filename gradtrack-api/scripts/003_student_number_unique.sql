-- ============================================================
-- Migration: make student_number required and unique (case-insensitive)
-- Run this in the Supabase SQL Editor AFTER 001_schema.sql
-- ============================================================

-- 1. Normalise all existing student numbers to uppercase
UPDATE graduates SET student_number = UPPER(student_number) WHERE student_number IS NOT NULL;

-- 2. Add case-insensitive unique index (citext approach via expression index)
CREATE UNIQUE INDEX IF NOT EXISTS uq_graduates_student_number_ci
  ON graduates (UPPER(student_number));

-- 3. Make student_number NOT NULL
ALTER TABLE graduates
  ALTER COLUMN student_number SET NOT NULL;

-- 4. Regular index for fast lookups (UPPER already covered by unique index above)
CREATE INDEX IF NOT EXISTS idx_graduates_student_number ON graduates(student_number);
