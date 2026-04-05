# Implementation Plan (Ordered Steps)

This is the “do this, then that” plan. Each step should end with a concrete verification.

## Step 0 — Lock down the spec (so nothing is missed)

- Freeze the current behavior as the “spec”:
  - list all input fields and validation rules
  - list all error cases and expected responses
  - list all dashboard calculations and sorting
- Create fixtures:
  - valid submission payloads
  - invalid payloads (each validation failure)
  - a small sample dataset of graduates for dashboard calculations

Verification:
- You can run a scripted replay against current Next.js server actions and capture outputs as “golden files”.

## Step 1 — Create backend project structure

- Decide on minimal API vs controllers (either is fine; pick one).
- Add:
  - request/response DTOs matching the frontend types
  - validation layer (FluentValidation or manual validation)
  - OpenAPI/Swagger for quick inspection

Verification:
- OpenAPI lists the endpoints and schemas.

## Step 2 — Implement committee session in backend

- Implement:
  - `POST /api/committee/login`
  - `POST /api/committee/logout`
  - `GET /api/committee/session`
- Implement settings endpoints:
  - `POST /api/committee/pin` (durable change; not “set env var in memory”)
- Match current semantics:
  - PIN source: `COMMITTEE_PIN` defaulting to `123456`
  - cookie is HTTP-only, 8h max age, secure in production, `SameSite=Lax`

Verification:
- Session cookie is set on successful login and blocks dashboard endpoints when missing.

## Step 3 — Implement data access layer

- Choose DB access method:
  - direct Postgres with `Npgsql` (recommended)
  - or Supabase REST with service key
- Implement repository methods:
  - resolve programme id by (`department_id`, `name`)
  - insert graduate row
  - bulk insert with chunking and per-row failure reporting
  - fetch graduates (for parity) ordered by `created_at desc`

Verification:
- A simple smoke test can insert and retrieve a row in a dev database.

## Step 4 — Implement `POST /api/graduates`

- Port the exact rules from `frontend/src/lib/actions.ts`:
  - validate school/department/programme based on your canonical source (see Step 6)
  - enforce “email or phone required”
  - parse `graduation_year` to int
  - resolve programme id
  - insert into `graduates`
- Match error meanings:
  - invalid school/department/programme
  - programme not found in DB
  - insert error

Verification:
- Parity tests for all fixtures pass for single insert.

## Step 5 — Implement `POST /api/graduates/bulk`

- Implement:
  - resolve and validate each payload
  - keep the same “row numbering” behavior (1-based)
  - insert in chunks (100)
  - return `{ inserted, failed[] }`

Verification:
- Parity tests pass for bulk fixtures.

## Step 6 — Make “MUST data” canonical

Today `MUST_SCHOOLS` lives in the frontend. You need a single source of truth to avoid drift.

Pick one:
- A shared JSON file checked into the repo and loaded by both apps.
- A backend-owned endpoint `GET /api/metadata/must` that the frontend uses to populate selects.
- A database table for schools/departments/programmes and the UI queries it (more work, best long-term).

Verification:
- Frontend options exactly match backend validation rules (no “valid in UI but rejected by API”).

## Step 7 — Implement `GET /api/dashboard`

- Start by matching current behavior (parity-first):
  - load all graduates
  - compute aggregates in code (same rules)
- After parity is proven, optimize:
  - compute aggregates in SQL
  - add pagination for raw graduate list

Verification:
- Dashboard parity fixtures produce identical aggregates.

## Step 7.1 — Implement admin stats + purge

- Implement:
  - `GET /api/admin/stats` (mirror `fetchDbStats`)
  - `DELETE /api/admin/graduates` (mirror `purgeAllGraduates`)
- Add guardrails for purge:
  - committee auth required
  - explicit confirmation (e.g., `X-Confirm-Purge: YES`)

Verification:
- Stats match expected counts.
- Purge refuses without confirmation and succeeds with it.

## Step 8 — Migrate frontend to call backend

- Replace usages of:
  - `submitGraduate` -> `fetch('/api/graduates', ...)`
  - `bulkInsertGraduates` -> `fetch('/api/graduates/bulk', ...)`
  - `fetchDashboardData` -> `fetch('/api/dashboard')` (server-side)
  - committee login -> call backend login
- Remove direct Supabase client usage from frontend where possible.

Verification:
- Full UI flow works end-to-end without any direct Supabase calls.

## Step 9 — Harden Supabase RLS + remove browser privileges

- Update Supabase policies so:
  - anon key cannot insert into `graduates`
  - anon key cannot read `graduates` (committee-only via backend)
- Rotate any leaked keys if needed.

Verification:
- Direct Supabase requests from browser are denied for protected operations.
