# ADR 0002: Enforce shared quality gates

- Status: Accepted
- Date: 2025-02-XX

## Context

Linting, type-checking, tests og build kørte kun vejledende i CI. Jobs var markeret med `continue-on-error`, og reglerne i den delte ESLint-konfiguration fangede ikke ubrugte imports eller inkonsistente importsorteringer. TypeScript-basen manglede flere strict-flag, hvilket kunne skjule fejl ved optional properties og indeksopslag.

## Decision

- Skærp `@org/tsconfig` med `moduleDetection`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noUncheckedIndexedAccess` og beslægtede strict-flags.
- Udvid `@org/eslint-config` til at håndhæve konsistente type-imports, importorden og automatisk fjerne ubrugte imports via `eslint-plugin-import` og `eslint-plugin-unused-imports`.
- Tilføj `format`-scripts og dokumentér lokale kvalitetskontroller i README.
- Omstrukturér CI-workflowet til et matrix-job uden `continue-on-error`, så lint, typecheck, test og build blokerer pull requests.

## Consequences

- Udviklere får tidlige signaler når imports er overflødige, eller når indeksopslag kan returnere `undefined`.
- CI-fejl er nu blokkerende, hvilket øger tilliden til main-branchens kvalitet.
- Nye lint-regler kan kræve små kodeoprydninger når moduler redigeres; standarden er nu dokumenteret og konsistent i hele monorepoet.
