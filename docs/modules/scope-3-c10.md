# Scope 3 modulreference – C10 upstream leasede aktiver

> Se også [runbooken for C10](../runbooks/module-c10.md) for en trin-for-trin guide til formål, UI-flow og QA.

Denne reference supplerer de eksisterende Scope 3-moduler med detaljer for C10, der nu beregner
upstream leasede aktiver. Brug dokumentet til at afstemme dataindsamling, valideringer og
forventede advarsler mellem produkt, dataejere og assurance.

## Inputfelter

- **Leased asset lines**: Op til 20 linjer kan registreres.
  - **Energitype** (`electricity` eller `heat`) styrer standardintensitet og emissionsfaktor.
  - **Areal (m²)** anvendes som fallback til at beregne energi, når kWh ikke er kendt.
  - **Energiforbrug (kWh)** har forrang, hvis værdien er angivet.
  - **Emissionsfaktor (kg CO₂e/kWh)** kan overstyres pr. linje. Tomme felter bruger standardværdier.
  - **Dokumentationskvalitet (%)** bruges til at flagge linjer med lavt revisionsniveau.

## Standardantagelser og valideringer

| Element                                | Elektricitet | Varme |
| -------------------------------------- | ------------ | ----- |
| Standardintensitet (kWh/m²)            | 95           | 80    |
| Standard emissionsfaktor (kg CO₂e/kWh) | 0,18         | 0,07  |
| Dokumentationskvalitet (standard)      | 100          | 100   |

- Felter for areal, energi, emissionsfaktor og dokumentationskvalitet valideres til ikke-negative værdier.
- Manglende værdier behandles som 0 (eller standard) og udløser en advarsel i resultatet.
- Dokumentationskvalitet begrænses til intervallet 0–100 %. Værdier under 60 % markeres som lav kvalitet.
- Hvis både areal og energiforbrug mangler/er 0, udelades linjen fra beregningen.

## Beregning

1. For hver linje vælges den effektive energi:
   - Hvis `energyConsumptionKwh` er >0 anvendes værdien direkte.
   - Ellers beregnes `floorAreaSqm × standardintensitet` baseret på energitypen.
2. Emissioner pr. linje = `energi (kWh) × emissionsfaktor`.
3. Totalen summeres på kg og konverteres til ton CO₂e via faktoren 0,001.
4. Resultatet afrundes til tre decimaler.

## Output og sporbarhed

- Outputtet rapporteres i ton CO₂e (tre decimaler).
- Trace-listen dokumenterer:
  - Sanitiserede inputværdier for hver linje.
  - Om energien kommer fra indtastede kWh eller arealestimat (`energyBasis`).
  - Udregnet energi, emissioner i kg og ton samt totalsummer.
- Warnings indeholder:
  - Manglende felter, der er sat til standardværdier.
  - Lav dokumentationskvalitet (under 60 %).
  - Linjer der er blevet udeladt pga. manglende data.

## UI-overblik

- Wizardtrinnet tilbyder dynamiske linjer med mulighed for at tilføje/fjerne aktiver.
- Feltet for energitype skifter placeholder for emissionsfaktoren til den relevante standard.
- Resultatkortet viser antagelser, warnings og trace direkte, så brugere kan validere input inden eksport.
