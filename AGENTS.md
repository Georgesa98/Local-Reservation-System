# AGENTS.md

## Scope

This file applies to the entire repository unless a deeper `AGENTS.md` overrides it.

## Project Map

- `backend/`: Django + DRF API
- `client/`: pnpm/turbo monorepo
    - `client/apps/staff/`: Electron + React app
    - `client/apps/web/`: Next.js guest portal
    - `client/packages/ui/`: shared shadcn/ui components

## Global Engineering Rules

- Follow existing architecture and naming conventions before introducing new patterns.
- Keep changes scoped to the requested task; avoid unrelated refactors.
- Never commit secrets, credentials, or `.env` files.
- Update tests and docs when behavior, API contracts, or workflows change.
- Prefer shared abstractions when the same logic appears in multiple places.
