# Scope 3 modulreference – C12 franchising og downstream services

Denne reference beskriver det nye C12-modul, som dækker emissioner fra franchiserede
aktiviteter og downstream services, hvor virksomheden fortsat har kontrol over brand,
processer eller energiforsyning. Dokumentet giver produkt, dataejere og assurance et
fælles overblik over input, valideringer, antagelser og brugeroplevelsen.

## Inputfelter
- **Franchise lines**: Op til 20 linjer kan registreres.
  - **Aktivitetsbasis** (`revenue` eller `energy`) bestemmer om linjen baseres på
    omsætning (DKK) eller energiforbrug (kWh).
  - **Omsætning (DKK)** anvendes direkte, når basis er omsætning.
  - **Energiforbrug (kWh)** anvendes direkte, når basis er energi.
  - **Emissionsfaktor** vælges fra en branchespecifik dropdown. Mangler valg, bruges
    standardværdien for den valgte basis.
  - **Dokumentationskvalitet (%)** flagger linjer med svag dokumentation.

## Standardantagelser og valideringer

| Basis | Option | Emissionsfaktor |
| --- | --- | --- |
| Omsætning | Detailhandel | 0,00035 kg CO₂e/DKK |
| Omsætning | Fødevare- og servicefranchises | 0,00052 kg CO₂e/DKK |
| Omsætning | Hotel & oplevelse | 0,00042 kg CO₂e/DKK |
| Omsætning | Anden franchise | 0,00030 kg CO₂e/DKK |
| Energi | Elektricitet | 0,18 kg CO₂e/kWh |
| Energi | Fjernvarme | 0,07 kg CO₂e/kWh |
| Energi | Branchemix | 0,12 kg CO₂e/kWh |

- Omsætning, energiforbrug og dokumentationskvalitet må ikke være negative.
- Emissionsfaktorer skal matche den valgte basis. Ved mismatch eller manglende værdi
  anvendes standarden for basis og brugeren informeres.
- Dokumentationskvalitet begrænses til 0–100 %. Værdier under 60 % markeres som lav kvalitet.
- Linjer uden gyldig omsætning/energi udelades fra beregningen.

## Beregning
1. For hver linje identificeres basis (`revenue` eller `energy`).
2. Det relevante input (omsætning i DKK eller energiforbrug i kWh) multipliceres med
   den valgte branchespecifikke emissionsfaktor (kg CO₂e/DKK eller kg CO₂e/kWh).
3. Emissionerne summeres i kg og konverteres til ton CO₂e ved faktoren 0,001.
4. Resultatet afrundes til tre decimaler.

## Output og sporbarhed
- Outputtet rapporteres i ton CO₂e med tre decimalers præcision.
- Trace-listen viser aktivitetsbasis, anvendt emissionsfaktor og beregnede kg/ton pr. linje
  samt totalsummer.
- Warnings dækker:
  - Manglende eller negative input, der er sat til 0.
  - Manglende eller mismatch på emissionsfaktor.
  - Lav dokumentationskvalitet (<60 %).
  - Linjer der er udeladt pga. manglende data.

## UI-overblik
- Wizardtrinnet tilbyder dynamiske rækker med valg af basis og branchespecifikke
  emissionsfaktorer.
- Dropdownen opdateres automatisk, så kun faktorer relevante for den valgte basis vises.
- Estimatpanelet viser værdi, antagelser, warnings og teknisk trace, så brugere kan
  validere data før eksport.
