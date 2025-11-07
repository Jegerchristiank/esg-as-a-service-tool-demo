# Runbook – S2 værdikædearbejdere

Modulet samler ESRS S2 datapunkter om leverandørarbejdere: dækningsgrad af risikovurderinger, sociale audits, klagemekanismer og registrerede hændelser. Resultatet er en social score (0-100) med fokus på dækning, arbejdstagerbeskyttelse og hændelsesstyring.

## Inputfelter

- **Arbejdstagere i værdikæden** og **udsatte arbejdstagere** – bruges til at dimensionere hændelser og warnings.
- **Risikodækning (%)** og **andel højrisiko-leverandører (%)** – dokumenterer ESRS S2-2.2.
- **Leve-/mindsteløn (%)** og **kollektive aftaler (%)** – afdækker arbejdstagerrettigheder (S2-5).
- **Sociale audits (%)**, **åbne klager** og **klagemekanisme** – viser opfølgning og remediering (S2-2.3 og S2-5).
- **Hændelseslisten** – registrerer leverandør/site, hændelsestype, antal berørte, alvorlighed og remedieringsstatus.
- **Narrativer** – dialog/kapacitetsopbygning samt kompensation og opfølgning.

## Beregningsoverblik

1. Dækningsscore (35 %) bygger på `valueChainCoveragePercent` (warning under 70 %).
2. Beskyttelsesscore (25 %) er gennemsnit af `livingWageCoveragePercent` og `collectiveBargainingCoveragePercent`.
3. Audit- og klagemekanisme (30 %) kombinerer `socialAuditsCompletedPercent`, `grievanceMechanismForWorkers` og åbne klager.
4. Hændelser reducerer scoren ud fra alvorlighed, antal berørte og remediering. Højrisiko uden afsluttet remediering udløser warnings.

## QA og test

- Unit-testen `runS2` i `runModule.spec.ts` dækker scenario med flere hændelser og kontrollerer trace/warnings.
- UI (`S2Step`) understøtter alle datapunkter samt incident-tabellen og narrativer.
- Validering findes i `s2InputSchema` og `esg-input-schema.json`; husk at opdatere begge ved schemaændringer.

## CSRD/XBRL-eksport

- Centrale nøgletal eksporteres til ESRS S2-fakta (`S2ValueChainWorkersCount`, `S2LivingWageCoveragePercent` osv.).
- Narrativer om dialog og afhjælpning eksporteres som `S2SocialDialogueNarrative` og `S2RemediationNarrative`.
- Hændelseslisten serialiseres som `S2IncidentsTable`, så hver leverandørlinje bevares i XBRL-instansen.
