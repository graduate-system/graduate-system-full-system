# Goals, Non-Goals, and Success Criteria

## Goals

- Move all data access and business logic out of the Next.js app and into the .NET backend.
- Keep behavior identical for:
  - validation rules
  - error cases and messages (as much as practical)
  - dashboard calculations (counts, grouping, sorting, rounding)
  - committee PIN gate behavior (what is protected, how long sessions last, cookie settings)
- Reduce risk by creating a parity test harness that proves backend output matches the current frontend/server-actions output.
- Improve security posture by removing direct Supabase “write” capabilities from the browser.

## Non-goals (for the first migration)

- Adding full user authentication (e.g., per-graduate accounts). This can be phase 2.
- Rewriting the UI/UX.
- Redesigning the schema beyond what is required to support the current UI.
- “Perfect architecture”; the priority is correctness + parity + safe cutover.

## Success criteria (“done”)

- The frontend no longer uses `@supabase/supabase-js` for reads/writes to protected tables.
- The backend provides endpoints that fully replace:
  - `submitGraduate`
  - `bulkInsertGraduates`
  - `fetchDashboardData`
  - `verifyPin` / session
- A parity suite runs in CI (or locally) that:
  - replays a set of fixed inputs (fixtures) and asserts identical outputs
  - covers edge cases (bad school/department/programme, missing contact info, invalid years, etc.)
- Supabase Row Level Security (RLS) and keys are configured so the browser cannot bypass the backend for protected data.

