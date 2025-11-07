# Runbook – E5 Ressourcer og materialeforbrug

Denne runbook gennemgår arbejdsgang, beregning og QA for ressource- og materialemodulet.

## Formål

- Overvåge forbrug af primære og sekundære materialer samt kritiske ressourcer.
- Understøtte cirkularitetsinitiativer med data om genanvendt indhold og målopfyldelse.
- Dokumentere antagelser, warnings og datakvalitet for audit og rådgivning.

## Arbejdsgang i UI

1. Profilspørgsmålet om kritiske materialer aktiverer modulet.
2. Udfyld felterne i [E5-trinnet](../../apps/web/features/wizard/steps/E5Resources.tsx) for materialeforbrug, procentandele og dokumentationskvalitet.
3. Formularen viser et kort med forhåndsresultat, warnings og valideringsfejl ved negative tal eller procent over 100 %.
4. Resultatet anvendes i analyser og rapporter for cirkularitet og ressourceeffektivitet.

## Beregningslogik

- Beregningen ligger i [runE5Resources](../../packages/shared/calculations/modules/runE5Resources.ts).
- Indekset vægter primært forbrug 35 %, kritiske materialer 20 %, genanvendelse 20 %, fornybare materialer 15 % og målopfyldelse 10 %.
- Faktorkonfiguration findes i [factors](../../packages/shared/calculations/factors.ts); inputvalidering i `e5ResourcesInputSchema` i [schemaindekset](../../packages/shared/schema/index.ts).
- Warnings udløses ved højt kritisk materialeforbrug, mål-gap, lav datakvalitet og sekundært forbrug over primært niveau.

## Kvalitetssikring

- Tests i [`runModule.spec.ts`](../../packages/shared/calculations/__tests__/runModule.spec.ts) dækker indeksberegning og warnings.
- Wizardformularen håndterer parsing af kommatal og begrænser procentværdier til 0-100 %.
- Profilafhængigheden kræver både materialeforbrug og kritiske materialer, før modulet vises.

## CSRD/XBRL-eksport

- Primært og sekundært forbrug, genanvendt andel og kritiske materialer eksporteres som ESRS E5-fakta.
- Målopfyldelse og dokumentationskvalitet indgår, så cirkularitetsindekset kan valideres direkte i XBRL.

## Videreudvikling

- Tilføj felt for materialespecifikationer eller CO₂-intensitet for at styrke rapportering.
- Overvej integration med indkøbssystemer for automatisk import af materialeforbrug.
- Udbyg UI med trendgrafer for cirkularitetsmål og kritiske materialer.
