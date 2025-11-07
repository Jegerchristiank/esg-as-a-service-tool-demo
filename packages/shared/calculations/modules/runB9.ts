/**
 * Beregning for modul B9 der håndterer fysiske PPA-leverancer af vedvarende el.
 */
import type { B9Input, ModuleInput, ModuleResult } from '../../types'
import { factors } from '../factors'
import { withE1Insights } from '../e1Insights'

type SanitisedB9 = Required<{
  [Key in keyof B9Input]: number
}>

export function runB9(input: ModuleInput): ModuleResult {
  const warnings: string[] = []
  const assumptions = [
    'Kun den PPA-leverede energi der matcher virksomhedens forbrug medregnes som reduktion.',
    `Nettab over nettet fratrækkes lineært baseret på oplyst procent (maks ${factors.b9.maximumGridLossPercent}%).`,
    `Dokumentationskvalitet vægtes med ${Math.round(factors.b9.qualityMitigationRate * 100)}% effektivitet.`,
    `Konvertering fra kg til ton: ${factors.b9.kgToTonnes}`
  ]

  const raw = (input['B9'] ?? {}) as B9Input
  const sanitised = normaliseInput(raw, warnings)

  const matchedKwh = Math.min(sanitised.ppaDeliveredKwh, sanitised.matchedConsumptionKwh)

  if (sanitised.matchedConsumptionKwh > sanitised.ppaDeliveredKwh) {
    warnings.push('Forbrugsdata overstiger PPA-leverancen. Overskydende mængde ignoreres.')
  }

  const lossFactor = Math.max(
    0,
    1 - sanitised.gridLossPercent * factors.b9.percentToRatio
  )
  const netMatchedKwh = matchedKwh * lossFactor

  if (sanitised.documentationQualityPercent === 0 && netMatchedKwh > 0) {
    warnings.push('Dokumentationskvalitet på 0% betyder, at ingen reduktion kan bogføres.')
  }

  const qualityAdjustedKwh =
    netMatchedKwh *
    sanitised.documentationQualityPercent *
    factors.b9.percentToRatio *
    factors.b9.qualityMitigationRate

  const grossReductionKg = qualityAdjustedKwh * sanitised.residualEmissionFactorKgPerKwh
  const grossReductionTonnes = grossReductionKg * factors.b9.kgToTonnes
  const signedReductionTonnes = Number((-grossReductionTonnes).toFixed(factors.b9.resultPrecision))
  const value = signedReductionTonnes === 0 ? 0 : signedReductionTonnes

  return withE1Insights('B9', input, {
    value,
    unit: factors.b9.unit,
    assumptions,
    trace: [
      `ppaDeliveredKwh=${sanitised.ppaDeliveredKwh}`,
      `matchedConsumptionKwh=${sanitised.matchedConsumptionKwh}`,
      `gridLossPercent=${sanitised.gridLossPercent}`,
      `lossFactor=${lossFactor}`,
      `netMatchedKwh=${netMatchedKwh}`,
      `documentationQualityPercent=${sanitised.documentationQualityPercent}`,
      `qualityAdjustedKwh=${qualityAdjustedKwh}`,
      `residualEmissionFactorKgPerKwh=${sanitised.residualEmissionFactorKgPerKwh}`,
      `grossReductionKg=${grossReductionKg}`,
      `grossReductionTonnes=${grossReductionTonnes}`
    ],
    warnings
  })
}

function normaliseInput(raw: B9Input, warnings: string[]): SanitisedB9 {
  const hasAnyValue =
    raw != null && Object.values(raw).some((value) => value != null && !Number.isNaN(Number(value)))

  const safeDelivered = toNonNegativeNumber(
    raw?.ppaDeliveredKwh,
    'ppaDeliveredKwh',
    warnings,
    hasAnyValue
  )
  const safeMatched = toNonNegativeNumber(
    raw?.matchedConsumptionKwh,
    'matchedConsumptionKwh',
    warnings,
    hasAnyValue
  )
  const safeLoss = toGridLossPercent(raw?.gridLossPercent, warnings, hasAnyValue)
  const safeResidual = toNonNegativeNumber(
    raw?.residualEmissionFactorKgPerKwh,
    'residualEmissionFactorKgPerKwh',
    warnings,
    hasAnyValue
  )
  const safeQuality = toQualityPercent(raw?.documentationQualityPercent, warnings, hasAnyValue)

  return {
    ppaDeliveredKwh: safeDelivered,
    matchedConsumptionKwh: safeMatched,
    gridLossPercent: safeLoss,
    residualEmissionFactorKgPerKwh: safeResidual,
    documentationQualityPercent: safeQuality
  }
}

function toNonNegativeNumber(
  value: number | null | undefined,
  field: keyof B9Input,
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

function toGridLossPercent(
  value: number | null | undefined,
  warnings: string[],
  emitMissingWarning: boolean
): number {
  if (value == null || Number.isNaN(value)) {
    if (emitMissingWarning) {
      warnings.push('Nettab mangler og behandles som 0%.')
    }
    return 0
  }
  if (value < 0) {
    warnings.push('Nettab kan ikke være negativt. 0% anvendes.')
    return 0
  }
  if (value > factors.b9.maximumGridLossPercent) {
    warnings.push(`Nettab er begrænset til ${factors.b9.maximumGridLossPercent}%.`)
    return factors.b9.maximumGridLossPercent
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
  if (value > factors.b9.maximumDocumentationPercent) {
    warnings.push(`Dokumentationskvalitet er begrænset til ${factors.b9.maximumDocumentationPercent}%.`)
    return factors.b9.maximumDocumentationPercent
  }
  if (value < factors.b9.minimumEffectiveQualityPercent) {
    warnings.push(
      `Dokumentationskvalitet under ${factors.b9.minimumEffectiveQualityPercent}% kan blive udfordret i revision.`
    )
  }
  return value
}
