# gradtrack-web

Next.js frontend for **GradTrack Analytics** — the graduate employability tracking system for Meru University of Science and Technology (MUST).

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS · Recharts · Playwright

---

## What it does

- Public graduate self-registration form (3-step, validated, with skills picker)
- Committee dashboard protected by a shared PIN
- Employment analytics with charts, filters, and year-on-year comparison
- Bulk graduate upload via CSV or Excel
- AI-generated employability reports with PDF and Excel export
- Fully proxies all `/api/*` requests to `gradtrack-api` — no secrets in the browser

---

## Project layout

```
gradtrack-web/
├── src/
│   ├── app/
│   │   ├── page.tsx              Landing page
│   │   ├── register/             Public graduate registration form
│   │   └── dashboard/            PIN-protected committee area
│   │       ├── page.tsx          Overview — KPIs, charts, year comparison
│   │       ├── analytics/        Employment rates, skills, cohort comparison
│   │       ├── graduates/        Searchable graduate records table
│   │       ├── upload/           Single entry + CSV/Excel bulk upload
│   │       ├── reports/          AI report generation and download
│   │       └── settings/         Security, data management, appearance
│   ├── components/               Shared UI components (shadcn/ui)
│   └── lib/                      API clients, server actions, utilities
├── tests/e2e/                    Playwright end-to-end tests (241 tests)
├── playwright.config.ts
└── next.config.mjs
```

---

## Prerequisites

- [Node.js 20+](https://nodejs.org)
- [gradtrack-api](https://github.com/your-org/gradtrack-api) running on port `5291`

---

## Local development

### 1. Clone and install

```bash
git clone https://github.com/your-org/gradtrack-web.git
cd gradtrack-web
npm install
```

### 2. Create `.env.local`

This file is git-ignored. Create it manually:

```env
# URL of the gradtrack-api (used server-side only)
BACKEND_URL=http://localhost:5291
```

### 3. Run

```bash
npm run dev
# → http://localhost:3000
```

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `BACKEND_URL` | ✅ | gradtrack-api base URL e.g. `https://api.gradtrack.must.ac.ke` |
| `BACKEND_INTERNAL_URL` | Optional | Internal URL when both services run in the same Docker network |

All `/api/*` requests are proxied to the backend via `next.config.mjs` rewrites. No API keys or secrets are ever sent to the browser.

---

## Scripts

```bash
npm run dev          # Start development server on :3000
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npx tsc --noEmit     # TypeScript type check
```

---

## Tests

### Playwright end-to-end

```bash
# Install browsers (first time only)
npx playwright install chromium firefox

# Run all tests (dev server must be running)
npm run test:e2e

# Run with browser visible
npm run test:e2e:headed

# Interactive Playwright UI
npm run test:e2e:ui

# Open last HTML report
npm run test:e2e:report
```

Tests use route interception to mock all backend API calls — no real `gradtrack-api` needed to run the test suite.

---

## Docker

```bash
# Build
docker build -t gradtrack-web .

# Run
docker run -p 3000:3000 \
  -e BACKEND_INTERNAL_URL=http://gradtrack-api:8080 \
  gradtrack-web
```

Requires `output: "standalone"` in `next.config.mjs` — already configured.

---

## Deployment

### Vercel (recommended)

1. Push this repo to GitHub
2. Import into [Vercel](https://vercel.com)
3. Set `BACKEND_URL` to your deployed API URL
4. Deploy — Vercel auto-detects Next.js

### Railway / Docker

1. Push to GitHub
2. New Railway project → **Deploy from GitHub repo**
3. Railway detects the `Dockerfile` automatically
4. Set `BACKEND_INTERNAL_URL` to your API service's internal Railway URL

---

## CI

GitHub Actions workflow at `.github/workflows/ci.yml`:

- **On every push/PR** — TypeScript type check + ESLint
- **On merge to main** — Playwright tests (Chromium), Docker build and push to GitHub Container Registry
