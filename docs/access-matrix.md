# Page Access Matrix

Which pages each kind of account may reach. This is the human-readable mirror of
[`src/routes/accessConfig.ts`](../src/routes/accessConfig.ts) — when you change one, change the
other. The model behind it is recorded in [ADR-0006](./adr/0006-page-access-model.md); the
reasons enforcement is UX-only (not security) are in
[ADR-0002](./adr/0002-backend-authoritative-rbac.md).

## Account types

There are **two** account types, distinguished by the `isSuperadmin` flag:

- **Superadmin** (`isSuperadmin: true`) — a cross-tenant account. Reaches **every** page and gets
  the `TenantSelector` to choose the active tenant. `usePermissions().can()` returns `true` for
  everything, so no permission gates apply.
- **Franchise user** (`isSuperadmin: false`) — fixed to their own tenant. There is **no fixed list
  of franchise subtypes**: a franchise user's reach is exactly the **baseline pages** plus whatever
  **operational pages** are unlocked by the permissions on the `Role` the superadmin assigned. Two
  franchise users differ only by the permissions of their roles.

## Access classes

Every page falls into one of three classes:

| Class | Meaning | Gate |
|---|---|---|
| **Baseline** | Every authenticated user, no permission needed | none |
| **Operational** | Franchise-grantable per page via a role permission | a `resource:read` permission |
| **Superadmin-only** | Cross-tenant / account governance; **never** grantable to a franchise role | `isSuperadmin` |

## The matrix

| Page | Route | Class | Gate | Superadmin | Franchise user |
|---|---|---|---|:---:|:---:|
| Summary / Dashboard | `/app/dashboard` | Baseline | — | ✅ | ✅ (always) |
| Manage Account | `/app/manage-account` | Baseline | — | ✅ | ✅ (always) |
| Product | `/app/products` | Operational | `products:read` | ✅ | ✅ if granted |
| Design Template | `/app/layouts` | Operational | `templates:read` | ✅ | ✅ if granted |
| — Templates (child) | `/app/layouts/:layoutId/templates` | Operational | inherits `templates:read` | ✅ | ✅ if granted |
| Time | `/app/timers` | Operational | `rules:read` | ✅ | ✅ if granted |
| Voucher | `/app/vouchers` | Operational | `vouchers:read` | ✅ | ✅ if granted |
| Session | `/app/sessions` | Operational | `sessions:read` | ✅ | ✅ if granted |
| Report Transaction | `/app/transactions` | Operational | `transactions:read` | ✅ | ✅ if granted |
| Tenant | `/app/tenants` | Superadmin-only | `isSuperadmin` | ✅ | ❌ never |
| User | `/app/users` | Superadmin-only | `isSuperadmin` | ✅ | ❌ never |
| Role | `/app/roles` | Superadmin-only | `isSuperadmin` | ✅ | ❌ never |
| — Role Permissions (child) | `/app/roles/:id/permissions` | Superadmin-only | inherits `isSuperadmin` | ✅ | ❌ never |
| Permission | `/app/permissions` | Superadmin-only | `isSuperadmin` | ✅ (hidden from nav) | ❌ never |
| Accounts (legacy) | `/app/accounts` | Superadmin-only | `isSuperadmin` | ✅ (hidden from nav) | ❌ never |

Notes:

- **Child routes inherit their parent's rule** via longest-prefix matching in `accessConfig`, so
  Templates follows Design Template and Role Permissions follows Role.
- **Permission** and **Accounts** are reachable by superadmins but intentionally **not shown in the
  sidebar**. Accounts is a legacy page (see _Known Inconsistencies_ in `CONTEXT.md`).

## How it's enforced

1. **Route guard** (`AccessGuard` in [`AppRoutes.tsx`](../src/routes/AppRoutes.tsx)) — on every
   navigation it calls `canAccessPath(pathname)`. If the user can't access the page it redirects to
   `/app/dashboard` and fires a snackbar: _"You don't have access to that page."_ This stops
   URL-typing past the hidden sidebar item.
2. **Sidebar** ([`Sidebar.tsx`](../src/components/layout/Sidebar.tsx)) — filters its nav items with
   the same `canAccessPath`, so users never see links they can't use.
3. **Backend** — the real security boundary. Both of the above are UX-only; the API independently
   rejects any request the user isn't authorized for (ADR-0002).

> **Change from earlier behavior:** Tenant / User / Role were previously gated on
> `tenants:read` / `users:read` / `roles:read` permissions. They are now **Superadmin-only**, so
> those permission strings no longer affect what a franchise user can reach.
