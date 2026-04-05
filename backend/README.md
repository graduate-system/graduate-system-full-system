# graduate-system-worker
graduate-system-worker for handling the apis  used to build up the system.

## Build & test

From `backend/`:

- `dotnet restore`
- `dotnet build`
- `dotnet test`

If you’re in a restricted environment (CI/sandbox) and MSBuild servers fail, add `--disable-build-servers`.
