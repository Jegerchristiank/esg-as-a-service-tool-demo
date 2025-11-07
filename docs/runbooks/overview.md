# Runbook-overblik

Denne oversigt samler alle modulrunbooks og den anbefalede gennemførelsesrækkefølge, så support og produkt hurtigt kan finde den rette dokumentation.

| Rækkefølge | Modul                          | Fokus                                                                 | Runbook                          |
| ---------- | ------------------------------ | ---------------------------------------------------------------------- | -------------------------------- |
| 1          | B1 – Scope 2 elforbrug         | Indtast elforbrug, faktor og vedvarende andel for netto ton CO₂e.      | [module-b1.md](module-b1.md)     |
| 2          | C10 – Upstream leasede aktiver | Registrér leasede aktiver med areal-/energidata og datakvalitet.       | [module-c10.md](module-c10.md)   |
| 3          | E1 – Klimamål og handlinger    | Saml ESRS E1-mål, ansvarlige og actionplaner til intensiteter og mix. | [module-e1targets.md](module-e1targets.md) |
| 4          | D1 – Metode & governance       | Dokumentér governance-metoder og strategi for compliance-score.       | [module-d1.md](module-d1.md)     |
| 5          | S1 – Arbejdsstyrke & headcount | Registrér headcount, segmenter og faglig repræsentation for social score. | [module-s1.md](module-s1.md)     |
| 6          | S2 – Værdikædearbejdere        | Registrér risikovurdering, sociale audits og hændelser i leverandørleddet. | [module-s2.md](module-s2.md)     |
| 7          | S3 – Lokalsamfund              | Dokumentér impacts, klager og afhjælpning for berørte lokalsamfund.   | [module-s3.md](module-s3.md)     |
| 8          | S4 – Forbrugere & slutbrugere  | Saml produkt-risikovurdering, klageprocesser og alvorlige hændelser.  | [module-s4.md](module-s4.md)     |
| 9          | G1 – Governance-politikker     | Saml politikker, targets og bestyrelsestilsyn for governance-score.   | [module-g1.md](module-g1.md)     |

> Brug oversigten som indgang til både UI-flow, beregningslogik og QA-krav for hvert modul.

## ESRS-review og eksport

- Review-siden konsoliderer resultater i fem ESRS-sektioner: generelle oplysninger (D1/D2), politikker og governance (G1/S4), mål (E1 Targets), metrics pr. standard (miljø/social/governance) samt dobbelt væsentlighed.
- Alle moduler eksponerer nu narrativer, ansvar og noter, så support kan validere både tekst og tal for hvert modul.
- D2-modulet leverer en detaljeret dobbelt væsentlighedsoversigt med gap-advarsler, tidslinjer og ansvarlige. Anvend denne ved kundesupport til at identificere dokumentationsgaps.
- Eksporteringslaget mappe de miljø-, sociale og governance-moduler til ESRS XBRL-fakta (vand E2, forurening E3, biodiversitet E4, ressourcer E5, S1-S4, G1, D1 og D2) samt genererer tabellerne som JSON-text blocks.
- Ændringslog og ansvarssporing gemmes automatisk pr. felt. Historikken følger med i PDF-, CSRD- og XBRL-eksporter samt i API-indsendelser.
- Eksport-knapper på review-siden kan hente PDF, CSRD JSON, XBRL og sende rapporten til en ekstern myndighedsendpoint (konfigurer `NEXT_PUBLIC_REPORT_API_ENDPOINT`).
