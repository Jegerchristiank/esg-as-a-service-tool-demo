/**
 * Beregning for modul B8 der vurderer egenproduceret vedvarende el.
 */
import type { B8Input, ModuleInput, ModuleResult } from '../../types'
import { factors } from '../factors'
import { withE1Insights } from '../e1Insights'

type SanitisedB8 = Required<{
  [Key in keyof B8Input]: number
}>

export function runB8(input: ModuleInput): ModuleResult {
  const warnings: string[] = []
  const assumptions = [
    'Kun den egenproducerede el der forbruges internt reducerer Scope 2-udledningerne.',
    `Dokumentationskvalitet vægtes med ${Math.round(factors.b8.qualityMitigationRate * 100)}% effektivitet.`,
    `Konvertering fra kg til ton: ${factors.b8.kgToTonnes}`
  ]

  const raw = (input['B8'] ?? {}) as B8Input
  const sanitised = normaliseInput(raw, warnings)

  if (sanitised.exportedRenewableKwh > sanitised.onSiteRenewableKwh) {
    warnings.push('Eksporteret vedvarende el overstiger produktionen. Nettoreduktionen sættes til 0.')
  }

  const netSelfConsumptionKwh = Math.max(
    0,
    sanitised.onSiteRenewableKwh - sanitised.exportedRenewableKwh
  )

  if (sanitised.documentationQualityPercent === 0 && netSelfConsumptionKwh > 0) {
    warnings.push('Dokumentationskvalitet på 0% betyder, at ingen reduktion kan bogføres.')
  }

  const qualityAdjustedKwh =
    netSelfConsumptionKwh *
    sanitised.documentationQualityPercent *
    factors.b8.percentToRatio *
    factors.b8.qualityMitigationRate

  if (
    sanitised.documentationQualityPercent > 0 &&
    sanitised.documentationQualityPercent < factors.b8.minimumEffectiveQualityPercent
  ) {
    warnings.push(
      `Dokumentationskvalitet under ${factors.b8.minimumEffectiveQualityPercent}% kan blive udfordret i revision.`
    )
  }

  const grossReductionKg = qualityAdjustedKwh * sanitised.residualEmissionFactorKgPerKwh
  const grossReductionTonnes = grossReductionKg * factors.b8.kgToTonnes
  const signedReductionTonnes = Number((-grossReductionTonnes).toFixed(factors.b8.resultPrecision))
  const value = signedReductionTonnes === 0 ? 0 : signedReductionTonnes

  return withE1Insights('B8', input, {
    value,
    unit: factors.b8.unit,
    assumptions,
    trace: [
      `onSiteRenewableKwh=${sanitised.onSiteRenewableKwh}`,
      `exportedRenewableKwh=${sanitised.exportedRenewableKwh}`,
      `netSelfConsumptionKwh=${netSelfConsumptionKwh}`,
      `documentationQualityPercent=${sanitised.documentationQualityPercent}`,
      `qualityAdjustedKwh=${qualityAdjustedKwh}`,
      `residualEmissionFactorKgPerKwh=${sanitised.residualEmissionFactorKgPerKwh}`,
      `grossReductionKg=${grossReductionKg}`,
      `grossReductionTonnes=${grossReductionTonnes}`
    ],
    warnings
  })
}

function normaliseInput(raw: B8Input, warnings: string[]): SanitisedB8 {
  const hasAnyValue =
    raw != null && Object.values(raw).some((value) => value != null && !Number.isNaN(Number(value)))

  const safeOnSite = toNonNegativeNumber(
    raw?.onSiteRenewableKwh,
    'onSiteRenewableKwh',
    warnings,
    hasAnyValue
  )
  const safeExported = toNonNegativeNumber(
    raw?.exportedRenewableKwh,
    'exportedRenewableKwh',
    warnings,
    hasAnyValue
  )
  const safeResidual = toNonNegativeNumber(
    raw?.residualEmissionFactorKgPerKwh,
    'residualEmissionFactorKgPerKwh',
    warnings,
    hasAnyValue
  )
  const safeQuality = toQualityPercent(raw?.documentationQualityPercent, warnings, hasAnyValue)

  return {
    onSiteRenewableKwh: safeOnSite,
    exportedRenewableKwh: safeExported,
    residualEmissionFactorKgPerKwh: safeResidual,
    documentationQualityPercent: safeQuality
  }
}

function toNonNegativeNumber(
  value: number | null | undefined,
  field: keyof B8Input,
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
  if (value > factors.b8.maximumDocumentationPercent) {
    warnings.push(`Dokumentationskvalitet er begrænset til ${factors.b8.maximumDocumentationPercent}%.`)
    return factors.b8.maximumDocumentationPercent
  }
  return value
}
