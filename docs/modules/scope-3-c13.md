# Scope 3 modulreference – C13 investeringer og finansielle aktiviteter

Denne modulreference beskriver det fuldt implementerede C13-modul, som
beregner Scope 3-emissioner fra investeringer og finansielle aktiviteter.
Dokumentet sikrer, at produkt, dataejere og assurance-teamet har et fælles
udgangspunkt for input, antagelser, valideringer og brugeroplevelsen i
wizard-trinnet.

## Inputfelter
- **Investment lines**: Op til 30 investeringer kan registreres.
  - **Beløb investeret (DKK)** – kapitalen der er placeret i den konkrete
    portefølje eller investering.
  - **Emissionsfaktor** – vælges fra en liste over typiske
    emissionsintensiteter (kg CO₂e/DKK) for aktiver og fonde.
  - **Dokumentationskvalitet (%)** – bruges til at flagge linjer med lavt
    revisionsgrundlag.

## Standardantagelser og valideringer

| Option | Emissionsfaktor |
| --- | --- |
| Børsnoterede aktier | 0,00028 kg CO₂e/DKK |
| Virksomhedsobligationer | 0,00019 kg CO₂e/DKK |
| Statsobligationer | 0,00012 kg CO₂e/DKK |
| Unoteret kapital (private equity) | 0,00045 kg CO₂e/DKK |
| Ejendomsinvesteringer | 0,00036 kg CO₂e/DKK |
| Infrastrukturfonde | 0,00040 kg CO₂e/DKK |
| Diversificeret portefølje | 0,00025 kg CO₂e/DKK |

- Investeringer må ikke være negative. Negative værdier sættes til 0, og
  linjen udelades fra beregningen.
- Manglende eller ukendte emissionsfaktorer erstattes af standarden for
  børsnoterede aktier (0,00028 kg CO₂e/DKK) med tydelig advarsel.
- Dokumentationskvalitet skal ligge mellem 0 og 100 %. Manglende værdier
  sættes til 100 %, værdier over 100 % begrænses og værdier under 0 %
  sættes til 0.
- Dokumentationskvalitet under 60 % flagges som lav kvalitet i UI og
  warnings.

## Beregning
1. For hver investering multipliceres beløbet (DKK) med den valgte
   emissionsfaktor (kg CO₂e/DKK) for at finde emissioner i kg.
2. Emissioner summeres og konverteres til ton CO₂e via faktoren 0,001.
3. Resultatet afrundes til tre decimaler.

## Output og sporbarhed
- Outputtet rapporteres i ton CO₂e med tre decimalers præcision.
- Trace-listen viser beløb, valgte faktorer, dokumentationskvalitet og
  beregnede kg/ton pr. linje samt totalsummer.
- Warnings dækker:
  - Negative eller manglende beløb.
  - Manglende eller ukendte emissionsfaktorer.
  - Manglende, ugyldig eller lav dokumentationskvalitet.

## UI-overblik
- Wizardtrinnet tilbyder dynamiske rækker med investeringsbeløb,
  emissionsfaktor-dropdown og dokumentationskvalitet.
- Resultatkortet viser beregnet værdi, antagelser, warnings og teknisk
  trace, så brugere kan validere data inden eksport.
- Knappen “Tilføj investering” gør det nemt at tilføje flere linjer, og
  hver linje kan fjernes individuelt uden at påvirke øvrige data.
