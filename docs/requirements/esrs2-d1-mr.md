# Kravmatrix – ESRS 2 D1 & MR

Denne matrix beskriver de konkrete evalueringskriterier, som `runD1` og `runMR` anvender til at klassificere input som **opfyldt** eller **mangler**. Den kan bruges som udgangspunkt for reviews, testcases og auditerbar dokumentation af ESRS 2-compliance.

## ESRS 2 D1 – Metode og governance

| Krav-id | ESRS-reference | Beskrivelse | Acceptkriterier | Output i løsning |
| --- | --- | --- | --- | --- |
| D1-REQ-01 | ESRS 2 §68 (a) | Metodegrundlag dokumenteret | Organisatorisk afgrænsning, Scope 2-metode og dominerende datakvalitet skal være udfyldt. Proxy-data giver advarsel men kan godtgøres hvis planlagt opgradering beskrives. | Kravstatus i `ModuleResult.metrics`, trace for feltvalg og evt. advarsel om proxy/afgrænsning. |
| D1-REQ-02 | ESRS 2 §68 (b) & (c) | Scope 3-screening og horisonter | Scope 3-screening skal være markeret som gennemført, værdikædedækning skal omfatte både upstream og downstream, og analyser skal dække mindst mellem og lang sigt. | Kravstatus inkl. detalje om dækkede horisonter samt advarsler ved delvis værdikædedækning. |
| D1-REQ-03 | ESRS 2 §69 (a) | Væsentlighedsvurdering | Narrativ om væsentlighed skal være ≥200 tegn og beskrive resultater/metode. | Kravstatus + trace over tekstlængde. |
| D1-REQ-04 | ESRS 2 §69 (b) | Strategi & integration | Strategi-sammendrag skal være ≥200 tegn og mindst tre delbeskrivelser (forretningsmodel, integration, robusthed, stakeholder) ≥150 tegn. | Kravstatus + advarsler hvis nøgleelementer mangler. |
| D1-REQ-05 | ESRS 2 §69 (c) | Governance-roller & tilsyn | Mindst fire governance-dimensioner (tilsyn, roller, kompetencer, incitamenter, politikker) skal være ≥150 tegn, og ESG-udvalg skal være angivet (ja/nej). | Kravstatus og advarsel hvis ingen ESG-udvalg er etableret. |
| D1-REQ-06 | ESRS 2 §69 (d) | Proces for impacts/risici/muligheder | Min. tre procesfelter ≥150 tegn (proces, prioritering, integration, mitigation). | Kravstatus + trace over proceslængder. |
| D1-REQ-07 | ESRS 2 §70 | Mål, opfølgning og KPI’er | Governance- og fremdriftsnarrativer ≥150 tegn, kvantitative mål markeret som “ja”, samt mindst én KPI med baseline og mål. | Kravstatus + advarsler hvis kvantitative mål/KPI-data mangler. |

## ESRS 2 MR – Metrics og targets

| Krav-id | ESRS-reference | Beskrivelse | Acceptkriterier | Output i løsning |
| --- | --- | --- | --- | --- |
| MR-REQ-01 | ESRS 2 §72 (a) | Intensiteter og udvikling | Narrativ ≥200 tegn beskriver udvikling i klimarelaterede intensiteter. | Kravstatus + trace over tekstlængde. |
| MR-REQ-02 | ESRS 2 §72 (b) | Mål og status | Narrativ ≥200 tegn forklarer fremdrift på klimamål/KPI’er. | Kravstatus + trace. |
| MR-REQ-03 | ESRS 2 §72 (c) | Datakvalitet | Narrativ ≥200 tegn dokumenterer kontroller og datakilder. | Kravstatus + trace. |
| MR-REQ-04 | ESRS 2 §72 (d) | Assurance | Narrativ ≥200 tegn beskriver intern/ekstern assurance. | Kravstatus + trace. |
| MR-REQ-05 | ESRS 2 §73 | Overgangsplan | Enten narrativ ≥200 tegn eller mindst ét overgangstiltag med status/milepæl/investering. | Kravstatus + advarsler pr. mangelfuldt tiltag. |
| MR-REQ-06 | ESRS 2 §74 | Finansielle effekter | Enten narrativ ≥200 tegn eller registrerede finansielle effekter med beløb/beskrivelse. | Kravstatus + advarsler for manglende detaljer. |
| MR-REQ-07 | ESRS 2 §75 | Klimarelaterede metrics | Mindst én metric med baseline+værdi, aktuel status eller mål beskrevet. | Kravstatus + noteopbygning for metrics. |
| MR-REQ-08 | ESRS E1 §80 | GHG-removal projekter | Hvis projekter er registreret, skal kvantificerede data (ton, lagring, standard) udfyldes; ellers markeres kravet som opfyldt. | Kravstatus + advarsler for ikke-kvantificerede projekter. |

## Afprøvning og tests

- `packages/shared/calculations/__tests__/runModule.spec.ts` dækker både afviste og godkendte scenarier for D1 og MR baseret på ovenstående kriterier.
- UI-komponenterne i `apps/web/features/wizard/steps/D1.tsx` og `MR.tsx` gengiver kravstatus og kontekst, så brugere tydeligt kan se hvilke kriterier der mangler.
- Kravstatus eksporteres via `ModuleResult.metrics` og trace-loggen, så auditører kan følge dokumentationen tilbage til inputfelterne.
