/**
 * Modul til at opsamle klimamål (ESRS E1) og planlagte handlinger.
 */
import type {
  E1ActionStatus,
  E1ActionLine,
  E1ContextInput,
  E1EnergyMixType,
  E1TargetLine,
  E1TargetMilestone,
  E1TargetScope,
  E1TargetStatus,
  E1TargetsInput,
  ModuleActionItem,
  ModuleEsrsFact,
  ModuleEsrsTable,
  ModuleInput,
  ModuleMetric,
  ModuleResult,
  ModuleTable,
  ModuleTargetSummary,
} from '../../types'

const VALID_TARGET_SCOPE: ReadonlyArray<E1TargetScope> = ['scope1', 'scope2', 'scope3', 'combined']
const VALID_TARGET_STATUS: ReadonlyArray<E1TargetStatus> = ['onTrack', 'lagging', 'atRisk']
const VALID_ACTION_STATUS: ReadonlyArray<E1ActionStatus> = ['planned', 'inProgress', 'delayed', 'completed']

export function runE1Targets(input: ModuleInput): ModuleResult {
  const raw = ((input.E1Targets ?? {}) as E1TargetsInput) || {}
  const context = ((input.E1Context ?? {}) as E1ContextInput) || {}
  const assumptions = [
    'Målene anvendes til at vurdere ESRS E1-krav for reduktion og energistyring.',
    'Status beregnes ud fra angivet baseline, mål og subjektiv status, hvis tilgængelig.',
  ]
  const warnings: string[] = []
  const trace: string[] = []

  const targets = Array.isArray(raw.targets) ? raw.targets : []
  const actions = Array.isArray(raw.actions) ? raw.actions : []

  const sanitisedTargets = targets
    .map((target, index) => normaliseTarget(target, index, warnings, trace))
    .filter((target): target is ModuleTargetSummary => target !== null)

  const sanitisedActions = actions
    .map((action, index) => normaliseAction(action, index, warnings, trace))
    .filter((action): action is ModuleActionItem => action !== null)

  const energyMixEntries = normaliseEnergyMix(context.energyMixLines, trace)
  const totalEnergyConsumptionKwh = resolveTotalEnergyConsumption(context, energyMixEntries, warnings, trace)
  const renewableProductionKwh = toNonNegativeNumber(context.renewableEnergyProductionKwh)
  const energyProductionKwh = toNonNegativeNumber(context.energyProductionKwh)

  let renewableConsumptionKwh: number | null = renewableProductionKwh
  if (totalEnergyConsumptionKwh != null && renewableConsumptionKwh != null) {
    if (renewableConsumptionKwh > totalEnergyConsumptionKwh) {
      warnings.push('Vedvarende egenproduktion overstiger totalforbrug. Afkortes til totalforbrug.')
      renewableConsumptionKwh = totalEnergyConsumptionKwh
    }
  }

  const nonRenewableConsumptionKwh =
    totalEnergyConsumptionKwh != null && renewableConsumptionKwh != null
      ? Math.max(totalEnergyConsumptionKwh - renewableConsumptionKwh, 0)
      : null

  const renewableSharePercent =
    totalEnergyConsumptionKwh != null && totalEnergyConsumptionKwh > 0 && renewableConsumptionKwh != null
      ? round((renewableConsumptionKwh / totalEnergyConsumptionKwh) * 100, 1)
      : null
  const nonRenewableSharePercent =
    renewableSharePercent != null
      ? round(Math.max(100 - renewableSharePercent, 0), 1)
      : totalEnergyConsumptionKwh != null && totalEnergyConsumptionKwh > 0 && nonRenewableConsumptionKwh != null
        ? round((nonRenewableConsumptionKwh / totalEnergyConsumptionKwh) * 100, 1)
        : null

  let nonRenewableProductionKwh: number | null = null
  if (energyProductionKwh != null) {
    if (renewableProductionKwh != null) {
      nonRenewableProductionKwh = Math.max(energyProductionKwh - renewableProductionKwh, 0)
    } else {
      nonRenewableProductionKwh = energyProductionKwh
    }
  }

  const documentationQualityPercent = calculateDocumentationQuality(energyMixEntries)

  if (totalEnergyConsumptionKwh != null) {
    trace.push(`energy.totalConsumptionKwh=${totalEnergyConsumptionKwh}`)
  }
  if (renewableSharePercent != null) {
    trace.push(`energy.renewableSharePercent=${renewableSharePercent}`)
  }
  if (nonRenewableSharePercent != null) {
    trace.push(`energy.nonRenewableSharePercent=${nonRenewableSharePercent}`)
  }
  if (documentationQualityPercent != null) {
    trace.push(`energy.documentationQualityPercent=${documentationQualityPercent}`)
  }
  if (energyMixEntries.length > 0) {
    trace.push(`energyMix.lines=${energyMixEntries.length}`)
  }

  const value = sanitisedTargets.length
  const onTrackCount = sanitisedTargets.filter((target) => target.status === 'onTrack').length
  const laggingCount = sanitisedTargets.filter((target) => target.status === 'lagging').length
  const atRiskCount = sanitisedTargets.filter((target) => target.status === 'atRisk').length

  trace.push(`targets.count=${value}`)
  trace.push(`targets.onTrack=${onTrackCount}`)
  trace.push(`targets.lagging=${laggingCount}`)
  trace.push(`targets.atRisk=${atRiskCount}`)
  trace.push(`actions.count=${sanitisedActions.length}`)

  const narratives = [
    ...sanitisedTargets
      .map((target) => {
        if (!target.description) {
          return null
        }
        return {
          label: target.name,
          content: target.description,
        }
      })
      .filter((entry): entry is { label: string; content: string } => entry !== null),
    ...sanitisedActions
      .map((action) => {
        if (!action.description) {
          return null
        }
        return {
          label: action.title ?? 'Handling',
          content: action.description,
        }
      })
      .filter((entry): entry is { label: string; content: string } => entry !== null),
  ]

  const responsibilities = [
    ...sanitisedTargets
      .map((target) => {
        if (!target.owner) {
          return null
        }
        return {
          subject: target.name,
          owner: target.owner,
          role: `Mål (${target.scope})`,
        }
      })
      .filter((entry): entry is { subject: string; owner: string; role: string } => entry !== null),
    ...sanitisedActions
      .map((action) => {
        if (!action.owner) {
          return null
        }
        return {
          subject: action.title ?? 'Handling',
          owner: action.owner,
          role: 'Klimahandling',
        }
      })
      .filter((entry): entry is { subject: string; owner: string; role: string } => entry !== null),
  ]

  const notes = [
    ...sanitisedTargets.map((target) => ({
      label: `${target.name} (${target.scope})`,
      detail: `Baseline ${target.baselineYear ?? 'n/a'}: ${target.baselineValueTonnes ?? 'n/a'} t · Mål ${
        target.targetYear ?? 'n/a'
      }: ${target.targetValueTonnes ?? 'n/a'} t · Status: ${target.status ?? 'ukendt'}`,
    })),
    ...sanitisedActions.map((action, index) => ({
      label: action.title ?? `Handling ${index + 1}`,
      detail: `Deadline: ${action.dueQuarter ?? 'ukendt'} · Status: ${action.status ?? 'ukendt'}`,
    })),
  ]

  const metrics: ModuleMetric[] = []
  if (totalEnergyConsumptionKwh != null) {
    metrics.push({
      label: 'Samlet energiforbrug',
      value: round(totalEnergyConsumptionKwh, 0),
      unit: 'kWh',
    })
  }
  if (renewableSharePercent != null) {
    metrics.push({
      label: 'Vedvarende energiandel',
      value: renewableSharePercent,
      unit: '%',
    })
  }
  if (nonRenewableSharePercent != null) {
    metrics.push({
      label: 'Ikke-vedvarende energiandel',
      value: nonRenewableSharePercent,
      unit: '%',
    })
  }
  if (documentationQualityPercent != null) {
    metrics.push({
      label: 'Dokumentationskvalitet',
      value: documentationQualityPercent,
      unit: '%',
    })
  }

  const esrsFacts: ModuleEsrsFact[] = [
    { conceptKey: 'E1TargetsPresent', value: sanitisedTargets.length > 0 },
  ]
  if (totalEnergyConsumptionKwh != null) {
    esrsFacts.push({
      conceptKey: 'E1EnergyConsumptionTotalKwh',
      value: totalEnergyConsumptionKwh,
      unitId: 'kWh',
      decimals: 0,
    })
  }
  if (renewableConsumptionKwh != null) {
    esrsFacts.push({
      conceptKey: 'E1EnergyConsumptionRenewableKwh',
      value: renewableConsumptionKwh,
      unitId: 'kWh',
      decimals: 0,
    })
  }
  if (nonRenewableConsumptionKwh != null) {
    esrsFacts.push({
      conceptKey: 'E1EnergyConsumptionNonRenewableKwh',
      value: nonRenewableConsumptionKwh,
      unitId: 'kWh',
      decimals: 0,
    })
  }
  if (renewableSharePercent != null) {
    esrsFacts.push({
      conceptKey: 'E1EnergyRenewableSharePercent',
      value: renewableSharePercent,
      unitId: 'percent',
      decimals: 1,
    })
  }
  if (nonRenewableSharePercent != null) {
    esrsFacts.push({
      conceptKey: 'E1EnergyNonRenewableSharePercent',
      value: nonRenewableSharePercent,
      unitId: 'percent',
      decimals: 1,
    })
  }
  if (renewableProductionKwh != null) {
    esrsFacts.push({
      conceptKey: 'E1EnergyRenewableProductionKwh',
      value: renewableProductionKwh,
      unitId: 'kWh',
      decimals: 0,
    })
  }
  if (nonRenewableProductionKwh != null) {
    esrsFacts.push({
      conceptKey: 'E1EnergyNonRenewableProductionKwh',
      value: nonRenewableProductionKwh,
      unitId: 'kWh',
      decimals: 0,
    })
  }

  const targetNarrativeLines = [
    ...sanitisedTargets.map((target) => describeTarget(target)).filter((line): line is string => line !== null),
    ...sanitisedActions.map((action) => describeAction(action)).filter((line): line is string => line !== null),
  ]
  if (targetNarrativeLines.length > 0) {
    esrsFacts.push({ conceptKey: 'E1TargetsNarrative', value: targetNarrativeLines.join('\n') })
  }

  const esrsTables: ModuleEsrsTable[] = []
  if (sanitisedTargets.length) {
    esrsTables.push({
      conceptKey: 'E1TargetsTable',
      rows: sanitisedTargets.map((target) => ({
        scope: target.scope,
        name: target.name,
        targetYear: target.targetYear ?? null,
        targetValueTonnes: target.targetValueTonnes ?? null,
        baselineYear: target.baselineYear ?? null,
        baselineValueTonnes: target.baselineValueTonnes ?? null,
        owner: target.owner ?? null,
        status: target.status ?? null,
        description: target.description ?? null,
        milestones: formatMilestoneSummary(target.milestones),
      })),
    })
  }
  if (energyMixEntries.length) {
    esrsTables.push({
      conceptKey: 'E1EnergyMixTable',
      rows: energyMixEntries.map((entry) => ({
        energyType: entry.energyType,
        consumptionKwh: entry.consumptionKwh,
        sharePercent: entry.sharePercent,
        documentationQualityPercent: entry.documentationQualityPercent,
      })),
    })
  }

  const moduleTables: ModuleTable[] = []
  if (energyMixEntries.length) {
    moduleTables.push({
      id: 'e1-energy-mix',
      title: 'Energimix',
      summary:
        totalEnergyConsumptionKwh != null
          ? `Samlet energiforbrug: ${formatNumber(totalEnergyConsumptionKwh)} kWh`
          : null,
      columns: [
        { key: 'energyType', label: 'Energitype' },
        { key: 'consumptionKwh', label: 'Forbrug (kWh)', align: 'end' },
        { key: 'sharePercent', label: 'Andel (%)', align: 'end', format: 'percent' },
        {
          key: 'documentationQualityPercent',
          label: 'Dokumentationskvalitet (%)',
          align: 'end',
          format: 'percent',
        },
      ],
      rows: energyMixEntries.map((entry) => ({
        energyType: ENERGY_TYPE_LABELS[entry.energyType] ?? entry.energyType,
        consumptionKwh: round(entry.consumptionKwh, 0),
        sharePercent: entry.sharePercent,
        documentationQualityPercent: entry.documentationQualityPercent,
      })),
    })
  }

  return {
    value,
    unit: 'mål',
    assumptions,
    trace,
    warnings,
    ...(metrics.length ? { metrics } : {}),
    ...(moduleTables.length ? { tables: moduleTables } : {}),
    ...(energyMixEntries.length ? { energyMix: energyMixEntries } : {}),
    targetsOverview: sanitisedTargets,
    plannedActions: sanitisedActions,
    narratives,
    responsibilities,
    notes,
    ...(esrsFacts.length ? { esrsFacts } : {}),
    ...(esrsTables.length ? { esrsTables } : {}),
  }
}

const ENERGY_TYPE_LABELS: Record<E1EnergyMixType, string> = {
  electricity: 'Elektricitet',
  districtHeat: 'Fjernvarme',
  steam: 'Damp',
  cooling: 'Køling',
  biogas: 'Biogas',
  diesel: 'Diesel',
  other: 'Andet',
}

function describeTarget(target: ModuleTargetSummary): string | null {
  const segments: string[] = []
  segments.push(`${target.name} (${target.scope})`)

  if (target.targetValueTonnes != null && target.targetYear != null) {
    segments.push(`mål ${target.targetValueTonnes} t i ${target.targetYear}`)
  }
  if (target.baselineValueTonnes != null && target.baselineYear != null) {
    segments.push(`baseline ${target.baselineValueTonnes} t i ${target.baselineYear}`)
  }
  if (target.status) {
    segments.push(`status: ${target.status}`)
  }
  if (target.description) {
    segments.push(target.description)
  }

  const line = segments.join(' – ').trim()
  return line.length > 0 ? line : null
}

function describeAction(action: ModuleActionItem): string | null {
  const segments: string[] = []
  const title = action.title ?? 'Handling'
  segments.push(title)

  if (action.status) {
    segments.push(`status: ${action.status}`)
  }
  if (action.dueQuarter) {
    segments.push(`deadline ${action.dueQuarter}`)
  }
  if (action.description) {
    segments.push(action.description)
  }

  const line = segments.join(' – ').trim()
  return line.length > 0 ? line : null
}

function formatMilestoneSummary(milestones: ModuleTargetSummary['milestones']): string | null {
  if (!Array.isArray(milestones) || milestones.length === 0) {
    return null
  }

  const parts = milestones
    .map((milestone) => {
      const label = milestone.label?.trim() ?? ''
      const year = milestone.dueYear != null ? String(milestone.dueYear) : ''

      if (!label && !year) {
        return null
      }

      if (label && year) {
        return `${label} (${year})`
      }

      return label || year
    })
    .filter((value): value is string => value != null && value.trim().length > 0)

  if (parts.length === 0) {
    return null
  }

  return parts.join('; ')
}

function normaliseEnergyMix(
  rawLines: E1ContextInput['energyMixLines'],
  trace: string[],
): Array<{
  energyType: E1EnergyMixType
  consumptionKwh: number
  sharePercent: number
  documentationQualityPercent: number | null
}> {
  const lines = Array.isArray(rawLines) ? rawLines : []
  if (lines.length === 0) {
    return []
  }

  const sanitised = lines
    .map((line, index) => {
      const rawType = line?.energyType as E1EnergyMixType | undefined
      const energyType: E1EnergyMixType = isEnergyMixType(rawType) ? rawType : 'other'
      const consumption = toNonNegativeNumber(line?.consumptionKwh)
      const share = clampPercent(line?.sharePercent)
      const documentationQualityPercent = clampPercent(line?.documentationQualityPercent)

      if (consumption == null || consumption === 0) {
        trace.push(`energyMix[${index}].consumption=0`)
        return null
      }

      return {
        energyType,
        consumption,
        share,
        documentationQualityPercent,
      }
    })
    .filter((entry): entry is { energyType: E1EnergyMixType; consumption: number; share: number | null; documentationQualityPercent: number | null } => entry !== null)

  if (sanitised.length === 0) {
    return []
  }

  const totalConsumption = sanitised.reduce((sum, entry) => sum + entry.consumption, 0)
  if (totalConsumption === 0) {
    return []
  }

  return sanitised.map((entry, index) => {
    const defaultShare = round((entry.consumption / totalConsumption) * 100, 1)
    const sharePercent = entry.share != null ? round(entry.share, 1) : defaultShare
    trace.push(`energyMix[${index}].sharePercent=${sharePercent}`)
    return {
      energyType: entry.energyType,
      consumptionKwh: entry.consumption,
      sharePercent,
      documentationQualityPercent: entry.documentationQualityPercent,
    }
  })
}

function resolveTotalEnergyConsumption(
  context: E1ContextInput,
  energyMix: Array<{ consumptionKwh: number }>,
  warnings: string[],
  trace: string[],
): number | null {
  const contextValue = toNonNegativeNumber(context.totalEnergyConsumptionKwh)
  const mixSum = energyMix.reduce((sum, entry) => sum + entry.consumptionKwh, 0)

  if (contextValue != null && mixSum > 0 && Math.abs(contextValue - mixSum) / Math.max(contextValue, 1) > 0.25) {
    warnings.push('Energimix afviger væsentligt fra angivet totalforbrug. Vurder datakvaliteten.')
  }

  if (contextValue != null) {
    return contextValue
  }

  if (mixSum > 0) {
    trace.push('energy.totalFromMix=true')
    return mixSum
  }

  return null
}

function calculateDocumentationQuality(
  entries: Array<{ consumptionKwh: number; documentationQualityPercent: number | null }>,
): number | null {
  if (entries.length === 0) {
    return null
  }

  let weightedSum = 0
  let weight = 0
  for (const entry of entries) {
    if (entry.documentationQualityPercent == null) {
      continue
    }
    weightedSum += entry.documentationQualityPercent * entry.consumptionKwh
    weight += entry.consumptionKwh
  }

  if (weight === 0) {
    return null
  }

  return round(weightedSum / weight, 1)
}

function normaliseTarget(
  target: E1TargetLine | undefined,
  index: number,
  warnings: string[],
  trace: string[],
): ModuleTargetSummary | null {
  if (!target) {
    return null
  }

  const fallbackScope: E1TargetScope = 'combined'
  const scope: E1TargetScope = isTargetScope(target.scope) ? target.scope : fallbackScope
  if (!isTargetScope(target.scope)) {
    warnings.push(`Ukendt scope på mål ${index + 1}. Standard (${fallbackScope}) anvendes.`)
  }

  const name = trimString(target.name) ?? `Mål ${index + 1}`
  const id = `${scope}-${index + 1}`
  const owner = trimString(target.owner)
  const description = trimString(target.description)
  const targetYear = toBoundedNumber(target.targetYear, 2000, 2100)
  const targetValueTonnes = toNonNegativeNumber(target.targetValueTonnes)
  const baselineYear = toBoundedNumber(target.baselineYear, 1990, 2100)
  const baselineValueTonnes = toNonNegativeNumber(target.baselineValueTonnes)

  const status: E1TargetStatus | null = isTargetStatus(target.status) ? target.status : null
  if (!status && target.status != null) {
    warnings.push(`Status på mål ${index + 1} er ugyldig og ignoreres.`)
  }

  const milestones = Array.isArray(target.milestones)
    ? target.milestones.map((milestone: E1TargetMilestone | null | undefined) => ({
        label: trimString(milestone?.label) ?? null,
        dueYear: toBoundedNumber(milestone?.dueYear, 2000, 2100),
      }))
    : []

  trace.push(`target[${index}].scope=${scope}`)
  trace.push(`target[${index}].id=${id}`)
  if (targetYear != null) {
    trace.push(`target[${index}].targetYear=${targetYear}`)
  }
  if (targetValueTonnes != null) {
    trace.push(`target[${index}].targetValueTonnes=${targetValueTonnes}`)
  }

  return {
    id,
    name,
    scope,
    targetYear,
    targetValueTonnes,
    baselineYear,
    baselineValueTonnes,
    owner,
    status,
    description,
    milestones,
  }
}

function normaliseAction(
  action: E1ActionLine | undefined,
  index: number,
  warnings: string[],
  trace: string[],
): ModuleActionItem | null {
  if (!action) {
    return null
  }

  const title = trimString(action.title)
  const description = trimString(action.description)
  const owner = trimString(action.owner)
  const dueQuarter = validateQuarter(action.dueQuarter)
  if (dueQuarter == null && action.dueQuarter) {
    warnings.push(`Due-date på handling ${index + 1} bruger ikke formatet ÅÅÅÅ-QX og ignoreres.`)
  }

  const status: E1ActionStatus | null = isActionStatus(action.status) ? action.status : null
  if (!status && action.status != null) {
    warnings.push(`Status på handling ${index + 1} er ugyldig og ignoreres.`)
  }

  if (!title && !description) {
    return null
  }

  trace.push(`action[${index}].status=${status ?? 'ukendt'}`)

  return {
    title,
    description,
    owner,
    dueQuarter,
    status,
  }
}

function isTargetScope(value: unknown): value is E1TargetScope {
  return typeof value === 'string' && VALID_TARGET_SCOPE.includes(value as E1TargetScope)
}

function isTargetStatus(value: unknown): value is E1TargetStatus {
  return typeof value === 'string' && VALID_TARGET_STATUS.includes(value as E1TargetStatus)
}

function isActionStatus(value: unknown): value is E1ActionStatus {
  return typeof value === 'string' && VALID_ACTION_STATUS.includes(value as E1ActionStatus)
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

function trimString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function toNonNegativeNumber(value: unknown): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null
  }
  if (value < 0) {
    return null
  }
  return value
}

function toBoundedNumber(value: unknown, min: number, max: number): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null
  }
  if (value < min || value > max) {
    return null
  }
  return value
}

function validateQuarter(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }
  const match = value.trim().match(/^(\d{4})-Q([1-4])$/)
  if (!match) {
    return null
  }
  return `${match[1]}-Q${match[2]}`
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

function formatNumber(value: number): string {
  return Number.isFinite(value) ? value.toLocaleString('da-DK') : String(value)
}

function round(value: number, precision: number): number {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}
