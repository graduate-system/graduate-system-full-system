# Data Model and Database Plan

This plan assumes Supabase Postgres is the database. The goal is to make the backend the only trusted writer/reader for protected tables.

## Tables involved (as referenced by current code)

### `programmes`

Read pattern today:
- lookup by `department_id` + `name`
- returns `id`

Backend needs:
- uniqueness guarantee on (`department_id`, `name`) so lookups are deterministic

Recommended constraints/index:
- unique index on (`department_id`, `name`)

### `graduates`

Write pattern today:
- inserts a denormalized row containing both ids and names:
  - `school_id`, `department_id`, `programme_id`
  - `school_name`, `department_name`, `programme_name`
- plus graduate employment fields

Backend needs:
- validation for required fields and acceptable enums
- sane types:
  - `graduation_year` as integer
  - `created_at` default

Recommended constraints:
- `graduation_year` reasonable bounds (e.g., 1990..(currentYear+1)) if you want strictness
- optional: check constraints for `employment_status` and `campus` to prevent drift

## Migration approach

1. Export the current schema from Supabase (tables + constraints).
2. Write a schema contract doc in this folder (or generate a SQL snapshot).
3. If constraints are missing (e.g., `programmes` uniqueness), add them in a controlled migration.
4. Only after schema is stable, start hardening RLS.

## RLS (Row Level Security) direction

- For parity and simplicity:
  - keep public insert into `graduates` *disabled* from the anon key,
  - allow inserts only through the backend (service role / DB role),
  - allow reads for dashboard only through backend.
- If you need some public read access (usually you do not), explicitly allow it via RLS policies.

