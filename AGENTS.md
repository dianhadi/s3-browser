# AGENTS.md

## Project Overview

This repository will contain an internal S3 browser built with fullstack TypeScript using Next.js.

Current agreed scope:

- Framework: Next.js with TypeScript
- Package manager: pnpm
- Storage target: S3-compatible services
- Known targets: MinIO and Nutanix
- Authentication model: direct login using S3-compatible credentials
- Session model: encrypted cookie session
- Deployment: not in scope for now

## Product Goals

The app should allow an internal user to:

- log in by providing S3-compatible connection details
- browse buckets
- browse folders and objects
- upload files via presigned URL
- download files via presigned URL
- create folders
- delete files or folders
- preview object metadata

## Non-Goals For Now

- no database
- no app-level user management
- no multi-tenant persistence
- no deployment automation
- no background jobs

## Connection Requirements

The login form must support:

- custom endpoint input
- localhost endpoints
- LAN/internal hostnames and IP addresses
- HTTP or HTTPS endpoints
- virtual-hosted style
- path-style addressing

Minimum connection fields:

- endpoint
- region
- accessKeyId
- secretAccessKey
- addressing style

## Technical Direction

- Use Next.js App Router
- Use route handlers for backend endpoints
- Use AWS SDK v3 for S3-compatible access
- Generate presigned upload and download URLs server-side
- Store connection credentials only in encrypted HTTP-only cookies
- Encrypt session payloads with `jose`
- Never log secrets

## Implemented Baseline

The repository currently includes:

- login with direct S3-compatible credentials
- encrypted cookie session using `SESSION_SECRET`
- route protection for `/browser`
- shared connection validation and endpoint parsing
- reusable S3 client abstraction in `src/lib/s3.ts`
- live bucket listing
- live object and folder listing using `prefix` and `delimiter`
- breadcrumb-based folder navigation
- JSON route handlers for bucket and object listing

Current progress baseline:

- Phase 0 completed
- Phase 1 completed
- Phase 2 completed
- Phase 3 completed
- Phase 4 completed
- Phase 5 not started
- Phase 6 not started
- Phase 7 not started

## Delivery Rules

- Work in small phases
- Do not implement the whole app in one pass
- Update the progress tracker after each completed phase
- Keep MVP scope tight unless the user expands it
- Prefer simple, readable architecture over premature abstraction

## Current Repository Structure

- `src/app/` for Next.js routes, pages, server actions, and route handlers
- `src/app/api/` for JSON endpoints
- `src/lib/` for session, connection schema, S3 abstraction, validation, and helpers
- `docs/` for planning and progress tracking

## S3 Integration Rules

- Reuse `src/lib/connection.ts` for connection schema validation and endpoint parsing
- Reuse `src/lib/s3.ts` for S3 client creation, listing helpers, normalization, and error mapping
- Reuse `src/lib/session.ts` for session reads and writes
- Do not create ad-hoc S3 clients inside pages or route handlers when `src/lib/s3.ts` can be extended instead
- Normalize bucket names, object keys, folder keys, and prefixes before using them in S3 operations
- Preserve support for:
  - HTTP and HTTPS endpoints
  - localhost endpoints
  - LAN/internal hostnames and IP addresses
  - path-style addressing
  - virtual-hosted addressing
- Keep folder browsing aligned with S3 semantics by using `prefix` and `delimiter`
- Map S3 and network failures to user-facing errors without exposing secrets

## Environment Requirements

Required environment variables:

- `SESSION_SECRET`

Optional environment variables:

- `NEXT_PUBLIC_APP_NAME`
- `SESSION_COOKIE_NAME`
- `SESSION_DURATION_HOURS`

## Definition of Done Per Phase

A phase is complete only when:

- code for that phase is implemented
- local behavior is manually verified or limitations are documented
- `pnpm lint` passes
- `pnpm build` passes
- the progress tracker is updated
- important assumptions or blockers are written down

If a phase depends on live S3 behavior and no real MinIO or Nutanix endpoint is available during implementation, record that limitation explicitly.

## Documentation Discipline

When making progress:

- update status markers in the progress tracker
- add brief notes on what changed
- record blockers instead of leaving implicit gaps
- keep `AGENTS.md` aligned with the actual repository structure and implemented baseline
