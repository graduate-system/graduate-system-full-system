# gradtrack-api

REST API for **GradTrack Analytics** — the graduate employability tracking system for Meru University of Science and Technology (MUST).

**Stack:** ASP.NET Core · .NET 10 · Supabase (PostgreSQL) · Azure OpenAI

---

## What it does

- Accepts graduate employment submissions from the public registration form
- Provides a PIN-protected committee dashboard with analytics data
- Generates AI-powered employability reports (PDF and Excel)
- Validates all data against the MUST academic structure (schools, departments, programmes)

---

## Project layout

```
gradtrack-api/
├── Committee/        PIN-based auth — session tokens, filter, PIN store
├── Dashboard/        Aggregation calculator for dashboard analytics
├── Endpoints/        All HTTP route handlers (minimal API)
├── Graduates/        Graduate payload DTO, service, Supabase repository
├── Json/             Snake_case JSON naming policy
├── MustData/         MUST school / department / programme metadata
├── Reports/          AI report generation, PDF export, Excel export
├── Supabase/         PostgREST HTTP client
├── tests/            xUnit unit + integration tests
├── scripts/          SQL migrations and CI helper script
├── Api.csproj
├── gradtrack-api.sln
└── Program.cs
```

---

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- A [Supabase](https://supabase.com) project with the schema applied (see `scripts/`)

---

## Local development

### 1. Clone

```bash
git clone https://github.com/your-org/gradtrack-api.git
cd gradtrack-api
dotnet restore gradtrack-api.sln
```

### 2. Create `appsettings.Development.json`

This file is git-ignored. Create it manually:

```json
{
  "Supabase": {
    "Url": "https://your-project.supabase.co",
    "ServiceRoleKey": "your-service-role-key"
  },
  "CommitteeAuth": {
    "SessionSecret": "any-random-32-character-string"
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:3000"]
  },
  "AzureAI": {
    "Endpoint": "https://your-resource.openai.azure.com/",
    "ApiKey": "your-key",
    "DeploymentName": "gpt-4"
  }
}
```

### 3. Run

```bash
dotnet run
# → http://localhost:5291
# → Health check: GET http://localhost:5291/api/health
```

---

## Database setup

Run these scripts in your Supabase SQL Editor in order:

```
scripts/001_schema.sql   — tables, indexes, seed data (schools, departments, programmes)
scripts/002_add_skills.sql — adds the skills[] column to graduates
```

---

## Tests

```bash
dotnet test gradtrack-api.sln
# 188 tests — no real database needed (uses in-memory fakes)
```

---

## Environment variables

Set these in production (Railway config, Azure App Service settings, or environment):

| Variable | Required | Description |
|---|---|---|
| `Supabase__Url` | ✅ | Supabase project URL |
| `Supabase__ServiceRoleKey` | ✅ | Service role key — keep private, never expose to browser |
| `CommitteeAuth__SessionSecret` | ✅ | Random 32+ char string for signing session cookies |
| `Cors__AllowedOrigins__0` | ✅ | Deployed frontend URL e.g. `https://gradtrack.must.ac.ke` |
| `COMMITTEE_PIN` | Optional | Dashboard PIN (defaults to `123456` — change in production) |
| `AzureAI__Endpoint` | Optional | Azure OpenAI endpoint (required for AI report generation) |
| `AzureAI__ApiKey` | Optional | Azure OpenAI API key |
| `AzureAI__DeploymentName` | Optional | Model deployment name (default: `haven-gpt-4.1`) |

---

## API reference

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | — | Health check |
| `POST` | `/api/committee/login` | — | PIN login — sets session cookie |
| `GET` | `/api/committee/session` | — | Check if session is valid |
| `POST` | `/api/committee/logout` | — | Clear session cookie |
| `POST` | `/api/committee/pin` | 🔐 | Change committee PIN |
| `GET` | `/api/metadata/schools` | — | List all schools |
| `GET` | `/api/metadata/departments?school_id=` | — | List departments for a school |
| `GET` | `/api/metadata/programmes?school_id=&department_id=` | — | List programmes |
| `POST` | `/api/graduates` | — | Submit one graduate record |
| `POST` | `/api/graduates/bulk` | — | Bulk insert graduates (JSON array) |
| `POST` | `/api/graduates/bulk-excel` | — | Bulk insert graduates (Excel file upload) |
| `GET` | `/api/dashboard` | 🔐 | Full dashboard analytics |
| `GET` | `/api/admin/stats` | 🔐 | Database statistics |
| `DELETE` | `/api/admin/graduates` | 🔐 | Purge all graduate records |
| `GET` | `/api/reports/preview` | 🔐 | Preview report scope and graduate count |
| `POST` | `/api/reports/generate` | 🔐 | Generate AI narrative report |
| `POST` | `/api/reports/edit-section` | 🔐 | Edit a report section with AI |
| `POST` | `/api/reports/pdf` | 🔐 | Download report as PDF |
| `POST` | `/api/reports/excel` | 🔐 | Download report as Excel |

---

## Docker

```bash
# Build
docker build -t gradtrack-api .

# Run
docker run -p 8080:8080 \
  -e Supabase__Url=https://your-project.supabase.co \
  -e Supabase__ServiceRoleKey=your-key \
  -e CommitteeAuth__SessionSecret=your-secret \
  -e Cors__AllowedOrigins__0=https://your-frontend.com \
  gradtrack-api
```

---

## Deployment

### Railway

1. Push this repo to GitHub
2. New Railway project → **Deploy from GitHub repo**
3. Railway detects `railway.toml` and builds the `Dockerfile` automatically
4. Add environment variables in the Railway dashboard

### Azure App Service

```bash
az webapp create \
  --resource-group myRG \
  --plan myPlan \
  --name gradtrack-api \
  --deployment-container-image-name ghcr.io/your-org/gradtrack-api:latest
```

---

## CI

GitHub Actions workflow at `.github/workflows/ci.yml`:

- **On every push/PR** — restore, build, run all 188 tests
- **On merge to main** — build and push Docker image to GitHub Container Registry
