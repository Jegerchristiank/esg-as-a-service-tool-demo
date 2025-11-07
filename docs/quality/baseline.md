# Baseline – February 2025

## Installation
- `pnpm install --frozen-lockfile` succeeds without warnings. pnpm reports 34 packages processed (32 added, 18 removed) and finishes in ~2.2 s.

## Lint
- `pnpm -w run lint` passes across @org/tooling, @org/shared and @org/web. Next.js telemetry notice is the only output; Turbo reports all three tasks succeeding in ~5.4 s.

## Typecheck
- `pnpm -w run typecheck` succeeds in @org/tooling, @org/shared and @org/web via `tsc --noEmit`, completing in ~5.6 s.

## Tests
- `pnpm -w run test` succeeds. Vitest runs three assertions in `packages/shared`; @org/web and @org/tooling currently have no test files and exit early.

## Build
- `pnpm -w run build` succeeds. Next.js 14.2.5 reports first-load JavaScript of ~544 kB for `/review` and ~536 kB for `/wizard`, with 87.1 kB shared across routes.

## Notable Risks
- High initial JS payloads for the `/review` and `/wizard` routes (≥536 kB) risk slow client performance.
- Only the shared package currently has automated tests; other workspaces rely on `--passWithNoTests`, reducing coverage confidence.
- Turbo remote caching remains disabled, so CI runs do not reuse build artefacts yet.
