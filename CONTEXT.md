# Retroppies Dashboard — Context

Desktop-first React SPA for administering a **multi-tenant photobooth franchise**. Each
tenant (a photobooth cafe/outlet) customizes its products, photo templates, timers and
vouchers, and monitors its sessions and transactions. A separate Go REST API owns all data
and is the **sole authority for security and tenant isolation** — this frontend only
renders and enforces UX-level guardrails.

This file is the single source of truth for the project's domain language, architecture
shape, and coding conventions. Feature-level progress lives in [STATUS.md](./STATUS.md);
hard-to-reverse decisions live in [docs/adr/](./docs/adr/).

---

## Domain Glossary

Canonical terms. When several words exist for one concept, the canonical one is defined and
the rest are listed under _Avoid_.

**Tenant**:
A single photobooth franchise location — the unit of data isolation. Every domain record
belongs to a tenant. In this business a tenant *is* the cafe/outlet.
_Avoid_: Outlet, Cafe, Franchise, Store.

**Superadmin**:
A cross-tenant account (flagged by `isSuperadmin`, carried as the sentinel `tenantId = -99`)
that can view and act on any tenant. Superadmins choose the working tenant via the Tenant
Selector.
_Avoid_: Root, Owner.

**Active Tenant** (scope):
The tenant a superadmin is currently acting as. Stored as `user.tenantId` in the auth store
and mutated through `setScope()`. The sentinel `0` means **ALL / unscoped**. A normal user's
active tenant is fixed to their own.
_Avoid_: Current outlet, Selected org.

**Product**:
A sellable item at a tenant (`productType`: `print` | `addon` | `bundling`) with a code,
name, price and photo.

**Layout**:
A photo frame arrangement. Templates are organized under a layout — you pick a layout first,
then manage its templates.
_Avoid_: Frame, Design (the sidebar labels this "Design Template").

**Template**:
An uploaded overlay for a layout, consisting of a **pair** of PNGs — a `display` image (shown
to the customer) and a `production` image (used in the final render) — plus an `isDefault`
flag. Belongs to a layout and a tenant.
_Avoid_: Overlay, Frame image.

**Timer**:
A configurable numeric setting for a tenant (e.g. payment countdown, photo-session duration).
Canonical UI/domain term. Backed by the API's generic **Rule** entity (`rulesType` + `value`,
under `/rules/*`); "Rule" is a backend/implementation term only.
_Avoid_: Rule (in domain/UI language), Countdown.

**Voucher**:
A discount code for a tenant with a `value`, spend/quantity limits (`limitRp`, `limitQty`,
with `tempLimitRp`/`tempLimitQty` tracking remaining usage), an active period (`dateFrom`/
`dateTo`) and a `status`.

**Session**:
A completed photobooth photo session record (`sessionCode`, `invoiceNumber`, `resultUrl`,
`isPublish`). Tied to a tenant; the `invoiceNumber` links it to a Transaction.
_Avoid_: Photo job, Booth run.

**Transaction**:
A read-only sales record (`invoiceNumber`, `grandTotal`, `status`, line `items`) for a tenant.
Reported and filtered, never edited from this dashboard.
_Avoid_: Order, Sale, Purchase.

**Role**:
A named set of permissions (e.g. `admin`, `outlet_manager`). Assigned to users; its
permissions are edited on the Role → Permission assignment screen.

**Permission**:
A backend-defined capability string in `resource:action` form (e.g. `products:create`,
`vouchers:delete`). The frontend receives the current user's permission list at login and
uses it for UX gating only.

**User / Account**:
A login identity (`username`, `roleId`, `tenantId`, `isSuperadmin`). "Account" also refers to
the self-service Manage Account screen (password change only). Note: the legacy `accounts.api`
"Account" type is a separate, older shape — see _Known Inconsistencies_.

---

## Users, Roles & Permissions (RBAC)

- Security and tenant isolation are enforced **by the backend**. The frontend RBAC is
  **UX-only**: it hides menus/buttons the user can't use, and is never the security boundary.
  See [ADR-0002](./docs/adr/0002-backend-authoritative-rbac.md).
- On login the backend returns the user's `permissions: string[]` inside `ResultLogin`.
- Gate UI with `usePermissions().can(...)`:
  - `can('products:create')` — exact permission match.
  - `can('products')` — true if the user has *any* `products:*` permission.
  - `can('*')` — always true.
  - Superadmins bypass all checks (`can` returns `true`).
- Permission naming convention (backend-driven): `resource:action` where action is one of
  `read` / `create` / `update` / `delete`.

---

## Architecture at a Glance

```
src/
├── api/          One file per domain. All HTTP lives here (nothing else calls axios).
├── components/
│   ├── common/   ConfirmDialog, ErrorAlert, EmptyState, GlobalSnackbar,
│   │             GlobalErrorBoundary, TenantSelector.
│   └── layout/   AppShell, Sidebar, Topbar.
├── features/     Per-domain form dialogs & feature-specific pieces.
├── hooks/        usePermissions.
├── pages/        One file per route under /app/*.
├── routes/       AppRoutes (lazy-loaded pages), ProtectedRoute.
├── stores/       Zustand: authStore (persisted), uiStore (ephemeral).
└── theme/        MUI theme + colors.
```

- **Routing**: `react-router` v6. Public `/login`; everything else under `/app/*` is wrapped
  in `ProtectedRoute` → `AppShell`. Pages are lazy-loaded per feature.
- **Server state**: TanStack Query v5 for *all* API data. Never store API responses in
  `useState`/Zustand.
- **Client state**: Zustand. `authStore` holds the logged-in user (and doubles as the tenant
  scope); `uiStore` holds sidebar + snackbar state.
- **Auth session**: token in `sessionStorage`, no refresh flow, `401` → hard logout. See
  [ADR-0001](./docs/adr/0001-auth-session-model.md).
- **Tenant scope**: single-level (Tenant only). See
  [ADR-0004](./docs/adr/0004-tenant-as-sole-scope.md).

---

## Coding Conventions

### Tech stack & versions

| Package | Version | Note |
|---|---|---|
| React | 19 | New JSX transform — no `import React` unless using `React.*` explicitly |
| MUI | **v9** | System props must go inside `sx` (see below) |
| Zod | **v4** | `invalid_type_error` removed from `z.number()` |
| TanStack Query | v5 | All server state |
| React Router | v6 | |
| Zustand | v5 | |
| React Hook Form + Zod | | Form state + validation |
| dayjs (+ utc plugin) | | All date handling |

### MUI v9 (violating these = TypeScript errors)

System props (`mb`, `fontWeight`, `flex`, …) cannot be direct props — put them in `sx`.

```tsx
// ❌ v5/v6                             // ✅ v9
<Typography fontWeight={700} mb={2}>    <Typography sx={{ fontWeight: 700, mb: 2 }}>
<Box flex={1} mt={2}>                   <Box sx={{ flex: 1, mt: 2 }}>
<Grid item xs={12} sm={6}>              <Grid size={{ xs: 12, sm: 6 }}>
<TextField inputProps={{ min: 0 }} />   <TextField slotProps={{ htmlInput: { min: 0 } }} />
<TextField InputProps={{ ... }} />      <TextField slotProps={{ input: { ... } }} />
<Menu PaperProps={{ ... }} />           <Menu slotProps={{ paper: { ... } }} />
```

### Colors

Import directly from `src/theme/colors.ts`; do **not** use `useTheme()` just to read a color.

```tsx
import { colors } from '@/theme/colors';
<Box sx={{ bgcolor: colors.brand[50], color: colors.base[900], borderColor: colors.border[200] }} />
```

Available keys: `brand`, `base`, `border`, `secondary`, `accent`, `woodTone`, `highlight`,
`error`. `useTheme()` is only for non-color values (e.g. `theme.breakpoints`).

### Dates & times — always UTC

Server data is UTC. Parse/compare/format with dayjs + the UTC plugin so display never drifts
with the browser timezone.

```ts
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

dayjs.utc('2026-01-01T00:00:00Z').format('DD MMM HH:mm'); // ✅ server-anchored
dayjs('2026-01-01T00:00:00Z').format('DD MMM HH:mm');     // ❌ drifts per timezone
```

Standard display formats: `DD MMM HH:mm` (date+time), `DD MMM YYYY` (date), `DD MMM` (short).
Plain `dayjs()` (no `.utc()`) is only for local UI concerns unrelated to server data.

### API & data-fetching pattern

- Every HTTP call goes through a `src/api/*.api.ts` module using the shared `apiClient`
  (`src/api/client.ts`). Nothing else imports axios.
- The dominant backend convention is **POST to `/{domain}/{action}`** (including reads and
  deletes) with a JSON body, returning a `BaseResponse<T>` envelope
  (`{ statusCode, success, result, message }`). See
  [ADR-0003](./docs/adr/0003-all-post-api-envelope.md).
- File uploads (products, templates) use `multipart/form-data` with an `onUploadProgress`
  callback for progress bars.
- Query keys: `[domain, tenantId, ...params]`. Gate tenant-scoped queries with
  `enabled: activeTenantId !== null`.
- Mutations call `queryClient.invalidateQueries` on success.
- Error messages: `extractErrorMessage(err)` from `src/api/client.ts`.

```ts
const { data, isLoading, isError, refetch } = useQuery({
  queryKey: ['products', activeTenantId, page, keyword],
  queryFn: () => productsApi.list({ tenantId: activeTenantId!, page, limit: 15, keyword }),
  enabled: activeTenantId !== null,
});
```

### Auth usage

- Read the user from `useAuthStore`; the access token is attached automatically by the request
  interceptor in `client.ts`.
- A `401` triggers `clearUser()` + an `auth:logout` window event; `App.tsx` clears the query
  cache and redirects to `/login`. Do not build a separate refresh/retry path.

### Testing

- Playwright (Chromium). Dev server must be running (`npm run dev`, port 5173).
- `tests/helpers/auth.ts` provides the `authedPage` fixture, `login()`, `collectErrors()`.
- New page → render + no-crash test. New form → validation test. New dialog → open/close/empty
  submit test.

---

## Known Inconsistencies (tech debt)

These are real deviations in the current code — documented so nobody mistakes them for the
intended pattern or "fixes" a deliberate one.

- **Legacy `accounts.api.ts`** uses REST verbs (`GET /accounts`, `PATCH`) and snake_case
  (`user_id`, `outlet_id`) — the old shape, inconsistent with the all-POST + camelCase norm.
  The current user-management path is `users.api.ts` (`/users/*`, though itself mixing
  POST/PUT/DELETE).
- **Envelope isn't universal**: most endpoints return `BaseResponse<T>`, but `dashboard.api`
  and some voucher create/update calls return bare payloads.
- **`outlet_manager` role and `outlet_id`** are vestigial — there is no Outlet entity; Tenant
  is the only scope.
- **Dead auth stubs**: `authApi.refresh()` / `authApi.logout()` and the commented
  `isBootstrapping` logic in `ProtectedRoute` are unused (no refresh flow — see ADR-0001).
- **Hardcoded Basic-auth header** on `/users/login` (`photobox:PhotoBox123@`) — a fixed API
  gateway credential baked into the client.
- **Snake_case leaks** in otherwise-camelCase code (e.g. `DashboardSummary.total_transactions`,
  template upload form fields `layout_id`/`tenant_id`).
