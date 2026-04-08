-- ============================================================
-- Migration 002: Add skills column to graduates table
-- Run this in the Supabase SQL Editor
-- ============================================================

alter table graduates
  add column if not exists skills text[] default null;

create index if not exists idx_graduates_skills on graduates using gin(skills);
