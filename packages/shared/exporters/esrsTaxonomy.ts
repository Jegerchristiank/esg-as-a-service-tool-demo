/**
 * Mapping af anvendte ESRS-konceptnøgler til deres taksonomidefinitioner.
 *
 * Navnene tager udgangspunkt i EFRAGs officielle ESRS XBRL-taksonomi
 * (entry point: https://xbrl.efrag.org/taxonomy/esrs/2023-12-22/esrs_all.xsd).
 */

export type EsrsPeriodType = 'duration' | 'instant'

export type EsrsConceptDefinition = {
  /** Fuldt kvalificeret navn inkl. namespace-præfiks. */
  qname: string
  /** Relevant unit-id fra Unit Type Registry. Udelades for tekstblokke og booleans. */
  unitId?: string | null
  /** Periodetype angivet i taksonomien. */
  periodType: EsrsPeriodType
}

export const esrsNamespace = 'https://xbrl.efrag.org/taxonomy/esrs/2023-12-22'

export const esrsConceptDefinitions = {
  scope1: {
    qname: 'esrs:GrossScope1GreenhouseGasEmissions',
    unitId: 'tCO2e',
    periodType: 'duration'
  },
  scope2LocationBased: {
    qname: 'esrs:GrossLocationBasedScope2GreenhouseGasEmissions',
    unitId: 'tCO2e',
    periodType: 'duration'
  },
  scope2MarketBased: {
    qname: 'esrs:GrossMarketBasedScope2GreenhouseGasEmissions',
    unitId: 'tCO2e',
    periodType: 'duration'
  },
  scope3: {
    qname: 'esrs:GrossScope3GreenhouseGasEmissions',
    unitId: 'tCO2e',
    periodType: 'duration'
  },
  totalLocationBased: {
    qname: 'esrs:LocationBasedGreenhouseGasEmissions',
    unitId: 'tCO2e',
    periodType: 'duration'
  },
  totalMarketBased: {
    qname: 'esrs:MarketBasedGreenhouseGasEmissions',
    unitId: 'tCO2e',
    periodType: 'duration'
  },
  E2TotalWaterWithdrawalM3: {
    qname: 'esrs:E2TotalWaterWithdrawalVolume',
    unitId: 'm3',
    periodType: 'duration'
  },
  E2WaterWithdrawalInStressRegionsM3: {
    qname: 'esrs:E2WaterWithdrawalInWaterStressAreas',
    unitId: 'm3',
    periodType: 'duration'
  },
  E2WaterDischargeM3: {
    qname: 'esrs:E2TotalWaterDischargeVolume',
    unitId: 'm3',
    periodType: 'duration'
  },
  E2WaterReusePercent: {
    qname: 'esrs:E2WaterReusePercentage',
    unitId: 'percent',
    periodType: 'duration'
  },
  E2WaterStressSharePercent: {
    qname: 'esrs:E2ShareOfWaterWithdrawalInStressAreas',
    unitId: 'percent',
    periodType: 'duration'
  },
  E2WaterDischargeRatioPercent: {
    qname: 'esrs:E2WaterDischargeRatio',
    unitId: 'percent',
    periodType: 'duration'
  },
  E2WaterDataQualityPercent: {
    qname: 'esrs:E2WaterDataCoveragePercentage',
    unitId: 'percent',
    periodType: 'duration'
  },
  E3AirEmissionsTonnes: {
    qname: 'esrs:E3AirEmissions',
    unitId: 'tonne',
    periodType: 'duration'
  },
  E3AirLimitTonnes: {
    qname: 'esrs:E3AirEmissionLimit',
    unitId: 'tonne',
    periodType: 'duration'
  },
  E3AirExceedPercent: {
    qname: 'esrs:E3AirEmissionExceedancePercent',
    unitId: 'percent',
    periodType: 'duration'
  },
  E3WaterEmissionsTonnes: {
    qname: 'esrs:E3WaterDischarges',
    unitId: 'tonne',
    periodType: 'duration'
  },
  E3WaterLimitTonnes: {
    qname: 'esrs:E3WaterDischargeLimit',
    unitId: 'tonne',
    periodType: 'duration'
  },
  E3WaterExceedPercent: {
    qname: 'esrs:E3WaterDischargeExceedancePercent',
    unitId: 'percent',
    periodType: 'duration'
  },
  E3SoilEmissionsTonnes: {
    qname: 'esrs:E3SoilEmissions',
    unitId: 'tonne',
    periodType: 'duration'
  },
  E3SoilLimitTonnes: {
    qname: 'esrs:E3SoilEmissionLimit',
    unitId: 'tonne',
    periodType: 'duration'
  },
  E3SoilExceedPercent: {
    qname: 'esrs:E3SoilEmissionExceedancePercent',
    unitId: 'percent',
    periodType: 'duration'
  },
  E3ReportableIncidentsCount: {
    qname: 'esrs:E3ReportablePollutionIncidents',
    unitId: 'pure',
    periodType: 'duration'
  },
  E3DocumentationQualityPercent: {
    qname: 'esrs:E3PollutionDataQualityPercent',
    unitId: 'percent',
    periodType: 'duration'
  },
  E3MediumsTable: {
    qname: 'esrs:E3PollutionMediumBreakdownTable',
    unitId: null,
    periodType: 'duration'
  },
  E4SitesInProtectedAreasCount: {
    qname: 'esrs:E4SitesInProtectedAreas',
    unitId: 'pure',
    periodType: 'duration'
  },
  E4ProtectedAreaHectares: {
    qname: 'esrs:E4AffectedHabitatArea',
    unitId: 'hectare',
    periodType: 'duration'
  },
  E4RestorationHectares: {
    qname: 'esrs:E4RestoredHabitatArea',
    unitId: 'hectare',
    periodType: 'duration'
  },
  E4SignificantIncidentsCount: {
    qname: 'esrs:E4SignificantBiodiversityIncidents',
    unitId: 'pure',
    periodType: 'duration'
  },
  E4RestorationRatioPercent: {
    qname: 'esrs:E4RestorationCoveragePercent',
    unitId: 'percent',
    periodType: 'duration'
  },
  E4DocumentationQualityPercent: {
    qname: 'esrs:E4DocumentationQualityPercent',
    unitId: 'percent',
    periodType: 'duration'
  },
  E5PrimaryMaterialConsumptionTonnes: {
    qname: 'esrs:E5PrimaryMaterialConsumption',
    unitId: 'tonne',
    periodType: 'duration'
  },
  E5SecondaryMaterialConsumptionTonnes: {
    qname: 'esrs:E5SecondaryMaterialConsumption',
    unitId: 'tonne',
    periodType: 'duration'
  },
  E5RecycledContentPercent: {
    qname: 'esrs:E5RecycledMaterialShare',
    unitId: 'percent',
    periodType: 'duration'
  },
  E5RenewableMaterialSharePercent: {
    qname: 'esrs:E5RenewableMaterialShare',
    unitId: 'percent',
    periodType: 'duration'
  },
  E5CriticalMaterialsSharePercent: {
    qname: 'esrs:E5CriticalMaterialShare',
    unitId: 'percent',
    periodType: 'duration'
  },
  E1ScenariosDiverseRange: {
    qname:
      'esrs:DiverseRangeOfClimateScenariosHaveBeenConsideredToDetectRelevantEnvironmentalSocietalTechnologyMarketAndPolicyrelatedDevelopmentsAndDetermineDecarbonisationLevers',
    periodType: 'duration',
  },
  E1ScenariosNarrative: {
    qname:
      'esrs:DisclosureOfHowDiverseRangeOfClimateScenariosHaveBeenConsideredToDetectRelevantEnvironmentalSocietalTechnologyMarketAndPolicyrelatedDevelopmentsAndDetermineDecarbonisationLeversExplanatory',
    periodType: 'duration',
  },
  E1CarbonPriceAmount: {
    qname: 'esrs:CarbonPriceAppliedForEachMetricTonneOfGreenhouseGasEmission',
    unitId: 'DKK',
    periodType: 'duration',
  },
  E1CarbonPriceAlignment: {
    qname: 'esrs:CarbonPriceUsedInInternalCarbonPricingSchemeIsConsistentWithCarbonPriceUsedInFinancialStatements',
    periodType: 'duration',
  },
  E1CarbonPriceNarrative: {
    qname: 'esrs:DescriptionOfCriticalAssumptionsMadeToDetermineCarbonPriceAppliedExplanatory',
    periodType: 'duration',
  },
  E1IntensityLocationBasedPerNetRevenue: {
    qname: 'esrs:GHGEmissionsIntensityLocationbasedTotalGHGEmissionsPerNetRevenue',
    unitId: 'Emissions_per_Monetary',
    periodType: 'duration'
  },
  E1IntensityMarketBasedPerNetRevenue: {
    qname: 'esrs:GHGEmissionsIntensityMarketbasedTotalGHGEmissionsPerNetRevenue',
    unitId: 'Emissions_per_Monetary',
    periodType: 'duration'
  },
  E1TargetsPresent: {
    qname:
      'esrs:GHGEmissionsReductionTargetsAndOrAnyOtherTargetsHaveBeenSetToManageMaterialClimaterelatedImpactsRisksAndOpportunities',
    periodType: 'duration',
  },
  E1TargetsNarrative: {
    qname:
      'esrs:DisclosureOfHowGHGEmissionsReductionTargetsAndOrAnyOtherTargetsHaveBeenSetToManageMaterialClimaterelatedImpactsRisksAndOpportunitiesExplanatory',
    periodType: 'duration',
  },
  E1TargetsTable: {
    qname: 'esrs:TargetsRelatedToClimateChangeMitigationAndAdaptationGHGEmissionsReductionTargetsTable',
    unitId: null,
    periodType: 'duration',
  },
  E1EnergyConsumptionTotalKwh: {
    qname: 'esrs:EnergyConsumptionRelatedToOwnOperations',
    unitId: 'kWh',
    periodType: 'duration',
  },
  E1EnergyConsumptionRenewableKwh: {
    qname: 'esrs:EnergyConsumptionFromRenewableSources',
    unitId: 'kWh',
    periodType: 'duration',
  },
  E1EnergyConsumptionNonRenewableKwh: {
    qname: 'esrs:EnergyConsumptionFromFossilSources',
    unitId: 'kWh',
    periodType: 'duration',
  },
  E1EnergyRenewableSharePercent: {
    qname: 'esrs:PercentageOfRenewableSourcesInTotalEnergyConsumption',
    unitId: 'percent',
    periodType: 'duration',
  },
  E1EnergyNonRenewableSharePercent: {
    qname: 'esrs:PercentageOfFossilSourcesInTotalEnergyConsumption',
    unitId: 'percent',
    periodType: 'duration',
  },
  E1EnergyRenewableProductionKwh: {
    qname: 'esrs:RenewableEnergyProduction',
    unitId: 'kWh',
    periodType: 'duration',
  },
  E1EnergyNonRenewableProductionKwh: {
    qname: 'esrs:NonrenewableEnergyProduction',
    unitId: 'kWh',
    periodType: 'duration',
  },
  E1EnergyMixTable: {
    qname: 'esrs:DisclosureOfEnergyConsumptionAndMixTable',
    unitId: null,
    periodType: 'duration',
  },
  E1RiskPhysicalAssets: {
    qname: 'esrs:CarryingAmountOfAssetsAtMaterialPhysicalRisk',
    unitId: 'DKK',
    periodType: 'instant',
  },
  E1RiskPhysicalRevenue: {
    qname: 'esrs:NetRevenueAtMaterialPhysicalRisk',
    unitId: 'DKK',
    periodType: 'duration',
  },
  E1RiskTransitionAssets: {
    qname: 'esrs:CarryingAmountOfAssetsAtMaterialTransitionRisk',
    unitId: 'DKK',
    periodType: 'instant',
  },
  E1RiskTransitionRevenue: {
    qname: 'esrs:NetRevenueAtMaterialTransitionRisk',
    unitId: 'DKK',
    periodType: 'duration',
  },
  E1RiskNarrative: {
    qname: 'esrs:DisclosureOfLocationOfSignificantAssetsAtMaterialPhysicalRiskExplanatory',
    periodType: 'duration',
  },
  E1DecarbonisationLeverTypes: {
    qname: 'esrs:DecarbonisationLeverTypes',
    periodType: 'duration',
  },
  E1DecarbonisationNarrative: {
    qname:
      'esrs:DescriptionOfExpectedDecarbonisationLeversAndTheirOverallQuantitativeContributionsToAchieveGHGEmissionReductionTargetExplanatory',
    periodType: 'duration',
  },
  E1DecarbonisationTable: {
    qname:
      'esrs:TargetsRelatedToClimateChangeMitigationAndAdaptationGHGEmissionsReductionTargetsByDecarbonisationLeversTable',
    periodType: 'duration',
  },
  E5CircularityTargetPercent: {
    qname: 'esrs:E5CircularityTargetPercent',
    unitId: 'percent',
    periodType: 'duration'
  },
  E5TargetGapPercent: {
    qname: 'esrs:E5CircularityTargetGapPercent',
    unitId: 'percent',
    periodType: 'duration'
  },
  E5DocumentationQualityPercent: {
    qname: 'esrs:E5DocumentationQualityPercent',
    unitId: 'percent',
    periodType: 'duration'
  },
  S1TotalHeadcount: {
    qname: 'esrs:S1TotalEmployees',
    unitId: 'pure',
    periodType: 'instant'
  },
  S1TotalFte: {
    qname: 'esrs:S1TotalFullTimeEquivalentEmployees',
    unitId: 'pure',
    periodType: 'duration'
  },
  S1SegmentHeadcountTotal: {
    qname: 'esrs:S1SegmentHeadcountTotal',
    unitId: 'pure',
    periodType: 'instant'
  },
  S1SegmentFemaleHeadcountEstimate: {
    qname: 'esrs:S1SegmentFemaleHeadcountEstimate',
    unitId: 'pure',
    periodType: 'instant'
  },
  S1DataCoveragePercent: {
    qname: 'esrs:S1DataCoveragePercent',
    unitId: 'percent',
    periodType: 'duration'
  },
  S1FteCoveragePercent: {
    qname: 'esrs:S1FteDataCoveragePercent',
    unitId: 'percent',
    periodType: 'duration'
  },
  S1EmploymentContractHeadcountTotal: {
    qname: 'esrs:S1EmploymentContractHeadcountTotal',
    unitId: 'pure',
    periodType: 'instant'
  },
  S1EmploymentContractFteTotal: {
    qname: 'esrs:S1EmploymentContractFteTotal',
    unitId: 'pure',
    periodType: 'duration'
  },
  S1EmploymentStatusHeadcountTotal: {
    qname: 'esrs:S1EmploymentStatusHeadcountTotal',
    unitId: 'pure',
    periodType: 'instant'
  },
  S1EmploymentStatusFteTotal: {
    qname: 'esrs:S1EmploymentStatusFteTotal',
    unitId: 'pure',
    periodType: 'duration'
  },
  S1CollectiveAgreementCoveragePercent: {
    qname: 'esrs:S1CollectiveAgreementCoveragePercent',
    unitId: 'percent',
    periodType: 'duration'
  },
  S1AverageFemalePercent: {
    qname: 'esrs:S1FemaleSharePercent',
    unitId: 'percent',
    periodType: 'duration'
  },
  S1HasCollectiveAgreements: {
    qname: 'esrs:S1CollectiveAgreementsInPlace',
    unitId: null,
    periodType: 'duration'
  },
  S1GenderPayGapPercentTotal: {
    qname: 'esrs:S1GenderPayGapOverallPercent',
    unitId: 'percent',
    periodType: 'duration'
  },
  S1GenderPayGapPercentManagement: {
    qname: 'esrs:S1GenderPayGapManagementPercent',
    unitId: 'percent',
    periodType: 'duration'
  },
  S1GenderPayGapPercentOperations: {
    qname: 'esrs:S1GenderPayGapOtherEmployeesPercent',
    unitId: 'percent',
    periodType: 'duration'
  },
  S1AbsenteeismRatePercent: {
    qname: 'esrs:S1AbsenteeismRatePercent',
    unitId: 'percent',
    periodType: 'duration'
  },
  S1LostTimeInjuryFrequencyRate: {
    qname: 'esrs:S1LostTimeInjuryFrequencyRate',
    unitId: 'pure',
    periodType: 'duration'
  },
  S1WorkRelatedAccidentsCount: {
    qname: 'esrs:S1WorkRelatedAccidentsCount',
    unitId: 'pure',
    periodType: 'duration'
  },
  S1WorkRelatedFatalitiesCount: {
    qname: 'esrs:S1WorkRelatedFatalitiesCount',
    unitId: 'pure',
    periodType: 'duration'
  },
  S1AverageTrainingHoursPerEmployee: {
    qname: 'esrs:S1AverageTrainingHoursPerEmployee',
    unitId: 'hour',
    periodType: 'duration'
  },
  S1AverageWeeklyHours: {
    qname: 'esrs:S1AverageWeeklyWorkingTimeHours',
    unitId: 'hour',
    periodType: 'duration'
  },
  S1TrainingCoveragePercent: {
    qname: 'esrs:S1TrainingCoveragePercent',
    unitId: 'percent',
    periodType: 'duration'
  },
  S1SocialProtectionCoveragePercent: {
    qname: 'esrs:S1SocialProtectionCoveragePercent',
    unitId: 'percent',
    periodType: 'duration'
  },
  S1HealthCareCoveragePercent: {
    qname: 'esrs:S1HealthCareCoveragePercent',
    unitId: 'percent',
    periodType: 'duration'
  },
  S1PensionPlanCoveragePercent: {
    qname: 'esrs:S1PensionPlanCoveragePercent',
    unitId: 'percent',
    periodType: 'duration'
  },
  S1HeadcountBreakdownTable: {
    qname: 'esrs:S1HeadcountBreakdownTable',
    unitId: null,
    periodType: 'instant'
  },
  S1EmploymentContractBreakdownTable: {
    qname: 'esrs:S1EmploymentContractBreakdownTable',
    unitId: null,
    periodType: 'instant'
  },
  S1EmploymentStatusBreakdownTable: {
    qname: 'esrs:S1EmploymentStatusBreakdownTable',
    unitId: null,
    periodType: 'instant'
  },
  S2ValueChainWorkersCount: {
    qname: 'esrs:S2ValueChainWorkersCount',
    unitId: 'pure',
    periodType: 'duration'
  },
  S2WorkersAtRiskCount: {
    qname: 'esrs:S2WorkersAtRiskCount',
    unitId: 'pure',
    periodType: 'duration'
  },
  S2ValueChainCoveragePercent: {
    qname: 'esrs:S2ValueChainCoveragePercent',
    unitId: 'percent',
    periodType: 'duration'
  },
  S2HighRiskSupplierSharePercent: {
    qname: 'esrs:S2HighRiskSupplierSharePercent',
    unitId: 'percent',
    periodType: 'duration'
  },
  S2LivingWageCoveragePercent: {
    qname: 'esrs:S2LivingWageCoveragePercent',
    unitId: 'percent',
    periodType: 'duration'
  },
  S2CollectiveBargainingCoveragePercent: {
    qname: 'esrs:S2CollectiveBargainingCoveragePercent',
    unitId: 'percent',
    periodType: 'duration'
  },
  S2SocialAuditsCompletedPercent: {
    qname: 'esrs:S2SocialAuditCompletionPercent',
    unitId: 'percent',
    periodType: 'duration'
  },
  S2GrievancesOpenCount: {
    qname: 'esrs:S2OpenGrievancesCount',
    unitId: 'pure',
    periodType: 'duration'
  },
  S2GrievanceMechanismForWorkers: {
    qname: 'esrs:S2GrievanceMechanismForWorkers',
    unitId: null,
    periodType: 'duration'
  },
  S2IncidentsCount: {
    qname: 'esrs:S2IncidentCount',
    unitId: 'pure',
    periodType: 'duration'
  },
  S2WorkersAffectedTotal: {
    qname: 'esrs:S2WorkersAffectedTotal',
    unitId: 'pure',
    periodType: 'duration'
  },
  S2SocialDialogueNarrative: {
    qname: 'esrs:S2SocialDialogueNarrative',
    unitId: null,
    periodType: 'duration'
  },
  S2RemediationNarrative: {
    qname: 'esrs:S2RemediationNarrative',
    unitId: null,
    periodType: 'duration'
  },
  S2IncidentsTable: {
    qname: 'esrs:S2IncidentsTable',
    unitId: null,
    periodType: 'duration'
  },
  S3CommunitiesIdentifiedCount: {
    qname: 'esrs:S3CommunitiesIdentifiedCount',
    unitId: 'pure',
    periodType: 'duration'
  },
  S3ImpactAssessmentsCoveragePercent: {
    qname: 'esrs:S3ImpactAssessmentCoveragePercent',
    unitId: 'percent',
    periodType: 'duration'
  },
  S3HighRiskCommunitySharePercent: {
    qname: 'esrs:S3HighRiskCommunitySharePercent',
    unitId: 'percent',
    periodType: 'duration'
  },
  S3GrievancesOpenCount: {
    qname: 'esrs:S3OpenGrievancesCount',
    unitId: 'pure',
    periodType: 'duration'
  },
  S3ImpactsCount: {
    qname: 'esrs:S3ImpactsRecordedCount',
    unitId: 'pure',
    periodType: 'duration'
  },
  S3HouseholdsAffectedTotal: {
    qname: 'esrs:S3HouseholdsAffectedTotal',
    unitId: 'pure',
    periodType: 'duration'
  },
  S3EngagementNarrative: {
    qname: 'esrs:S3EngagementNarrative',
    unitId: null,
    periodType: 'duration'
  },
  S3RemedyNarrative: {
    qname: 'esrs:S3RemedyNarrative',
    unitId: null,
    periodType: 'duration'
  },
  S3CommunityImpactsTable: {
    qname: 'esrs:S3CommunityImpactsTable',
    unitId: null,
    periodType: 'duration'
  },
  S4ProductsAssessedPercent: {
    qname: 'esrs:S4ProductsAssessedPercent',
    unitId: 'percent',
    periodType: 'duration'
  },
  S4SevereIncidentsCount: {
    qname: 'esrs:S4SevereIncidentsCount',
    unitId: 'pure',
    periodType: 'duration'
  },
  S4RecallsCount: {
    qname: 'esrs:S4ProductRecallsCount',
    unitId: 'pure',
    periodType: 'duration'
  },
  S4ComplaintsResolvedPercent: {
    qname: 'esrs:S4ComplaintsResolvedPercent',
    unitId: 'percent',
    periodType: 'duration'
  },
  S4DataBreachesCount: {
    qname: 'esrs:S4DataBreachesCount',
    unitId: 'pure',
    periodType: 'duration'
  },
  S4GrievanceMechanismInPlace: {
    qname: 'esrs:S4GrievanceMechanismInPlace',
    unitId: null,
    periodType: 'duration'
  },
  S4EscalationTimeframeDays: {
    qname: 'esrs:S4GrievanceEscalationTimeframeDays',
    unitId: 'day',
    periodType: 'duration'
  },
  S4IssuesCount: {
    qname: 'esrs:S4IssuesRecordedCount',
    unitId: 'pure',
    periodType: 'duration'
  },
  S4UsersAffectedTotal: {
    qname: 'esrs:S4UsersAffectedTotal',
    unitId: 'pure',
    periodType: 'duration'
  },
  S4VulnerableUsersNarrative: {
    qname: 'esrs:S4VulnerableUsersNarrative',
    unitId: null,
    periodType: 'duration'
  },
  S4ConsumerEngagementNarrative: {
    qname: 'esrs:S4ConsumerEngagementNarrative',
    unitId: null,
    periodType: 'duration'
  },
  S4ConsumerIssuesTable: {
    qname: 'esrs:S4ConsumerIssuesTable',
    unitId: null,
    periodType: 'duration'
  },
  G1PolicyCount: {
    qname: 'esrs:G1PolicyCount',
    unitId: 'pure',
    periodType: 'duration'
  },
  G1TargetCount: {
    qname: 'esrs:G1TargetCount',
    unitId: 'pure',
    periodType: 'duration'
  },
  G1PolicyAverageScore: {
    qname: 'esrs:G1PolicyAverageScorePercent',
    unitId: 'percent',
    periodType: 'duration'
  },
  G1TargetAverageScore: {
    qname: 'esrs:G1TargetAverageScorePercent',
    unitId: 'percent',
    periodType: 'duration'
  },
  G1OversightScore: {
    qname: 'esrs:G1OversightScorePercent',
    unitId: 'percent',
    periodType: 'duration'
  },
  G1BoardOversight: {
    qname: 'esrs:G1BoardOversight',
    unitId: null,
    periodType: 'duration'
  },
  G1GovernanceNarrative: {
    qname: 'esrs:G1GovernanceNarrative',
    unitId: null,
    periodType: 'duration'
  },
  G1PoliciesTable: {
    qname: 'esrs:G1PoliciesTable',
    unitId: null,
    periodType: 'duration'
  },
  G1TargetsTable: {
    qname: 'esrs:G1TargetsTable',
    unitId: null,
    periodType: 'duration'
  },
  D1OrganizationalBoundary: {
    qname: 'esrs:D1OrganizationalBoundary',
    unitId: null,
    periodType: 'duration'
  },
  D1Scope2Method: {
    qname: 'esrs:D1Scope2Method',
    unitId: null,
    periodType: 'duration'
  },
  D1Scope3ScreeningCompleted: {
    qname: 'esrs:D1Scope3ScreeningCompleted',
    unitId: null,
    periodType: 'duration'
  },
  D1DataQuality: {
    qname: 'esrs:D1DataQuality',
    unitId: null,
    periodType: 'duration'
  },
  D1MaterialityAssessmentDescription: {
    qname: 'esrs:D1MaterialityAssessmentDescription',
    unitId: null,
    periodType: 'duration'
  },
  D1StrategySummary: {
    qname: 'esrs:D1StrategySummary',
    unitId: null,
    periodType: 'duration'
  },
  D1ValueChainCoverage: {
    qname: 'esrs:D1ValueChainCoverage',
    unitId: null,
    periodType: 'duration'
  },
  D1QuantitativeTargets: {
    qname: 'esrs:D1QuantitativeTargets',
    unitId: null,
    periodType: 'duration'
  },
  D1TimeHorizonsCoveredCount: {
    qname: 'esrs:D1TimeHorizonsCoveredCount',
    unitId: 'pure',
    periodType: 'duration'
  },
  D1KpiCount: {
    qname: 'esrs:D1KpiCount',
    unitId: 'pure',
    periodType: 'duration'
  },
  D1HasEsgCommittee: {
    qname: 'esrs:D1HasEsgCommittee',
    unitId: null,
    periodType: 'duration'
  },
  D1StrategyNarrativesTable: {
    qname: 'esrs:D1StrategyNarrativesTable',
    unitId: null,
    periodType: 'duration'
  },
  D1GovernanceNarrativesTable: {
    qname: 'esrs:D1GovernanceNarrativesTable',
    unitId: null,
    periodType: 'duration'
  },
  D1ImpactsProcessTable: {
    qname: 'esrs:D1ImpactsProcessTable',
    unitId: null,
    periodType: 'duration'
  },
  D1TargetsNarrativesTable: {
    qname: 'esrs:D1TargetsNarrativesTable',
    unitId: null,
    periodType: 'duration'
  },
  D1KpiOverviewTable: {
    qname: 'esrs:D1KpiOverviewTable',
    unitId: null,
    periodType: 'duration'
  },
  SBMBusinessModelNarrative: {
    qname: 'esrs:DescriptionOfBusinessModelAndValueChainExplanatory',
    periodType: 'duration'
  },
  SBMStrategyNarrative: {
    qname:
      'esrs:DisclosureOfElementsOfStrategyThatRelateToOrImpactSustainabilityMattersBusinessModelAndValueChainExplanatory',
    periodType: 'duration'
  },
  SBMResilienceNarrative: {
    qname: 'esrs:DescriptionOfResultsOfResilienceAnalysisExplanatory',
    periodType: 'duration'
  },
  SBMStakeholderNarrative: {
    qname: 'esrs:DescriptionOfStakeholderEngagementExplanatory',
    periodType: 'duration'
  },
  SBMTransitionPlanNarrative: {
    qname:
      'esrs:DescriptionOfProcessInRelationToClimaterelatedTransitionRisksAndOpportunitiesInOwnOperationsAndAlongUpstreamAndDownstreamValueChainExplanatory',
    periodType: 'duration'
  },
  SBMResponsibilitiesTable: {
    qname: 'esrs:StrategyBusinessModelAndValueChainTable',
    unitId: null,
    periodType: 'duration'
  },
  GOVOversightNarrative: {
    qname: 'esrs:InformationAboutRolesAndResponsibilitiesOfAdministrativeManagementAndSupervisoryBodiesExplanatory',
    periodType: 'duration'
  },
  GOVManagementNarrative: {
    qname:
      'esrs:DisclosureOfHowAdministrativeManagementAndSupervisoryBodiesAreInformedAboutSustainabilityMattersAndHowTheseMattersWereAddressedExplanatory',
    periodType: 'duration'
  },
  GOVCompetenceNarrative: {
    qname: 'esrs:InformationAboutExtentToWhichTrainingIsGivenToMembersOfAdministrativeManagementAndSupervisoryBodiesExplanatory',
    periodType: 'duration'
  },
  GOVReportingNarrative: {
    qname:
      'esrs:DescriptionOfPeriodicReportingOfFindingsOfRiskAssessmentAndInternalControlsToAdministrativeManagementAndSupervisoryBodiesInRelationToSustainabilityReportingProcessExplanatory',
    periodType: 'duration'
  },
  GOVIncentiveNarrative: {
    qname:
      'esrs:DescriptionOfSpecificSustainabilityrelatedTargetsAndOrImpactsUsedToAssessPerformanceOfMembersOfAdministrativeManagementAndSupervisoryBodiesExplanatory',
    periodType: 'duration'
  },
  GOVResponsibilitiesTable: {
    qname: 'esrs:RolesAndResponsibilitiesOfAdministrativeManagementAndSupervisoryBodiesTable',
    unitId: null,
    periodType: 'duration'
  },
  IROProcessNarrative: {
    qname:
      'esrs:DescriptionOfProcessToIdentifyAssessPrioritiseAndMonitorPotentialAndActualImpactsOnPeopleAndEnvironmentInformedByDueDiligenceProcessExplanatory',
    periodType: 'duration'
  },
  IROIntegrationNarrative: {
    qname:
      'esrs:DisclosureOfHowAdministrativeManagementAndSupervisoryBodiesConsiderImpactsRisksAndOpportunitiesWhenOverseeingStrategyDecisionsOnMajorTransactionsAndRiskManagementProcessExplanatory',
    periodType: 'duration'
  },
  IROStakeholderNarrative: {
    qname: 'esrs:DescriptionOfHowStakeholderEngagementIsOrganisedExplanatory',
    periodType: 'duration'
  },
  IRODueDiligenceNarrative: {
    qname:
      'esrs:InformationAboutMethodologiesAssumptionsAndToolsUsedToScreenAssetsAndOrActivitiesInOrderToIdentifyActualAndPotentialImpactsRisksAndOpportunitiesInEitherOwnOperationsOrValueChainExplanatory',
    periodType: 'duration'
  },
  IROMonitoringNarrative: {
    qname: 'esrs:DescriptionOfMetricsUsedToEvaluatePerformanceAndEffectivenessInRelationToMaterialImpactRiskOrOpportunityExplanatory',
    periodType: 'duration'
  },
  IROActionsTable: {
    qname: 'esrs:ProcessToIdentifyAndAssessMaterialImpactsRisksAndOpportunitiesESRS2Table',
    unitId: null,
    periodType: 'duration'
  },
  MRIntensityNarrative: {
    qname: 'esrs:DescriptionOfMetricsScopeExplanatory',
    periodType: 'duration'
  },
  MRTargetsNarrative: {
    qname:
      'esrs:DescriptionOfAnyTimeboundTargetsSetRelatedToSustainabilityMattersAssessedToBeMaterialPhaseinAndProgressMadeTowardsAchievingThoseTargetsExplanatory',
    periodType: 'duration'
  },
  MRDataQualityNarrative: {
    qname:
      'esrs:DisclosureOfExtentToWhichDataAndProcessesThatAreUsedForSustainabilityReportingPurposesHaveBeenVerifiedByExternalAssuranceProviderAndFoundToConformToCorrespondingIsoNOIecOrCenNOCenelecStandardExplanatory',
    periodType: 'duration'
  },
  MRAssuranceNarrative: {
    qname: 'esrs:TypeOfExternalBodyOtherThanAssuranceProviderThatProvidesValidationExplanatory',
    periodType: 'duration'
  },
  MRTransitionPlanNarrative: {
    qname: 'esrs:DisclosureOfTransitionPlanForClimateChangeMitigationExplanatory',
    periodType: 'duration'
  },
  MRFinancialEffectsNarrative: {
    qname:
      'esrs:DisclosureOfAnticipatedFinancialEffectsOfMaterialRisksAndOpportunitiesOnFinancialPerformanceAndCashFlowsOverShortMediumAndLongtermExplanatory',
    periodType: 'duration'
  },
  MRMetricsNarrative: {
    qname: 'esrs:DescriptionOfMetricsUsedToEvaluatePerformanceAndEffectivenessInRelationToMaterialImpactRiskOrOpportunityExplanatory',
    periodType: 'duration'
  },
  MRTransitionMeasuresTable: {
    qname: 'esrs:TransitionPlanForClimateChangeMitigationTable',
    unitId: null,
    periodType: 'duration'
  },
  MRFinancialEffectsTable: {
    qname: 'esrs:AnticipatedFinancialEffectsFromMaterialPhysicalAndTransitionRisksDetailedTable',
    unitId: null,
    periodType: 'duration'
  },
  MRRemovalProjectsTable: {
    qname: 'esrs:GHGRemovalsAndStorageActivityTable',
    unitId: null,
    periodType: 'duration'
  },
  MRRequirementsTable: {
    qname: 'esrs:MinimumDisclosureRequirementMetricsListOfESRSMetricsTable',
    unitId: null,
    periodType: 'duration'
  },
  D2ValidTopicsCount: {
    qname: 'esrs:D2ValidTopicsCount',
    unitId: 'pure',
    periodType: 'duration'
  },
  D2PrioritisedTopicsCount: {
    qname: 'esrs:D2PrioritisedTopicsCount',
    unitId: 'pure',
    periodType: 'duration'
  },
  D2AttentionTopicsCount: {
    qname: 'esrs:D2AttentionTopicsCount',
    unitId: 'pure',
    periodType: 'duration'
  },
  D2GapAlertsCount: {
    qname: 'esrs:D2GapAlertsCount',
    unitId: 'pure',
    periodType: 'duration'
  },
  D2AverageWeightedScore: {
    qname: 'esrs:D2AverageWeightedScorePercent',
    unitId: 'percent',
    periodType: 'duration'
  },
  D2MaterialTopicsTable: {
    qname: 'esrs:D2MaterialTopicsTable',
    unitId: null,
    periodType: 'duration'
  },
  D2GapAlertsTable: {
    qname: 'esrs:D2GapAlertsTable',
    unitId: null,
    periodType: 'duration'
  }
} as const satisfies Record<string, EsrsConceptDefinition>

export type EsrsConceptKey = keyof typeof esrsConceptDefinitions

export const esrsEmissionConceptKeys = [
  'scope1',
  'scope2LocationBased',
  'scope2MarketBased',
  'scope3',
  'totalLocationBased',
  'totalMarketBased'
] as const satisfies readonly EsrsConceptKey[]

export const esrsEmissionConceptList = esrsEmissionConceptKeys.map((key) => ({
  key,
  definition: esrsConceptDefinitions[key]
}))

export function getEsrsConceptDefinition(key: EsrsConceptKey): EsrsConceptDefinition {
  const definition = esrsConceptDefinitions[key]
  if (!definition) {
    throw new Error(`Ukendt ESRS-koncept: ${key}`)
  }
  return definition
}
