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
- Never log secrets

## Delivery Rules

- Work in small phases
- Do not implement the whole app in one pass
- Update the progress tracker after each completed phase
- Keep MVP scope tight unless the user expands it
- Prefer simple, readable architecture over premature abstraction

## Suggested Initial Structure

- `app/` for Next.js routes and UI
- `components/` for reusable UI pieces
- `lib/` for session, S3 client factory, validation, and helpers
- `docs/` for planning and progress tracking

## Definition of Done Per Phase

A phase is complete only when:

- code for that phase is implemented
- local behavior is manually verified or limitations are documented
- the progress tracker is updated
- important assumptions or blockers are written down

## Documentation Discipline

When making progress:

- update status markers in the progress tracker
- add brief notes on what changed
- record blockers instead of leaving implicit gaps

