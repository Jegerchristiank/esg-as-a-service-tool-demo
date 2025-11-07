# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) where applicable.

## [Unreleased]

### Added
- Migreret wizard-persistence til PostgreSQL med Drizzle ORM, migrations og et engangsscript til import af eksisterende JSON-data.
- Password-beskyttet adgangsflow for webappen med middleware, `/access`-side og Playwright-helper til login.
- Baseline quality report capturing current install, lint, typecheck, test and build status.
- Architectural decision record describing the new shared configuration packages.
- Shared tooling packages for TypeScript, ESLint, Prettier and Jest foundations.
- Repository directories for quality metrics, ADRs, migrations and runbooks.
- Git keepers for migrations and runbooks to maintain directory structure.
- Root Prettier configuration pointing to the shared preset.
- Updated TypeScript and ESLint configs to consume workspace presets.
- ADR 0002 documenting the enforcement of strict lint/type settings and CI gates.
- Publish runbook describing safe GitHub Packages authentication for releases.
- Fuldt B1-modul for Scope 2 elforbrug med schema, beregning, UI og tests.
- Fuldt B2-modul for Scope 2 varmeforbrug med schema, beregning, UI og tests.
- Fuldt B3-modul for Scope 2 køleforbrug med schema, beregning, UI og tests.
- Fuldt B4-modul for Scope 2 dampforbrug med schema, beregning, UI og tests.
- Fuldt B5-modul for øvrige Scope 2-energileverancer med schema, beregning, UI og tests.
- Fuldt B6-modul for Scope 2 nettab i elnettet med schema, beregning, UI og tests.
- Fuldt B7-modul for dokumenteret vedvarende el med schema, beregning, UI og tests.
- Fuldt B8-modul for egenproduceret vedvarende el med schema, beregning, UI og tests.
- Fuldt B9-modul for fysiske PPA-leverancer med schema, beregning, UI og tests.
- Fuldt B10-modul for virtuelle PPA-leverancer med schema, beregning, UI og tests.
- Fuldt B11-modul for time-matchede certifikatporteføljer med schema, beregning, UI og tests.
- Udvidede S1–S4 sociale moduler med ESRS-nøgletal, tabeller, UI-validering og rapport/PDF-understøttelse.
- ESRS S1 udvidet med FTE, ansættelsesformer, løngab, arbejdsmiljø, træning og sociale ydelser på tværs af schema, beregning, UI, eksport og tests.
- Fuldt A1-modul for Scope 1 stationær forbrænding med schema, beregning, UI og tests.
- Fuldt A2-modul for Scope 1 mobile kilder med schema, beregning, UI og tests.
- Fuldt A3-modul for Scope 1 procesemissioner med schema, beregning, UI og tests.
- Fuldt A4-modul for Scope 1 flugtige emissioner med schema, beregning, UI og tests.
- Fuldt C1-modul for Scope 3 medarbejderpendling med schema, beregning, UI og tests.
- Fuldt C2-modul for Scope 3 forretningsrejser med schema, beregning, UI og tests.

- Fuldt C3-modul for Scope 3 brændstof- og energirelaterede aktiviteter med schema, beregning, UI og tests.
- Fuldt C4-modul for Scope 3 upstream transport og distribution med schema, beregning, UI og tests.
- Fuldt C5-modul for Scope 3 affald fra drift (upstream) med schema, beregning, UI og tests.
- Fuldt C6-modul for Scope 3 udlejede aktiver (upstream) med schema, beregning, UI og tests.
- Fuldt C7-modul for Scope 3 downstream transport og distribution med schema, beregning, UI og tests.
- Fuldt C8-modul for Scope 3 udlejede aktiver (downstream) med schema, beregning, UI og tests.
- Fuldt C9-modul for Scope 3 forarbejdning af solgte produkter med schema, beregning, UI og tests.
- Fuldt C10-modul for Scope 3 upstream leasede aktiver med schema, beregning, UI og tests.
- Fuldt C11-modul for Scope 3 downstream leasede aktiver med schema, beregning, UI og tests.
- Fuldt C12-modul for Scope 3 franchising og downstream services med schema, beregning, UI og tests.
- Fuldt C13-modul for Scope 3 investeringer og finansielle aktiviteter med schema, beregning, UI og tests.
- Fuldt C14-modul for Scope 3 behandling af solgte produkter med schema, beregning, UI og tests.
- Fuldt C15-modul for Scope 3 screening af øvrige kategorier med schema, beregning, UI og tests.
- E1 klimamål- og actionmodul med ESRS E1 intensiteter, målstatus, wizard-step, PDF og test-fixtures.
- E1 kontekstmoduler for klimascenarier, interne CO₂-priser, risikogeografi og decarboniseringsdrivere med schema, beregninger,
  wizard-trin, ESRS-eksport og tests.
- Server-baseret wizard-persistence med revisionslog, rollebaseret adgangskontrol, Vitest-dækning og runbook for drift/compliance.
- Udvidet E1-målmodul med energiforbrug, vedvarende andele, dokumentationskvalitet og ESRS-eksport.
- Landing-komponentbibliotek (`LandingHero`, `LandingBacklog`, `LandingFlows`) dokumenteret i Storybook/MDX.
- Feature-flag infrastruktur til `wizardRedesign` med cookie- og query-override samt initialisering i layoutet.
- Migration-guide for wizard-redesign i `docs/migrations/2025-03-30-wizard-redesign.md`.


### Changed
- Opdaterede wizardens profilskifter-tests til at verificere DOM-struktur i stedet for billedsnapshots for at undgå billedfiler i repoet.
- Skjulte modulnavigationen og statuspanelet, mens virksomhedsprofilen er åben, så stepper-flowets tekst kan brede sig og forblive læsbar.
- Finjusterede pre-wizard-stepperens layout med smallere primærkolonne, justerede linjehøjder og forbedret reset-knapplacering for at gøre spørgsmålsteksterne lettere at læse.
- Redesignet design-systemet med farve-, typografi-, spacing- og breakpoint-tokens, alternative kort/panel-toner samt ny `/styleguide` reference og dokumentation.
- Omstillede ESRS 2 D1 og MR til kravbaseret validering med kvalitative outputs, opdaterede UI-komponenter og dækkende tests/fixtures.
- Replaced the Next.js TypeScript config with an `.mjs` variant to unblock `next lint` and let Next manage app compiler settings.
- Normalised wizard infrastructure to rely on strongly typed module input and removed duplicate step registrations.
- Tuned Turbo test outputs to avoid false cache warnings while coverage instrumentation is not yet enabled.
- Hardened the shared TypeScript compiler defaults with additional strictness flags and introduced stricter ESLint rules for imports.
- Replaced the validation workflow with a single matrix job that disables telemetry, installs with a frozen lockfile, and blocks on lint, typecheck, test and build failures.
- Refreshed the baseline quality report to reflect the current green installation, lint, typecheck, test and build status, while documenting outstanding bundle-size and coverage risks.
- Removed the repository-level `.npmrc`; publishing now generates scoped auth config in CI to avoid local token requirements.
- Omkalfatrede D2-materialitetsmodulet til ESRS’ severity × likelihood matrix med finansielle effekter, tidslinjer og strukturerede rapporteringstabeller i UI, PDF og eksport.
- Landing page redesign med sprint-backlog, flowoversigt og profilskifter integreret i det nye visuelle sprog.

### Fixed
- Resolved merge artefacts across shared calculation, schema, PDF and tooling modules so TypeScript and ESLint parse cleanly.
- Restored review, PDF preview and storage utilities after conflict markers to ensure runtime components compile again.
- Cleaned B1 calculation tests to eliminate duplicate suites and reinstate deterministic assertions.
- Ensured `next lint` bruger den understøttede TypeScript-version ved at fastlåse 5.5.4 gennem pnpm overrides.
- Udvidede tooling-CLIens skemakonvertering til at forstå boolean- og array-typer, så GitHub CLI-testen lykkes for de nye E1-energifelter.
- Forhindret tabte wizard-opdateringer ved at serialisere persistence-skrivninger med database-transaktioner og repository-koordination.
- Hindret fejllogning fra Vercel Web Analytics og Speed Insights i lokale builds ved kun at initialisere integrationerne, når projekternes miljøvariabler er konfigureret.
