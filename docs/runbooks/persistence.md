# Persistence- og revisionsrunbook

Denne runbook beskriver hvordan wizard-data lagres i PostgreSQL via Drizzle ORM, samt hvordan revisionsspor og versionshistorik håndteres og driftes.

## Arkitektur

- **Backend (`apps/backend`)** udstiller et HTTP-API på `/wizard/snapshot`.
  - `GET` returnerer seneste snapshot bestående af lagrede profiler, revisionslog, brugeridentitet og rettigheder.
  - `PUT` accepterer et nyt `storage`-objekt og kræver et gyldigt bearer-token. Servicen udregner versionsnumre, opdaterer audit-log og sikrer, at alle feltrevisioner har aktuel bruger-ID.
- **Autentifikation** er token-baseret. Tokens konfigureres via `PERSISTENCE_TOKENS` (format `token:userId:role1|role2`). Roller mappes til rettigheder (`editor`, `admin`, `reviewer`, `viewer`).
- **Dataopbevaring** sker i PostgreSQL ved hjælp af Drizzle ORM. Tabellenes struktur findes i `apps/backend/src/persistence/schema.ts`, og migrations genereres til `apps/backend/drizzle`.
- **JSON-filen** (`PERSISTENCE_DATA_FILE`) bruges som midlertidigt fallback og til engangsmigrering. Scriptet `pnpm --filter @org/backend tsx scripts/migrateFileToDb.ts` læser filen og gemmer data i databasen.

## Datamodeller

- `wizard_storage`: gemmer aktiv profil og metadata.
- `wizard_profiles`: én række per profil inkl. state, historik og ansvarsfordeling.
- `wizard_audit_log`: append-only audit-log med ændringsdetaljer, versioner og bruger-id.

Alle tabeller styres via `DatabaseRepository`, som sørger for transaktioner og idempotent indsættelse af audit-log-poster.

## Revisionsproces

1. **Indlæsning**: Web-klienten kalder `GET /wizard/snapshot` ved initialisering. Svaret bruges til at hydrere wizard-state, bruger og tilladelser.
2. **Lokale ændringer**: Brugeren kan kun oprette/rette/slette profiler hvis `permissions.canEdit` er `true`. Hooken registrerer feltændringer, ansvar og historik lokalt.
3. **Synkronisering**: Ændringer debounces (800 ms). Når timeouten udløber, sendes de via `PUT /wizard/snapshot` sammen med metadata (bruger-id og årsag). Serveren:
   - Beregner delta mod sidste snapshot.
   - Inkrementerer versionsnummeret pr. profil ved ændringer.
   - Udfylder `updatedBy` for historikposter, hvis feltet mangler.
   - Tilføjer en audit-log post med timestamp, bruger og ændringsoversigt.
4. **Revision**: Audit-loggen kan bruges til at rekonstruere versionshistorikken. Hver post indeholder feltændringer (`field`, `previous`, `next`), version og `userId`.
5. **Review/Freigivelse**: Brugere med `canPublish` kan (fremtidigt) udvides til at godkende release-flow. Nuværende implementering muliggør læsning uden redigeringsrettigheder.

## Drift

- **Konfiguration**: Sæt følgende miljøvariabler før opstart:
  - `PERSISTENCE_PORT` (default `4010`)
  - `PERSISTENCE_DATABASE_URL` (PostgreSQL connection string)
  - `PERSISTENCE_DATA_FILE` (sti til JSON-lager, bruges til migrering/fallback)
  - `PERSISTENCE_TOKENS` (kommasepareret liste af tokens)
- **Databaseopsætning**:
  1. Start en PostgreSQL 16 instans (kan gøres via Docker).
  2. Kør `pnpm --filter @org/backend db:generate -- --name <migration-navn>` for at generere migrations.
  3. Kør `pnpm --filter @org/backend db:migrate` for at anvende migrations.
  4. Kør `pnpm --filter @org/backend tsx scripts/migrateFileToDb.ts` for at importere eksisterede JSON-data.
- **Start backend**: `pnpm --filter @org/backend build && pnpm --filter @org/backend start`
- **Test**: `pnpm --filter @org/backend test` kører Vitest-suiten, inkl. audit-log verifikation.
- **Fejlretning**:
  - 401/403 svar indikerer ugyldigt token eller manglende rettigheder.
  - Databasefejl: kontrollér `PERSISTENCE_DATABASE_URL` og at migrations er kørt.
  - Audit-log mismatch: kør backend-testene for at validere diff-logic.
  - Migreringsscriptet kan køres flere gange; audit-log poster deduplikeres via primærnøglen.

## Appendix: Token-roller

| Rolle      | Rettigheder                     |
|------------|---------------------------------|
| `admin`    | `canEdit`, `canPublish`         |
| `editor`   | `canEdit`                       |
| `reviewer` | `canPublish`                    |
| `viewer`   | Ingen skrive-/release-rettigheder|

**Bemærk**: Frontend-hooken eksponerer `permissions` og `auditLog` via `useWizard`, så UI kan vise revisionsdata eller deaktivere input for læsebrugere.
