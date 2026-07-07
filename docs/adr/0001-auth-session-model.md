# Auth session: sessionStorage token, no refresh, 401 = logout

**Status:** accepted

The access token is persisted in `sessionStorage` (via Zustand `persist`), there is **no
refresh-token flow**, and a `401` from the API clears the token and redirects to `/login`.

## Context

The backend does not provide a working refresh endpoint. We needed the session to survive a
tab reload (a full page refresh mid-work should not kick the user out), but we also wanted to
avoid `localStorage` (readable cross-tab, longer-lived, larger XSS blast radius).

## Decision

- Store the logged-in user + token in `sessionStorage`: survives reload, dies on tab close,
  and is not shared across tabs.
- No `/auth/refresh` bootstrap and no single-flight-refresh-then-retry on `401`. On `401` the
  request interceptor calls `clearUser()` and dispatches an `auth:logout` event; `App.tsx`
  clears the TanStack Query cache and navigates to `/login`.
- Session lifetime = token TTL or tab close, whichever comes first; then the user re-logs in.

This deliberately contradicts the original PRD ("in-memory only, refresh cookie, silent
retry"). That design assumed backend support that does not exist.

## Consequences

- `authApi.refresh()` / `authApi.logout()` and the commented-out `isBootstrapping` path in
  `ProtectedRoute` are **dead code** — safe to remove; do not wire them up expecting a refresh
  flow.
- A token sitting in `sessionStorage` is reachable by any XSS on the origin. This is an accepted
  trade-off for reload-survival given no refresh backend; revisit if/when the backend adds
  httpOnly refresh cookies (that would flip this back toward the PRD's in-memory design).
