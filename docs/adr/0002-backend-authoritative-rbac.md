# Backend-authoritative RBAC; frontend permissions are UX-only

**Status:** accepted

Access control and tenant isolation are enforced entirely by the backend. The frontend's
permission checks exist only to shape the UI (hide menus and action buttons), never as a
security boundary.

## Context

This is a multi-tenant system where a data leak across tenants is the primary risk. A frontend
can always be bypassed, so treating client-side checks as security would be false comfort.

## Decision

- The backend returns the current user's `permissions: string[]` (in `resource:action` form)
  inside the login response, and independently enforces every request.
- The frontend gates UI via `usePermissions().can(...)` for UX only: exact match
  (`products:create`), resource match (`products`), wildcard (`*`), and a superadmin bypass.
- The frontend never decides authorization on its own and never assumes a hidden button means
  a protected backend.

## Consequences

- New permissions are defined by the backend; the frontend just consumes strings. Keep the
  `resource:action` naming aligned with backend contracts.
- It is acceptable (and expected) for the backend to reject an action the UI appeared to allow;
  handle those errors gracefully rather than treating the UI gate as authoritative.
