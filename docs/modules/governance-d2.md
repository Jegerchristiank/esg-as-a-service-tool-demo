# Governance modulreference – D2 dobbelt væsentlighed & CSRD-gap

Denne reference opsummerer inputfelter, beregningslogik og UI-adfærd for
modul D2. Modulet hjælper rådgivere og virksomheder med at strukturere
resultaterne fra en dobbelt væsentlighedsvurdering, koble dem til
ansvarlige og tidslinjer samt identificere CSRD-gaps, der kræver
opfølgning.

## Inputfelter

- **Materialitetsemner** – op til 50 rækker kan registreres.
  - **Titel** – navn på emnet (maks. 120 tegn).
  - **Beskrivelse / notat** – valgfri uddybning (maks. 500 tegn).
  - **Risiko eller mulighed** – vælg mellem risiko, mulighed eller begge.
  - **Impact-score** – 0-5 skala for påvirkning af mennesker/miljø.
  - **Finansiel score** – 0-5 skala for finansiel effekt.
  - **Tidslinje** – short-, medium-, long-term eller løbende.
  - **Ansvarlig** – navngiv rolle eller person (maks. 120 tegn).
  - **CSRD-gap status** – aligned, partial eller missing.

## Beregningslogik

1. Emner uden titel eller uden nogen score ignoreres og flagges i
   warnings.
2. Impact- og finansielle scorer vægtes hhv. 60 % og 40 % og danner en
   kombineret prioritetsscore (0-5).
3. Resultatet er gennemsnittet af alle gyldige scorer og skaleres til
   0-100.
4. Emner med score ≥ 4,0 markeres som prioriterede og fremhæves i
   warnings. Manglende tidslinje, ansvarlig eller gap-status på
   prioriterede emner udløser ekstra warnings.
5. Assumptions-liste inkluderer de øverste tre prioriterede emner samt
   emner tæt på tærsklen.

## UI-overblik

- Wizardtrinnet tilbyder dynamiske kort hvor rådgiveren kan tilføje,
  fjerne og redigere materialitetsemner.
- Resultatkortet viser samlet prioritetsscore, antagelser, warnings og en
  detaljeret trace, så man kan dokumentere beslutninger og datagrundlag.
- Når ingen emner er registreret, vises en vejledning om at starte med at
  tilføje væsentlige emner.
- Inputfelter begrænser tekstlængder og scorer til forventede intervaller
  for at understøtte kvalitet i dataindsamlingen.

## CSRD/XBRL-eksport

- Prioriteringer, opmærksomhedsemner og gap-advarsler eksporteres som ESRS D2-fakta (`D2PrioritisedTopicsCount`, `D2GapAlertsCount` m.fl.).
- Hver materialitetspost serialiseres som `D2MaterialTopicsTable`, så kombinerede scorer, tidslinje og ansvarlig kan læses direkte i XBRL.
