/**
 * Beregning for modul B11 – time-matchede certifikater for vedvarende el.
 */
import type { B11Input, ModuleInput, ModuleResult } from '../../types'
import { factors } from '../factors'
import { withE1Insights } from '../e1Insights'

type SanitisedB11 = Required<{
  [Key in keyof B11Input]: number
}>

export function runB11(input: ModuleInput): ModuleResult {
  const warnings: string[] = []
  const assumptions = [
    'Kun certifikater der matcher dokumenteret forbrug medregnes i reduktionen.',
    `Timekorrelation reduceres lineært efter den angivne procent (maks ${factors.b11.maximumTimeCorrelationPercent}%).`,
    `Time-match effektivitet vægtes med ${Math.round(factors.b11.timeMatchingMitigationRate * 100)}%.`,
    `Dokumentationskvalitet vægtes med ${Math.round(factors.b11.qualityMitigationRate * 100)}% effektivitet.`,
    `Konvertering fra kg til ton: ${factors.b11.kgToTonnes}`
  ]

  const raw = (input['B11'] ?? {}) as B11Input
  const sanitised = normaliseInput(raw, warnings)

  const matchedKwh = Math.min(sanitised.certificatesRetiredKwh, sanitised.matchedConsumptionKwh)

  if (sanitised.matchedConsumptionKwh > sanitised.certificatesRetiredKwh) {
    warnings.push('Forbrugsdata overstiger certificeret mængde. Overskydende energi ignoreres.')
  }

  const timeCorrelationRatio = sanitised.timeCorrelationPercent * factors.b11.percentToRatio
  const timeAdjustedKwh =
    matchedKwh * timeCorrelationRatio * factors.b11.timeMatchingMitigationRate

  if (sanitised.timeCorrelationPercent === 0 && matchedKwh > 0) {
    warnings.push('Timekorrelation på 0% betyder, at ingen reduktion kan bogføres.')
  }

  const qualityAdjustedKwh =
    timeAdjustedKwh *
    sanitised.documentationQualityPercent *
    factors.b11.percentToRatio *
    factors.b11.qualityMitigationRate

  if (sanitised.documentationQualityPercent === 0 && timeAdjustedKwh > 0) {
    warnings.push('Dokumentationskvalitet på 0% betyder, at ingen reduktion kan bogføres.')
  }

  const grossReductionKg = qualityAdjustedKwh * sanitised.residualEmissionFactorKgPerKwh
  const grossReductionTonnes = grossReductionKg * factors.b11.kgToTonnes
  const signedReductionTonnes = Number((-grossReductionTonnes).toFixed(factors.b11.resultPrecision))
  const value = signedReductionTonnes === 0 ? 0 : signedReductionTonnes

  return withE1Insights('B11', input, {
    value,
    unit: factors.b11.unit,
    assumptions,
    trace: [
      `certificatesRetiredKwh=${sanitised.certificatesRetiredKwh}`,
      `matchedConsumptionKwh=${sanitised.matchedConsumptionKwh}`,
      `timeCorrelationPercent=${sanitised.timeCorrelationPercent}`,
      `timeCorrelationRatio=${timeCorrelationRatio}`,
      `timeAdjustedKwh=${timeAdjustedKwh}`,
      `documentationQualityPercent=${sanitised.documentationQualityPercent}`,
      `qualityAdjustedKwh=${qualityAdjustedKwh}`,
      `residualEmissionFactorKgPerKwh=${sanitised.residualEmissionFactorKgPerKwh}`,
      `grossReductionKg=${grossReductionKg}`,
      `grossReductionTonnes=${grossReductionTonnes}`
    ],
    warnings
  })
}

function normaliseInput(raw: B11Input, warnings: string[]): SanitisedB11 {
  const hasAnyValue =
    raw != null && Object.values(raw).some((value) => value != null && !Number.isNaN(Number(value)))

  const safeCertificates = toNonNegativeNumber(
    raw?.certificatesRetiredKwh,
    'certificatesRetiredKwh',
    warnings,
    hasAnyValue
  )
  const safeMatched = toNonNegativeNumber(
    raw?.matchedConsumptionKwh,
    'matchedConsumptionKwh',
    warnings,
    hasAnyValue
  )
  const safeTimeCorrelation = toTimeCorrelationPercent(
    raw?.timeCorrelationPercent,
    warnings,
    hasAnyValue
  )
  const safeResidual = toNonNegativeNumber(
    raw?.residualEmissionFactorKgPerKwh,
    'residualEmissionFactorKgPerKwh',
    warnings,
    hasAnyValue
  )
  const safeQuality = toQualityPercent(
    raw?.documentationQualityPercent,
    warnings,
    hasAnyValue
  )

  return {
    certificatesRetiredKwh: safeCertificates,
    matchedConsumptionKwh: safeMatched,
    timeCorrelationPercent: safeTimeCorrelation,
    residualEmissionFactorKgPerKwh: safeResidual,
    documentationQualityPercent: safeQuality
  }
}

function toNonNegativeNumber(
  value: number | null | undefined,
  field: keyof B11Input,
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

function toTimeCorrelationPercent(
  value: number | null | undefined,
  warnings: string[],
  emitMissingWarning: boolean
): number {
  if (value == null || Number.isNaN(value)) {
    if (emitMissingWarning) {
      warnings.push('Timekorrelation mangler og behandles som 0%.')
    }
    return 0
  }
  if (value < 0) {
    warnings.push('Timekorrelation kan ikke være negativ. 0% anvendes.')
    return 0
  }
  if (value > factors.b11.maximumTimeCorrelationPercent) {
    warnings.push(`Timekorrelation er begrænset til ${factors.b11.maximumTimeCorrelationPercent}%.`)
    return factors.b11.maximumTimeCorrelationPercent
  }
  if (value > 0 && value < factors.b11.minimumEffectiveTimeCorrelationPercent) {
    warnings.push(
      `Timekorrelation under ${factors.b11.minimumEffectiveTimeCorrelationPercent}% kan blive udfordret i revision.`
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
  if (value > factors.b11.maximumDocumentationPercent) {
    warnings.push(`Dokumentationskvalitet er begrænset til ${factors.b11.maximumDocumentationPercent}%.`)
    return factors.b11.maximumDocumentationPercent
  }
  if (value > 0 && value < factors.b11.minimumEffectiveQualityPercent) {
    warnings.push(
      `Dokumentationskvalitet under ${factors.b11.minimumEffectiveQualityPercent}% kan blive udfordret i revision.`
    )
  }
  return value
}
