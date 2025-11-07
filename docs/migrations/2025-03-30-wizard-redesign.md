# Migration: Wizard redesign og landingsside (2025-03-30)

> **Status:** Klar til teams i sprint 14. Feature-flag `wizardRedesign` bruges til A/B-test.

## Formål

- Indføre nyt visuelt sprog med fokus på design tokens, layouts og flows.
- Sikre at ældre instanser stadig kan køre via feature-flag.
- Dokumentere trin så øvrige teams kan migrere uden at brække eksisterende flows.

## Hvad ændrer sig?

| Område | Beskrivelse | Handling |
| --- | --- | --- |
| Design tokens | Hero, backlog og flow-kort bruger nye gradients, badges og spacing. | Synkroniser med `apps/web/styles/design-system.css` og komponenterne i `apps/web/components/landing`. |
| Layout | Landing page benytter nye grids og CSS-moduler fremfor tidligere utility-only layout. | Kontrollér at custom CSS er importeret via komponenterne og at container-bredder matcher `ds-constrain`. |
| Flows | CTA-sektioner guider mod profiloprettelse og wizardens nye navigation. | Sørg for at Playwright-scenarier navigerer via nye knapper og labels. |
| Feature flag | `wizardRedesign` læses fra cookies eller query-parametre (`?ff_wizardRedesign=off`). | Opsæt default-værdien i cookies ved behov for kontrolgruppe. |

## Migrationstrin

1. **Tokens**
   - Opdater lokale overrides til at bruge `var(--color-primary-700)` m.fl.
   - Fjern hardcodede farver i tidligere hero-komponenter.
2. **Layout**
   - Erstat direkte `ds-` utility-stacks med `LandingHero`, `LandingBacklog` og `LandingFlows` hvor relevant.
   - Kontroller at CSS-modulerne ikke kolliderer med globale klasser.
3. **Flows**
   - Justér Playwright-tests til at anvende nye knap-etiketter (`Opret ny profil`, `Fortsæt seneste profil`).
   - Tilpas analytics-events så de inkluderer flag-varianten (se `useFeatureFlag`).

## QA & Release

- Kør `pnpm -w run lint && pnpm -w run typecheck && pnpm -w run test && pnpm --filter @org/web exec playwright test` før release.
- Opdater visuelle snapshots efter designændringer.
- Feature-flag skal være aktivt (`true`) før landing page gøres synlig for alle.

## Rollback

- Sæt `wizardRedesign=false` via cookie eller query-param for at vende tilbage til den tidligere landing page.
- Ingen databaseændringer er foretaget; rollback påvirker kun klienten.
