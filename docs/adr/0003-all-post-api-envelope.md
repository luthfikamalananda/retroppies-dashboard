# All-POST API calls with a BaseResponse envelope

**Status:** accepted

The dominant backend convention is to expose every operation — including reads and deletes —
as `POST /{domain}/{action}` (e.g. `/products/get`, `/products/delete`, `/rules/update`), with
parameters in a JSON body and a uniform `BaseResponse<T>` envelope in the response.

## Context

The Go backend standardized on action-style POST endpoints and a consistent response wrapper
(`{ statusCode, success, responseDatetime, result, message }`) rather than REST verb/resource
semantics. The frontend mirrors whatever the backend exposes.

## Decision

- `src/api/*.api.ts` modules call `POST /{domain}/{action}` and unwrap `BaseResponse<T>`.
- A reader who expects `GET`/`DELETE` should not "fix" these to REST verbs — POST is the
  contract, not an oversight.

## Consequences

- Uniform error/success handling via the envelope's `message`/`success` fields
  (`extractErrorMessage` reads `message`).
- The convention is not perfectly consistent yet: a few legacy/edge endpoints use REST verbs
  or return bare payloads (`accounts.api` GET/PATCH, `transactions.getById` GET, `users.api`
  PUT/DELETE, `dashboard.api` un-enveloped). Treat all-POST + `BaseResponse` as the target;
  see _Known Inconsistencies_ in [CONTEXT.md](../../CONTEXT.md).
