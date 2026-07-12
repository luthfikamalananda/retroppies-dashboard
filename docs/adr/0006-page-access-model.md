# Page access model: structural Superadmin-only vs permission-gated pages

**Status:** accepted

Page access is decided by one shared config ([`src/routes/accessConfig.ts`](../../src/routes/accessConfig.ts))
in three classes — **baseline** (every user), **operational** (franchise-grantable via a
`resource:read` permission), and **Superadmin-only** (gated on `isSuperadmin`, never grantable).
Both the route guard and the sidebar read from it, and [docs/access-matrix.md](../access-matrix.md)
mirrors it.

## Context

There are two account types: superadmins (cross-tenant) and franchise users (single tenant, access
driven by the permissions of a superadmin-assigned Role). We needed to say precisely which pages a
franchise role can ever reach. The account-governance pages (Tenant, User, Role, Permission) manage
tenants and the RBAC system itself; letting a franchise role be granted `users:read` or
`tenants:read` would let a tenant edit cross-tenant registries and the very roles that constrain it.

## Decision

- **Tenant / User / Role / Permission (and legacy Accounts) are Superadmin-only** — gated on the
  `isSuperadmin` flag, **not** on a permission. This is a deliberate departure from the
  otherwise-uniform `resource:read` gating, and it changes prior behavior where those pages were
  gated on `tenants:read` / `users:read` / `roles:read`. Those permission strings no longer govern
  franchise access to these pages.
- **Operational pages** (Products, Design Template, Timers, Vouchers, Sessions, Transactions) stay
  permission-gated so a superadmin can compose franchise roles freely.
- **Dashboard and Manage Account are baseline** — reachable by every authenticated user with no
  permission, so Dashboard is always a safe landing/redirect target.
- **One source of truth.** The sidebar (nav visibility) and the route guard (URL-typed navigation)
  both call `canAccessPath()` from `accessConfig`, so they can't drift.
- **Denied navigation** redirects to `/app/dashboard` and shows a warning snackbar rather than
  rendering a 403 page.

## Consequences

- Enforcement here is UX-only; the backend remains the security boundary (ADR-0002). A franchise
  user cannot be granted an admin page even by mistake, because the gate ignores permissions
  entirely for that class.
- If the business ever wants a trusted franchise role to manage its own staff (User/Role within its
  tenant), that page must move from the Superadmin-only class to permission-gated — a deliberate
  model change recorded by superseding this ADR, not an ad-hoc permission grant.
