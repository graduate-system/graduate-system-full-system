# GradTrack Analytics

Graduate employability tracking system for **Meru University of Science and Technology (MUST)**.

Tracks graduate employment outcomes, provides analytics dashboards for the committee, and generates AI-powered employability reports.

---

## Architecture

```
┌─────────────────────────┐        ┌──────────────────────────┐
│      gradtrack-web      │  HTTP  │      gradtrack-api       │
│   Next.js 16 frontend   │ ──────▶│  ASP.NET Core .NET 10    │
│   (React, Tailwind)     │        │  Minimal API             │
└─────────────────────────┘        └──────────┬───────────────┘
                                              │ PostgREST
                                   ┌──────────▼───────────────┐
                                   │         Supabase         │
                                   │      (PostgreSQL)        │
                                   └──────────────────────────┘
```

---

## Projects

| Project | Description | Docs |
|---|---|---|
| [`gradtrack-api`](./gradtrack-api/) | ASP.NET Core REST API | [README](./gradtrack-api/README.md) |
| [`gradtrack-web`](./gradtrack-web/) | Next.js web application | [README](./gradtrack-web/README.md) |

Each project is independently deployable and has its own `Dockerfile`, `.gitignore`, CI workflow, and README.

---

## Quick start (local development)

### 1. Database setup

Run the SQL scripts in your Supabase SQL Editor in order:

```
gradtrack-api/scripts/001_schema.sql    — tables, indexes, seed data
gradtrack-api/scripts/002_add_skills.sql — skills column migration
```

### 2. Start the API

```bash
cd gradtrack-api
# Create appsettings.Development.json — see gradtrack-api/README.md
dotnet run
# → http://localhost:5291
```

### 3. Start the web app

```bash
cd gradtrack-web
npm install
# Create .env.local with BACKEND_URL=http://localhost:5291
npm run dev
# → http://localhost:3000
```

---

## Repository structure

```
graduate system/
├── gradtrack-api/        .NET backend — own repo candidate
│   ├── scripts/          SQL migrations + CI helper
│   ├── tests/            xUnit unit + integration tests
│   ├── Dockerfile
│   ├── railway.toml
│   └── gradtrack-api.sln
├── gradtrack-web/        Next.js frontend — own repo candidate
│   ├── src/              App source code
│   ├── tests/e2e/        Playwright end-to-end tests
│   └── Dockerfile
└── .gitignore
```

---

## Extracting into separate repos

Each project is ready to be extracted into its own repository:

```bash
# Extract gradtrack-api
git subtree split --prefix=gradtrack-api -b gradtrack-api-branch
git push https://github.com/your-org/gradtrack-api.git gradtrack-api-branch:main

# Extract gradtrack-web
git subtree split --prefix=gradtrack-web -b gradtrack-web-branch
git push https://github.com/your-org/gradtrack-web.git gradtrack-web-branch:main
```
