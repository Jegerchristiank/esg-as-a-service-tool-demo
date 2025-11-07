# Runbook – C10 Upstream leasede aktiver

Denne runbook beskriver, hvordan modul C10 estimerer emissioner fra upstream leasede aktiver via kombinationen af areal- og energidata.

## Formål

- Samle dokumentation for leasede bygninger/aktiver, hvor virksomheden er ansvarlig for energiforbruget.
- Understøtte både direkte energimålinger og estimering fra areal med standardintensiteter.
- Fremhæve datakvalitet gennem procentbaserede vurderinger, så revision og support kan prioritere opfølgning.

## Arbejdsgang i UI

1. Tilføj én eller flere linjer i [C10-step-komponenten](../../apps/web/features/wizard/steps/C10.tsx).
2. Vælg energitype (elektricitet eller varme), og udfyld enten areal eller energiforbrug. Begge felter kan udfyldes for at dokumentere input.
3. Justér emissionsfaktor og dokumentationskvalitet pr. linje efter behov. Felterne er forudfyldt med standardværdier fra `c10EnergyConfigurations`.
4. Resultatkortet viser ton CO₂e, antagelser, advarsler og teknisk trace for hver linje, så brugere kan verificere beregningen.

## Beregningslogik

- Implementeret i [runC10-funktionen](../../packages/shared/calculations/modules/runC10.ts).
- For hver linje vælges energitypen, og manglende energiforbrug beregnes som `floorAreaSqm × standardintensitet`.
- Emissioner pr. linje = `energi (kWh) × emissionsfaktor`. Summen konverteres til ton CO₂e med `factors.c10.kgToTonnes`.
- Dokumentationskvalitet anvendes til warnings: værdier under `lowDocumentationQualityThresholdPercent` udløser en besked.
- Input normaliseres: negative tal erstattes af 0, manglende værdier bruger standarder, og ugyldige energityper falder tilbage til elektricitet.
- Understøttende formler findes i [ESG-formula-mappet](../../packages/shared/schema/esg-formula-map.json), mens feltdefinitioner ligger i [`c10InputSchema`](../../packages/shared/schema/index.ts).

## Kvalitetssikring

- Felter, defaultværdier og begrænsninger er defineret i [`C10Input`-schemaet](../../packages/shared/schema/esg-input-schema.json) og eksporteres fra [schemaindekset](../../packages/shared/schema/index.ts).
- Beregningen dækkes i [`runModule.spec.ts`](../../packages/shared/calculations/__tests__/runModule.spec.ts), som opretter både glade scenarier og edge cases for modul C10.
- Wizardtrinnet bygger oven på [`StepTemplate`](../../apps/web/features/wizard/steps/StepTemplate.tsx) og understøtter manuelle QA-tjek fra [baseline-guiden](../quality/baseline.md), hvor support gennemgår warnings og trace.
- Før release skal `pnpm lint`, `pnpm typecheck` og `pnpm test` være grønne, så beregning og præsentation er stabil før produktion.

## Videreudvikling

- Tilføj flere energityper (fx damp eller køling) med egne standardintensiteter og faktorprofiler.
- Udbyg warnings med forslag til datakilder, når dokumentationskvaliteten er lav.
- Integrér upstream leasede aktiver med facility management-systemer for at automatisere inputopdateringer.
