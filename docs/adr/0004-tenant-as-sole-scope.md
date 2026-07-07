# Tenant is the only scope; scope lives in the auth store

**Status:** accepted

Data is scoped to a single level — the **Tenant** — and the "active tenant" is stored on the
logged-in user in `authStore` rather than in a separate scope store. Two sentinel values
carry meaning: `tenantId = -99` marks a superadmin, `tenantId = 0` means ALL/unscoped.

## Context

The PRD imagined a two-level scope (Tenant → Outlet/Cafe) and a dedicated `scopeStore`. In
practice the business treats a tenant *as* the outlet, so a second level was never built, and
a separate scope store added indirection with no payoff.

## Decision

- **Tenant only.** No Outlet entity or outlet-level scoping. `outlet_manager` / `outlet_id`
  remain as vestigial backend fields.
- **Scope lives in `authStore`** as `user.tenantId`, mutated via `setScope()`:
  - Normal user: fixed to their own tenant (set at login).
  - Superadmin (`isSuperadmin`, sentinel `-99`): picks the active tenant via the Tenant
    Selector, which writes `user.tenantId`; `clearScope()` resets to `0` (ALL).
- Pages read the active tenant from `authStore` and pass it as `tenantId` into API calls and
  query keys, gating with `enabled: activeTenantId !== null`.

## Consequences

- The magic numbers `-99` (superadmin) and `0` (ALL) are load-bearing; keep them in sync with
  the backend contract.
- Because scope is folded into the user object, mutating `tenantId` re-renders permission and
  data hooks that subscribe to `authStore` — intended, but be aware changing the user shape
  affects scope behavior. A future `scopeStore` split would be the reversal path if the
  coupling becomes painful.
