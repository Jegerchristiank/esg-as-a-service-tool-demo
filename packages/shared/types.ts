/**
 * Fælles typer for ESG-input, moduler og beregningsresultater.
 */

import type {
  A1Input,
  A2Input,
  A3Input,
  A4Input,
  B1Input,
  B2Input,
  B3Input,
  B4Input,
  B5Input,
  B6Input,
  B7Input,
  B8Input,
  B9Input,
  B10Input,
  B11Input,
  C1Input,
  C2Input,
  C3Input,
  C4Input,
  C5Input,
  C6Input,
  C7Input,
  C8Input,
  C9Input,
  C10Input,
  C11Input,
  C12Input,
  C13Input,
  C14Input,
  C15Input,
  D2Input,
  D2MaterialTopic,
  D1Input,
  E1ContextInput,
  E1ScenariosInput,
  E1CarbonPriceInput,
  E1RiskGeographyInput,
  E1DecarbonisationDriversInput,
  E1TargetsInput,
  E1TargetLine,
  E1TargetMilestone,
  E1ActionLine,
  E1EnergyMixType,
  E1TargetScope,
  E1TargetStatus,
  E1ActionStatus,
  E1TransitionStatus,
  E1FinancialEffectType,
  E1RemovalType,
  E1ScenarioType,
  E1RiskType,
  E1DecarbonisationDriverType,
  E2WaterInput,
  E3PollutionInput,
  E4BiodiversityInput,
  E5ResourcesInput,
  SbmInput,
  GovInput,
  IroInput,
  MrInput,
  MrProgressStatus,
  E1RemovalProject,
  E1FinancialEffect,
  E1TransitionPlanMeasure,
  S1Input,
  S2Input,
  S3Input,
  S4Input,
  G1Input,
} from './schema'


export const moduleIds = [
  'A1',
  'A2',
  'A3',
  'A4',
  'B1',
  'B2',
  'B3',
  'B4',
  'B5',
  'B6',
  'B7',
  'B8',
  'B9',
  'B10',
  'B11',
  'C1',
  'C2',
  'C3',
  'C4',
  'C5',
  'C6',
  'C7',
  'C8',
  'C9',
  'C10',
  'C11',
  'C12',
  'C13',
  'C14',
  'C15',
  'E1Scenarios',
  'E1CarbonPrice',
  'E1RiskGeography',
  'E1DecarbonisationDrivers',
  'E1Targets',
  'E2Water',
  'E3Pollution',
  'E4Biodiversity',
  'E5Resources',
  'SBM',
  'GOV',
  'IRO',
  'MR',
  'S1',
  'S2',
  'S3',
  'S4',
  'G1',
  'D1',
  'D2'
] as const

export type ModuleId = (typeof moduleIds)[number]

type ModuleInputBase = Partial<Record<ModuleId, unknown>> & {
  A1?: A1Input | null | undefined
  A2?: A2Input | null | undefined
  A3?: A3Input | null | undefined
  A4?: A4Input | null | undefined
  B1?: B1Input | null | undefined
  B2?: B2Input | null | undefined
  B3?: B3Input | null | undefined
  B4?: B4Input | null | undefined
  B5?: B5Input | null | undefined
  B6?: B6Input | null | undefined
  B7?: B7Input | null | undefined
  B8?: B8Input | null | undefined
  B9?: B9Input | null | undefined
  B10?: B10Input | null | undefined
  B11?: B11Input | null | undefined
  C1?: C1Input | null | undefined
  C2?: C2Input | null | undefined
  C3?: C3Input | null | undefined
  C4?: C4Input | null | undefined
  C5?: C5Input | null | undefined
  C6?: C6Input | null | undefined
  C7?: C7Input | null | undefined
  C8?: C8Input | null | undefined
  C9?: C9Input | null | undefined
  C10?: C10Input | null | undefined
  C11?: C11Input | null | undefined
  C12?: C12Input | null | undefined
  C13?: C13Input | null | undefined
  C14?: C14Input | null | undefined
  C15?: C15Input | null | undefined
  E1Scenarios?: E1ScenariosInput | null | undefined
  E1CarbonPrice?: E1CarbonPriceInput | null | undefined
  E1RiskGeography?: E1RiskGeographyInput | null | undefined
  E1DecarbonisationDrivers?: E1DecarbonisationDriversInput | null | undefined
  E1Targets?: E1TargetsInput | null | undefined
  E1Context?: E1ContextInput | null | undefined
  E2Water?: E2WaterInput | null | undefined
  E3Pollution?: E3PollutionInput | null | undefined
  E4Biodiversity?: E4BiodiversityInput | null | undefined
  E5Resources?: E5ResourcesInput | null | undefined
  SBM?: SbmInput | null | undefined
  GOV?: GovInput | null | undefined
  IRO?: IroInput | null | undefined
  MR?: MrInput | null | undefined
  S1?: S1Input | null | undefined
  S2?: S2Input | null | undefined
  S3?: S3Input | null | undefined
  S4?: S4Input | null | undefined
  G1?: G1Input | null | undefined
  D1?: D1Input | null | undefined
  D2?: D2Input | null | undefined
}

export type ModuleInput = ModuleInputBase & Record<string, unknown>

export type ModuleIntensityBasis = 'netRevenue' | 'production' | 'energy' | 'employees'

export type ModuleIntensity = {
  basis: ModuleIntensityBasis
  label: string
  value: number
  unit: string
  denominatorValue: number
  denominatorUnit: string
}

export type ModuleTrend = {
  label: string
  previousValue: number | null
  currentValue: number
  absoluteChange: number | null
  percentChange: number | null
  unit: string
}

export type ModuleTargetProgress = {
  targetId: string
  name: string | null
  scope: E1TargetScope
  targetYear: number | null
  targetValueTonnes: number | null
  currentValueTonnes: number
  varianceTonnes: number | null
  progressPercent: number | null
  status: E1TargetStatus | null
  owner: string | null
}

export type ModuleEnergyMixEntry = {
  energyType: E1EnergyMixType
  consumptionKwh: number
  sharePercent: number
  documentationQualityPercent: number | null
}

export type ModuleTargetMilestoneSummary = {
  label: string | null
  dueYear: number | null
}

export type ModuleTargetSummary = {
  id: string
  name: string
  scope: E1TargetScope
  targetYear: number | null
  targetValueTonnes: number | null
  baselineYear: number | null
  baselineValueTonnes: number | null
  owner: string | null
  status: E1TargetStatus | null
  description: string | null
  milestones: ModuleTargetMilestoneSummary[]
}

export type ModuleActionItem = {
  title: string | null
  description: string | null
  owner: string | null
  dueQuarter: string | null
  status: E1ActionStatus | null
}

export type ModuleTransitionMeasure = {
  initiative: string | null
  status: E1TransitionStatus | null
  milestoneYear: number | null
  investmentNeedDkk: number | null
  responsible: string | null
  description: string | null
}

export type ModuleFinancialEffect = {
  label: string | null
  type: E1FinancialEffectType | null
  amountDkk: number | null
  timeframe: string | null
  description: string | null
}

export type ModuleRemovalProject = {
  projectName: string | null
  removalType: E1RemovalType | null
  annualRemovalTonnes: number | null
  storageDescription: string | null
  qualityStandard: string | null
  permanenceYears: number | null
  financedThroughCredits: boolean | null
  responsible: string | null
}

export type ModuleScenarioEntry = {
  name: string | null
  provider: string | null
  scenarioType: E1ScenarioType | null
  timeHorizon: string | null
  coveragePercent: number | null
  description: string | null
}

export type ModuleCarbonPriceScheme = {
  scheme: string | null
  scope: E1TargetScope | null
  priceDkkPerTonne: number | null
  coveragePercent: number | null
  appliesToCapex: boolean | null
  appliesToOpex: boolean | null
  appliesToInvestmentDecisions: boolean | null
  alignedWithFinancialStatements: boolean | null
  description: string | null
}

export type ModuleRiskGeographyEntry = {
  geography: string | null
  riskType: E1RiskType | null
  timeHorizon: string | null
  assetsAtRiskDkk: number | null
  revenueAtRiskDkk: number | null
  exposureNarrative: string | null
}

export type ModuleDecarbonisationDriver = {
  lever: E1DecarbonisationDriverType | null
  name: string | null
  description: string | null
  expectedReductionTonnes: number | null
  investmentNeedDkk: number | null
  startYear: number | null
}

export type ModuleNarrative = {
  label: string
  content: string
}

export type ModuleResponsibility = {
  subject: string
  owner: string
  role?: string | null
}

export type ModuleNote = {
  label: string
  detail: string
}

export type ModuleEsrsFactValue = string | number | boolean | null

export type ModuleEsrsFact = {
  conceptKey: string
  value: ModuleEsrsFactValue
  /** Angiv decimals hvis faktaværdien er numerisk og skal afrundes anderledes end standarden. */
  decimals?: number | null
  /** Valgfrit override for unit-id. Hvis ikke sat anvendes konfigurationen fra taksonomien. */
  unitId?: string | null
}

export type ModuleEsrsTableRow = Record<string, string | number | boolean | null>

export type ModuleEsrsTable = {
  conceptKey: string
  rows: ModuleEsrsTableRow[]
}

export type ModuleDoubleMaterialityTopic = {
  name: string
  description: string | null
  riskType: string | null
  impactType: string | null
  severity: string
  likelihood: string
  impactScore: number
  financialScore: number | null
  timelineScore: number | null
  combinedScore: number
  timeline: string | null
  valueChainSegment: string | null
  responsible: string | null
  csrdGapStatus: string | null
  remediationStatus: string | null
  priorityBand: 'priority' | 'attention' | 'monitor'
}

export type ModuleDoubleMaterialityImpactMatrixRow = {
  severity: string
  likelihood: string
  topics: number
}

export type ModuleDoubleMaterialityDueDiligenceEntry = {
  key: string
  label: string
  topics: number
}

export type ModuleDoubleMaterialityPrioritisationCriterion = {
  title: string
  description: string
}

export type ModuleDoubleMaterialityOverview = {
  totalTopics: number
  prioritisedTopics: number
  attentionTopics: number
  gapAlerts: number
  averageScore: number
}

export type ModuleDoubleMateriality = {
  overview: ModuleDoubleMaterialityOverview
  prioritisationCriteria: ModuleDoubleMaterialityPrioritisationCriterion[]
  tables: {
    topics: ModuleDoubleMaterialityTopic[]
    gapAlerts: string[]
    impactMatrix: ModuleDoubleMaterialityImpactMatrixRow[]
  }
  dueDiligence: {
    impactTypes: ModuleDoubleMaterialityDueDiligenceEntry[]
    valueChain: ModuleDoubleMaterialityDueDiligenceEntry[]
    remediation: ModuleDoubleMaterialityDueDiligenceEntry[]
  }
}

export type ModuleMetric = {
  label: string
  value: string | number | null
  unit?: string | null
  context?: string | null
}

export type ModuleTableColumn = {
  key: string
  label: string
  align?: 'start' | 'center' | 'end'
  format?: 'string' | 'number' | 'percent'
}

export type ModuleTableRow = Record<string, string | number | null>

export type ModuleTable = {
  id: string
  title: string
  summary?: string | null
  columns: ModuleTableColumn[]
  rows: ModuleTableRow[]
}

export type ModuleResult = {
  value: number
  unit: string
  assumptions: string[]
  trace: string[]
  warnings: string[]
  metrics?: ModuleMetric[]
  intensities?: ModuleIntensity[]
  trend?: ModuleTrend | null
  targetProgress?: ModuleTargetProgress | null
  energyMix?: ModuleEnergyMixEntry[]
  targetsOverview?: ModuleTargetSummary[]
  plannedActions?: ModuleActionItem[]
  transitionMeasures?: ModuleTransitionMeasure[]
  financialEffects?: ModuleFinancialEffect[]
  removalProjects?: ModuleRemovalProject[]
  scenarios?: ModuleScenarioEntry[]
  carbonPriceSchemes?: ModuleCarbonPriceScheme[]
  riskGeographies?: ModuleRiskGeographyEntry[]
  decarbonisationDrivers?: ModuleDecarbonisationDriver[]
  narratives?: ModuleNarrative[]
  responsibilities?: ModuleResponsibility[]
  notes?: ModuleNote[]
  tables?: ModuleTable[]
  doubleMateriality?: ModuleDoubleMateriality | null
  esrsFacts?: ModuleEsrsFact[]
  esrsTables?: ModuleEsrsTable[]
}

export type ModuleCalculator = (input: ModuleInput) => ModuleResult

export type CalculatedModuleResult = {
  moduleId: ModuleId
  title: string
  result: ModuleResult
}

export type {
  A1Input,
  A2Input,
  A3Input,
  A4Input,
  B1Input,
  B2Input,
  B3Input,
  B4Input,
  B5Input,
  B6Input,
  B7Input,
  B8Input,
  B9Input,
  B10Input,
  B11Input,
  C1Input,
  C2Input,
  C3Input,
  C4Input,
  C5Input,
  C6Input,
  C7Input,
  C8Input,
  C9Input,
  C10Input,
  C11Input,
  C12Input,
  C13Input,
  C14Input,
  C15Input,
  S1Input,
  S2Input,
  S3Input,
  S4Input,
  G1Input,
  D2Input,
  D2MaterialTopic,
  D1Input,
  E1ContextInput,
  E1TargetsInput,
  E1TargetLine,
  E1TargetMilestone,
  E1ActionLine,
  E1EnergyMixType,
  E1TargetScope,
  E1TargetStatus,
  E1ActionStatus,
  E1TransitionStatus,
  E1FinancialEffectType,
  E1RemovalType,
  E1ScenarioType,
  E1RiskType,
  E1DecarbonisationDriverType,
  E1ScenariosInput,
  E1CarbonPriceInput,
  E1RiskGeographyInput,
  E1DecarbonisationDriversInput,
  E2WaterInput,
  E3PollutionInput,
  E4BiodiversityInput,
  E5ResourcesInput,
  SbmInput,
  GovInput,
  IroInput,
  MrInput,
  MrProgressStatus,
  E1RemovalProject,
  E1FinancialEffect,
  E1TransitionPlanMeasure
}

