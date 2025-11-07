# Scope 3 modulreference – C15 screening af øvrige kategorier

Denne modulreference beskriver det fuldt implementerede C15-modul, der
støtter spend- og aktivitetsbaserede screeninger for Scope 3-kategorier,
som endnu ikke har deres egne detaljerede moduler. Dokumentet samler
inputfelter, standardantagelser, beregningslogik og UI-adfærd, så
organisationen kan kvalificere restposter og prioritere videre
udvikling.

## Inputfelter
- **Screening lines**: Op til 40 linjer kan registreres.
  - **Kategori** – vælg Scope 3-kategori 1–15.
  - **Beskrivelse/metode** – kort tekstfelt til metode, afgrænsning eller
    datakilde (maks. 240 tegn).
  - **Enhed** – frit tekstfelt til at angive om mængden opgøres i DKK,
    ton, km osv. (maks. 32 tegn).
  - **Estimeret mængde** – talfelt for spend/mængde i den valgte enhed.
  - **Faktor** – udvalg af standardiserede screeningsfaktorer for hver
    kategori.
  - **Dokumentationskvalitet (%)** – anvendes til at flagge linjer med
    lav revisionssikkerhed.

## Standardantagelser og valideringer

| Kategori | Beskrivelse | Enhed | Faktor |
| --- | --- | --- | --- |
| 1 | Indkøbte varer og services | kg CO₂e/DKK | 0,28 |
| 2 | Kapitalgoder | kg CO₂e/DKK | 0,22 |
| 3 | Brændstof- og energirelaterede emissioner (upstream) | kg CO₂e/kWh | 0,16 |
| 4 | Upstream transport og distribution | kg CO₂e/tonkm | 0,12 |
| 5 | Affald fra drift | kg CO₂e/ton | 320 |
| 6 | Forretningsrejser | kg CO₂e/km | 0,15 |
| 7 | Medarbejderpendling | kg CO₂e/km | 0,12 |
| 8 | Upstream leasede aktiver | kg CO₂e/kWh | 0,18 |
| 9 | Downstream transport og distribution | kg CO₂e/tonkm | 0,11 |
| 10 | Forarbejdning af solgte produkter | kg CO₂e/ton | 410 |
| 11 | Brug af solgte produkter | kg CO₂e/enhed | 120 |
| 12 | End-of-life for solgte produkter | kg CO₂e/ton | 540 |
| 13 | Downstream leasede aktiver | kg CO₂e/kWh | 0,17 |
| 14 | Franchises | kg CO₂e/DKK | 0,24 |
| 15 | Investeringer | kg CO₂e/DKK | 0,35 |

- Manglende kategori antages som kategori 1 (indkøbte varer og services).
- Manglende eller ukendt emissionsfaktor erstattes automatisk med
  standardværdien for den valgte kategori.
- Estimerede mængder må ikke være negative; ugyldige eller manglende
  værdier erstattes med 0 og udelades fra beregningen.
- Dokumentationskvalitet skal ligge mellem 0 og 100 %. Manglende værdier
  sættes til 100 %, værdier over 100 % begrænses, og værdier under 0 %
  sættes til 0.
- Dokumentationskvalitet under 60 % flagges som lav kvalitet i UI og
  warnings.

## Beregning
1. Hver linje multiplicerer den estimerede mængde med den valgte
   emissionsfaktor for at få emissioner i kg CO₂e.
2. Resultatet konverteres til ton CO₂e via faktoren 0,001.
3. Alle linjer summeres og afrundes til tre decimaler.

## Output og sporbarhed
- Resultatet returneres i ton CO₂e (tre decimaler).
- Trace-listen viser kategori, beskrivelser, enheder, mængder,
  emissionsfaktorer, dokumentationskvalitet og linjeemissioner.
- Warnings dækker:
  - Ukendte kategorier og faktorer.
  - Manglende, negative eller ugyldige mængder.
  - Manglende, ugyldig eller lav dokumentationskvalitet.

## UI-overblik
- Wizardtrinnet stiller dynamiske screeninglinjer til rådighed med
  dropdowns for kategori og faktor samt felter for metodebeskrivelser og
  enheder.
- Resultatkortet viser beregnet værdi, antagelser, warnings og teknisk
  trace, så brugerne kan validere data inden eksport.
- En "Tilføj screeninglinje"-knap gør det let at udvide registret, og
  hver linje kan fjernes individuelt uden at påvirke øvrige registreringer.
