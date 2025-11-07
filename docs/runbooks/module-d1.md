# Runbook – D1 Metode & governance

Denne runbook beskriver, hvordan governance-modulet (D1) anvendes til at dokumentere CSRD/ESRS-metoder og validere governance-kravene kvalitativt.

## Formål

- Dokumentere hvilket konsolideringsprincip og Scope 2-metode organisationen rapporterer efter.
- Vise status på Scope 3-screening og datakvalitet via en kravvurdering, der fremhæver manglende dokumentation.
- Indsamle kvalitative beskrivelser af væsentlighedsanalyse, strategi, governance, impacts/risici/muligheder og mål/KPI’er, så compliance- og ESG-teams arbejder ud fra samme beslutningsgrundlag.

## ESRS 2 datapunkter og felttyper

| Tema | Datapunkter | Felttype |
| --- | --- | --- |
| Metodevalg | Konsolideringsprincip, Scope 2 metode, Scope 3 screening, datakvalitet | Select/checkbox |
| Strategi | Forretningsmodel, integration af bæredygtighed, robusthed/scenarier, stakeholderinddragelse, overordnet governance-sammendrag | Fritekst (2000 tegn) |
| Governance | Bestyrelsens tilsyn, direktionens ansvar, kompetencer & træning, incitamenter, politikker & kontroller, ESG-komité | Fritekst + checkbox |
| Impacts/risici/muligheder | Proces, prioriteringskriterier, integration i styring, handlingsplaner, værdikædedækning, analyserede tidshorisonter | Fritekst, select, flere checkboxe |
| Mål & KPI’er | Forankring af mål, status/fremdrift, om der findes kvantitative mål, liste over KPI’er (navn, KPI, enhed, baseline-år/-værdi, mål-år/-værdi, kommentarer) | Fritekst, checkbox, gentagelig sektion med tekst- og talfelter |

## Arbejdsgang i UI

1. Navigér til `/wizard` og vælg governance-sektionen.
2. Udfyld metodefelterne:
   - **Organisatorisk afgrænsning** – equity share, financial control eller operational control.
   - **Scope 2 metode** – location-based eller market-based.
   - **Scope 3 screening udført** – markér når alle 15 kategorier er vurderet.
   - **Datakvalitet** – primær, sekundær eller proxy.
3. Udfyld strategisektionen med beskrivelser af forretningsmodel, integration, robusthed og stakeholderinddragelse. Brug det samlede governance-felt til overblik over beslutningsprocesser.
4. Dokumentér governance-rollerne: bestyrelsens tilsyn, direktionens ansvar, kompetencer, incitamenter, politikker og om der findes et dedikeret ESG-udvalg.
5. Beskriv processen for impacts/risici/muligheder, angiv værdikædedækning og markér analyserede tidshorisonter.
6. Angiv om der findes kvantitative mål, beskriv forankring og status, og registrér relevante KPI’er (min. én række for at få delscore).
7. Preview-panelet viser antal opfyldte krav, status for hvert krav og tilhørende antagelser/advarsler. Trace-listen viser længder for tekstfelter, værdikædedækning, tidshorisonter og KPI-setup.
8. Resultatet indgår i review-siden og PDF-rapporten på linje med Scope 1 og Scope 3-modulerne.

## Beregningslogik

- Evalueringen består af syv krav: metodevalg, Scope 3-dækning, væsentlighed, strategi, governance, impacts/risici/muligheder og mål/KPI’er.
- Et krav er opfyldt, når de tilhørende narrativer når mindst 150-200 tegn, og de strukturelle datapunkter (fx værdikædedækning, tidshorisonter, kvantitative mål) er registreret.
- Scope 3-kravet kræver fuld screening, dækning af upstream + downstream og analyser på mellem og lang sigt.
- KPI-kravet kræver kvantitative mål og mindst én KPI med baseline og mål.
- Kravstatus vises binært (opfyldt/mangler) og ledsages af anbefalinger, hvis dokumentationen er kortfattet eller markeret som proxy.

## Kvalitetssikring

- `packages/shared/calculations/modules/runD1.ts` indeholder den fulde logik og spores i `runModule.spec.ts` med tre tests (neutral, delvis og fuld score).
- Schemaet i `packages/shared/schema` og UI-komponenten i `apps/web/features/wizard/steps/D1.tsx` sikrer konsistent validering.
- Vitest, lint, typecheck og build skal være grønne før release.
- Krydstjek D2-input: Finansielle undtagelser i D2 skal understøttes af governance- eller procesbeskrivelser i D1 for at fremstå troværdige ved revision.

## CSRD/XBRL-eksport

- Metodevalg, værdikædedækning, tidshorisonter og KPI-antallet eksporteres som ESRS D1-fakta (`D1OrganizationalBoundary`, `D1TimeHorizonsCoveredCount` m.fl.).
- De kvalitative beskrivelser serialiseres som tabeller (`D1StrategyNarrativesTable`, `D1KpiOverviewTable` osv.), så assurance-teamet kan efterprøve indholdet direkte i XBRL.

## Videreudvikling

- Kravvurderingen kan eksporteres via `@org/shared` og anvendes i dashboards eller compliance-rapporter.
- Fremtidige iterationer kan udvide modulet med dokumentupload eller kobling til revisionsplaner.
