# Persistence- og revisionsrunbook

Denne runbook beskriver den nye server-baserede persistence-løsning for wizard-data samt hvordan revisionsspor og versionshistorik håndteres.

## Arkitektur

- **Backend (`apps/backend`)** udstiller et HTTP-API på `/wizard/snapshot`.
  - `GET` returnerer seneste snapshot bestående af lagrede profiler, revisionslog, brugeridentitet og rettigheder.
  - `PUT` accepterer et nyt `storage`-objekt og kræver et gyldigt bearer-token. Servicen udregner versionsnumre, opdaterer audit-log og sikrer, at alle feltrevisioner har aktuel bruger-ID.
- **Autentifikation** er token-baseret. Tokens konfigureres via `PERSISTENCE_TOKENS` (format `token:userId:role1|role2`). Roller mappes til rettigheder (`editor`, `admin`, `reviewer`, `viewer`).
- **Dataopbevaring** sker i en JSON-fil (`PERSISTENCE_DATA_FILE`). `WizardPersistenceService` sikrer atomiske opdateringer og audit-log.

## Revisionsproces

1. **Indlæsning**: Web-klienten kalder `GET /wizard/snapshot` ved initialisering. Svaret bruges til at hydrere wizard-state, bruger og tilladelser.
2. **Lokale ændringer**: Brugeren kan kun oprette/rette/slette profiler hvis `permissions.canEdit` er `true`. Hooken registrerer feltændringer, ansvar og historik lokalt.
3. **Synkronisering**: Ændringer debounces (800 ms). Når timeouten udløber, sendes de via `PUT /wizard/snapshot` sammen med metadata (bruger-id og årsag). Serveren:
   - Beregner delta mod sidste snapshot.
   - Inkrementerer versionsnummeret pr. profil ved ændringer.
   - Udfylder `updatedBy` for historikposter, hvis feltet mangler.
   - Tilføjer en audit-log post med timestamp, bruger og ændringsoversigt.
4. **Revision**: Audit-loggen kan bruges til at rekonstruere versionshistorikken. Hver post indeholder feltændringer (`field`, `previous`, `next`), version og `userId`.
5. **Review/Freigivelse**: Brugere med `canPublish` kan (fremtidigt) udvides til at godkende release-flow. Nuværende implementation muliggør læsning uden redigeringsrettigheder.

## Drift

- **Konfiguration**: Sæt følgende miljøvariabler før opstart:
  - `PERSISTENCE_PORT` (default `4010`)
  - `PERSISTENCE_DATA_FILE` (sti til JSON-lager)
  - `PERSISTENCE_TOKENS` (kommasepareret liste af tokens)
- **Start backend**: `pnpm --filter @org/backend build && pnpm --filter @org/backend start`
- **Test**: `pnpm --filter @org/backend test` kører Vitest-suiten, inkl. audit-log verifikation.
- **Fejlretning**:
  - 401/403 svar indikerer ugyldigt token eller manglende rettigheder.
  - JSON-fil konflikter: slet filen og lad `ensureDataFileExists` generere ny baseline.
  - Audit-log mismatch: kør backend-testene for at validere diff-logic.

## Appendix: Token-roller

| Rolle     | Rettigheder                     |
|-----------|---------------------------------|
| `admin`   | `canEdit`, `canPublish`         |
| `editor`  | `canEdit`                       |
| `reviewer`| `canPublish`                    |
| `viewer`  | Ingen skrive-/release-rettigheder|

**Bemærk**: Frontend hooken eksponerer `permissions` og `auditLog` via `useWizard`, så UI kan vise revisionsdata eller deaktivere input for læsebrugere.
