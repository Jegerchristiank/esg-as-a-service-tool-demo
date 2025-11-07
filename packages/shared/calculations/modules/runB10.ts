/**
 * Beregning for modul B10 – virtuelle PPA-aftaler for vedvarende elektricitet.
 */
import type { B10Input, ModuleInput, ModuleResult } from '../../types'
import { factors } from '../factors'
import { withE1Insights } from '../e1Insights'

type SanitisedB10 = Required<{
  [Key in keyof B10Input]: number
}>

export function runB10(input: ModuleInput): ModuleResult {
  const warnings: string[] = []
  const assumptions = [
    'Kun kontrakteret energi der kan matches med dokumenteret forbrug medregnes som reduktion.',
    `Finansiel dækning reduceres lineært efter angivet settlement-procent (maks ${factors.b10.maximumSettlementPercent}%).`,
    `Dokumentationskvalitet vægtes med ${Math.round(factors.b10.qualityMitigationRate * 100)}% effektivitet.`,
    `Konvertering fra kg til ton: ${factors.b10.kgToTonnes}`
  ]

  const raw = (input['B10'] ?? {}) as B10Input
  const sanitised = normaliseInput(raw, warnings)

  const matchedKwh = Math.min(sanitised.ppaSettledKwh, sanitised.matchedConsumptionKwh)

  if (sanitised.matchedConsumptionKwh > sanitised.ppaSettledKwh) {
    warnings.push('Forbrugsdata overstiger PPA-leverancen. Overskydende mængde ignoreres.')
  }

  const settlementRatio = sanitised.marketSettlementPercent * factors.b10.percentToRatio
  const settlementAdjustedKwh = matchedKwh * settlementRatio

  if (sanitised.marketSettlementPercent === 0 && matchedKwh > 0) {
    warnings.push('Finansiel dækning på 0% betyder, at ingen reduktion kan bogføres.')
  }

  const qualityAdjustedKwh =
    settlementAdjustedKwh *
    sanitised.documentationQualityPercent *
    factors.b10.percentToRatio *
    factors.b10.qualityMitigationRate

  if (sanitised.documentationQualityPercent === 0 && settlementAdjustedKwh > 0) {
    warnings.push('Dokumentationskvalitet på 0% betyder, at ingen reduktion kan bogføres.')
  }

  const grossReductionKg = qualityAdjustedKwh * sanitised.residualEmissionFactorKgPerKwh
  const grossReductionTonnes = grossReductionKg * factors.b10.kgToTonnes
  const signedReductionTonnes = Number((-grossReductionTonnes).toFixed(factors.b10.resultPrecision))
  const value = signedReductionTonnes === 0 ? 0 : signedReductionTonnes

  return withE1Insights('B10', input, {
    value,
    unit: factors.b10.unit,
    assumptions,
    trace: [
      `ppaSettledKwh=${sanitised.ppaSettledKwh}`,
      `matchedConsumptionKwh=${sanitised.matchedConsumptionKwh}`,
      `marketSettlementPercent=${sanitised.marketSettlementPercent}`,
      `settlementRatio=${settlementRatio}`,
      `settlementAdjustedKwh=${settlementAdjustedKwh}`,
      `documentationQualityPercent=${sanitised.documentationQualityPercent}`,
      `qualityAdjustedKwh=${qualityAdjustedKwh}`,
      `residualEmissionFactorKgPerKwh=${sanitised.residualEmissionFactorKgPerKwh}`,
      `grossReductionKg=${grossReductionKg}`,
      `grossReductionTonnes=${grossReductionTonnes}`
    ],
    warnings
  })
}

function normaliseInput(raw: B10Input, warnings: string[]): SanitisedB10 {
  const hasAnyValue =
    raw != null && Object.values(raw).some((value) => value != null && !Number.isNaN(Number(value)))

  const safeSettled = toNonNegativeNumber(raw?.ppaSettledKwh, 'ppaSettledKwh', warnings, hasAnyValue)
  const safeMatched = toNonNegativeNumber(
    raw?.matchedConsumptionKwh,
    'matchedConsumptionKwh',
    warnings,
    hasAnyValue
  )
  const safeSettlement = toSettlementPercent(raw?.marketSettlementPercent, warnings, hasAnyValue)
  const safeResidual = toNonNegativeNumber(
    raw?.residualEmissionFactorKgPerKwh,
    'residualEmissionFactorKgPerKwh',
    warnings,
    hasAnyValue
  )
  const safeQuality = toQualityPercent(raw?.documentationQualityPercent, warnings, hasAnyValue)

  return {
    ppaSettledKwh: safeSettled,
    matchedConsumptionKwh: safeMatched,
    marketSettlementPercent: safeSettlement,
    residualEmissionFactorKgPerKwh: safeResidual,
    documentationQualityPercent: safeQuality
  }
}

function toNonNegativeNumber(
  value: number | null | undefined,
  field: keyof B10Input,
  warnings: string[],
  emitMissingWarning: boolean
): number {
  if (value == null || Number.isNaN(value)) {
    if (emitMissingWarning) {
      warnings.push(`Feltet ${String(field)} mangler og behandles som 0.`)
    }
    return 0
  }
  if (value < 0) {
    warnings.push(`Feltet ${String(field)} kan ikke være negativt. 0 anvendes i stedet.`)
    return 0
  }
  return value
}

function toSettlementPercent(
  value: number | null | undefined,
  warnings: string[],
  emitMissingWarning: boolean
): number {
  if (value == null || Number.isNaN(value)) {
    if (emitMissingWarning) {
      warnings.push('Finansiel dækning mangler og behandles som 0%.')
    }
    return 0
  }
  if (value < 0) {
    warnings.push('Finansiel dækning kan ikke være negativ. 0% anvendes.')
    return 0
  }
  if (value > factors.b10.maximumSettlementPercent) {
    warnings.push(`Finansiel dækning er begrænset til ${factors.b10.maximumSettlementPercent}%.`)
    return factors.b10.maximumSettlementPercent
  }
  if (value > 0 && value < factors.b10.minimumEffectiveSettlementPercent) {
    warnings.push(
      `Finansiel dækning under ${factors.b10.minimumEffectiveSettlementPercent}% kan blive udfordret i revision.`
    )
  }
  return value
}

function toQualityPercent(
  value: number | null | undefined,
  warnings: string[],
  emitMissingWarning: boolean
): number {
  if (value == null || Number.isNaN(value)) {
    if (emitMissingWarning) {
      warnings.push('Dokumentationskvalitet mangler og behandles som 0%.')
    }
    return 0
  }
  if (value < 0) {
    warnings.push('Dokumentationskvalitet kan ikke være negativ. 0% anvendes.')
    return 0
  }
  if (value > factors.b10.maximumDocumentationPercent) {
    warnings.push(`Dokumentationskvalitet er begrænset til ${factors.b10.maximumDocumentationPercent}%.`)
    return factors.b10.maximumDocumentationPercent
  }
  if (value > 0 && value < factors.b10.minimumEffectiveQualityPercent) {
    warnings.push(
      `Dokumentationskvalitet under ${factors.b10.minimumEffectiveQualityPercent}% kan blive udfordret i revision.`
    )
  }
  return value
}
