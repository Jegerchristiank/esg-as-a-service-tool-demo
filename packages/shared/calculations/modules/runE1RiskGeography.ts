/**
 * Beregning for modul E1 – risikogeografi.
 */
import type {
  E1RiskGeographyInput,
  E1RiskType,
  ModuleEsrsFact,
  ModuleInput,
  ModuleMetric,
  ModuleResult,
  ModuleRiskGeographyEntry,
  ModuleTable,
} from '../../types'

const PHYSICAL_RISK_TYPES: ReadonlyArray<E1RiskType> = ['acutePhysical', 'chronicPhysical']
const TRANSITION_RISK_TYPE: E1RiskType = 'transition'

export function runE1RiskGeography(input: ModuleInput): ModuleResult {
  const raw = ((input.E1RiskGeography ?? {}) as E1RiskGeographyInput) || {}
  const warnings: string[] = []
  const trace: string[] = []
  const assumptions = [
    'Geografisk risikovurdering kombinerer fysisk og transitionseksponeringer jf. ESRS E1-9.',
    'Beløb angives i DKK og antages at være positive værdier.',
  ]

  const rawRegions = Array.isArray(raw.riskRegions) ? raw.riskRegions : []
  const regions = rawRegions
    .map((region, index) => normaliseRegion(region, index, warnings, trace))
    .filter((region): region is ModuleRiskGeographyEntry => region !== null)

  const value = regions.length
  trace.push(`riskGeography.count=${value}`)

  const physicalAssets = sumBy(regions, (region) =>
    isPhysicalRisk(region.riskType) ? region.assetsAtRiskDkk ?? 0 : 0,
  )
  const transitionAssets = sumBy(regions, (region) =>
    region.riskType === TRANSITION_RISK_TYPE ? region.assetsAtRiskDkk ?? 0 : 0,
  )
  const physicalRevenue = sumBy(regions, (region) =>
    isPhysicalRisk(region.riskType) ? region.revenueAtRiskDkk ?? 0 : 0,
  )
  const transitionRevenue = sumBy(regions, (region) =>
    region.riskType === TRANSITION_RISK_TYPE ? region.revenueAtRiskDkk ?? 0 : 0,
  )

  if (physicalAssets > 0) {
    trace.push(`riskGeography.physicalAssets=${physicalAssets}`)
  }
  if (transitionAssets > 0) {
    trace.push(`riskGeography.transitionAssets=${transitionAssets}`)
  }
  if (physicalRevenue > 0) {
    trace.push(`riskGeography.physicalRevenue=${physicalRevenue}`)
  }
  if (transitionRevenue > 0) {
    trace.push(`riskGeography.transitionRevenue=${transitionRevenue}`)
  }

  const metrics: ModuleMetric[] = []
  if (physicalAssets > 0) {
    metrics.push({ label: 'Aktiver eksponeret for fysisk risiko', value: formatDkk(physicalAssets), unit: 'DKK' })
  }
  if (transitionAssets > 0) {
    metrics.push({ label: 'Aktiver eksponeret for transitionrisiko', value: formatDkk(transitionAssets), unit: 'DKK' })
  }
  if (physicalRevenue > 0 || transitionRevenue > 0) {
    metrics.push({
      label: 'Nettoomsætning i risikoområder',
      value: formatDkk(physicalRevenue + transitionRevenue),
      unit: 'DKK',
    })
  }

  const tables: ModuleTable[] = regions.length
    ? [
        {
          id: 'e1-risk-geography',
          title: 'Risikogeografi',
          columns: [
            { key: 'geography', label: 'Geografi' },
            { key: 'riskType', label: 'Risikotype' },
            { key: 'timeHorizon', label: 'Horisont' },
            { key: 'assetsAtRiskDkk', label: 'Aktiver (DKK)', align: 'end', format: 'number' },
            { key: 'revenueAtRiskDkk', label: 'Nettoomsætning (DKK)', align: 'end', format: 'number' },
            { key: 'exposureNarrative', label: 'Noter' },
          ],
          rows: regions.map((region) => ({
            geography: region.geography ?? 'Geografi',
            riskType: region.riskType ?? 'ukendt',
            timeHorizon: region.timeHorizon ?? 'ukendt',
            assetsAtRiskDkk: region.assetsAtRiskDkk ?? null,
            revenueAtRiskDkk: region.revenueAtRiskDkk ?? null,
            exposureNarrative: region.exposureNarrative ?? null,
          })),
        },
      ]
    : []

  const assessmentNarrative = normaliseText(raw.assessmentNarrative)
  const narratives = assessmentNarrative
    ? [
        {
          label: 'Vurdering af klimarisici',
          content: assessmentNarrative,
        },
      ]
    : []

  const esrsFacts: ModuleEsrsFact[] = []
  if (physicalAssets > 0) {
    esrsFacts.push({ conceptKey: 'E1RiskPhysicalAssets', value: physicalAssets, unitId: 'DKK', decimals: 0 })
  }
  if (physicalRevenue > 0) {
    esrsFacts.push({ conceptKey: 'E1RiskPhysicalRevenue', value: physicalRevenue, unitId: 'DKK', decimals: 0 })
  }
  if (transitionAssets > 0) {
    esrsFacts.push({ conceptKey: 'E1RiskTransitionAssets', value: transitionAssets, unitId: 'DKK', decimals: 0 })
  }
  if (transitionRevenue > 0) {
    esrsFacts.push({ conceptKey: 'E1RiskTransitionRevenue', value: transitionRevenue, unitId: 'DKK', decimals: 0 })
  }
  if (assessmentNarrative) {
    esrsFacts.push({ conceptKey: 'E1RiskNarrative', value: assessmentNarrative })
  }

  return {
    value,
    unit: 'geografier',
    assumptions,
    trace,
    warnings,
    riskGeographies: regions,
    ...(metrics.length ? { metrics } : {}),
    ...(tables.length ? { tables } : {}),
    ...(narratives.length ? { narratives } : {}),
    ...(esrsFacts.length ? { esrsFacts } : {}),
  }
}

function normaliseRegion(
  region: E1RiskGeographyInput['riskRegions'] extends Array<infer T> ? T : unknown,
  index: number,
  warnings: string[],
  trace: string[],
): ModuleRiskGeographyEntry | null {
  if (!region || typeof region !== 'object') {
    return null
  }

  const geography = normaliseText((region as { geography?: unknown }).geography)
  const riskType = normaliseRiskType((region as { riskType?: unknown }).riskType, index, warnings)
  const timeHorizon = normaliseText((region as { timeHorizon?: unknown }).timeHorizon)
  const assetsAtRiskDkk = normaliseNumber((region as { assetsAtRiskDkk?: unknown }).assetsAtRiskDkk)
  const revenueAtRiskDkk = normaliseNumber((region as { revenueAtRiskDkk?: unknown }).revenueAtRiskDkk)
  const exposureNarrative = normaliseText((region as { exposureNarrative?: unknown }).exposureNarrative)

  if (!geography && !riskType && assetsAtRiskDkk == null && revenueAtRiskDkk == null && !exposureNarrative) {
    return null
  }

  if (assetsAtRiskDkk != null) {
    trace.push(`riskGeography[${index}].assets=${assetsAtRiskDkk}`)
  }
  if (revenueAtRiskDkk != null) {
    trace.push(`riskGeography[${index}].revenue=${revenueAtRiskDkk}`)
  }

  return {
    geography,
    riskType,
    timeHorizon,
    assetsAtRiskDkk,
    revenueAtRiskDkk,
    exposureNarrative,
  }
}

function normaliseRiskType(value: unknown, index: number, warnings: string[]): E1RiskType | null {
  if (typeof value === 'string' && (value === TRANSITION_RISK_TYPE || PHYSICAL_RISK_TYPES.includes(value as E1RiskType))) {
    return value as E1RiskType
  }
  if (value != null) {
    warnings.push(`Ukendt risikotype på geografi ${index + 1}. Værdien ignoreres.`)
  }
  return null
}

function normaliseText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function normaliseNumber(value: unknown): number | null {
  if (value == null) {
    return null
  }
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return null
  }
  return Math.max(0, numeric)
}

function sumBy<T>(items: T[], selector: (item: T) => number): number {
  return items.reduce((sum, item) => sum + selector(item), 0)
}

function formatDkk(value: number): number {
  return Math.round(value)
}

function isPhysicalRisk(riskType: E1RiskType | null): boolean {
  return riskType != null && PHYSICAL_RISK_TYPES.includes(riskType)
}
