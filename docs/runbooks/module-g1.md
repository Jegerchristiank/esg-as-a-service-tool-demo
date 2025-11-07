# Runbook – G1 governance-politikker & targets

Modulet vurderer governance-setup via politikker, targets og bestyrelsestilsyn. Outputtet er en governance-score (0-100).

## Inputfelter

- **Politikker** – liste med navn, status (approved/inReview/draft/retired/missing), ejer og seneste review.
- **Targets** – liste med navn, baselineår, målår, værdi, enhed, status (onTrack/lagging/offTrack/notStarted) og narrativ.
- **Bestyrelsestilsyn** – ja/nej/ikke angivet.
- **Narrativ governance** – tekst om roller, incitamenter og planer.

## Beregningsoverblik

1. Politikscore (40 %) – status oversættes til 0-1 og skaleres med antal politikker vs. minimum (5).
2. Targetscore (40 %) – status skaleres på samme måde.
3. Bestyrelsestilsyn (20 %) – fuld score for ja, baseline for "ikke angivet".
4. Warnings udsendes ved manglende ejere, manglende status og målsætninger hvor målår ≤ baselineår.

## QA og test

- Unit-testen `runG1` i `runModule.spec.ts` dækker et scenarie med kombinerede politikker og targets samt warnings.
- `G1Step` giver formularer til både politikker og targets samt narrativ felt.
- `g1InputSchema` sikrer validering af status-felter og tekstlængder – opdater schemaer og test ved ændringer.

## CSRD/XBRL-eksport

- Optællinger og gennemsnit eksponeres som ESRS G1-fakta (`G1PolicyCount`, `G1PolicyAverageScore` osv.).
- `G1GovernanceNarrative` gengiver tekstfeltet om roller og incitamenter som del af ESRS-rapporteringen.
- Politikker og targets serialiseres som tabeller (`G1PoliciesTable`, `G1TargetsTable`), så hver række kan efterprøves i XBRL.
