/**
 * Beregning for modul B1 der vurderer nettoemissioner fra elforbrug.
 */
import type { B1Input, ModuleInput, ModuleResult } from '../../types'
import { factors } from '../factors'
import { withE1Insights } from '../e1Insights'

type SanitisedB1 = Required<{
  [Key in keyof B1Input]: number
}>

export function runB1(input: ModuleInput): ModuleResult {
  const warnings: string[] = []
  const assumptions = [
    `Reduktion for vedvarende energi: ${Math.round(factors.b1.renewableMitigationRate * 100)}%`,
    `Konvertering fra kg til ton: ${factors.b1.kgToTonnes}`
  ]

  const raw = (input.B1 ?? {}) as B1Input

  const sanitised = normaliseInput(raw, warnings)

  const grossEmissionsKg = sanitised.electricityConsumptionKwh * sanitised.emissionFactorKgPerKwh
  const renewableReductionKg =
    grossEmissionsKg *
    sanitised.renewableSharePercent *
    factors.b1.percentToRatio *
    factors.b1.renewableMitigationRate
  const netEmissionsKg = Math.max(0, grossEmissionsKg - renewableReductionKg)
  const netEmissionsTonnes = netEmissionsKg * factors.b1.kgToTonnes

  const value = Number(netEmissionsTonnes.toFixed(factors.b1.resultPrecision))

  return withE1Insights('B1', input, {
    value,
    unit: factors.b1.unit,
    assumptions,
    trace: [
      `electricityConsumptionKwh=${sanitised.electricityConsumptionKwh}`,
      `emissionFactorKgPerKwh=${sanitised.emissionFactorKgPerKwh}`,
      `renewableSharePercent=${sanitised.renewableSharePercent}`,
      `grossEmissionsKg=${grossEmissionsKg}`,
      `renewableReductionKg=${renewableReductionKg}`,
      `netEmissionsKg=${netEmissionsKg}`,
      `netEmissionsTonnes=${netEmissionsTonnes}`
    ],
    warnings
  })
}

function normaliseInput(raw: B1Input, warnings: string[]): SanitisedB1 {
  const hasAnyValue =
    raw != null &&
    Object.values(raw).some((value) => value != null && !Number.isNaN(Number(value)))

  const safeElectricity = toNonNegativeNumber(
    raw?.electricityConsumptionKwh,
    'electricityConsumptionKwh',
    warnings,
    hasAnyValue
  )
  const safeEmissionFactor = toNonNegativeNumber(
    raw?.emissionFactorKgPerKwh,
    'emissionFactorKgPerKwh',
    warnings,
    hasAnyValue
  )
  const safeShare = toSharePercent(raw?.renewableSharePercent, warnings, hasAnyValue)

  return {
    electricityConsumptionKwh: safeElectricity,
    emissionFactorKgPerKwh: safeEmissionFactor,
    renewableSharePercent: safeShare
  }
}

function toNonNegativeNumber(
  value: number | null | undefined,
  field: keyof B1Input,
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

function toSharePercent(
  value: number | null | undefined,
  warnings: string[],
  emitMissingWarning: boolean
): number {
  if (value == null || Number.isNaN(value)) {
    if (emitMissingWarning) {
      warnings.push('Andelen af vedvarende energi mangler og behandles som 0%.')
    }
    return 0
  }
  if (value < 0) {
    warnings.push('Andelen af vedvarende energi kan ikke være negativ. 0% anvendes.')
    return 0
  }
  if (value > factors.b1.maximumRenewableSharePercent) {
    warnings.push(
      `Andelen af vedvarende energi er begrænset til ${factors.b1.maximumRenewableSharePercent}%.`
    )
    return factors.b1.maximumRenewableSharePercent
  }
  return value
}
