/**
 * Beregning for modul B6 der estimerer transmission- og distributionstab for el.
 */
import type { B6Input, ModuleInput, ModuleResult } from '../../types'
import { factors } from '../factors'
import { withE1Insights } from '../e1Insights'

type SanitisedB6 = Required<{
  [Key in keyof B6Input]: number
}>

export function runB6(input: ModuleInput): ModuleResult {
  const warnings: string[] = []
  const assumptions = [
    'Nettab beregnes som leveret el multipliceret med nettab i procent.',
    `Reduktion for vedvarende dækning af tab: ${Math.round(factors.b6.renewableMitigationRate * 100)}%`,
    `Konvertering fra kg til ton: ${factors.b6.kgToTonnes}`
  ]

  const raw = (input.B6 ?? {}) as B6Input
  const sanitised = normaliseInput(raw, warnings)

  const lossEnergyKwh = sanitised.electricitySuppliedKwh * sanitised.gridLossPercent * factors.b6.percentToRatio
  const grossEmissionsKg = lossEnergyKwh * sanitised.emissionFactorKgPerKwh
  const renewableReductionKg =
    grossEmissionsKg *
    sanitised.renewableSharePercent *
    factors.b6.percentToRatio *
    factors.b6.renewableMitigationRate

  const netEmissionsKg = Math.max(0, grossEmissionsKg - renewableReductionKg)
  const netEmissionsTonnes = netEmissionsKg * factors.b6.kgToTonnes
  const value = Number(netEmissionsTonnes.toFixed(factors.b6.resultPrecision))

  return withE1Insights('B6', input, {
    value,
    unit: factors.b6.unit,
    assumptions,
    trace: [
      `electricitySuppliedKwh=${sanitised.electricitySuppliedKwh}`,
      `gridLossPercent=${sanitised.gridLossPercent}`,
      `lossEnergyKwh=${lossEnergyKwh}`,
      `emissionFactorKgPerKwh=${sanitised.emissionFactorKgPerKwh}`,
      `renewableSharePercent=${sanitised.renewableSharePercent}`,
      `grossEmissionsKg=${grossEmissionsKg}`,
      `renewableReductionKg=${renewableReductionKg}`,
      `netEmissionsTonnes=${netEmissionsTonnes}`
    ],
    warnings
  })
}

function normaliseInput(raw: B6Input, warnings: string[]): SanitisedB6 {
  const hasAnyValue =
    raw != null &&
    Object.values(raw).some((value) => value != null && !Number.isNaN(Number(value)))

  const safeElectricitySupplied = toNonNegativeNumber(
    raw?.electricitySuppliedKwh,
    'electricitySuppliedKwh',
    warnings,
    hasAnyValue
  )
  const safeLossPercent = toLossPercent(raw?.gridLossPercent, warnings, hasAnyValue)
  const safeEmissionFactor = toNonNegativeNumber(
    raw?.emissionFactorKgPerKwh,
    'emissionFactorKgPerKwh',
    warnings,
    hasAnyValue
  )
  const safeRenewableShare = toSharePercent(raw?.renewableSharePercent, warnings, hasAnyValue)

  return {
    electricitySuppliedKwh: safeElectricitySupplied,
    gridLossPercent: safeLossPercent,
    emissionFactorKgPerKwh: safeEmissionFactor,
    renewableSharePercent: safeRenewableShare
  }
}

function toNonNegativeNumber(
  value: number | null | undefined,
  field: keyof B6Input,
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

function toLossPercent(
  value: number | null | undefined,
  warnings: string[],
  emitMissingWarning: boolean
): number {
  if (value == null || Number.isNaN(value)) {
    if (emitMissingWarning) {
      warnings.push('Nettab i elnettet mangler og behandles som 0%.')
    }
    return 0
  }
  if (value < 0) {
    warnings.push('Nettab i elnettet kan ikke være negativt. 0% anvendes.')
    return 0
  }
  if (value > factors.b6.maximumGridLossPercent) {
    warnings.push(`Nettab i elnettet er begrænset til ${factors.b6.maximumGridLossPercent}%.`)
    return factors.b6.maximumGridLossPercent
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
  if (value > factors.b6.maximumRenewableSharePercent) {
    warnings.push(
      `Andelen af vedvarende energi er begrænset til ${factors.b6.maximumRenewableSharePercent}%.`
    )
    return factors.b6.maximumRenewableSharePercent
  }
  return value
}
