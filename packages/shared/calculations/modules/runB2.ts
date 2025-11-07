/**
 * Beregning for modul B2 der vurderer nettoemissioner fra varmeforbrug.
 */
import type { B2Input, ModuleInput, ModuleResult } from '../../types'
import { factors } from '../factors'
import { withE1Insights } from '../e1Insights'

type SanitisedB2 = Required<{
  [Key in keyof B2Input]: number
}>

export function runB2(input: ModuleInput): ModuleResult {
  const warnings: string[] = []
  const assumptions = [
    `Fradrag for genindvundet varme: ${Math.round(factors.b2.recoveryCreditRate * 100)}%`,
    `Reduktion for vedvarende varme: ${Math.round(factors.b2.renewableMitigationRate * 100)}%`,
    `Konvertering fra kg til ton: ${factors.b2.kgToTonnes}`
  ]

  const raw = (input.B2 ?? {}) as B2Input
  const sanitised = normaliseInput(raw, warnings)

  const adjustedHeatConsumptionKwh = Math.max(
    0,
    sanitised.heatConsumptionKwh - sanitised.recoveredHeatKwh * factors.b2.recoveryCreditRate
  )

  if (sanitised.recoveredHeatKwh > sanitised.heatConsumptionKwh) {
    warnings.push('Genindvundet varme overstiger det registrerede forbrug. Nettoforbruget sættes til 0.')
  }

  const grossEmissionsKg = adjustedHeatConsumptionKwh * sanitised.emissionFactorKgPerKwh
  const renewableReductionKg =
    grossEmissionsKg *
    sanitised.renewableSharePercent *
    factors.b2.percentToRatio *
    factors.b2.renewableMitigationRate
  const netEmissionsKg = Math.max(0, grossEmissionsKg - renewableReductionKg)
  const netEmissionsTonnes = netEmissionsKg * factors.b2.kgToTonnes

  const value = Number(netEmissionsTonnes.toFixed(factors.b2.resultPrecision))

  return withE1Insights('B2', input, {
    value,
    unit: factors.b2.unit,
    assumptions,
    trace: [
      `heatConsumptionKwh=${sanitised.heatConsumptionKwh}`,
      `recoveredHeatKwh=${sanitised.recoveredHeatKwh}`,
      `netHeatConsumptionKwh=${adjustedHeatConsumptionKwh}`,
      `emissionFactorKgPerKwh=${sanitised.emissionFactorKgPerKwh}`,
      `renewableSharePercent=${sanitised.renewableSharePercent}`,
      `grossEmissionsKg=${grossEmissionsKg}`,
      `renewableReductionKg=${renewableReductionKg}`,
      `netEmissionsTonnes=${netEmissionsTonnes}`
    ],
    warnings
  })
}

function normaliseInput(raw: B2Input, warnings: string[]): SanitisedB2 {
  const hasAnyValue =
    raw != null &&
    Object.values(raw).some((value) => value != null && !Number.isNaN(Number(value)))

  const safeHeatConsumption = toNonNegativeNumber(
    raw?.heatConsumptionKwh,
    'heatConsumptionKwh',
    warnings,
    hasAnyValue
  )
  const safeRecoveredHeat = toNonNegativeNumber(
    raw?.recoveredHeatKwh,
    'recoveredHeatKwh',
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
    heatConsumptionKwh: safeHeatConsumption,
    recoveredHeatKwh: safeRecoveredHeat,
    emissionFactorKgPerKwh: safeEmissionFactor,
    renewableSharePercent: safeShare
  }
}

function toNonNegativeNumber(
  value: number | null | undefined,
  field: keyof B2Input,
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
  if (value > factors.b2.maximumRenewableSharePercent) {
    warnings.push(
      `Andelen af vedvarende energi er begrænset til ${factors.b2.maximumRenewableSharePercent}%.`
    )
    return factors.b2.maximumRenewableSharePercent
  }
  return value
}
