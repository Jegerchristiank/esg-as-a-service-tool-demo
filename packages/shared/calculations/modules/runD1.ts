/**
 * ESRS 2 D1 – governance validation against qualitative requirements.
 */
import type {
  D1Input,
  ModuleEsrsFact,
  ModuleEsrsTable,
  ModuleInput,
  ModuleResult
} from '../../types'

const MIN_CORE_TEXT_LENGTH = 200
const MIN_SUPPORTING_TEXT_LENGTH = 150

type RequirementResult = {
  id: string
  label: string
  passes: boolean
  detail: string
}

type RequirementOptions = {
  id: string
  label: string
  passes: boolean
  successDetail: string
  failureDetail: string
  warnings: string[]
}

type ImpactsDetails = NonNullable<D1Input['impactsRisksOpportunities']>
type TargetLine = NonNullable<NonNullable<D1Input['targetsAndKpis']>['kpis']>[number]
type ValueChainCoverage = NonNullable<ImpactsDetails['valueChainCoverage']>
type TimeHorizonValue = NonNullable<ImpactsDetails['timeHorizons']>[number]

const timeHorizonLabels: Record<TimeHorizonValue, string> = {
  shortTerm: 'kort sigt',
  mediumTerm: 'mellemsigt',
  longTerm: 'lang sigt'
}

const allTimeHorizons: TimeHorizonValue[] = ['shortTerm', 'mediumTerm', 'longTerm']

export function runD1(input: ModuleInput): ModuleResult {
  const raw = (input.D1 ?? null) as D1Input | null

  const boundary = raw?.organizationalBoundary ?? null
  const scope2Method = raw?.scope2Method ?? null
  const screeningCompleted = raw?.scope3ScreeningCompleted ?? null
  const dataQuality = raw?.dataQuality ?? null
  const strategy = raw?.strategy ?? null
  const governance = raw?.governance ?? null
  const impacts = raw?.impactsRisksOpportunities ?? null
  const targets = raw?.targetsAndKpis ?? null

  const materiality = normaliseText(raw?.materialityAssessmentDescription)
  const strategySummary = normaliseText(raw?.strategyDescription)

  const strategyEntries = [
    {
      key: 'businessModelSummary',
      value: normaliseText(strategy?.businessModelSummary)
    },
    {
      key: 'sustainabilityIntegration',
      value: normaliseText(strategy?.sustainabilityIntegration)
    },
    {
      key: 'resilienceDescription',
      value: normaliseText(strategy?.resilienceDescription)
    },
    {
      key: 'stakeholderEngagement',
      value: normaliseText(strategy?.stakeholderEngagement)
    }
  ]

  const governanceEntries = [
    {
      key: 'oversight',
      value: normaliseText(governance?.oversight)
    },
    {
      key: 'managementRoles',
      value: normaliseText(governance?.managementRoles)
    },
    {
      key: 'esgExpertise',
      value: normaliseText(governance?.esgExpertise)
    },
    {
      key: 'incentives',
      value: normaliseText(governance?.incentives)
    },
    {
      key: 'policies',
      value: normaliseText(governance?.policies)
    }
  ]

  const impactsEntries = [
    {
      key: 'processDescription',
      value: normaliseText(impacts?.processDescription)
    },
    {
      key: 'prioritisationCriteria',
      value: normaliseText(impacts?.prioritisationCriteria)
    },
    {
      key: 'integrationIntoManagement',
      value: normaliseText(impacts?.integrationIntoManagement)
    },
    {
      key: 'mitigationActions',
      value: normaliseText(impacts?.mitigationActions)
    }
  ]

  const targetEntries = [
    {
      key: 'governanceIntegration',
      value: normaliseText(targets?.governanceIntegration)
    },
    {
      key: 'progressDescription',
      value: normaliseText(targets?.progressDescription)
    }
  ]

  const valueChainCoverage = impacts?.valueChainCoverage ?? null
  const timeHorizons = impacts?.timeHorizons ?? []
  const quantitativeTargets = targets?.hasQuantitativeTargets ?? null
  const rawKpis: TargetLine[] = targets?.kpis ?? []
  const meaningfulKpis = rawKpis.filter(hasAnyKpiData)

  const hasAnyInput =
    boundary !== null ||
    scope2Method !== null ||
    screeningCompleted !== null ||
    dataQuality !== null ||
    materiality.length > 0 ||
    strategySummary.length > 0 ||
    strategyEntries.some((entry) => entry.value.length > 0) ||
    governanceEntries.some((entry) => entry.value.length > 0) ||
    (governance?.hasEsgCommittee ?? null) !== null ||
    impactsEntries.some((entry) => entry.value.length > 0) ||
    valueChainCoverage !== null ||
    timeHorizons.length > 0 ||
    targetEntries.some((entry) => entry.value.length > 0) ||
    quantitativeTargets !== null ||
    meaningfulKpis.length > 0

  const trace: string[] = [
    `organizationalBoundary=${boundary ?? 'null'}`,
    `scope2Method=${scope2Method ?? 'null'}`,
    `scope3ScreeningCompleted=${screeningCompleted ?? 'null'}`,
    `dataQuality=${dataQuality ?? 'null'}`,
    `materialityLength=${materiality.length}`,
    `strategySummaryLength=${strategySummary.length}`,
    `strategyDetailLengths=${strategyEntries
      .map((entry) => `${entry.key}:${entry.value.length}`)
      .join(',')}`,
    `governanceDetailLengths=${governanceEntries
      .map((entry) => `${entry.key}:${entry.value.length}`)
      .join(',')}`,
    `impactsDetailLengths=${impactsEntries
      .map((entry) => `${entry.key}:${entry.value.length}`)
      .join(',')}`,
    `valueChainCoverage=${valueChainCoverage ?? 'null'}`,
    `timeHorizons=${timeHorizons.length > 0 ? timeHorizons.join('|') : 'none'}`,
    `quantitativeTargets=${quantitativeTargets ?? 'null'}`,
    `kpiCount=${meaningfulKpis.length}`
  ]

  if (!hasAnyInput) {
    return {
      value: 0,
      unit: 'opfyldte krav',
      assumptions: ['Udfyld D1-felterne for at validere governance-oplysningerne mod ESRS-krav.'],
      trace,
      warnings: []
    }
  }

  const warnings: string[] = []
  const requirements: RequirementResult[] = []

  const addRequirement = ({ id, label, passes, successDetail, failureDetail, warnings: extraWarnings }: RequirementOptions) => {
    requirements.push({ id, label, passes, detail: passes ? successDetail : failureDetail })
    trace.push(`requirement:${id}=${passes ? 'pass' : 'fail'}`)
    if (!passes) {
      warnings.push(failureDetail)
    }
    warnings.push(...extraWarnings)
  }

  const scope3Detail = evaluateScope3Requirement({
    screeningCompleted,
    valueChainCoverage,
    timeHorizons
  })

  const methodPass = boundary !== null && scope2Method !== null && dataQuality !== null
  const methodWarnings: string[] = []
  if (dataQuality === 'proxy') {
    methodWarnings.push('Proxy-data er svag dokumentation – planlæg overgang til primære eller sekundære kilder.')
  }
  if (boundary === 'equityShare') {
    methodWarnings.push('Overvej operational control for at afspejle styringsmuligheder i D1-rapporteringen.')
  }

  addRequirement({
    id: 'methodology',
    label: 'Metodegrundlag er dokumenteret',
    passes: methodPass,
    successDetail: `Afgrænsning: ${boundary}; Scope 2 metode: ${scope2Method}; datakvalitet: ${dataQuality}.`,
    failureDetail: 'Angiv organisatorisk afgrænsning, primær Scope 2 metode og dominerende datakvalitet.',
    warnings: methodWarnings
  })

  addRequirement({
    id: 'scope3Coverage',
    label: 'Scope 3 screening dækker værdikæden og tidshorisonter',
    passes: scope3Detail.passes,
    successDetail: scope3Detail.successDetail,
    failureDetail: scope3Detail.failureDetail,
    warnings: scope3Detail.warnings
  })

  const materialityDetail = evaluateNarrativeRequirement({
    label: 'materialitet',
    value: materiality,
    emptyMessage: 'Beskriv væsentlighedsvurderingen og dens resultater.',
    shortMessage: `Uddyb væsentlighedsvurderingen (mindst ${MIN_CORE_TEXT_LENGTH} tegn).`,
    minLength: MIN_CORE_TEXT_LENGTH
  })

  addRequirement({
    id: 'materiality',
    label: 'Væsentlighedsvurderingen er beskrevet',
    passes: materialityDetail.passes,
    successDetail: materialityDetail.successDetail,
    failureDetail: materialityDetail.failureDetail,
    warnings: []
  })

  const strategyDetail = evaluateStrategyRequirement(strategySummary, strategyEntries)
  addRequirement({
    id: 'strategy',
    label: 'Strategi og integration er dokumenteret',
    passes: strategyDetail.passes,
    successDetail: strategyDetail.successDetail,
    failureDetail: strategyDetail.failureDetail,
    warnings: strategyDetail.warnings
  })

  const governanceDetail = evaluateGovernanceRequirement(governanceEntries, governance?.hasEsgCommittee ?? null)
  addRequirement({
    id: 'governance',
    label: 'Governance-roller og tilsyn er beskrevet',
    passes: governanceDetail.passes,
    successDetail: governanceDetail.successDetail,
    failureDetail: governanceDetail.failureDetail,
    warnings: governanceDetail.warnings
  })

  const impactsDetail = evaluateImpactsRequirement(impactsEntries)
  addRequirement({
    id: 'impactsProcess',
    label: 'Proces for impacts, risici og muligheder er beskrevet',
    passes: impactsDetail.passes,
    successDetail: impactsDetail.successDetail,
    failureDetail: impactsDetail.failureDetail,
    warnings: []
  })

  const targetsDetail = evaluateTargetsRequirement(targetEntries, quantitativeTargets, meaningfulKpis)
  addRequirement({
    id: 'targets',
    label: 'Mål, opfølgning og KPI’er er dokumenteret',
    passes: targetsDetail.passes,
    successDetail: targetsDetail.successDetail,
    failureDetail: targetsDetail.failureDetail,
    warnings: targetsDetail.warnings
  })

  const passedCount = requirements.filter((requirement) => requirement.passes).length

  const assumptions = [
    `Evalueringen tester ${requirements.length} krav fra ESRS 2 D1 (opfyldt/ikke opfyldt).`,
    `Narrativer vurderes som fyldestgørende ved ${MIN_CORE_TEXT_LENGTH} tegn for kernefelter og ${MIN_SUPPORTING_TEXT_LENGTH} tegn for understøttende detaljer.`,
    'Scope 3-kravet kræver fuldført screening, værdikædedækning og analyser på mellemsigt og lang sigt.',
    'KPI-kravet opfyldes først når mindst én KPI har baseline og mål sammen med kvalitative beskrivelser.'
  ]

  const esrsFacts: ModuleEsrsFact[] = []
  const pushStringFact = (key: string, value: string | null | undefined) => {
    const resolved = value == null ? '' : value.trim()
    if (resolved.length === 0) {
      return
    }
    esrsFacts.push({ conceptKey: key, value: resolved, unitId: null })
  }

  const pushBooleanFact = (key: string, value: boolean | null | undefined) => {
    if (value == null) {
      return
    }
    esrsFacts.push({ conceptKey: key, value, unitId: null })
  }

  const pushNumericFact = (key: string, value: number | null | undefined, unitId: string, decimals: number) => {
    if (value == null || Number.isNaN(value) || !Number.isFinite(Number(value))) {
      return
    }
    esrsFacts.push({ conceptKey: key, value: Number(value), unitId, decimals })
  }

  pushStringFact('D1OrganizationalBoundary', boundary)
  pushStringFact('D1Scope2Method', scope2Method)
  pushBooleanFact('D1Scope3ScreeningCompleted', screeningCompleted)
  pushStringFact('D1DataQuality', dataQuality)
  pushStringFact('D1MaterialityAssessmentDescription', materiality)
  pushStringFact('D1StrategySummary', strategySummary)
  pushStringFact('D1ValueChainCoverage', valueChainCoverage)
  pushBooleanFact('D1QuantitativeTargets', quantitativeTargets)
  pushNumericFact('D1TimeHorizonsCoveredCount', new Set(timeHorizons).size, 'pure', 0)
  pushNumericFact('D1KpiCount', meaningfulKpis.length, 'pure', 0)
  pushBooleanFact('D1HasEsgCommittee', governance?.hasEsgCommittee ?? null)

  const esrsTables: ModuleEsrsTable[] = []

  const strategyRows = strategyEntries
    .map((entry) => ({ key: entry.key, value: entry.value }))
    .filter((entry) => entry.value.length > 0)
  if (strategyRows.length > 0) {
    esrsTables.push({ conceptKey: 'D1StrategyNarrativesTable', rows: strategyRows })
  }

  const governanceRows = governanceEntries
    .map((entry) => ({ key: entry.key, value: entry.value }))
    .filter((entry) => entry.value.length > 0)
  if (governanceRows.length > 0) {
    esrsTables.push({ conceptKey: 'D1GovernanceNarrativesTable', rows: governanceRows })
  }

  const impactsRows = impactsEntries
    .map((entry) => ({ key: entry.key, value: entry.value }))
    .filter((entry) => entry.value.length > 0)
  if (impactsRows.length > 0) {
    esrsTables.push({ conceptKey: 'D1ImpactsProcessTable', rows: impactsRows })
  }

  const targetsRows = targetEntries
    .map((entry) => ({ key: entry.key, value: entry.value }))
    .filter((entry) => entry.value.length > 0)
  if (targetsRows.length > 0) {
    esrsTables.push({ conceptKey: 'D1TargetsNarrativesTable', rows: targetsRows })
  }

  if (meaningfulKpis.length > 0) {
    esrsTables.push({
      conceptKey: 'D1KpiOverviewTable',
      rows: meaningfulKpis.map((kpi) => ({
        name: normaliseText(kpi.name),
        kpi: normaliseText(kpi.kpi),
        unit: normaliseText(kpi.unit),
        baselineYear: kpi.baselineYear ?? null,
        baselineValue: kpi.baselineValue ?? null,
        targetYear: kpi.targetYear ?? null,
        targetValue: kpi.targetValue ?? null,
        comments: normaliseText(kpi.comments)
      }))
    })
  }

  return {
    value: passedCount,
    unit: 'opfyldte krav',
    assumptions,
    trace,
    warnings,
    metrics: requirements.map((requirement) => ({
      label: requirement.label,
      value: requirement.passes ? 'Opfyldt' : 'Mangler',
      context: requirement.detail
    })),
    ...(esrsFacts.length > 0 ? { esrsFacts } : {}),
    ...(esrsTables.length > 0 ? { esrsTables } : {})
  }
 }

 function normaliseText(value: string | null | undefined): string {
  if (!value) {
    return ''
  }
  return value.trim()
 }

 function hasAnyKpiData(line: TargetLine): boolean {
  return (
    normaliseText(line.name).length > 0 ||
    normaliseText(line.kpi).length > 0 ||
    normaliseText(line.unit).length > 0 ||
    normaliseText(line.comments).length > 0 ||
    (line.baselineYear !== null && line.baselineYear !== undefined) ||
    (line.baselineValue !== null && line.baselineValue !== undefined) ||
    (line.targetYear !== null && line.targetYear !== undefined) ||
    (line.targetValue !== null && line.targetValue !== undefined)
  )
 }

 function evaluateScope3Requirement({
  screeningCompleted,
  valueChainCoverage,
  timeHorizons
 }: {
  screeningCompleted: boolean | null
  valueChainCoverage: ValueChainCoverage | null
  timeHorizons: TimeHorizonValue[]
 }): {
  passes: boolean
  successDetail: string
  failureDetail: string
  warnings: string[]
 } {
  const uniqueHorizons = Array.from(new Set(timeHorizons))
  const hasMedium = uniqueHorizons.includes('mediumTerm')
  const hasLong = uniqueHorizons.includes('longTerm')

  if (screeningCompleted !== true) {
    return {
      passes: false,
      successDetail: '',
      failureDetail: 'Markér at Scope 3 screeningen er gennemført.',
      warnings: []
    }
  }

  if (valueChainCoverage == null) {
    return {
      passes: false,
      successDetail: '',
      failureDetail: 'Angiv værdikædedækning for Scope 3 screeningen.',
      warnings: []
    }
  }

  if (valueChainCoverage === 'ownOperations') {
    return {
      passes: false,
      successDetail: '',
      failureDetail: 'Udvid Scope 3 screeningen til upstream og downstream led.',
      warnings: []
    }
  }

  if (valueChainCoverage === 'upstreamOnly' || valueChainCoverage === 'downstreamOnly') {
    return {
      passes: false,
      successDetail: '',
      failureDetail: 'Dæk både upstream og downstream i Scope 3 screeningen.',
      warnings: []
    }
  }

  if (!hasMedium || !hasLong) {
    const missing = allTimeHorizons
      .filter((value) => !uniqueHorizons.includes(value))
      .map((value) => timeHorizonLabels[value])
      .join(' og ')
    return {
      passes: false,
      successDetail: '',
      failureDetail: `Tilføj analyser for ${missing} i Scope 3 screeningen.`,
      warnings: []
    }
  }

  const detail = `Screeningen dækker ${valueChainCoverage} og analyserer ${uniqueHorizons
    .map((value) => timeHorizonLabels[value])
    .join(', ')}.`

  const warnings: string[] = []
  if (valueChainCoverage === 'upstreamAndDownstream') {
    warnings.push('Dokumentér fuld værdikædedækning for at matche ESRS bedste praksis.')
  }

  return {
    passes: true,
    successDetail: detail,
    failureDetail: '',
    warnings
  }
 }

 function evaluateNarrativeRequirement({
  label,
  value,
  emptyMessage,
  shortMessage,
  minLength
 }: {
  label: string
  value: string
  emptyMessage: string
  shortMessage: string
  minLength: number
 }): { passes: boolean; successDetail: string; failureDetail: string } {
  if (value.length === 0) {
    return {
      passes: false,
      successDetail: '',
      failureDetail: emptyMessage
    }
  }

  if (value.length < minLength) {
    return {
      passes: false,
      successDetail: '',
      failureDetail: shortMessage
    }
  }

  return {
    passes: true,
    successDetail: `Narrativet for ${label} er udfyldt med ${value.length} tegn.`,
    failureDetail: ''
  }
 }

 function evaluateStrategyRequirement(strategySummary: string, entries: Array<{ key: string; value: string }>) {
  const detailedEntries = entries.filter((entry) => entry.value.length >= MIN_SUPPORTING_TEXT_LENGTH)
  const summaryDetailed = strategySummary.length >= MIN_CORE_TEXT_LENGTH

  if (!summaryDetailed) {
    return {
      passes: false,
      successDetail: '',
      failureDetail: `Beskriv strategi og politikker (mindst ${MIN_CORE_TEXT_LENGTH} tegn).`,
      warnings: []
    }
  }

  if (detailedEntries.length < 3) {
    return {
      passes: false,
      successDetail: '',
      failureDetail: 'Uddyb hvordan bæredygtighed integreres i forretningsmodel, robusthed og stakeholderinddragelse.',
      warnings: []
    }
  }

  const detail = `Strategien dækker ${detailedEntries.length} nøgleelementer med tilstrækkelig dybde.`
  return {
    passes: true,
    successDetail: detail,
    failureDetail: '',
    warnings: []
  }
 }

 function evaluateGovernanceRequirement(entries: Array<{ key: string; value: string }>, hasCommittee: boolean | null) {
  const detailedEntries = entries.filter((entry) => entry.value.length >= MIN_SUPPORTING_TEXT_LENGTH)
  const warnings: string[] = []

  if (hasCommittee === false) {
    warnings.push('Dokumentér hvordan bestyrelsen følger op uden et dedikeret ESG-udvalg.')
  }

  if (hasCommittee == null) {
    return {
      passes: false,
      successDetail: '',
      failureDetail: 'Angiv om der er et ESG-/bæredygtighedsudvalg og dets mandat.',
      warnings
    }
  }

  if (detailedEntries.length < 4) {
    return {
      passes: false,
      successDetail: '',
      failureDetail: 'Uddyb bestyrelsens tilsyn, ledelsesroller, incitamenter og politikker.',
      warnings
    }
  }

  return {
    passes: true,
    successDetail: 'Governance-roller og kontrolmiljø er beskrevet i mindst fire dimensioner.',
    failureDetail: '',
    warnings
  }
 }

 function evaluateImpactsRequirement(entries: Array<{ key: string; value: string }>) {
  const detailedEntries = entries.filter((entry) => entry.value.length >= MIN_SUPPORTING_TEXT_LENGTH)

  if (detailedEntries.length < 3) {
    return {
      passes: false,
      successDetail: '',
      failureDetail: 'Uddyb processen for identificering, prioritering og håndtering af impacts/risici/muligheder.',
      warnings: []
    }
  }

  return {
    passes: true,
    successDetail: `Procesbeskrivelsen dækker ${detailedEntries.length} hovedtrin.`,
    failureDetail: '',
    warnings: []
  }
 }

 function evaluateTargetsRequirement(
  entries: Array<{ key: string; value: string }>,
  quantitativeTargets: boolean | null,
  kpis: TargetLine[]
 ) {
  const detailedEntries = entries.filter((entry) => entry.value.length >= MIN_SUPPORTING_TEXT_LENGTH)
  const quantifiedKpis = kpis.filter((kpi) =>
    (kpi.baselineYear != null || kpi.baselineValue != null) &&
    (kpi.targetYear != null || kpi.targetValue != null)
  )

  const warnings: string[] = []

  if (quantitativeTargets === false) {
    warnings.push('Bekræft kvantitative mål for væsentlige impacts og risici.')
  }

  if (quantitativeTargets == null) {
    return {
      passes: false,
      successDetail: '',
      failureDetail: 'Angiv om organisationen arbejder med kvantitative mål.',
      warnings
    }
  }

  if (detailedEntries.length < 2) {
    return {
      passes: false,
      successDetail: '',
      failureDetail: 'Uddyb governance-forankring og fremdrift for målene.',
      warnings
    }
  }

  if (quantitativeTargets === true && quantifiedKpis.length === 0) {
    return {
      passes: false,
      successDetail: '',
      failureDetail: 'Tilføj mindst én KPI med baseline og mål for at dokumentere opfølgning.',
      warnings
    }
  }

  const detail = `Kvantitative mål er bekræftet og ${quantifiedKpis.length} KPI’er har baseline/mål.`
  return {
    passes: true,
    successDetail: detail,
    failureDetail: '',
    warnings
  }
 }
