# Scope 3 modulreference – C11 downstream leasede aktiver

Denne reference beskriver det nye C11-modul, som dækker emissioner fra aktiver virksomheden
leaser ud til kunder (downstream). Dokumentet hjælper produkt, dataejere og assurance med at
forstå input, valideringer, antagelser og brugeroplevelsen.

## Inputfelter
- **Leased asset lines**: Op til 20 linjer kan registreres.
  - **Energitype** (`electricity` eller `heat`) bestemmer standardintensitet og emissionsfaktor.
  - **Areal (m²)** anvendes som fallback, når energiforbruget ikke er kendt.
  - **Energiforbrug (kWh)** anvendes direkte, hvis det er angivet.
  - **Emissionsfaktor (kg CO₂e/kWh)** kan overstyres pr. linje; tomme felter bruger standardværdier.
  - **Dokumentationskvalitet (%)** flagger linjer med svag dokumentation.

## Standardantagelser og valideringer
| Element | Elektricitet | Varme |
| --- | --- | --- |
| Standardintensitet (kWh/m²) | 95 | 80 |
| Standard emissionsfaktor (kg CO₂e/kWh) | 0,18 | 0,07 |
| Dokumentationskvalitet (standard) | 100 | 100 |

- Areal, energi, emissionsfaktor og dokumentationskvalitet må ikke være negative.
- Manglende værdier sættes til 0 eller standard og genererer en advarsel.
- Dokumentationskvalitet begrænses til 0–100 %. Værdier under 60 % markeres som lav kvalitet.
- Linjer uden både areal og energiforbrug udelades fra beregningen.

## Beregning
1. For hver linje bestemmes energibehovet:
   - `energyConsumptionKwh` bruges hvis værdien er >0.
   - Ellers beregnes `floorAreaSqm × standardintensitet` for den valgte energitype.
2. Emissioner pr. linje = `energi (kWh) × emissionsfaktor`.
3. Emissionerne summeres i kg og konverteres til ton CO₂e via faktoren 0,001.
4. Resultatet afrundes til tre decimaler.

## Output og sporbarhed
- Outputtet rapporteres i ton CO₂e med tre decimalers præcision.
- Trace-listen viser:
  - Sanitiserede input for hver linje.
  - Om energien bygger på rapporterede kWh eller arealestimat (`energyBasis`).
  - Beregnet energi, emissioner i kg/ton og totalsummer.
- Warnings dækker:
  - Felter der mangler og er sat til standardværdier.
  - Lav dokumentationskvalitet (<60 %).
  - Linjer der er udeladt pga. manglende data.

## UI-overblik
- Wizardtrinnet tilbyder dynamiske rækker som kan tilføjes og fjernes.
- Valg af energitype opdaterer placeholderen for emissionsfaktoren med standardværdien.
- Estimatpanelet viser værdien, antagelser, warnings og teknisk trace, så brugere kan validere data før eksport.
