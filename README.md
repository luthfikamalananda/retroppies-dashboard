# Retroppies Dashboard

Desktop-first React SPA for administering a multi-tenant photobooth franchise (products,
templates, timers, vouchers, sessions, transactions, and user/role management). Data and
security are owned by a separate Go REST API; this app is UI only.

## Docs

- **[CONTEXT.md](./CONTEXT.md)** — domain glossary, architecture, and coding conventions. Read
  this first.
- **[STATUS.md](./STATUS.md)** — feature checklist (what's built).
- **[docs/adr/](./docs/adr/)** — architecture decision records.

## Getting started

```bash
npm install
npm run dev        # Vite dev server on http://localhost:5173
```

Configure `.env`:

```
VITE_API_BASE_URL=https://api.retroppies.com/
VITE_DUMMY_MODE=false
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server (port 5173) |
| `npm run build` | Type-check + production build |
| `npm run lint` | ESLint |
| `npm run preview` | Preview the production build |
| `npx playwright test` | Run Playwright tests (dev server must be running) |

## Stack

React 19 · TypeScript · Vite · MUI v9 · TanStack Query v5 · Zustand v5 · React Router v6 ·
React Hook Form + Zod v4 · dayjs · Playwright.
