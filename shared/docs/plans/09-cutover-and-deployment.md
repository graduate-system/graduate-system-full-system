# Cutover and Deployment Plan

## Environments

- Local dev:
  - Next.js dev server
  - .NET backend
  - Supabase dev project (or local Postgres)
- Staging:
  - same topology as production
  - isolated database or separate schema
- Production:
  - reverse-proxied single site if possible

## Rollout steps

1. Deploy backend with endpoints behind a feature flag (or staging-only).
2. Run parity suite in CI.
3. Enable frontend to call backend in staging.
4. Verify:
   - graduate submission
   - dashboard access + PIN
   - dashboard calculations
5. Tighten RLS so browser cannot bypass backend.
6. Deploy to production:
   - ship backend
   - switch frontend to backend endpoints

## Rollback plan (keep it simple)

- Keep the previous frontend behavior behind a flag for one release window.
- If backend has issues:
  - flip the flag back
  - temporarily relax RLS only if absolutely necessary (and revert quickly)

## Monitoring

- Add basic request logging in backend (no sensitive fields).
- Add health endpoint and simple uptime monitoring.
- Track:
  - insert failures
  - dashboard fetch latency
  - login failures/rate limiting triggers

