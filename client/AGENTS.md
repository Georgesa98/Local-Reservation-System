# AGENTS.md

## Scope
This file applies to `client/` and all subdirectories unless a deeper `AGENTS.md` overrides it.

## Monorepo Rules
- Use `pnpm` and `turbo` only.
- Shared UI primitives belong in `client/packages/ui/`.
- App code should consume shared UI via `@workspace/ui/components/*`.
- Do not duplicate shadcn base components inside app folders.
- If a needed shadcn component is missing, add it in `client/packages/ui/` first, then consume it from apps.

## Styling and Theming
- App-specific visual behavior should be implemented through each app's `src/styles/theme.css`.
- Keep design tokens centralized; avoid scattered hardcoded values.

## Validation
- Run relevant commands for changed workspaces (lint, typecheck, and build as needed).
