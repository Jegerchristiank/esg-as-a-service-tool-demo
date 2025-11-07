# Scope 3 modulreference – C14 behandling af solgte produkter

Denne modulreference beskriver det fuldt implementerede C14-modul, som
beregner Scope 3-emissioner fra den efterfølgende behandling af solgte
produkter. Dokumentet samler produkt-, data- og assuranceperspektiver så
teamet har et fælles udgangspunkt for input, antagelser og valideringer.

## Inputfelter
- **Treatment lines**: Op til 30 behandlingslinjer kan registreres.
  - **Behandlingstype** – vælges som genanvendelse, forbrænding eller deponi.
  - **Tonnage behandlet (ton)** – mængden af produkt der gennemgår den valgte behandling.
  - **Emissionsfaktor** – branchespecifik faktor (kg CO₂e/ton) for den konkrete behandling.
  - **Dokumentationskvalitet (%)** – bruges til at flagge linjer med lav revisionssikkerhed.

## Standardantagelser og valideringer

| Option | Behandlingstype | Emissionsfaktor |
| --- | --- | --- |
| Genanvendelse – blandet fraktion | Genanvendelse | 200 kg CO₂e/ton |
| Genanvendelse – høj kvalitet | Genanvendelse | 120 kg CO₂e/ton |
| Forbrænding med energiudnyttelse | Forbrænding | 650 kg CO₂e/ton |
| Forbrænding uden energiudnyttelse | Forbrænding | 900 kg CO₂e/ton |
| Deponi – kontrolleret anlæg | Deponi | 1.000 kg CO₂e/ton |
| Deponi – ukontrolleret anlæg | Deponi | 1.400 kg CO₂e/ton |

- Ukendt behandlingstype antages som genanvendelse.
- Manglende eller ukendt emissionsfaktor erstattes af standarden for den
  valgte behandlingstype.
- Dokumentationskvalitet skal ligge mellem 0 og 100 %. Manglende værdier
  sættes til 100 %, værdier over 100 % begrænses og værdier under 0 %
  sættes til 0.
- Dokumentationskvalitet under 60 % flagges som lav kvalitet i UI og
  warnings.
- Negativ eller manglende tonnage giver advarsel og udelades fra
  beregningen.

## Beregning
1. For hver linje multipliceres tonnagen (ton) med den valgte
   emissionsfaktor (kg CO₂e/ton) for at finde emissioner i kg.
2. Emissioner summeres og konverteres til ton CO₂e via faktoren 0,001.
3. Resultatet afrundes til tre decimaler.

## Output og sporbarhed
- Outputtet rapporteres i ton CO₂e med tre decimalers præcision.
- Trace-listen viser tonnage, valgt behandlingstype, emissionsfaktor,
  dokumentationskvalitet og beregnet kg/ton pr. linje samt totalsummer.
- Warnings dækker:
  - Negative eller manglende tonnager.
  - Manglende, ukendte eller inkompatible emissionsfaktorer.
  - Manglende, ugyldig eller lav dokumentationskvalitet.

## UI-overblik
- Wizardtrinnet tilbyder dynamiske linjer med behandlingstype,
  tonnagefelt, emissionsfaktor-dropdown og dokumentationskvalitet.
- Resultatkortet viser beregnet værdi, antagelser, warnings og teknisk
  trace, så brugere kan validere data inden eksport.
- Knappen “Tilføj behandlingslinje” gør det nemt at udvide registret, og
  hver linje kan fjernes individuelt uden at påvirke øvrige data.
