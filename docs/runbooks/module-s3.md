# Runbook – S3 lokalsamfund & påvirkninger

Modulet dækker ESRS S3 datapunkter om berørte lokalsamfund: konsekvensanalyser, klager, registrerede impacts og afhjælpning. Resultatet er en social score (0-100) baseret på dækning, højrisikoandel, dialog og hændelsesstyring.

## Inputfelter

- **Identificerede lokalsamfund** og **dækningsgrad af analyser (%)** – svarer til S3-2.
- **Højrisiko-lokalsamfund (%)** – bruges til warnings når andelen er høj.
- **Åbne klager** – dokumenterer S3-3 om klagemekanismer.
- **Påvirkningsliste** – community, geografi, impact-type, husholdninger, alvorlighed, remediering og beskrivelse.
- **Narrativer** – engagement/FPIC og afhjælpning/samarbejde.

## Beregningsoverblik

1. Konsekvensanalyser (35 %) normaliseres ud fra `impactAssessmentsCoveragePercent` med warning under 60 %.
2. Højrisikoandel (20 %) omregnes til score (lav andel giver høj score).
3. Klagehåndtering (15 %) beregnes ud fra antal åbne klager.
4. Engagement (15 %) vurderes via narrativets længde og udførlighed.
5. Hændelser reducerer scoren baseret på alvorlighed, husholdninger og remediering. Uafsluttede højrisiko-impacts giver warnings.

## QA og test

- Unit-testen `runS3` i `runModule.spec.ts` dækker scenario med flere impacts og verificerer warnings/trace.
- UI (`S3Step`) understøtter alle felter samt tabellen for lokalsamfund.
- Opdater både `s3InputSchema` og JSON schema ved nye felter.

## CSRD/XBRL-eksport

- ESRS S3-fakta som `S3CommunitiesIdentifiedCount` og `S3ImpactAssessmentsCoveragePercent` dannes ud fra inputfelterne.
- Narrativer om engagement og afhjælpning eksporteres til `S3EngagementNarrative` og `S3RemedyNarrative`.
- Community-tabellen serialiseres til `S3CommunityImpactsTable`, så hver registreret hændelse genfindes i XBRL.
