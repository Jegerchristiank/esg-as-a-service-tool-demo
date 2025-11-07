# Runbook – S1 arbejdsstyrke & headcount

Modulet samler kvantitative headcount-data og kvalitative noter om arbejdsstyrken. Outputtet er en social score på 0-100, hvor
headcount, segmentering, datadækning og faglig repræsentation vægtes.

## Inputfelter

- **Rapporteringsår** – valgfrit årstal (bruges kun til dokumentation).
- **Total headcount** og **total FTE** – samlet antal medarbejdere og fuldtidsekvivalenter.
- **Gns. ugentlige arbejdstimer** – anvendes til ESRS datapunkt om arbejdstid.
- **Datadækning (%)** – hvor stor en andel af arbejdsstyrken der er dækket af data.
- **Segmenteret headcount** – liste over segmenter med headcount, kønsfordeling og dækning af kollektive aftaler.
- **Ansættelsesformer/FTE** og **beskæftigelsesstatus** – bruges til at bygge totals for kontrakt- og statusopdelte headcounts.
- **Narrativ kontekst** – kort tekst om udvikling og dialog med medarbejderrepræsentanter.

## Beregningsoverblik

1. Scoren starter med 35 % for udfyldt total headcount.
2. Segmenteringen vægter 35 % og når fuldt udbytte ved mindst fire segmenter.
3. Datadækning vægter 20 % (normaliseret 0-100 %).
4. Dækning af kollektive aftaler vægter 10 % (gennemsnitligt niveau på tværs af segmenter).
5. Warnings genereres for lav datadækning, lave fagforeningsandele og skæv kønsfordeling per segment.

## QA og test

- Unit-testen `runS1` i `runModule.spec.ts` dækker både normal scenarie og warnings for skæv kønsfordeling.
- UI-skridtet `S1Step` understøtter både tal og narrativer og viser preview af resultatet.
- Ved nye felter tilføjes tilsvarende felter i `s1InputSchema` og run-modulet.

## CSRD/XBRL-eksport

- `S1TotalHeadcount`, `S1TotalFte`, `S1AverageWeeklyHours` samt kontrakt/status-totals eksporteres som ESRS S1-fakta.
- Segmentfordeling og ansættelseslister serialiseres som JSON under `S1HeadcountBreakdownTable`, `S1EmploymentContractBreakdownTable` og `S1EmploymentStatusBreakdownTable`.
