# Runbook – E2 Vandforbrug og vandstress

Denne runbook beskriver, hvordan modul E2 indsamler vanddata og beregner et vandstressindeks.

## Formål

- Dokumentere vandudtag, genbrug og udledning for de mest vandintensive aktiviteter.
- Identificere risici ved vandstress og lav dokumentationskvalitet som kræver handling.
- Give konsulenter og brugere indblik i antagelser, advarsler og trace-data for E2-beregningen.

## Arbejdsgang i UI

1. Åbn `/wizard` og vælg den nye sektion **Miljø – Vand, forurening og ressourcer**.
2. Udfyld felterne i [E2-trinnet](../../apps/web/features/wizard/steps/E2Water.tsx) for vandudtag, stressede områder, udledt vand og genbrug.
3. Formularen normaliserer kommatal og viser et kort med forhåndsresultat, inklusive alle warnings fra beregningen.
4. Profilspørgsmålet *"Har virksomheden vandintensive processer eller anlæg i vandstressede områder?"* styrer, om trinnet vises.

## Beregningslogik

- Implementeret i [runE2Water](../../packages/shared/calculations/modules/runE2Water.ts).
- Vandstressindekset er en vægtet sum: 50 % stressandel, 30 % genbrugsandel (1 − genbrug) og 20 % udledningsandel (1 − udledningsforhold).
- Standardværdier, tærskler og enhed er defineret i [faktorkonfigurationen](../../packages/shared/calculations/factors.ts).
- Inputvalidering og grænser ligger i [schemaet](../../packages/shared/schema/index.ts) via `e2WaterInputSchema`.
- Warnings udsendes ved høj stressandel, manglende genbrug og lav datakvalitet.

## Kvalitetssikring

- Enhedstests i [`runModule.spec.ts`](../../packages/shared/calculations/__tests__/runModule.spec.ts) dækker beregning, warnings og tomt input.
- Wizardformularen giver inline-fejl ved negative værdier, procent over 100 % og hvis stress/udledning overstiger totaludtag.
- Profilafhængigheder sikrer, at modullet kun vises, når miljøspørgsmålet om vand er besvaret med *ja*.

## CSRD/XBRL-eksport

- Vandudtag, udledning og genbrug eksporteres som ESRS E2-fakta (`E2TotalWaterWithdrawalM3`, `E2WaterReusePercent` m.fl.).
- Stressandel og dokumentationskvalitet indgår ligeledes som numeriske facts, så myndigheder kan kontrollere beregningsgrundlaget.

## Videreudvikling

- Udvid schemaet med lokationsspecifikke linjer, hvis behovet for flere lokationer opstår.
- Tilføj dataintegration til vandmålere, så udtag kan indlæses automatisk.
- Overvej grafisk visualisering af stressniveau og historiske trends i UI.
