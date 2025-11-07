# ADR 0001: Introduce shared configuration packages

- Status: Accepted
- Date: 2025-02-XX

## Context
Linting, formatting and TypeScript settings diverged between applications and packages. Each workspace defined toolchains independently, leading to duplicated effort and drift (for example, multiple tsconfig variants and ad-hoc ESLint setups).

## Decision
Create internal configuration packages under `packages/config/*`:

- `@org/tsconfig` – exports the current base compiler settings.
- `@org/eslint-config` – provides a base TypeScript preset and a Next.js variant.
- `@org/prettier-config` – supplies a repository-wide formatting profile.
- `@org/jest-config` – placeholder for unified test configuration once Jest is required.

Packages and the Next.js app now extend these shared configs. Root tooling (Prettier) consumes the same source of truth.

## Consequences
- Centralised defaults enable consistent upgrades and future strictness changes.
- Individual packages can still layer additional options locally.
- Further work will align lint/typecheck pipelines with the new presets and tighten rules.
