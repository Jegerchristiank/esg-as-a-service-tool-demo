# Runbook – E1 Klimamål og handlinger

Denne runbook beskriver mål-/aktionsmodulet E1, som hjælper teams med at dokumentere klimamål, ansvarlige og actionplaner i overensstemmelse med ESRS E1 (særligt §§24-31 om målsætninger og §63 om energimix).

## Formål

- Kortlægge klimamål på tværs af scope 1-3 samt samle ansvarlige og status.
- Indsamle data til intensiteter (fx tCO₂e pr. mio. DKK og pr. produktenhed) og energimix, så rapporten opfylder ESRS E1 datapunkter.
- Dokumentere planlagte handlinger og milepæle, der understøtter målopfyldelse, til brug for QA- og investordialog.

## Arbejdsgang i UI

1. Navigér til wizard-sektionen "Governance" og vælg trinnet **E1 – Klimamål og handlinger**.
2. Opret et mål pr. scope eller vælg "Samlet" for en fælles målsætning. Angiv:
   - Titel og scope (ESRS E1 §24-26).
   - Baseline-år og baseline-emission (ton CO₂e).
   - Målår, målværdi (ton CO₂e) og ansvarlig.
   - Status (on track/halter/risiko) samt beskrivelse.
   - Tilføj evt. milepæle med årstal for at understøtte §31-kravet om tidslinjer.
3. Registrér planlagte handlinger med titel, beskrivelse, ansvarlig, deadline (ÅÅÅÅ-QX) og status. Disse anvendes til opfølgningskravene i ESRS E1 §65.
4. Preview-panelet viser antal mål, planlagte handlinger og beregnede intensiteter. Kontrollér at målene dækker relevante scopes og at deadlines følger virksomhedens styringspraksis.

## Beregningslogik

- Modulet tæller antallet af registrerede mål og eksponerer dem som `targetsOverview` til review og PDF.
- `plannedActions` viser alle handlinger med status og deadlines.
- `withE1Insights` beriger scope-moduler (A, B, C) med:
  - Intensiteter: ton CO₂e pr. mio. DKK, pr. produktenhed, pr. FTE og pr. kWh (ESRS E1 §53-54).
  - Trend: sammenligning med foregående år (fra `E1Context.previousYearScope[1-3]Tonnes`).
  - Målstatus: afvigelse og fremskridt beregnes ud fra baseline og målværdi.
  - Energimix: kWh-fordeling og dokumentationskvalitet.
- `runE1Targets` normaliserer scope, status og deadlines og gemmer trace for QA.

## Kvalitetssikring

- Validér at schemaet (`packages/shared/schema/esg-input-schema.json`) accepterer alle felter og begrænser værdier til ESRS-enheder.
- Kør `pnpm -w run lint && pnpm -w run typecheck && pnpm -w run test` før merge.
- I `packages/shared/calculations/__tests__/runModule.spec.ts` findes tests for både `runE1Targets` og intensiteter i `runB1`. Udvid ved nye edge cases.
- Preview i wizard og review-side skal vise samme data som PDF (`packages/shared/pdf/EsgReportPdf.tsx`).

## QA-tjekliste

- [ ] Er alle relevante scopes dækket med mål, og har de baseline- og målår (ESRS E1 §29)?
- [ ] Viser review-siden intensiteter, energimix og målstatus uden "ukendt"-felter?
- [ ] Matcher planned actions deadlines formatet ÅÅÅÅ-QX, og er status valgt fra de fire valgmuligheder?
- [ ] Indeholder PDF-rapporten samme intensiteter/mål som UI (kør lokal download og spotcheck)?
- [ ] Er der mindst ét unit-test-scenarie pr. nyt modul og fixture (`fixtures/e1Targets.ts`)?
