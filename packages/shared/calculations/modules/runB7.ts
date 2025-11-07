/**
 * Beregning for modul B7 der vurderer dokumenteret vedvarende el med garantiordninger.
 */
import type { B7Input, ModuleInput, ModuleResult } from '../../types'
import { factors } from '../factors'
import { withE1Insights } from '../e1Insights'

type SanitisedB7 = Required<{
  [Key in keyof B7Input]: number
}>

export function runB7(input: ModuleInput): ModuleResult {
  const warnings: string[] = []
  const assumptions = [
    'Reduktion beregnes som dokumenteret vedvarende el multipliceret med residualfaktor.',
    `Dokumentationskvalitet vægtes med ${Math.round(factors.b7.qualityMitigationRate * 100)}% effektivitet.`,
    `Konvertering fra kg til ton: ${factors.b7.kgToTonnes}`
  ]

  const raw = (input['B7'] ?? {}) as B7Input
  const sanitised = normaliseInput(raw, warnings)

  const qualityAdjustedKwh =
    sanitised.documentedRenewableKwh *
    sanitised.documentationQualityPercent *
    factors.b7.percentToRatio *
    factors.b7.qualityMitigationRate

  if (sanitised.documentationQualityPercent === 0 && sanitised.documentedRenewableKwh > 0) {
    warnings.push('Dokumentationskvalitet på 0% betyder, at ingen reduktion kan bogføres.')
  }

  const grossReductionKg = qualityAdjustedKwh * sanitised.residualEmissionFactorKgPerKwh
  const grossReductionTonnes = grossReductionKg * factors.b7.kgToTonnes
  const signedReductionTonnes = Number((-grossReductionTonnes).toFixed(factors.b7.resultPrecision))
  const value = signedReductionTonnes === 0 ? 0 : signedReductionTonnes

  return withE1Insights('B7', input, {
    value,
    unit: factors.b7.unit,
    assumptions,
    trace: [
      `documentedRenewableKwh=${sanitised.documentedRenewableKwh}`,
      `documentationQualityPercent=${sanitised.documentationQualityPercent}`,
      `qualityAdjustedKwh=${qualityAdjustedKwh}`,
      `residualEmissionFactorKgPerKwh=${sanitised.residualEmissionFactorKgPerKwh}`,
      `grossReductionKg=${grossReductionKg}`,
      `grossReductionTonnes=${grossReductionTonnes}`
    ],
    warnings
  })
}

function normaliseInput(raw: B7Input, warnings: string[]): SanitisedB7 {
  const hasAnyValue =
    raw != null && Object.values(raw).some((value) => value != null && !Number.isNaN(Number(value)))

  const safeRenewableKwh = toNonNegativeNumber(
    raw?.documentedRenewableKwh,
    'documentedRenewableKwh',
    warnings,
    hasAnyValue
  )
  const safeResidualFactor = toNonNegativeNumber(
    raw?.residualEmissionFactorKgPerKwh,
    'residualEmissionFactorKgPerKwh',
    warnings,
    hasAnyValue
  )
  const safeQualityPercent = toQualityPercent(
    raw?.documentationQualityPercent,
    warnings,
    hasAnyValue
  )

  return {
    documentedRenewableKwh: safeRenewableKwh,
    residualEmissionFactorKgPerKwh: safeResidualFactor,
    documentationQualityPercent: safeQualityPercent
  }
}

function toNonNegativeNumber(
  value: number | null | undefined,
  field: keyof B7Input,
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
  if (value > factors.b7.maximumDocumentationPercent) {
    warnings.push(
      `Dokumentationskvalitet er begrænset til ${factors.b7.maximumDocumentationPercent}%.`
    )
    return factors.b7.maximumDocumentationPercent
  }
  if (value < factors.b7.minimumEffectiveQualityPercent) {
    warnings.push(
      `Dokumentationskvalitet under ${factors.b7.minimumEffectiveQualityPercent}% kan blive udfordret i revision.`
    )
  }
  return value
}
