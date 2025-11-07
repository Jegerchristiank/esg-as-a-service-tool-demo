# Runbook – E3 Emissioner til luft, vand og jord

Denne runbook beskriver, hvordan modul E3 indsamler data om udledninger og beregner en compliance-score.

## Formål

- Overvåge virksomhedens efterlevelse af miljøtilladelser for luft, vand og jord.
- Skabe transparens omkring hændelser og datakvalitet, så risici kan prioriteres.
- Understøtte konsulenter med antagelser, warnings og trace til audits.

## Arbejdsgang i UI

1. Vælg miljøsektionen i `/wizard` og åbn [E3-trinnet](../../apps/web/features/wizard/steps/E3Pollution.tsx).
2. Indtast udledninger og tilhørende grænser for hvert medie samt antal rapporterbare hændelser.
3. Formularen validerer procentværdier og viser forhåndsresultat samt de mest kritiske warnings.
4. Profilspørgsmålet om *"udledninger til luft, vand eller jord med myndighedskrav"* aktiverer modulet.

## Beregningslogik

- Implementeret i [runE3Pollution](../../packages/shared/calculations/modules/runE3Pollution.ts).
- Score starter på 100 og reduceres med `0,9` point pr. procent overskridelse samt `7` point pr. rapporterbar hændelse.
- Standardgrænser og tærskler defineres i [faktorerne](../../packages/shared/calculations/factors.ts).
- Inputfelter valideres via `e3PollutionInputSchema` i [schemaindekset](../../packages/shared/schema/index.ts).
- Trace viser kvantiteter, grænser og akkumulerede penalties.

## Kvalitetssikring

- Unit-tests i [`runModule.spec.ts`](../../packages/shared/calculations/__tests__/runModule.spec.ts) dækker overskridelser, hændelser og datakvalitetsadvarsler.
- Wizardformularen er bygget med grid-layout, så luft/vand/jord-data er lette at sammenligne.
- Profilafhængigheden sikrer, at modulet kun vises for virksomheder med relevante emissioner.

## CSRD/XBRL-eksport

- Udledninger, grænser og overskridelsesprocenter eksporteres som ESRS E3-fakta for luft, vand og jord.
- Rapportérbare hændelser og dokumentationskvalitet indgår ligeledes som numeriske facts, mens et sammendrag gemmes i `E3MediumsTable`.

## Videreudvikling

- Udbyg modulet med artsopdelte emissioner eller COD/TOC-målinger, hvis behov opstår.
- Tilføj integration til miljørapporteringssystemer for automatisk import af tal.
- Overvej visualisering af trends og compliance-historik i dashboards.
