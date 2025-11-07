/**
 * ESRS 2 MR – qualitative validation of metrics and targets.
 */
import type {
  ModuleInput,
  ModuleResult,
  MrInput,
  E1ContextInput,
  ModuleNarrative,
  ModuleNote,
  ModuleTransitionMeasure,
  ModuleFinancialEffect,
  ModuleRemovalProject,
  ModuleEsrsFact,
  ModuleEsrsTable
} from '../../types'

const MINIMUM_DETAIL_LENGTH = 200

const ASSUMPTIONS = [
  'Evalueringen tester 8 krav fra ESRS 2 MR med binære resultater (opfyldt/ikke opfyldt).',
  `Narrativer skal være på mindst ${MINIMUM_DETAIL_LENGTH} tegn for at tælle som dokumenteret.`,
  'Mindst én klimarelateret metric skal have baseline og mål eller aktuel status.',
  'Overgangstiltag, finansielle effekter og removals kan dokumenteres via narrativ eller strukturerede felter.'
] as const

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
  warnings?: string[]
}

type CollectionResult<T> = {
  items: T[]
  total: number
  detailed: number
}

type NarrativeField = {
  id: string
  key: 'intensityNarrative' | 'targetNarrative' | 'dataQualityNarrative' | 'assuranceNarrative'
  label: string
  missingMessage: string
}

const narrativeFields: NarrativeField[] = [
  {
    id: 'intensityNarrative',
    key: 'intensityNarrative',
    label: 'Intensiteter og udvikling',
    missingMessage: 'Beskriv udviklingen i intensiteter for ESRS 2 MR.'
  },
  {
    id: 'targetNarrative',
    key: 'targetNarrative',
    label: 'Mål og status',
    missingMessage: 'Forklar fremdrift på klimamål og væsentlige KPI’er.'
  },
  {
    id: 'dataQualityNarrative',
    key: 'dataQualityNarrative',
    label: 'Datakvalitet',
    missingMessage: 'Dokumentér kvalitet og kontroller for nøgletal.'
  },
  {
    id: 'assuranceNarrative',
    key: 'assuranceNarrative',
    label: 'Assurance',
    missingMessage: 'Angiv scope for intern og ekstern assurance.'
  }
]

export function runMR(input: ModuleInput): ModuleResult {
  const mrRaw = (input.MR ?? null) as MrInput | null
  const context = (input.E1Context ?? null) as E1ContextInput | null

  const trace: string[] = []
  const warnings: string[] = []
  const narratives: ModuleNarrative[] = []
  const notes: ModuleNote[] = []

  const requirements: RequirementResult[] = []
  const narrativeValues: Partial<Record<NarrativeField['id'], string>> = {}
  const addRequirement = ({ id, label, passes, successDetail, failureDetail, warnings: extraWarnings = [] }: RequirementOptions) => {
    requirements.push({ id, label, passes, detail: passes ? successDetail : failureDetail })
    trace.push(`requirement:${id}=${passes ? 'pass' : 'fail'}`)
    if (!passes) {
      warnings.push(failureDetail)
    }
    if (extraWarnings.length > 0) {
      warnings.push(...extraWarnings)
    }
  }

  narrativeFields.forEach(({ id, key, label, missingMessage }) => {
    const value = normaliseText(mrRaw?.[key])
    trace.push(`${key}Length=${value?.length ?? 0}`)

    if (value) {
      narratives.push({ label, content: value })
      narrativeValues[id] = value
    }

    const passes = value != null && value.length >= MINIMUM_DETAIL_LENGTH
    const failureDetail = value == null ? missingMessage : `Uddyb "${label}" (mindst ${MINIMUM_DETAIL_LENGTH} tegn).`
    const successDetail = passes ? `Narrativet er udfyldt med ${value.length} tegn.` : ''

    addRequirement({
      id,
      label: `${label} er beskrevet`,
      passes,
      successDetail,
      failureDetail
    })
  })

  const transitionNarrative = normaliseText(mrRaw?.transitionPlanNarrative)
  trace.push(`transitionPlanNarrativeLength=${transitionNarrative?.length ?? 0}`)
  if (transitionNarrative) {
    narratives.push({ label: 'Overgangsplan', content: transitionNarrative })
  }

  const financialNarrative = normaliseText(mrRaw?.financialEffectNarrative)
  trace.push(`financialEffectNarrativeLength=${financialNarrative?.length ?? 0}`)
  if (financialNarrative) {
    narratives.push({ label: 'Finansielle effekter', content: financialNarrative })
  }

  const extraNarratives = Array.isArray(mrRaw?.keyNarratives) ? mrRaw.keyNarratives : []
  extraNarratives.forEach((entry, index) => {
    const title = normaliseText(entry?.title) ?? `Narrativ ${index + 1}`
    const content = normaliseText(entry?.content)
    if (!content) {
      warnings.push(`Narrativ ${index + 1} mangler indhold.`)
      return
    }
    narratives.push({ label: title, content })
  })

  const transitionMeasuresResult = combineTransitionMeasures(mrRaw, context, trace, warnings)
  const financialEffectsResult = combineFinancialEffects(mrRaw, context, trace, warnings)
  const removalProjectsResult = collectRemovalProjects(context, trace, warnings)

  const transitionPass =
    (transitionNarrative != null && transitionNarrative.length >= MINIMUM_DETAIL_LENGTH) ||
    transitionMeasuresResult.detailed > 0
  const transitionFailureDetail = (() => {
    if (transitionNarrative != null && transitionNarrative.length < MINIMUM_DETAIL_LENGTH && transitionMeasuresResult.total === 0) {
      return `Uddyb overgangsplanen (mindst ${MINIMUM_DETAIL_LENGTH} tegn) eller registrer konkrete tiltag.`
    }
    if (transitionMeasuresResult.total > 0 && transitionMeasuresResult.detailed === 0) {
      return 'Uddyb registrerede overgangstiltag med status, milepæl eller investering.'
    }
    return 'Beskriv overgangsplanen eller registrer konkrete tiltag.'
  })()

  const transitionSuccessDetail = transitionMeasuresResult.detailed > 0
    ? `${transitionMeasuresResult.detailed} overgangstiltag er dokumenteret med status eller milepæle.`
    : transitionNarrative != null
      ? `Narrativet om overgangsplanen er udfyldt med ${transitionNarrative.length} tegn.`
      : ''

  addRequirement({
    id: 'transitionPlan',
    label: 'Overgangsplanen er dokumenteret',
    passes: transitionPass,
    successDetail: transitionSuccessDetail,
    failureDetail: transitionFailureDetail
  })

  const financialPass =
    (financialNarrative != null && financialNarrative.length >= MINIMUM_DETAIL_LENGTH) ||
    financialEffectsResult.detailed > 0
  const financialFailureDetail = (() => {
    if (financialNarrative != null && financialNarrative.length < MINIMUM_DETAIL_LENGTH && financialEffectsResult.total === 0) {
      return `Uddyb finansielle effekter (mindst ${MINIMUM_DETAIL_LENGTH} tegn) eller registrer beløb/beskrivelser.`
    }
    if (financialEffectsResult.total > 0 && financialEffectsResult.detailed === 0) {
      return 'Angiv beløb eller uddybelse for de registrerede finansielle effekter.'
    }
    return 'Beskriv finansielle effekter eller registrer konkrete beløb.'
  })()

  const financialSuccessDetail = financialEffectsResult.detailed > 0
    ? `${financialEffectsResult.detailed} finansielle effekter har beløb eller detaljer.`
    : financialNarrative != null
      ? `Narrativet om finansielle effekter er udfyldt med ${financialNarrative.length} tegn.`
      : ''

  addRequirement({
    id: 'financialEffects',
    label: 'Finansielle effekter er dokumenteret',
    passes: financialPass,
    successDetail: financialSuccessDetail,
    failureDetail: financialFailureDetail
  })

  const metrics = Array.isArray(mrRaw?.metrics) ? mrRaw.metrics : []
  let metricsWithData = 0
  const metricSummaries: string[] = []

  metrics.forEach((metric, index) => {
    const name = normaliseText(metric?.name) ?? `Metric ${index + 1}`
    const unit = normaliseText(metric?.unit)
    const baselineYear = normaliseYear(metric?.baselineYear)
    const baselineValue = normaliseNumber(metric?.baselineValue)
    const currentYear = normaliseYear(metric?.currentYear)
    const currentValue = normaliseNumber(metric?.currentValue)
    const targetYear = normaliseYear(metric?.targetYear)
    const targetValue = normaliseNumber(metric?.targetValue)
    const status = normaliseStatus(metric?.status)
    const owner = normaliseText(metric?.owner)
    const description = normaliseText(metric?.description)

    if (
      !name &&
      !unit &&
      baselineYear == null &&
      baselineValue == null &&
      currentYear == null &&
      currentValue == null &&
      targetYear == null &&
      targetValue == null &&
      status == null &&
      !owner &&
      !description
    ) {
      return
    }

    trace.push(`metric[${index}]=${name}`)

    const hasData =
      (baselineYear != null && baselineValue != null) ||
      (currentYear != null && currentValue != null) ||
      (targetYear != null && targetValue != null) ||
      description != null

    if (hasData) {
      metricsWithData += 1
    } else {
      warnings.push(`Tilføj aktuelle værdier eller mål for ${name}.`)
    }

    notes.push({
      label: name,
      detail: [
        baselineYear != null ? `Baseline ${baselineYear}: ${baselineValue ?? 'ukendt'} ${unit ?? ''}`.trim() : null,
        currentYear != null ? `Seneste ${currentYear}: ${currentValue ?? 'ukendt'} ${unit ?? ''}`.trim() : null,
        targetYear != null ? `Mål ${targetYear}: ${targetValue ?? 'ukendt'} ${unit ?? ''}`.trim() : null,
        status ? `Status: ${status}` : null,
        description
      ]
        .filter(Boolean)
        .join(' · ')
    })

    metricSummaries.push(
      [
        name,
        baselineYear != null && baselineValue != null ? `Baseline ${baselineYear}: ${baselineValue} ${unit ?? ''}`.trim() : null,
        currentYear != null && currentValue != null ? `Seneste ${currentYear}: ${currentValue} ${unit ?? ''}`.trim() : null,
        targetYear != null && targetValue != null ? `Mål ${targetYear}: ${targetValue} ${unit ?? ''}`.trim() : null,
        status ? `Status: ${status}` : null,
        owner ? `Ansvarlig: ${owner}` : null,
      ]
        .filter(Boolean)
        .join(' · '),
    )

    if (owner) {
      notes.push({ label: `${name} – ansvarlig`, detail: owner })
    }
  })

  const metricsPass = metricsWithData > 0
  addRequirement({
    id: 'metrics',
    label: 'Klimametrics er dokumenteret',
    passes: metricsPass,
    successDetail: `${metricsWithData} metrics har baseline, status eller mål.`,
    failureDetail: 'Tilføj mindst én klimarelateret metric med baseline og mål eller aktuel status.'
  })

  const removalPass =
    removalProjectsResult.total === 0 || removalProjectsResult.detailed === removalProjectsResult.total
  const removalSuccessDetail = removalProjectsResult.total === 0
    ? 'Ingen removal-projekter registreret i ESRS E1 Context.'
    : 'Alle removal-projekter er kvantificeret.'
  const removalFailureDetail = 'Tilføj kvantificerede data for removal-projekterne.'

  addRequirement({
    id: 'removalProjects',
    label: 'GHG-removal projekter er dokumenteret',
    passes: removalPass,
    successDetail: removalSuccessDetail,
    failureDetail: removalFailureDetail
  })

  const passedCount = requirements.filter((requirement) => requirement.passes).length

  const esrsFacts: ModuleEsrsFact[] = []
  const esrsTables: ModuleEsrsTable[] = []

  const intensityNarrativeValue = narrativeValues['intensityNarrative']
  if (intensityNarrativeValue) {
    esrsFacts.push({ conceptKey: 'MRIntensityNarrative', value: intensityNarrativeValue })
  }

  const targetNarrativeParts: string[] = []
  const targetNarrativeValue = narrativeValues['targetNarrative']
  if (targetNarrativeValue) {
    targetNarrativeParts.push(targetNarrativeValue)
  }
  if (metricSummaries.length > 0) {
    targetNarrativeParts.push(`Nøgletal:\n- ${metricSummaries.join('\n- ')}`)
  }
  if (targetNarrativeParts.length > 0) {
    esrsFacts.push({ conceptKey: 'MRTargetsNarrative', value: targetNarrativeParts.join('\n\n') })
  }

  const assuranceNarrativeValue = narrativeValues['assuranceNarrative']
  if (assuranceNarrativeValue) {
    esrsFacts.push({ conceptKey: 'MRAssuranceNarrative', value: assuranceNarrativeValue })
  }

  const transitionSummaries = transitionMeasuresResult.items.map((measure, index) =>
    [
      measure.initiative ?? `Tiltag ${index + 1}`,
      measure.status ? `Status: ${measure.status}` : null,
      measure.milestoneYear != null ? `Milepæl: ${measure.milestoneYear}` : null,
      measure.investmentNeedDkk != null ? `Investering: ${measure.investmentNeedDkk} DKK` : null,
      measure.responsible ? `Ansvarlig: ${measure.responsible}` : null,
    ]
      .filter(Boolean)
      .join(' · '),
  )

  const transitionNarrativeParts: string[] = []
  if (transitionNarrative) {
    transitionNarrativeParts.push(transitionNarrative)
  }
  if (transitionSummaries.length > 0) {
    transitionNarrativeParts.push(`Overgangstiltag:\n- ${transitionSummaries.join('\n- ')}`)
  }
  if (transitionNarrativeParts.length > 0) {
    esrsFacts.push({ conceptKey: 'MRTransitionPlanNarrative', value: transitionNarrativeParts.join('\n\n') })
  }

  const financialEffectSummaries = financialEffectsResult.items.map((effect, index) =>
    [
      effect.label ?? `Finansiel effekt ${index + 1}`,
      effect.type ? `Type: ${effect.type}` : null,
      effect.amountDkk != null ? `Beløb: ${effect.amountDkk} DKK` : null,
      effect.timeframe ? `Tidsramme: ${effect.timeframe}` : null,
      effect.description,
    ]
      .filter(Boolean)
      .join(' · '),
  )

  const financialNarrativeParts: string[] = []
  if (financialNarrative) {
    financialNarrativeParts.push(financialNarrative)
  }
  if (financialEffectSummaries.length > 0) {
    financialNarrativeParts.push(`Finansielle effekter:\n- ${financialEffectSummaries.join('\n- ')}`)
  }
  if (financialNarrativeParts.length > 0) {
    esrsFacts.push({ conceptKey: 'MRFinancialEffectsNarrative', value: financialNarrativeParts.join('\n\n') })
  }

  const metricsNarrativeParts: string[] = []
  metricsNarrativeParts.push(`Registrerede metrics med data: ${metricsWithData} af ${metrics.length}`)
  if (metricSummaries.length > 0) {
    metricsNarrativeParts.push(`Oversigt:\n- ${metricSummaries.join('\n- ')}`)
  }
  esrsFacts.push({ conceptKey: 'MRMetricsNarrative', value: metricsNarrativeParts.join('\n\n') })

  const removalSummaries = removalProjectsResult.items.map((project, index) =>
    [
      project.projectName ?? `Removal projekt ${index + 1}`,
      project.removalType ? `Type: ${project.removalType}` : null,
      project.annualRemovalTonnes != null ? `Årlig removal: ${project.annualRemovalTonnes} t` : null,
      project.storageDescription,
      project.qualityStandard ? `Standard: ${project.qualityStandard}` : null,
      project.permanenceYears != null ? `Permanens: ${project.permanenceYears} år` : null,
      project.financedThroughCredits != null ? `Finansieret via kreditter: ${project.financedThroughCredits ? 'ja' : 'nej'}` : null,
      project.responsible ? `Ansvarlig: ${project.responsible}` : null,
    ]
      .filter(Boolean)
      .join(' · '),
  )

  const dataQualityNarrativeParts: string[] = []
  const dataQualityNarrativeValue = narrativeValues['dataQualityNarrative']
  if (dataQualityNarrativeValue) {
    dataQualityNarrativeParts.push(dataQualityNarrativeValue)
  }
  if (removalSummaries.length > 0) {
    dataQualityNarrativeParts.push(`Removal projekter:\n- ${removalSummaries.join('\n- ')}`)
  }
  if (dataQualityNarrativeParts.length > 0) {
    esrsFacts.push({ conceptKey: 'MRDataQualityNarrative', value: dataQualityNarrativeParts.join('\n\n') })
  }

  if (transitionMeasuresResult.items.length > 0) {
    esrsTables.push({
      conceptKey: 'MRTransitionMeasuresTable',
      rows: transitionMeasuresResult.items.map((measure, index) => ({
        initiative: measure.initiative ?? `Tiltag ${index + 1}`,
        status: measure.status ?? null,
        milestoneYear: measure.milestoneYear ?? null,
        investmentNeedDkk: measure.investmentNeedDkk ?? null,
        responsible: measure.responsible ?? null,
        description: measure.description ?? null,
      })),
    })
  }

  if (financialEffectsResult.items.length > 0) {
    esrsTables.push({
      conceptKey: 'MRFinancialEffectsTable',
      rows: financialEffectsResult.items.map((effect, index) => ({
        label: effect.label ?? `Finansiel effekt ${index + 1}`,
        type: effect.type ?? null,
        amountDkk: effect.amountDkk ?? null,
        timeframe: effect.timeframe ?? null,
        description: effect.description ?? null,
      })),
    })
  }

  if (removalProjectsResult.items.length > 0) {
    esrsTables.push({
      conceptKey: 'MRRemovalProjectsTable',
      rows: removalProjectsResult.items.map((project, index) => ({
        projectName: project.projectName ?? `Removal projekt ${index + 1}`,
        removalType: project.removalType ?? null,
        annualRemovalTonnes: project.annualRemovalTonnes ?? null,
        storageDescription: project.storageDescription ?? null,
        qualityStandard: project.qualityStandard ?? null,
        permanenceYears: project.permanenceYears ?? null,
        financedThroughCredits: project.financedThroughCredits ?? null,
        responsible: project.responsible ?? null,
      })),
    })
  }

  if (requirements.length > 0) {
    esrsTables.push({
      conceptKey: 'MRRequirementsTable',
      rows: requirements.map((requirement) => ({
        id: requirement.id,
        label: requirement.label,
        passes: requirement.passes,
        detail: requirement.detail,
      })),
    })
  }

  return {
    value: passedCount,
    unit: 'opfyldte krav',
    assumptions: Array.from(ASSUMPTIONS),
    trace,
    warnings,
    narratives,
    notes,
    transitionMeasures: transitionMeasuresResult.items,
    financialEffects: financialEffectsResult.items,
    removalProjects: removalProjectsResult.items,
    metrics: requirements.map((requirement) => ({
      label: requirement.label,
      value: requirement.passes ? 'Opfyldt' : 'Mangler',
      context: requirement.detail
    })),
    ...(esrsFacts.length ? { esrsFacts } : {}),
    ...(esrsTables.length ? { esrsTables } : {}),
  }
}

function combineTransitionMeasures(
  input: MrInput | null,
  context: E1ContextInput | null,
  trace: string[],
  warnings: string[]
): CollectionResult<ModuleTransitionMeasure> {
  const collected: ModuleTransitionMeasure[] = []
  let total = 0
  let detailed = 0

  const contextMeasures = Array.isArray(context?.transitionPlanMeasures) ? context.transitionPlanMeasures : []
  contextMeasures.forEach((measure, index) => {
    const initiative = normaliseText(measure?.initiative)
    const description = normaliseText(measure?.description)
    const status = normaliseStatus(measure?.status)
    const milestoneYear = normaliseYear(measure?.milestoneYear)
    const investmentNeed = normaliseNumber(measure?.investmentNeedDkk)
    const responsible = normaliseText(measure?.responsible)

    if (!initiative && !description && status == null && milestoneYear == null && investmentNeed == null && !responsible) {
      return
    }

    total += 1
    trace.push(`transitionPlan[${index}]=${initiative ?? 'ukendt'}`)
    const hasDetail = description != null || status != null || milestoneYear != null || investmentNeed != null
    if (hasDetail) {
      detailed += 1
    } else {
      warnings.push(`Uddyb overgangstiltag ${index + 1} med status eller milepæl.`)
    }

    collected.push({
      initiative,
      description,
      status,
      milestoneYear,
      investmentNeedDkk: investmentNeed,
      responsible
    })
  })

  if (collected.length === 0 && normaliseText(input?.transitionPlanNarrative)) {
    warnings.push('Overvej at registrere konkrete overgangstiltag under overgangsplanen.')
  }

  return { items: collected, total, detailed }
}

function combineFinancialEffects(
  input: MrInput | null,
  context: E1ContextInput | null,
  trace: string[],
  warnings: string[]
): CollectionResult<ModuleFinancialEffect> {
  const collected: ModuleFinancialEffect[] = []
  let total = 0
  let detailed = 0

  const sources = [
    ...(Array.isArray(context?.financialEffects) ? context.financialEffects : []),
    ...(Array.isArray(input?.financialEffects) ? input.financialEffects : [])
  ]

  sources.forEach((effect, index) => {
    const label = normaliseText(effect?.label) ?? `Finansiel effekt ${index + 1}`
    const type = normaliseFinancialType(effect?.type)
    const amount = normaliseNumber(effect?.amountDkk)
    const timeframe = normaliseText(effect?.timeframe)
    const description = normaliseText(effect?.description)

    if (!label && type == null && amount == null && !timeframe && !description) {
      return
    }

    total += 1
    trace.push(`financialEffect[${index}]=${label}`)
    const hasDetail = amount != null || description != null
    if (hasDetail) {
      detailed += 1
    } else {
      warnings.push(`Angiv beløb eller beskrivelse for ${label}.`)
    }

    collected.push({ label, type, amountDkk: amount, timeframe, description })
  })

  return { items: collected, total, detailed }
}

function collectRemovalProjects(
  context: E1ContextInput | null,
  trace: string[],
  warnings: string[]
): CollectionResult<ModuleRemovalProject> {
  const projects = Array.isArray(context?.ghgRemovalProjects) ? context.ghgRemovalProjects : []
  const items: ModuleRemovalProject[] = []
  let total = 0
  let detailed = 0

  projects.forEach((project, index) => {
    const rawName = normaliseText(project?.projectName)
    const projectName = rawName ?? `Removal projekt ${index + 1}`
    const removalType = normaliseRemovalType(project?.removalType)
    const annualRemovalTonnes = normaliseNumber(project?.annualRemovalTonnes)
    const storageDescription = normaliseText(project?.storageDescription)
    const qualityStandard = normaliseText(project?.qualityStandard)
    const permanenceYears = normaliseNumber(project?.permanenceYears)
    const financedThroughCredits = normaliseBoolean(project?.financedThroughCredits)
    const responsible = normaliseText(project?.responsible)

    if (
      !rawName &&
      removalType == null &&
      annualRemovalTonnes == null &&
      !storageDescription &&
      !qualityStandard &&
      permanenceYears == null &&
      financedThroughCredits == null &&
      !responsible
    ) {
      return
    }

    total += 1
    trace.push(`removalProject[${index}]=${projectName}`)
    const hasDetail = annualRemovalTonnes != null || storageDescription != null || qualityStandard != null
    if (hasDetail) {
      detailed += 1
    } else {
      warnings.push(`Tilføj kvantificerede data for removal-projekt ${index + 1}.`)
    }

    items.push({
      projectName,
      removalType,
      annualRemovalTonnes,
      storageDescription,
      qualityStandard,
      permanenceYears,
      financedThroughCredits,
      responsible
    })
  })

  return { items, total, detailed }
}

function normaliseText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normaliseYear(value: unknown): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null
  }
  if (value < 1990 || value > 2100) {
    return null
  }
  return Math.trunc(value)
}

function normaliseNumber(value: unknown): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null
  }
  return value
}

function normaliseBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') {
    return value
  }
  return null
}

function normaliseStatus(value: unknown): ModuleTransitionMeasure['status'] {
  if (value === 'planned' || value === 'inProgress' || value === 'lagging' || value === 'completed' || value === 'notStarted') {
    return value
  }
  return null
}

function normaliseFinancialType(value: unknown): ModuleFinancialEffect['type'] {
  if (value === 'capex' || value === 'opex' || value === 'revenues' || value === 'costs' || value === 'impairments' || value === 'other') {
    return value
  }
  return null
}

function normaliseRemovalType(value: unknown): ModuleRemovalProject['removalType'] {
  if (value === 'inHouse' || value === 'valueChain' || value === 'carbonCredits' || value === 'other') {
    return value
  }
  return null
}
