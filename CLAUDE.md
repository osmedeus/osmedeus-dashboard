# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Osmedeus Dashboard - A UI dashboard for the Osmedeus Workflow Engine built with Next.js App Router, Tailwind CSS v4, and Shadcn UI (new-york style).

## Commands

```bash
bun install          # Install dependencies
bun dev              # Start dev server with Turbopack (http://localhost:3000)
bun run build        # Production build
bun run lint         # Run ESLint
bunx shadcn@latest add <component>  # Add Shadcn components
```

## Architecture

### Route Structure (App Router)
- `app/(auth)/` - Public routes (login page)
- `app/(dashboard)/` - Protected routes requiring authentication
  - `/` - Dashboard home with stats
  - `/scans`, `/scans/new` - Scan management
  - `/settings` - User settings
  - `/assets`, `/assets/workspaces/[id]` - Asset workspaces and HTTP assets
  - `/workflows/[id]` - Workflow editor

### Authentication
Mock auth via `providers/auth-provider.tsx` using localStorage (`osmedeus_session` key). Default credentials: any username with 4+ character password. The `AuthProvider` handles redirect logic between public/protected routes.

### API Layer
All API calls go through `lib/api/` which currently uses mock data from `lib/mock/data/`. To integrate real APIs:
1. Update `NEXT_PUBLIC_API_URL` env var
2. Replace mock implementations in `lib/api/*.ts`
3. The `PaginatedResponse<T>` type in `lib/types/api.ts` defines the pagination contract

### Workflow Editor
The workflow editor at `/workflows/[id]` visualizes YAML workflows using React Flow (@xyflow/react):
- `components/workflow-editor/utils/yaml-parser.ts` - Converts YAML to React Flow nodes/edges
- `components/workflow-editor/utils/layout-engine.ts` - Dagre-based auto-layout
- `components/workflow-editor/nodes/` - Custom node types: bash, parallel, function, foreach, start, end
- Workflow types defined in `lib/types/workflow.ts`

### Component Organization
- `components/ui/` - Shadcn primitives (do not edit directly, use `bunx shadcn@latest add`)
- `components/layout/` - App shell (sidebar, topbar, mobile nav)
- `components/shared/` - Reusable components (EmptyState, ErrorState, LoadingSkeleton)
- Feature components in `components/scans/`, `components/assets/`, `components/dashboard/`

### Theming
Tailwind CSS v4 with CSS variables defined in `app/globals.css`. Theme switching via `next-themes` in `providers/theme-provider.tsx`. Reference `color-scheme.css` for the full color palette.

## Key Files

| File | Purpose |
|------|---------|
| `app/globals.css` | Tailwind v4 config + CSS variables |
| `components.json` | Shadcn configuration |
| `lib/types/` | TypeScript types for domain models |
| `lib/api/client.ts` | API base config (mock delay, headers) |
| `example-workflow.yaml` | Reference YAML workflow structure |
