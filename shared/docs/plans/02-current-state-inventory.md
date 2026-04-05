# Current State Inventory (What Exists Today)

## Backend

- `backend/Program.cs` is an empty ASP.NET Core app (no routes).
- `backend/Api.csproj` targets `net10.0` and references `Microsoft.AspNetCore.OpenApi`.
- Test project exists but has no meaningful tests yet.

## Frontend (Next.js)

### Data access

- Supabase client:
  - `frontend/src/lib/supabase.ts` uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Writes:
  - `frontend/src/lib/actions.ts`
    - resolves programme by querying `programmes` table (`department_id` + `name`)
    - inserts into `graduates` table
    - supports a bulk insert flow (chunks of 100) and collects per-row failures
- Reads + analytics:
  - `frontend/src/lib/dashboard-queries.ts`
    - reads *all* rows from `graduates`
    - computes aggregates in Node:
      - totals
      - by school/status/year/sector/campus/department/months_to_employ
      - employment rate (rounded to percent)

### Committee access

- “PIN gate” lives in Next.js server code:
  - `frontend/src/lib/auth.ts`
  - sets an HTTP-only cookie (currently `committee_auth`)
  - PIN is `COMMITTEE_PIN` (defaults to `"123456"` if missing)
  - cookie max age is 8 hours
- “Settings” actions also live in Next.js server code:
  - `changePin(currentPin, newPin)` updates `process.env.COMMITTEE_PIN` at runtime (not persistent)
  - `logout()` clears the cookie
- Dashboard layout enforces authentication:
  - `frontend/src/app/dashboard/layout.tsx` blocks access unless cookie exists

### Admin/data management

- DB statistics and “purge all graduates” live in Next.js server code:
  - `frontend/src/lib/settings-actions.ts`
  - `fetchDbStats()` counts records and derives basic stats
  - `purgeAllGraduates()` deletes all rows from `graduates`

## Operational assumptions currently baked in

- The browser has a Supabase anon key and can call Supabase directly.
- The committee “authentication” is a shared PIN, not a per-user identity.
- There is no explicit backend validation layer; the server actions are the only “source of truth” today.
