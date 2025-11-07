/**
 * Beregning for modul E1 – klimascenarier.
 */
import type {
  E1ScenarioType,
  E1ScenariosInput,
  ModuleEsrsFact,
  ModuleInput,
  ModuleMetric,
  ModuleResult,
  ModuleScenarioEntry,
  ModuleTable,
} from '../../types'

type ScenarioInput = NonNullable<E1ScenariosInput['scenarios']>[number]

const VALID_SCENARIO_TYPES: ReadonlyArray<E1ScenarioType> = [
  'netZero15',
  'wellBelow2',
  'currentPolicies',
  'stressTest',
  'custom',
]

const VALID_TIME_HORIZONS = new Set(['shortTerm', 'mediumTerm', 'longTerm'])

export function runE1Scenarios(input: ModuleInput): ModuleResult {
  const raw = ((input.E1Scenarios ?? {}) as E1ScenariosInput) || {}
  const warnings: string[] = []
  const trace: string[] = []
  const assumptions = [
    'Scenarier anvendes til at dokumentere klimarisikovurderinger i henhold til ESRS E1.',
    'Manglende værdier tolkes som 0 eller ukendt afhængigt af feltet.',
  ]

  const rawScenarios: ScenarioInput[] = Array.isArray(raw.scenarios)
    ? (raw.scenarios as ScenarioInput[])
    : ([] as ScenarioInput[])
  const scenarios = rawScenarios
    .map((scenario, index) => normaliseScenario(scenario, index, trace, warnings))
    .filter((scenario): scenario is ModuleScenarioEntry => scenario !== null)

  const value = scenarios.length
  trace.push(`scenarios.count=${value}`)

  const coverageValues = scenarios
    .map((scenario) => scenario.coveragePercent)
    .filter((coverage): coverage is number => coverage != null)
  const averageCoverage = coverageValues.length > 0 ? round(coverageValues.reduce((sum, n) => sum + n, 0) / coverageValues.length, 1) : null

  if (averageCoverage != null) {
    trace.push(`scenarios.averageCoverage=${averageCoverage}`)
  }

  const metrics: ModuleMetric[] = []
  if (averageCoverage != null) {
    metrics.push({
      label: 'Gennemsnitlig dækningsgrad',
      value: averageCoverage,
      unit: '%',
    })
  }

  const tables: ModuleTable[] = scenarios.length
    ? [
        {
          id: 'e1-scenarios',
          title: 'Klimascenarier',
          columns: [
            { key: 'name', label: 'Scenarie' },
            { key: 'provider', label: 'Udbyder' },
            { key: 'scenarioType', label: 'Type' },
            { key: 'timeHorizon', label: 'Horisont' },
            { key: 'coveragePercent', label: 'Dækning (%)', align: 'end', format: 'percent' },
            { key: 'description', label: 'Beskrivelse' },
          ],
          rows: scenarios.map((scenario) => ({
            name: scenario.name ?? 'Scenarie',
            provider: scenario.provider ?? 'Ukendt',
            scenarioType: scenario.scenarioType ?? 'ukendt',
            timeHorizon: scenario.timeHorizon ?? 'ukendt',
            coveragePercent: scenario.coveragePercent ?? null,
            description: scenario.description ?? null,
          })),
        },
      ]
    : []

  const scenarioNarrative = normaliseText(raw.scenarioNarrative)
  if (scenarioNarrative) {
    trace.push('scenarioNarrative.present=true')
  }

  const narratives = scenarioNarrative
    ? [
        {
          label: 'Anvendelse af scenarieanalyse',
          content: scenarioNarrative,
        },
      ]
    : []

  const scenarioTypes = new Set(scenarios.map((scenario) => scenario.scenarioType).filter((type): type is E1ScenarioType => type != null))
  const hasDiverseRange = scenarioTypes.size >= 2
  trace.push(`scenarioTypes.distinct=${scenarioTypes.size}`)

  const esrsFacts: ModuleEsrsFact[] = [
    {
      conceptKey: 'E1ScenariosDiverseRange',
      value: hasDiverseRange,
    },
  ]

  if (scenarioNarrative) {
    esrsFacts.push({ conceptKey: 'E1ScenariosNarrative', value: scenarioNarrative })
  } else if (scenarios.length > 0) {
    const fallbackNarrative = scenarios
      .map((scenario) => scenario.name)
      .filter((name): name is string => !!name)
      .join(', ')
    if (fallbackNarrative) {
      esrsFacts.push({ conceptKey: 'E1ScenariosNarrative', value: fallbackNarrative })
    }
  }

  return {
    value,
    unit: 'scenarier',
    assumptions,
    trace,
    warnings,
    scenarios,
    ...(metrics.length ? { metrics } : {}),
    ...(tables.length ? { tables } : {}),
    ...(narratives.length ? { narratives } : {}),
    esrsFacts,
  }
}

function normaliseScenario(
  scenario: ScenarioInput | undefined,
  index: number,
  trace: string[],
  warnings: string[],
): ModuleScenarioEntry | null {
  if (!scenario || typeof scenario !== 'object') {
    return null
  }

  const name = normaliseText((scenario as { name?: unknown }).name)
  const provider = normaliseText((scenario as { provider?: unknown }).provider)

  const rawScenarioType = (scenario as { scenarioType?: unknown }).scenarioType
  const scenarioType: E1ScenarioType | null = isScenarioType(rawScenarioType)
    ? rawScenarioType
    : null
  if (!scenarioType && rawScenarioType != null) {
    warnings.push(`Ukendt scenarietype på række ${index + 1}. Værdien ignoreres.`)
  }

  const rawTimeHorizon = normaliseText((scenario as { timeHorizon?: unknown }).timeHorizon)
  const timeHorizon = rawTimeHorizon && VALID_TIME_HORIZONS.has(rawTimeHorizon) ? rawTimeHorizon : rawTimeHorizon ?? null
  if (rawTimeHorizon && !VALID_TIME_HORIZONS.has(rawTimeHorizon)) {
    warnings.push(`Ukendt tidshorisont på scenarie ${index + 1}. Angivet værdi beholdes som tekst.`)
  }

  const coveragePercent = clampPercent((scenario as { coveragePercent?: unknown }).coveragePercent)
  const description = normaliseText((scenario as { description?: unknown }).description)

  if (!name && !provider && !scenarioType && coveragePercent == null && !description) {
    return null
  }

  trace.push(`scenario[${index}].type=${scenarioType ?? 'ukendt'}`)
  if (coveragePercent != null) {
    trace.push(`scenario[${index}].coverage=${coveragePercent}`)
  }

  return {
    name,
    provider,
    scenarioType,
    timeHorizon,
    coveragePercent,
    description,
  }
}

function isScenarioType(value: unknown): value is E1ScenarioType {
  return typeof value === 'string' && VALID_SCENARIO_TYPES.includes(value as E1ScenarioType)
}

function clampPercent(value: unknown): number | null {
  if (value == null) {
    return null
  }
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return null
  }
  if (numeric < 0) {
    return 0
  }
  if (numeric > 100) {
    return 100
  }
  return round(numeric, 1)
}

function normaliseText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}
