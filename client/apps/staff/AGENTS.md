# AGENTS.md

## Scope
This file applies to `client/apps/staff/` and all subdirectories.

## Mandatory Frontend Standards
- UI components: MUST use shared shadcn components from `@workspace/ui/components/*`.
- Theme and styling: MUST follow `src/styles/theme.css` and existing CSS variables.
- Do not hardcode one-off colors, radius, or shadows if an equivalent token exists or should exist in `src/styles/theme.css`.
- Data fetching, caching, and server state: MUST use TanStack Query (`@tanstack/react-query`).
- Tables and data grids: MUST use TanStack Table (`@tanstack/react-table`).
- Forms: MUST use React Hook Form (`react-hook-form`) with Zod resolver (`@hookform/resolvers`).

## Implementation Notes
- Keep query keys consistent and invalidate or update cache intentionally after mutations.
- Keep form schemas and validation explicit and type-safe.
- Preserve i18n and RTL behavior and direction-aware UI patterns.

## Verification
- `pnpm --filter staff lint`
- `pnpm --filter staff typecheck`
