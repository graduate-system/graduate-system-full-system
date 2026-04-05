# Target Architecture (End State)

## High-level shape

- Backend becomes the “BFF” (Backend-for-Frontend):
  - owns business rules and validation
  - owns all reads/writes to the database for this product
  - returns UI-friendly DTOs to the Next.js app
- Frontend becomes a thin UI:
  - submits form data to backend endpoints
  - renders dashboard data returned by backend

## Data layer options (pick one and stick to it)

### Option A (recommended): Backend talks to Supabase Postgres directly

- Backend uses Postgres connection string (via Supabase) using `Npgsql` (and optionally EF Core / Dapper).
- Backend uses a DB role that can read/write as required (often equivalent to Supabase “service role” privileges).
- Browser does not get a Supabase key capable of writing to `graduates`.

Why this option is strong:
- simplest long-term: standard SQL access
- easiest to enforce “browser cannot bypass backend”
- best observability for queries and performance

### Option B: Backend uses Supabase APIs (PostgREST) with service role key

- Backend uses Supabase REST endpoints with service role key.
- Still remove powerful keys from the browser.

This is workable, but you are dependent on external API semantics for joins/filters.

## Auth / access control

- Keep the same committee PIN concept for parity, but implement it in the backend:
  - `POST /api/committee/login` sets an HTTP-only cookie
  - `POST /api/committee/logout` clears it
  - `GET /api/committee/session` returns whether authenticated
- For dashboard endpoints, require the cookie.
- For graduate submission endpoints, decide:
  - public (graduates can submit without committee login), or
  - protected (only admins submit). Today it is public, so parity suggests public.

## Ownership boundaries

- Backend owns:
  - validation rules (school/department/programme/year/status)
  - programme resolution
  - insert/bulk insert logic and error reporting
  - dashboard aggregation calculations
- Frontend owns:
  - UI validation (can still exist), but backend validation is authoritative
  - calling backend endpoints and rendering results

