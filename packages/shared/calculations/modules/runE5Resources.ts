/**
 * Beregning for modul E5 – ressourcer og materialeforbrug.
 */
import type { E5ResourcesInput, ModuleEsrsFact, ModuleInput, ModuleResult } from '../../types'
import { factors } from '../factors'

const { e5Resources } = factors

export function runE5Resources(input: ModuleInput): ModuleResult {
  const raw = (input.E5Resources ?? null) as E5ResourcesInput | null

  const primaryConsumption = normaliseMass(raw?.primaryMaterialConsumptionTonnes)
  const secondaryConsumption = normaliseMass(raw?.secondaryMaterialConsumptionTonnes)
  const recycledPercent = clampPercent(raw?.recycledContentPercent, 0)
  const renewableSharePercent = clampPercent(raw?.renewableMaterialSharePercent, 0)
  const criticalSharePercent = clampPercent(raw?.criticalMaterialsSharePercent, 0)
  const circularityTargetPercent = clampPercent(raw?.circularityTargetPercent, 0)
  const dataQualityPercent = clampPercent(raw?.documentationQualityPercent, 100)

  const assumptions = [
    'Ressourceindekset anvender vægte: primært forbrug 35 %, kritiske materialer 20 %, genanvendelse 20 %, fornybare materialer 15 %, målopfyldelse 10 %.',
    'Primært forbrug normaliseres til 1.000 ton om året. Genanvendt og fornybar andel måles i procent.',
  ]
  const warnings: string[] = []
  const trace: string[] = []

  const primaryIntensity = Math.min(primaryConsumption / e5Resources.primaryNormalizationTonnes, 1)
  const primaryScore = primaryIntensity * e5Resources.primaryWeight
  const criticalScore = (criticalSharePercent / 100) * e5Resources.criticalWeight
  const recycledScore = (1 - recycledPercent / 100) * e5Resources.recycledWeight
  const renewableScore = (1 - renewableSharePercent / 100) * e5Resources.renewableWeight
  const targetGapPercent = Math.max(0, circularityTargetPercent - recycledPercent)
  const targetScore = (targetGapPercent / 100) * e5Resources.targetWeight

  const totalWeight =
    e5Resources.primaryWeight +
    e5Resources.criticalWeight +
    e5Resources.recycledWeight +
    e5Resources.renewableWeight +
    e5Resources.targetWeight

  const riskIndex =
    (primaryScore + criticalScore + recycledScore + renewableScore + targetScore) / totalWeight
  const value = Number((riskIndex * 100).toFixed(e5Resources.resultPrecision))

  trace.push(`primaryConsumptionTonnes=${primaryConsumption.toFixed(2)}`)
  trace.push(`secondaryConsumptionTonnes=${secondaryConsumption.toFixed(2)}`)
  trace.push(`primaryIntensity=${primaryIntensity.toFixed(4)}`)
  trace.push(`recycledPercent=${recycledPercent.toFixed(2)}`)
  trace.push(`renewableSharePercent=${renewableSharePercent.toFixed(2)}`)
  trace.push(`criticalSharePercent=${criticalSharePercent.toFixed(2)}`)
  trace.push(`circularityTargetPercent=${circularityTargetPercent.toFixed(2)}`)
  trace.push(`targetGapPercent=${targetGapPercent.toFixed(2)}`)
  trace.push(`riskIndex=${riskIndex.toFixed(4)}`)

  if (secondaryConsumption > primaryConsumption) {
    warnings.push('Sekundært materialeforbrug overstiger primært forbrug. Bekræft datasæt og enheder.')
  }

  if (criticalSharePercent > 30) {
    warnings.push('Høj andel kritiske materialer (>30 %). Overvej substitution eller leverandørdiversificering.')
  }

  if (recycledPercent < circularityTargetPercent) {
    const gap = (circularityTargetPercent - recycledPercent).toFixed(1)
    warnings.push(`Genanvendt andel er ${gap} procentpoint under målsætningen. Planlæg nye cirkulære initiativer.`)
  }

  if (value > e5Resources.circularityAttentionThreshold) {
    warnings.push('Ressourceindekset overstiger 55 point – prioriter cirkularitet i handlingsplanen.')
  }

  if (dataQualityPercent < e5Resources.documentationWarningThresholdPercent) {
    warnings.push(
      `Dokumentationskvalitet på ${dataQualityPercent.toFixed(0)} % er under anbefalingen på ${e5Resources.documentationWarningThresholdPercent} %. Indhent leverandørdata eller tredjepartsattester.`,
    )
  }

  if (primaryConsumption === 0 && recycledPercent === 0 && renewableSharePercent === 0) {
    warnings.push('Ingen ressourceforbrug registreret. Angiv data for at opgøre cirkularitet.')
  }

  trace.push(`dataQualityPercent=${dataQualityPercent.toFixed(2)}`)

  const esrsFacts: ModuleEsrsFact[] = []
  const pushNumericFact = (key: string, value: number, unitId: string, decimals: number) => {
    if (!Number.isFinite(value)) {
      return
    }
    esrsFacts.push({ conceptKey: key, value: Number(value), unitId, decimals })
  }

  pushNumericFact('E5PrimaryMaterialConsumptionTonnes', primaryConsumption, 'tonne', 2)
  pushNumericFact('E5SecondaryMaterialConsumptionTonnes', secondaryConsumption, 'tonne', 2)
  pushNumericFact('E5RecycledContentPercent', recycledPercent, 'percent', 1)
  pushNumericFact('E5RenewableMaterialSharePercent', renewableSharePercent, 'percent', 1)
  pushNumericFact('E5CriticalMaterialsSharePercent', criticalSharePercent, 'percent', 1)
  pushNumericFact('E5CircularityTargetPercent', circularityTargetPercent, 'percent', 1)
  pushNumericFact('E5TargetGapPercent', targetGapPercent, 'percent', 1)
  pushNumericFact('E5DocumentationQualityPercent', dataQualityPercent, 'percent', 1)

  return {
    value,
    unit: e5Resources.unit,
    assumptions,
    trace,
    warnings,
    ...(esrsFacts.length > 0 ? { esrsFacts } : {})
  }
}

function normaliseMass(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value) || !Number.isFinite(value)) {
    return 0
  }
  return Math.max(0, value)
}

function clampPercent(value: number | null | undefined, fallback: number): number {
  if (value == null || Number.isNaN(value) || !Number.isFinite(value)) {
    return clampPercentValue(fallback)
  }
  return clampPercentValue(value)
}

function clampPercentValue(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }
  return Math.min(Math.max(value, 0), 100)
}
