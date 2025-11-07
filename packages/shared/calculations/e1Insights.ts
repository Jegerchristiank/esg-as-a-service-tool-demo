/**
 * Hjælpefunktioner til at berige modulresultater med ESRS E1-indblik.
 */
import {
  type ModuleEnergyMixEntry,
  type ModuleIntensity,
  type ModuleInput,
  type ModuleResult,
  type ModuleTargetProgress,
  type ModuleTargetSummary,
  type ModuleTrend,
  type ModuleId,
  type E1ContextInput,
  type E1TargetsInput,
  type E1TargetLine,
  type E1EnergyMixType,
  type E1TargetScope,
  type E1TargetStatus,
} from '../types'

const scopeMap: Partial<Record<ModuleId, 'scope1' | 'scope2' | 'scope3'>> = {
  A1: 'scope1',
  A2: 'scope1',
  A3: 'scope1',
  A4: 'scope1',
  B1: 'scope2',
  B2: 'scope2',
  B3: 'scope2',
  B4: 'scope2',
  B5: 'scope2',
  B6: 'scope2',
  B7: 'scope2',
  B8: 'scope2',
  B9: 'scope2',
  B10: 'scope2',
  B11: 'scope2',
  C1: 'scope3',
  C2: 'scope3',
  C3: 'scope3',
  C4: 'scope3',
  C5: 'scope3',
  C6: 'scope3',
  C7: 'scope3',
  C8: 'scope3',
  C9: 'scope3',
  C10: 'scope3',
  C11: 'scope3',
  C12: 'scope3',
  C13: 'scope3',
  C14: 'scope3',
  C15: 'scope3',
}

const previousYearField: Record<'scope1' | 'scope2' | 'scope3', keyof E1ContextInput> = {
  scope1: 'previousYearScope1Tonnes',
  scope2: 'previousYearScope2Tonnes',
  scope3: 'previousYearScope3Tonnes',
}

export function withE1Insights(
  moduleId: ModuleId,
  input: ModuleInput,
  result: ModuleResult,
): ModuleResult {
  const scope = scopeMap[moduleId]
  if (!scope) {
    return result
  }

  const context = ((input.E1Context ?? {}) as E1ContextInput) || {}
  const targetsInput = ((input.E1Targets ?? {}) as E1TargetsInput) || {}

  const trace = [...result.trace]
  const intensities: ModuleIntensity[] = []
  const esrsFacts = Array.isArray(result.esrsFacts) ? [...result.esrsFacts] : []
  const energyMix = resolveEnergyMix(context)
  const targetProgress = resolveTargetProgress(moduleId, scope, targetsInput, result.value, trace)
  const trend = resolveTrend(scope, context, result.value, result.unit, trace)

  const revenue = toPositiveNumber(context.netRevenueDkk)
  if (revenue != null && revenue > 0) {
    const intensityValue = round(result.value / (revenue / 1_000_000), 3)
    intensities.push({
      basis: 'netRevenue',
      label: 'tCO2e pr. mio. DKK nettoomsætning',
      unit: 'tCO2e/mio. DKK',
      value: intensityValue,
      denominatorValue: revenue,
      denominatorUnit: 'DKK',
    })
    trace.push(`intensity.revenuePerMillion=${intensityValue}`)

  }

  const productionVolume = toPositiveNumber(context.productionVolume)
  const productionUnit = context.productionUnit?.trim() || 'enhed'
  if (productionVolume != null && productionVolume > 0) {
    const intensityValue = round(result.value / productionVolume, 3)
    intensities.push({
      basis: 'production',
      label: `tCO2e pr. ${productionUnit}`,
      unit: `tCO2e/${productionUnit}`,
      value: intensityValue,
      denominatorValue: productionVolume,
      denominatorUnit: productionUnit,
    })
    trace.push(`intensity.production=${intensityValue}`)
  }

  const employees = toPositiveNumber(context.employeesFte)
  if (employees != null && employees > 0) {
    const intensityValue = round(result.value / employees, 3)
    intensities.push({
      basis: 'employees',
      label: 'tCO2e pr. FTE',
      unit: 'tCO2e/FTE',
      value: intensityValue,
      denominatorValue: employees,
      denominatorUnit: 'FTE',
    })
    trace.push(`intensity.employees=${intensityValue}`)
  }

  const energy = toPositiveNumber(context.totalEnergyConsumptionKwh)
  if (energy != null && energy > 0) {
    const intensityValue = round(result.value / energy, 6)
    intensities.push({
      basis: 'energy',
      label: 'tCO2e pr. kWh samlet energi',
      unit: 'tCO2e/kWh',
      value: intensityValue,
      denominatorValue: energy,
      denominatorUnit: 'kWh',
    })
    trace.push(`intensity.energy=${intensityValue}`)
  }

  const next: ModuleResult = {
    ...result,
    trace,
  }

  if (intensities.length > 0) {
    next.intensities = intensities
  }

  if (trend) {
    next.trend = trend
  }

  if (targetProgress) {
    next.targetProgress = targetProgress
  }

  if (energyMix.length > 0) {
    next.energyMix = energyMix
  }

  if (esrsFacts.length > 0) {
    next.esrsFacts = esrsFacts
  }

  return next
}

function resolveTrend(
  scope: 'scope1' | 'scope2' | 'scope3',
  context: E1ContextInput,
  currentValue: number,
  unit: string,
  trace: string[],
): ModuleTrend | null {
  const previous = toPositiveNumber(context[previousYearField[scope]])
  if (previous == null) {
    return null
  }

  const absoluteChange = round(currentValue - previous, 3)
  const percentChange = previous > 0 ? round(((currentValue - previous) / previous) * 100, 1) : null

  trace.push(`trend.previous=${previous}`)
  trace.push(`trend.absoluteChange=${absoluteChange}`)
  if (percentChange != null) {
    trace.push(`trend.percentChange=${percentChange}`)
  }

  return {
    label: 'Udvikling mod foregående år',
    previousValue: previous,
    currentValue,
    absoluteChange,
    percentChange,
    unit,
  }
}

function resolveEnergyMix(context: E1ContextInput): ModuleEnergyMixEntry[] {
  const rawLines = Array.isArray(context.energyMixLines) ? context.energyMixLines : []
  if (rawLines.length === 0) {
    return []
  }

  const sanitised = rawLines
    .map((line) => {
      const rawType = line.energyType as E1EnergyMixType | undefined
      const energyType: E1EnergyMixType = isEnergyMixType(rawType) ? rawType : 'other'
      const consumption = toPositiveNumber(line.consumptionKwh) ?? 0
      const share = clampPercent(line.sharePercent)
      const documentationQualityPercent = clampPercent(line.documentationQualityPercent)
      return { energyType, consumption, share, documentationQualityPercent }
    })
    .filter((entry) => entry.consumption > 0)

  const total = sanitised.reduce((sum, entry) => sum + entry.consumption, 0)
  if (total === 0) {
    return []
  }

  return sanitised.map<ModuleEnergyMixEntry>((entry) => {
    const defaultShare = round((entry.consumption / total) * 100, 1)
    const sharePercent = entry.share != null ? round(entry.share, 1) : defaultShare
    return {
      energyType: entry.energyType,
      consumptionKwh: round(entry.consumption, 3),
      sharePercent,
      documentationQualityPercent: entry.documentationQualityPercent,
    }
  })
}

function resolveTargetProgress(
  moduleId: ModuleId,
  scope: 'scope1' | 'scope2' | 'scope3',
  targetsInput: E1TargetsInput,
  currentValueTonnes: number,
  trace: string[],
): ModuleTargetProgress | null {
  const rawTargets = Array.isArray(targetsInput.targets) ? targetsInput.targets : []
  if (rawTargets.length === 0) {
    return null
  }

  const sanitisedTargets = rawTargets
    .map((target, index) => normaliseTarget(target, index))
    .filter((target): target is ModuleTargetSummary => target !== null)

  if (sanitisedTargets.length === 0) {
    return null
  }

  const preferredScope: E1TargetScope = scope
  const match =
    sanitisedTargets.find((target) => target.scope === preferredScope) ??
    sanitisedTargets.find((target) => target.scope === 'combined') ??
    null

  if (!match) {
    return null
  }

  const varianceTonnes = match.targetValueTonnes != null ? round(currentValueTonnes - match.targetValueTonnes, 3) : null
  let progressPercent: number | null = null
  if (match.baselineValueTonnes != null && match.targetValueTonnes != null && match.baselineValueTonnes !== match.targetValueTonnes) {
    progressPercent = round(
      ((match.baselineValueTonnes - currentValueTonnes) / (match.baselineValueTonnes - match.targetValueTonnes)) * 100,
      1,
    )
  }

  const status = match.status ?? deriveStatus(progressPercent)

  trace.push(`targetProgress.module=${moduleId}`)
  trace.push(`targetProgress.targetId=${match.id}`)
  if (varianceTonnes != null) {
    trace.push(`targetProgress.varianceTonnes=${varianceTonnes}`)
  }
  if (progressPercent != null) {
    trace.push(`targetProgress.progressPercent=${progressPercent}`)
  }
  if (status) {
    trace.push(`targetProgress.status=${status}`)
  }

  return {
    targetId: match.id,
    name: match.name,
    scope: match.scope,
    targetYear: match.targetYear,
    targetValueTonnes: match.targetValueTonnes,
    currentValueTonnes: round(currentValueTonnes, 3),
    varianceTonnes,
    progressPercent,
    status,
    owner: match.owner,
  }
}

function normaliseTarget(target: E1TargetLine, index: number): ModuleTargetSummary | null {
  if (!target) {
    return null
  }

  const scope = (target.scope ?? 'combined') as E1TargetScope
  const targetYear = toPositiveNumber(target.targetYear)
  const targetValueTonnes = toPositiveNumber(target.targetValueTonnes)
  const baselineYear = toPositiveNumber(target.baselineYear)
  const baselineValueTonnes = toPositiveNumber(target.baselineValueTonnes)
  const owner = trimString(target.owner)
  const description = trimString(target.description)
  const name = trimString(target.name) ?? `Mål ${index + 1}`
  const id = trimString(target.id) ?? `${scope}-${index + 1}`

  const milestones = Array.isArray(target.milestones)
    ? target.milestones.map((milestone) => ({
        label: trimString(milestone?.label) ?? null,
        dueYear: toPositiveNumber(milestone?.dueYear),
      }))
    : []

  return {
    id,
    name,
    scope,
    targetYear: targetYear ?? null,
    targetValueTonnes: targetValueTonnes ?? null,
    baselineYear: baselineYear ?? null,
    baselineValueTonnes: baselineValueTonnes ?? null,
    owner,
    status: target.status ?? null,
    description,
    milestones,
  }
}

function deriveStatus(progressPercent: number | null): E1TargetStatus | null {
  if (progressPercent == null) {
    return null
  }
  if (progressPercent >= 90) {
    return 'onTrack'
  }
  if (progressPercent >= 60) {
    return 'lagging'
  }
  return 'atRisk'
}

function toPositiveNumber(value: unknown): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null
  }
  if (value < 0) {
    return null
  }
  return value
}

function round(value: number, precision: number): number {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

function clampPercent(value: unknown): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null
  }
  if (value < 0) {
    return 0
  }
  if (value > 100) {
    return 100
  }
  return value
}

function trimString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function isEnergyMixType(value: unknown): value is E1EnergyMixType {
  return (
    value === 'electricity' ||
    value === 'districtHeat' ||
    value === 'steam' ||
    value === 'cooling' ||
    value === 'biogas' ||
    value === 'diesel' ||
    value === 'other'
  )
}
