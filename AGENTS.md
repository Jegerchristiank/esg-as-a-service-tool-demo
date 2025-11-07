# AGENTS.md – Global instruktion for EAAS-Typescript

> **Scope:** Denne fil gælder for hele monorepoet. Hvis du opretter mapper med særlige regler, skal du lægge en ny `AGENTS.md` dér og referere til dette dokument.
> **Forrang:** Følg altid system-/brugerinstruktioner først, derefter den mest specifikke `AGENTS.md`.
> **Meta-krav:** Når du opdager nye faldgruber eller ændrer arbejdsgange, skal du opdatere denne fil (og evt. en mere specifik). Brug _Erfaringslog_-sektionen til at logge læringer og kendte issues.

## 1. Hurtigt overblik
- Monorepo med pnpm + Turbo. Workspaces ligger i `apps/*`, `packages/*`, `docs/*` og `tooling/*`.
- `apps/web` er Next.js-frontend med wizard UI, PDF-preview og designsystem.
- `packages/shared` indeholder domænelogik, schemaer, typer og PDF-komponenter. **Ingen Next.js imports her.**
- `packages/tooling` og `tooling/` rummer scripts og generators til schema/formler.
- Al IO foregår klient-side eller i isolerede route handlers. Server-state undgås.

## 2. Før-du-starter tjekliste
1. Læs `README.md`, `CHANGELOG.md`, `docs/` og relevante `AGENTS.md`-filer.
2. Kør `rg --files -g 'AGENTS.md'` for at opdage nested instruktioner.
3. Bekræft at `pnpm install` er kørt (brug workspaces-filtrering ved nye apps/packages).
4. Notér hvilke tests og scripts der skal køres før commit (se sektion 5).
5. Hvis opgaven berører UI, planlæg et Playwright/screenshot-scope.

## 3. Dev-environment og tooling
- Navigér mellem workspaces med `pnpm dlx turbo run where <workspace>`.
- Tilføj et workspace til et eksisterende install: `pnpm install --filter <workspace>`.
- Opret nye React+TS apps via `pnpm create vite@latest <navn> -- --template react-ts` hvis Next.js ikke er påkrævet.
- Start `apps/web` lokalt: `pnpm --filter @org/web dev --hostname 0.0.0.0 --port 3000` (bemærk `--` før flag).
- Generér schema/formel-map: `pnpm --filter @org/tooling run schema:generate`.
- Brug `turbo.json` som sandhed for pipelines; opdater når nye scripts tilføjes.

## 4. Arbejdsgange for nye features og bugs
1. Afklar domæneændring i `docs/modules` og eksisterende tests.
2. Udvikl businesslogik i `packages/shared/*`. Udvid `runModule` og tilføj fixtures/tests.
3. Synkroniser schemaændringer til UI (`apps/web`) via Zod-former og wizard-state (`useWizard.ts`). Brug bracket notation til modulnøgler (`state['B7']`).
4. Opdater designsystemet i `apps/web/styles/design-system.css` og genbrug `PrimaryButton`-varianter.
5. Tilføj Playwright-scenarier eller komponenttests for UI-ændringer.
6. Opdater `CHANGELOG.md`, `docs/` og evt. README.
7. Tag screenshot af relevante UI-ændringer.

## 5. Tests, kvalitet og CI
- **Standard pipeline (kør inden commit):** `pnpm -w run lint && pnpm -w run typecheck && pnpm -w run test && pnpm -w run build`.
- For targeted checks:
  - `pnpm turbo run lint --filter <workspace>`
  - `pnpm turbo run typecheck --filter <workspace>`
  - `pnpm turbo run test --filter <workspace>` eller `pnpm vitest run -t "<test name>"`
  - `pnpm --filter @org/web build`
- Krav:
  - Ingen lint-fejl, ingen TypeScript-`any`, ingen build warnings.
  - PDF-tests skal hashe buffer-output for determinisme.
  - Efter filflyt/ændringer skal ESLint og TS køres for at sikre korrekte imports.
  - Nye features kræver tests (unit + integration/fixtures).

## 6. Kodestandard og arkitekturprincipper
- Prioritér deterministiske løsninger fremfor “smarte” one-liners.
- Scope 2-moduler: modeller nettoprofilen (indkøbt energi – genindvinding/frikilder – certificeret VE-andel). Output i ton CO2e.
- UI skal håndtere negative tal og forklare brugeren hvorfor.
- Next.js SSR + `@react-pdf/renderer`: brug `dynamic` import eller isoleret route handler for at undgå SSR-konflikter.
- TypeScript kører med `exactOptionalPropertyTypes`; undgå `undefined` på optionelle felter medmindre typerne udvides.
- Ved Set-brug i tests: initialisér som `new Set<string>()` for korrekt inferens.

## 7. Dokumentation og vidensdeling
- Opdater `CHANGELOG.md` for alle ikke-trivielle ændringer.
- Skriv/udvid guides i `docs/` ved domæneændringer.
- Brug _Erfaringslog_-sektionen til at fastholde reviewer-feedback, flaky tests og workarounds.
- Dokumentér delvist arbejde og TODOs i PR-beskrivelser + denne fil hvis relevant for fremtidige agenter.

## 8. PR- og commit-proces
- Commit tidligt og ofte, men kun med grøn pipeline.
- PR-titel: `[<workspace-navn>] Kort og præcis titel`.
- PR-body skal beskrive ændringer, tests, og evt. kendte issues. Indsæt checklisten fra sektion 5 hvis den ikke allerede er i skabelonen.
- Før commit: kør standardpipeline (se sektion 5). Log resultater i PR.
- Merge kun når CI er grønt.

## 9. Kendte faldgruber og løsninger
- SSR-konflikter med `@react-pdf/renderer`: brug `dynamic` import.
- NPM publish issues: tjek `publishConfig` og `.npmrc` for GitHub Packages.
- NPM-auth i CI: brug `GITHUB_TOKEN`, ikke lokale `.env`-filer.
- Merge-konflikter: fjern alle `<<<<<<<`-markører. Tjek med `rg '<<<<<<<'` før commit.
- ESLint "couldn't find config": kør `pnpm install` for at regenerere pnpm-symlinks.

## 10. Reference og hjælperedskaber
- `docs/modules`: kilde til moduloversigt og afhængigheder.
- `turbo.json`: definerer pipeline og afhængigheder.
- `prettier.config.cjs`: formatstandarder.
- `tsconfig.base.json`: fælles TypeScript-konfiguration.
- `CHANGELOG.md`: skal opdateres for nye features/bugfixes.

## 11. Erfaringslog
- 2024-XX-XX: Husk at inkludere meta-instruktionerne ovenfor og udvide loggen med ny viden fra prompts/reviews.
- 2025-02-14: `exactOptionalPropertyTypes` kræver eksplicit håndtering af `undefined` i eksport/taksonomiobjekter.
- 2025-03-10: `pnpm --filter @org/web dev --hostname 0.0.0.0 --port 3000` – ekstra `--` før flag er nødvendigt.
- 2025-03-20: Brug `new Set<string>()` i tests når ESRS-qnames matches dynamisk.
- 2025-03-22: Efter nye workspaces, kør `pnpm install` for at hydrere symlinks.
- 2025-03-24: ESLint config-fejl løses ved `pnpm install` før `pnpm -w run lint && pnpm -w run typecheck && pnpm -w run test`.
- 2025-10-10: React-PDF `View`-stile må ikke modtage `null` i array-sammensætning; brug conditionelle spreads eller dedikerede klasser.

