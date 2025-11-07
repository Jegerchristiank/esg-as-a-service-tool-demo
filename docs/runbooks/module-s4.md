# Runbook – S4 forbrugere & slutbrugere

Modulet dækker ESRS S4 datapunkter om produkter og slutbrugere: risikovurdering, klagehåndtering, datasikkerhed og alvorlige hændelser. Resultatet er en social score (0-100) baseret på dækning, klageprocesser og hændelsesstyring.

## Inputfelter

- **Produkter med risikovurdering (%)** – S4-2.
- **Klager løst inden for SLA (%)** og **klagemekanisme** – S4-3.
- **Datasikkerhedsbrud**, **alvorlige hændelser** og **produkt-/service-recalls** – S4-4 og S4-5.
- **Hændelsesliste** – produkt/service, marked, hændelsestype, berørte brugere, alvorlighed og remediering.
- **Narrativer** – støtte til udsatte brugergrupper og engagement/uddannelse.

## Beregningsoverblik

1. Risikovurdering (30 %) via `productsAssessedPercent`.
2. Klagehåndtering (20 %) via `complaintsResolvedPercent` kombineret med mekanisme og behandlingstid.
3. Datasikkerhed (15 %) reduceres ved `dataBreachesCount`.
4. Hændelser reducerer scoren baseret på alvorlighed, antal brugere og remediering. Ekstra penalty for `severeIncidentsCount` og `recallsCount`.

## QA og test

- Unit-testen `runS4` i `runModule.spec.ts` dækker scenario med flere hændelser og kontrollerer warnings.
- UI (`S4Step`) understøtter talfelter, hændelsesliste og narrativer.
- Opdater `s4InputSchema` og JSON schema ved nye datapunkter.

## CSRD/XBRL-eksport

- Risikovurderinger, klageindikatorer og datasikkerhedsbrud eksporteres som ESRS S4-fakta (`S4ProductsAssessedPercent`, `S4DataBreachesCount` osv.).
- Narrativer om udsatte brugere og forbrugerengagement eksporteres som `S4VulnerableUsersNarrative` og `S4ConsumerEngagementNarrative`.
- Hændelseslisten serialiseres til `S4ConsumerIssuesTable`, så produkt, marked, alvorlighed og status er tilgængelig i XBRL.
