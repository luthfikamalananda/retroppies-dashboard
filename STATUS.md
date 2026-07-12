# Feature Status

Lean, reality-checked feature checklist (replaces the old PRD §14). `[x]` = built and in the
codebase today; `[ ]` = not present / pending. For domain terms and conventions see
[CONTEXT.md](./CONTEXT.md); for decisions see [docs/adr/](./docs/adr/).

## Foundation
- [x] React + Vite + TypeScript, MUI v9 theme, AppShell layout
- [x] React Router (public `/login`, protected `/app/*`), lazy-loaded pages
- [x] Zustand stores (`authStore` persisted to sessionStorage, `uiStore`)
- [x] TanStack Query + `QueryClientProvider`
- [x] Axios client with auth-header interceptor + `401` → hard logout (ADR-0001)
- [x] Env config (`VITE_API_BASE_URL`, `VITE_DUMMY_MODE`)
- [x] Global error boundary + global snackbar
- [ ] `DUMMY_MODE` / mock auth — **removed** (env var still read but no mock layer exists)
- [ ] Refresh-token bootstrap / silent retry — **not implemented by design** (ADR-0001)

## Auth & Access
- [x] Login page + `/users/login` integration
- [x] ProtectedRoute redirect
- [x] Logout clears query cache
- [x] `usePermissions().can()` reads backend `permissions[]` (ADR-0002)
- [x] Superadmin bypass + Tenant Selector scope (ADR-0004)
- [x] Page-level access model — single `src/routes/accessConfig.ts` consumed by the route guard
  (`AccessGuard`) and the sidebar; three classes (baseline / operational / superadmin-only).
  See [docs/access-matrix.md](./docs/access-matrix.md) + [ADR-0006](./docs/adr/0006-page-access-model.md)
- [!] **Backend over-grants the franchise `Owner` role** — verified against the real API, the
  `Owner` role (`demoadmin1`, `isSuperadmin: false`) is granted `tenants:*`, `roles:*`,
  `permissions:read`, `role_permissions:*` etc. The frontend now hides those admin pages
  (superadmin-only class), but since the backend is the security boundary (ADR-0002), a direct
  API call with that token would still be accepted. **Follow-up: tighten the backend `Owner`
  role definition** so franchise accounts genuinely cannot touch cross-tenant / RBAC data.

## Dashboard
- [x] Compiles clean (`tsc -b` passes) — uses `getChartSummary`/`getChartCount`; product options
  are fetched dynamically; recharts Tooltip formatters typed against recharts' own value types
- [x] Summary cards (total / success / failed)
- [x] Revenue chart + date-range filter
- [x] Transaction chart + date-range filter
- [x] Loading / error / empty states

## Products (CRUD)
- [x] List (server pagination), create, edit, delete + confirm
- [x] Photo upload (multipart + progress), Zod validation
- [x] Tenant column + Tenant Selector conditional on superadmin
- [x] Permission gates (`products:create/update/delete`)

## Layouts & Templates (CRUD)
- [x] Layouts grid → choose layout → templates page
- [x] Template list (grid + thumbnails)
- [x] Upload (display + production PNG pair, `isDefault`), edit, delete
- [x] Upload preview dialog + progress, PNG validation
- [x] Permission gates (`templates:*`)

## Timers (CRUD — backed by Rules)
- [x] List, create, edit, delete rules (`rulesType` + `value`)
- [x] Value bounds validation
- [x] Permission gates (`rules:*`)

## Vouchers (CRUD)
- [x] List, create (period picker + status), edit, delete
- [x] Validation (period, value, required); usage counters read-only
- [x] Permission gates (`vouchers:*`)

## Sessions
- [x] List (server pagination, keyword, publish filter) + detail dialog

## Transactions (read-only)
- [x] List (server pagination), **custom** date-range picker + detail drawer
- [~] Status filter — coded but **commented out** in `TransactionsPage`
- [ ] CSV export — pending backend endpoint

## Settings User
- [x] Tenants — CRUD + permission gates
- [x] Users — list/create/update/delete (create/update/delete UI intentionally limited)
- [x] Roles — CRUD + permission gates
- [x] Role → Permission assignment screen
- [~] Permissions page — built but **hidden** in the sidebar
- [x] Manage Account — read-only profile + change-password dialog

## Cross-cutting
- [~] Responsive (mobile/tablet): overlay sidebar done; **per-page header/filter area still
  being tidied** across viewports (see UI & Layout Conventions in CONTEXT.md)
- [x] Playwright tests: auth guard, navigation, products, vouchers, templates
- [ ] CI pipeline
- [ ] Deployment config (staging/prod) — Netlify config present (`netlify.toml`)

## Known tech debt
See _Known Inconsistencies_ in [CONTEXT.md](./CONTEXT.md): legacy `accounts.api`, non-uniform
response envelope, vestigial Outlet fields, dead refresh stubs, hardcoded Basic-auth header,
snake_case leaks.
