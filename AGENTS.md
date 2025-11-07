# AGENTS.md – Simplificeret Next.js monorepo

> **Scope:** Hele repositoriet.
> **Forrang:** System- og brugerinstruktioner har højeste prioritet. Denne fil beskriver den nuværende, lette struktur.

## Struktur
- `apps/web` er den eneste workspace. Den indeholder en Next.js 14-app med en enkelt landing page.
  - `app/` rummer `layout.tsx`, `page.tsx`, `globals.css` og `icon.svg`. Ingen øvrige routes er i brug.
  - `package.json` har kun Next.js- og TypeScript-afhængigheder. `test`-scriptet er en stub.
- Rodmappen indeholder kun fælles konfiguration (`package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `prettier.config.cjs`).
- Der findes ingen delte pakker, backend eller ekstra tooling længere; alt ubenyttet kode er fjernet.

## Arbejdsgange
- Brug `pnpm --filter web <kommando>` til at køre scripts for appen (rodens `dev`, `build`, `lint`, `typecheck`, `test`).
- Der er ingen automatiske tests endnu. Hvis du tilføjer tests, så opdater `apps/web/package.json` og dokumentér dem her.
- Kør `pnpm install` før udvikling for at sikre opdaterede afhængigheder.

## Kvalitet og stil
- Linting sker via `next lint` og følger `next/core-web-vitals`-regler.
- TypeScript kører med `strict` og `moduleResolution: bundler`. Undgå `any`, hold komponenter små og fokuser på faktisk UI-output.
- Prettier-formattering følger reglerne i `prettier.config.cjs` (ingen semikolonner, enkelt anførselstegn, `printWidth` 100).

## Dokumentation
- Opdater denne fil, README og CHANGELOG når strukturen ændres, så fremtidige agenter hurtigt kan forstå opsætningen.
