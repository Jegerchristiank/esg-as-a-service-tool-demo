# Runbook – E4 Påvirkning af biodiversitet

Denne runbook opsummerer arbejdsgang, beregning og QA for biodiversitetsmodulet.

## Formål

- Kortlægge påvirkede arealer, restaureringstiltag og hændelser i beskyttet natur.
- Understøtte risikovurderinger og rapportering af biodiversitet i CSRD/ESRS E4.
- Dokumentere antagelser og datakvalitet for audit- og rådgiverteams.

## Arbejdsgang i UI

1. Profilspørgsmålet om naturpåvirkning aktiverer modulet.
2. Indtast data i [E4-trinnet](../../apps/web/features/wizard/steps/E4Biodiversity.tsx) for antal lokaliteter, påvirket areal, restaurering og hændelser.
3. Formularen validerer, at restaureret areal ikke overstiger det påvirkede areal og viser forhåndsresultat med warnings.
4. Resultatet kan eksporteres sammen med øvrige moduler via rapportfunktionerne.

## Beregningslogik

- Implementeret i [runE4Biodiversity](../../packages/shared/calculations/modules/runE4Biodiversity.ts).
- Risikoindeks: lokaliteter vægter 30 %, areal 40 % og hændelser 30 %; restaurering reducerer op til 60 % af risikoen.
- Parametre og tærskler defineres i [factors](../../packages/shared/calculations/factors.ts).
- Inputvalidering håndteres af `e4BiodiversityInputSchema` i [schemaindekset](../../packages/shared/schema/index.ts).

## Kvalitetssikring

- Testcases i [`runModule.spec.ts`](../../packages/shared/calculations/__tests__/runModule.spec.ts) dækker mitigation, hændelser og datakvalitet.
- Wizardtrinnet bruger grid-layout og inline-fejl for negative eller for store værdier.
- Profilafhængigheden sikrer, at modulet kun vises for virksomheder med naturpåvirkning.

## CSRD/XBRL-eksport

- Antal lokaliteter, påvirket areal, restaureret areal og hændelser eksporteres som ESRS E4-fakta.
- Dokumentationskvalitet og restaureringsforhold følger med, så assurance kan efterprøve risikoniveauet direkte i XBRL.

## Videreudvikling

- Udvid formularen med geografiske tags eller koordinater, hvis mere detaljeret rapportering ønskes.
- Integrer automatiske datafeeds fra GIS-systemer, hvor det er tilgængeligt.
- Tilføj visualisering af risikoniveau og restaureringsgrad i dashboards.
