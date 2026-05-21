# S3 Browser

Internal S3-compatible browser built with fullstack TypeScript using Next.js.

Current targets:

- MinIO
- Nutanix

Current architecture decisions:

- Next.js App Router
- pnpm
- direct credential login
- encrypted cookie session
- presigned URL upload and download
- no database

## Current Status

The repository is in early setup.

Completed so far:

- initial project planning
- project rules in `AGENTS.md`
- phased progress tracker in `docs/PROGRESS.md`
- Next.js bootstrap with pnpm

## Planned MVP

- list buckets
- browse folders and objects
- upload files
- download files
- create folders
- delete files or folders
- preview object metadata

## Local Development

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Open `http://localhost:3000`.

Environment variables:

```bash
cp .env.example .env.local
```

Set `SESSION_SECRET` to a long random string before using the login flow.

## Documentation

- Project rules: `AGENTS.md`
- Progress tracker: `docs/PROGRESS.md`

## Notes

- Deployment is intentionally out of scope for now.
- Authentication is based on S3-compatible credentials supplied at login time.
- Credentials should only live in encrypted session cookies once implemented.
