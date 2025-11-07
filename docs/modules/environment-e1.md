# ESRS E1 – kontekst- og transitionsmoduler

Disse moduler supplerer beregningerne for ESRS E1 ved at beskrive kontekst, scenarier og drivere bag klimamålene.

## E1 – Klimascenarier
- **Formål:** dokumentere hvilke klimascenarier virksomheden anvender til risikovurdering.
- **Inputfelter:** navn, udbyder, scenarietype (`netZero15`, `wellBelow2`, `currentPolicies`, `stressTest`, `custom`), tidshorisont og dækningsgrad.
- **Beregning:** antallet af scenarier udgør modulværdien. Dækningsgrader normaliseres (0–100 %) og bruges til gennemsnitsmetrikker. Narrative felter samles til ESRS tekstblok.
- **ESRS mapping:**
  - `esrs:DiverseRangeOfClimateScenarios…` (boolean) sættes ud fra om flere typer er dækket.
  - `esrs:DisclosureOfHowDiverseRangeOfClimateScenarios…Explanatory` modtager narrativet.

## E1 – Interne CO₂-priser
- **Formål:** samle interne CO₂-prisordninger og deres dækning.
- **Inputfelter:** ordningsnavn, scope, pris (DKK/tCO₂e), dækningsgrad, anvendelsesområder (capex/opex/investering), alignment med finansielle antagelser og metodebeskrivelse.
- **Beregning:** gennemsnitspris og dækningsgrad beregnes på tværs af ordninger. Checkbokse konverteres til booleans.
- **ESRS mapping:**
  - `esrs:CarbonPriceAppliedForEachMetricTonneOfGreenhouseGasEmission` (DKK).
  - `esrs:CarbonPriceUsedInInternalCarbonPricingSchemeIsConsistentWithCarbonPriceUsedInFinancialStatements` (boolean).
  - `esrs:DescriptionOfCriticalAssumptionsMadeToDetermineCarbonPriceAppliedExplanatory` (tekstblok).

## E1 – Risikogeografi
- **Formål:** beskrive geografiske hotspots for fysisk og transitionrisiko.
- **Inputfelter:** geografi, risikotype (`acutePhysical`, `chronicPhysical`, `transition`), tidshorisont, aktiver i risiko (DKK), omsætning i risiko (DKK) og narrativ.
- **Beregning:** summerer eksponeringer pr. risikokategori og stiller dem til rådighed som metrikker og ESRS facts.
- **ESRS mapping:**
  - `esrs:CarryingAmountOfAssetsAtMaterialPhysicalRisk` og `esrs:NetRevenueAtMaterialPhysicalRisk`.
  - `esrs:CarryingAmountOfAssetsAtMaterialTransitionRisk` og `esrs:NetRevenueAtMaterialTransitionRisk`.
  - `esrs:DisclosureOfLocationOfSignificantAssetsAtMaterialPhysicalRiskExplanatory` for narrativet.

## E1 – Decarboniseringsdrivere
- **Formål:** opsamle centrale initiativer og deres forventede effekter.
- **Inputfelter:** drivertype (`energyEfficiency`, `renewableEnergy`, `processInnovation`, `fuelSwitching`, `carbonCapture`, `valueChainEngagement`, `other`), navn, forventet reduktion (tCO₂e), investering (DKK), startår og beskrivelse.
- **Beregning:** total forventet reduktion og investering summeres. Drivertyper aggregeres til ESRS enumeration.
- **ESRS mapping:**
  - `esrs:DecarbonisationLeverTypes` (enumeration-string) med de anvendte levers.
  - `esrs:DescriptionOfExpectedDecarbonisationLeversAndTheirOverallQuantitativeContributionsToAchieveGHGEmissionReductionTargetExplanatory` for narrativ.
  - `esrs:TargetsRelatedToClimateChangeMitigationAndAdaptationGHGEmissionsReductionTargetsByDecarbonisationLeversTable` modtager JSON-tabellen med drivere.
