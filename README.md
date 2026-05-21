# S3 Browser

S3-compatible browser built with fullstack TypeScript using Next.js.

Supported targets:

- MinIO
- Nutanix
- other S3-compatible endpoints that work with custom endpoint URLs

## Current Scope

Implemented:

- direct credential login
- encrypted cookie session
- bucket browsing
- folder and object browsing
- upload via presigned PUT URL
- download via presigned GET URL
- create folder
- delete object or folder
- metadata preview

Not in scope:

- database persistence
- deployment automation
- application-level user management

## Tech Stack

- Next.js App Router
- TypeScript
- pnpm
- AWS SDK v3
- `jose` for encrypted session payloads
- `vitest` for automated helper and route smoke tests

## Local Setup

Install dependencies:

```bash
pnpm install
```

Create local environment config:

```bash
cp .env.example .env.local
```

Required:

- `SESSION_SECRET`
  Use a long random string before testing the login flow.

Optional:

- `NEXT_PUBLIC_APP_NAME`
- `SESSION_COOKIE_NAME`
- `SESSION_DURATION_HOURS`

Start the development server:

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Available Commands

```bash
pnpm dev
pnpm lint
pnpm test
pnpm build
```

## Usage Notes

- Login is based on S3-compatible credentials supplied at runtime.
- Credentials are stored only in an encrypted HTTP-only cookie session.
- The login form supports custom `http://` and `https://` endpoints, including localhost, IP addresses, and internal hostnames.
- Bucket and folder browsing use S3 `prefix` and `delimiter` semantics.
- Uploads and downloads do not proxy file bodies through the Next.js server.

## Verification Status

Verified locally in this repository:

- `pnpm lint`
- `pnpm test`
- `pnpm build`

Not yet verified in this repository session:

- live end-to-end behavior against a real MinIO endpoint
- live end-to-end behavior against a real Nutanix endpoint

## Documentation

- Project rules: `AGENTS.md`
- Progress tracker: `docs/PROGRESS.md`
