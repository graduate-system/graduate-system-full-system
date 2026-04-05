# Security and Secrets Plan

## Current risk

- The browser holds `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- If Supabase RLS is permissive, a user can bypass the UI and read/write directly.

## Target security posture

- Browser has no credentials that can write to protected tables.
- Backend holds the privileged DB connection / service credentials.
- All sensitive reads (dashboard) require committee session.

## Secrets and env vars

Frontend (public):
- no “service” keys
- only backend base URL and non-sensitive flags

Backend (private):
- DB connection string OR Supabase service role key
- committee PIN (`COMMITTEE_PIN`)
- cookie signing/encryption secrets if you use signed cookies
- allowed origins (CORS)

## Cookie and CORS

If frontend and backend are on different origins during development:
- enable CORS on backend for the frontend dev origin
- configure cookies for cross-site rules if needed:
  - `SameSite=None` + `Secure` for true cross-site cookies (production)
  - prefer hosting behind the same domain to keep `SameSite=Lax` working reliably

Recommended deployment shape:
- reverse proxy so both are same-site (e.g., `app.example.com`):
  - `/` and `/dashboard` served by Next.js
  - `/api/*` proxied to backend

## Threat model checklist

- PIN brute force:
  - add rate limiting on login endpoint
  - add minimal lockout/backoff
- Destructive admin actions:
  - require committee session
  - require explicit confirmation
  - log “who/when” at least at the request level (without sensitive data)
- Logging:
  - never log PINs, tokens, or connection strings
- Input validation:
  - backend validates everything even if UI already validates
