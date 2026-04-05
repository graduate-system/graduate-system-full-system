# graduate-system-client

Graduate system client built with **Next.js 15** and **TypeScript**.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the dev server:

   ```bash
   npm run dev
   ```

3. Open `http://localhost:3000` in your browser.

## Tech stack

- **Framework**: Next.js 15.2.2 (App Router)
- **Language**: TypeScript
- **UI**: React 19
- **Styling**: Tailwind CSS 3

## Security defaults

This starter enables:

- **Strict mode** in React for better runtime checks.
- **Security headers** (HSTS, frame-busting, MIME sniffing protection, referrer policy, and a minimal permissions policy) via `next.config.mjs`.

If you deploy behind HTTP (not HTTPS), adjust or remove the `Strict-Transport-Security` header in `next.config.mjs`.
