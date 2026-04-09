# AGENTS.md

## Scope
This file applies to `client/apps/web/` and all subdirectories.

## Mandatory Frontend Standards
- UI components: MUST use shared shadcn components from `@workspace/ui/components/*`.
- Theme and styling: MUST follow `src/styles/theme.css` layered on top of `@workspace/ui/globals.css`.
- Do not hardcode design values outside tokenized and theme-driven styling.
- Data fetching, caching, and server state in client components: MUST use TanStack Query (`@tanstack/react-query`).
- Tables and data grids: MUST use TanStack Table (`@tanstack/react-table`).
- Forms: MUST use React Hook Form (`react-hook-form`) with Zod resolver (`@hookform/resolvers`).

## Next.js-Specific Rules
- Respect App Router server and client boundaries.
- Keep shared UI in `@workspace/ui`; keep app-level components focused on composition and feature logic.
- Preserve responsive behavior and RTL compatibility.

## Verification
- `pnpm --filter web lint`
- `pnpm --filter web typecheck`
