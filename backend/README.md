# graduate-system-worker
graduate-system-worker for handling the apis  used to build up the system.

## Build & test

From `backend/`:

- `dotnet restore`
- `dotnet build`
- `dotnet test`

If you’re in a restricted environment (CI/sandbox) and MSBuild servers fail, add `--disable-build-servers`.

## Local run

From `backend/`:

- `dotnet run --project Api/Api.csproj`

Required env vars for DB access (Supabase PostgREST via service role):

- `Supabase__Url` (e.g. `https://xxxx.supabase.co`)
- `Supabase__ServiceRoleKey` (keep private; never expose to browser)

Committee auth env vars:

- `COMMITTEE_PIN` (optional; defaults to `123456`)
