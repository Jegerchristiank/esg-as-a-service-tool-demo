# Runbook – Modul D2: Dobbelt væsentlighed

Denne runbook beskriver de nye inputfelter, beregningsmetodikken og rapporteringsudfaldet for modul D2. Målet er, at revisorer
og brugere hurtigt kan validere både scorer og de strukturerede outputs i UI, PDF og eksportlag.

## Inputfelter

Hvert materialitetsemne i D2 indsamler nu følgende:

- **Påvirkningstype** (`actual`/`potential`): bruges som multiplikator på impact-matrixen.
- **Alvor/omfang** (`minor`, `moderate`, `major`, `severe`): vægtes 1-5 efter ESRS’ severity-kategorier.
- **Sandsynlighed** (`rare` → `veryLikely`): vægtes 1-5 i matrixen.
- **Finansiel score** (0-5): normaliseres til 0-100 og indgår kun hvis udfyldt.
- **Begrundet undtagelse** (checkbox + tekstfelt): anvendes når finansiel score ikke kan angives. Kræver en bekræftelse og en
  begrundelse på mindst 20 tegn for at emnet fortsat kan prioriteres.
- **Tidslinje** (`shortTerm`, `mediumTerm`, `longTerm`, `ongoing`): mappes til en vægt (1.00 → 0.70) hvor kort sigt tæller mest.
- **Værdikædeled** (`ownOperations`, `upstream`, `downstream`): bruges i due diligence-sammenfatningen.
- **Eksisterende afhjælpning** (`none`, `planned`, `inPlace`): reducerer impact-matrixen (1.00 → 0.75).
- Øvrige felter (titel, beskrivelse, risikotype, ansvarlig, CSRD-gap) beholdes uændret.

## Beregningsmetode

1. **Validering:** Emner uden titel, alvor eller sandsynlighed ignoreres og logges som warnings.
2. **Impact-matrix:** `severityWeight × likelihoodWeight` (maks 25) multipliceres med modifiers for påvirkningstype og
   afhjælpning. Resultatet skaleres til 0-100.
3. **Finansielle effekter:** Finansiel score clamped til 0-5 og normaliseres til 0-100. Manglende scorer udløser en advarsel og
   reducerer kombinationsscoren med faktor 0.6, medmindre en begrundet undtagelse er bekræftet med tekstligt rationale.
4. **Tidslinje:** Time-horizon oversættes til en vægt (1.00/0.85/0.70/0.90) og skaleres til 0-100. Manglende tidslinje udelades
   fra gennemsnittet og triggere en advarsel for prioriterede emner.
5. **Samlet score:** Impact-, finansiel- og tidslinjedimensioner gennemsnittes dynamisk baseret på tilgængelige dimensioner.
   Resultatet afrundes til én decimal og bruges i:
   - Prioriteret (`≥70`), observation (`50-69.9`) eller monitoreringsbånd. Emner uden finansiel score forbliver i
     monitoreringsbåndet, medmindre undtagelsen er bekræftet.
   - Gennemsnitlig modulscore (`ModuleResult.value` og `D2AverageWeightedScore`).
6. **Due diligence-reference:** Optæller påvirkningstyper, værdikædeled og afhjælpningsstatus for rapportering og PDF.

## Rapporteringsudfald

- **`ModuleResult.doubleMateriality`** indeholder nu:
  - `overview`: totals, prioriterede emner, observationer, gap-advarsler og gennemsnitlig score.
  - `prioritisationCriteria`: tekst der beskriver matrix, finansielle effekter og tidslinjevægtning.
  - `tables.topics`: top-emner inkl. matrixdetaljer, scores, ansvarlige, gap-status og prioriteringsbånd.
  - `tables.impactMatrix`: antal emner per severity × likelihood-kombination.
  - `tables.gapAlerts`: navne på emner med CSRD-gap.
  - `dueDiligence`: summeret påvirkningstype, værdikædeled og afhjælpning.
- **ESRS-tabeller:** `D2MaterialTopicsTable` er udvidet med impact-/likelihoodfelter, prioriteringsbånd, tidslinjescore m.m.
- **UI og PDF:** Reviewkortet og PDF-sektionen viser samme struktur som ovenfor og fremhæver matrix, kriterier, due diligence og gap-advarsler.

## Valideringstrin for revisorer

1. Bekræft at inputfelterne er udfyldt for alvor og sandsynlighed; ellers fremgår emnet ikke af scoringen.
2. Kontrollér at den prioriterede liste matcher severity × likelihood, tidslinje og finansiel score, og at eventuelle
   undtagelser har en begrundelse på mindst 20 tegn.
3. Sammenhold gap-advarsler med `CSRD-gap status` i inputtet.
4. Brug due diligence-sammenfatningen til at verificere værdikædedækning og om afhjælpning er dokumenteret.
5. Krydstjek eksport (`D2MaterialTopicsTable`, `D2GapAlertsTable`) og PDF for at sikre, at struktur og data er konsistente.

Med denne struktur får brugere og revisorer et gennemskueligt output, som følger ESRS’ vejledning for dobbelt væsentlighed og
dokumenterer prioritetslogikken på tværs af kanaler.
