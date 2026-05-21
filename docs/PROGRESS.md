# Progress Tracker

## Status Legend

- `[ ]` not started
- `[-]` in progress
- `[x]` completed
- `[!]` blocked

## Current Decisions

- [x] Frontend/backend stack: Next.js + TypeScript
- [x] Package manager: pnpm
- [x] Storage target: S3-compatible
- [x] Initial compatibility target: MinIO and Nutanix
- [x] Auth approach: direct credential login
- [x] Session storage: encrypted cookie session
- [x] Upload/download mechanism: presigned URLs
- [x] Initial scope: internal tool, local development first

## Overall Status

- [x] Phase 0 - Planning And Repo Setup
- [x] Phase 1 - Application Skeleton
- [x] Phase 2 - Auth And Session
- [x] Phase 3 - S3 Client Abstraction
- [x] Phase 4 - Bucket And Object Browsing
- [x] Phase 5 - Upload And Download
- [x] Phase 6 - Folder Creation, Delete, Metadata
- [x] Phase 7 - Hardening And DX

## Phase 0 - Planning And Repo Setup

- [x] Confirm product scope
- [x] Confirm technical stack
- [x] Confirm auth/session approach
- [x] Create `AGENTS.md`
- [x] Create this progress tracker
- [x] Create initial `README.md`
- [x] Bootstrap Next.js project with pnpm

Notes:

- Repo started empty.
- Implementation should proceed phase by phase, not all at once.

## Phase 1 - Application Skeleton

Goal: create a running Next.js foundation without S3 logic yet.

- [x] Initialize Next.js with TypeScript and pnpm
- [x] Configure linting and basic scripts
- [x] Create base app layout
- [x] Create initial route structure
- [x] Add placeholder login page
- [x] Add placeholder browser page
- [x] Add shared config and env example

Exit criteria:

- app runs locally
- project structure is ready for auth and S3 integration

## Phase 2 - Auth And Session

Goal: user can log in with S3-compatible credentials and establish an encrypted session.

- [x] Define connection payload schema
- [x] Build login form
- [x] Validate endpoint, region, and addressing style inputs
- [x] Implement encrypted cookie session utilities
- [x] Implement login route/action
- [x] Validate credentials with a lightweight S3 call
- [x] Implement logout flow
- [x] Protect browser routes when session is absent

Exit criteria:

- valid credentials create a session
- invalid credentials return clear errors
- no database is introduced

## Phase 3 - S3 Client Abstraction

Goal: centralize S3-compatible access logic.

- [x] Create S3 client factory from session credentials
- [x] Support HTTP/HTTPS endpoints
- [x] Support localhost, IP, and internal hostnames
- [x] Support virtual-hosted style
- [x] Support path-style addressing
- [x] Add key/prefix normalization helpers
- [x] Add error mapping for common S3 failures

Exit criteria:

- app can build a correct S3 client from session state
- MinIO/Nutanix compatibility settings are explicit

## Phase 4 - Bucket And Object Browsing

Goal: browse buckets and navigate object hierarchies.

- [x] Implement list buckets endpoint
- [x] Implement list objects by bucket/prefix endpoint
- [x] Support folder-style browsing via prefix and delimiter
- [x] Build bucket selector UI
- [x] Build breadcrumb navigation UI
- [x] Build object/folder list UI
- [x] Add loading and empty states

Exit criteria:

- user can select a bucket and navigate folders/objects

## Phase 5 - Upload And Download

Goal: transfer files using presigned URLs.

- [x] Implement presigned upload endpoint
- [x] Implement frontend upload flow
- [x] Show upload progress and result state
- [x] Refresh listing after upload
- [x] Implement presigned download endpoint
- [x] Implement frontend download action

Exit criteria:

- upload and download work without proxying file data through the app server

## Phase 6 - Folder Creation, Delete, Metadata

Goal: complete the agreed MVP operations.

- [x] Implement create-folder endpoint
- [x] Implement create-folder UI
- [x] Implement delete object endpoint
- [x] Implement delete folder flow
- [x] Add selection UX for delete actions
- [x] Implement metadata endpoint
- [x] Build metadata preview panel/modal

Exit criteria:

- all MVP object-management actions are available

## Phase 7 - Hardening And DX

Goal: make the MVP usable and maintainable.

- [x] Improve error messages
- [x] Prevent secret leakage in logs
- [x] Add basic unit tests for helpers
- [x] Add smoke coverage for critical routes if practical
- [x] Document local setup in `README.md`
- [x] Review UI states for empty/loading/error cases

Exit criteria:

- local setup is documented
- key flows have at least minimal verification

## Change Log

### 2026-05-21

- Created `AGENTS.md`
- Created `docs/PROGRESS.md`
- Locked key architecture decisions before scaffolding
- Bootstrapped Next.js project with pnpm
- Replaced template `README.md` with project-specific setup notes
- Added Phase 1 route skeleton for `/login` and `/browser`
- Added shared app config and `.env.example`
- Added encrypted cookie session flow and S3-compatible login validation
- Protected `/browser` and added sign-out flow
- Removed remote font dependency so local builds do not need external font fetches
- Added reusable S3 client abstraction, endpoint summaries, and object key normalization helpers
- Unified session validation around shared connection schema and typed S3 error mapping
- Added live bucket and object browsing with `/api/buckets` and `/api/objects`
- Replaced browser placeholder data with real S3 listing, breadcrumb navigation, and empty/error states
- Added presigned upload and download endpoints
- Added browser-side upload progress, listing refresh after upload, and direct download actions
- Added create-folder, delete-entry, and metadata endpoints
- Added client-side selection, delete flow, folder creation, and metadata preview in the browser workspace
- Added sanitized user-facing error handling to reduce secret leakage risk
- Added Vitest-based helper tests and route smoke coverage
- Expanded README with setup, commands, verification status, and runtime notes

## Update Template

Use this format when updating progress:

```md
### YYYY-MM-DD

- Completed:
- Notes:
- Blockers:
- Next:
```
