/**
 * Beregning for modul B3 der vurderer nettoemissioner fra køleforbrug.
 */
import type { B3Input, ModuleInput, ModuleResult } from '../../types'
import { factors } from '../factors'
import { withE1Insights } from '../e1Insights'

type SanitisedB3 = Required<{
  [Key in keyof B3Input]: number
}>

export function runB3(input: ModuleInput): ModuleResult {
  const warnings: string[] = []
  const assumptions = [
    `Fradrag for frikøling eller genindvundet kulde: ${Math.round(
      factors.b3.recoveryCreditRate * 100
    )}%`,
    `Reduktion for vedvarende køling: ${Math.round(factors.b3.renewableMitigationRate * 100)}%`,
    `Konvertering fra kg til ton: ${factors.b3.kgToTonnes}`
  ]

  const raw = (input.B3 ?? {}) as B3Input
  const sanitised = normaliseInput(raw, warnings)

  const adjustedCoolingConsumptionKwh = Math.max(
    0,
    sanitised.coolingConsumptionKwh - sanitised.recoveredCoolingKwh * factors.b3.recoveryCreditRate
  )

  if (sanitised.recoveredCoolingKwh > sanitised.coolingConsumptionKwh) {
    warnings.push('Genindvundet køling overstiger det registrerede forbrug. Nettoforbruget sættes til 0.')
  }

  const grossEmissionsKg = adjustedCoolingConsumptionKwh * sanitised.emissionFactorKgPerKwh
  const renewableReductionKg =
    grossEmissionsKg *
    sanitised.renewableSharePercent *
    factors.b3.percentToRatio *
    factors.b3.renewableMitigationRate
  const netEmissionsKg = Math.max(0, grossEmissionsKg - renewableReductionKg)
  const netEmissionsTonnes = netEmissionsKg * factors.b3.kgToTonnes

  const value = Number(netEmissionsTonnes.toFixed(factors.b3.resultPrecision))

  return withE1Insights('B3', input, {
    value,
    unit: factors.b3.unit,
    assumptions,
    trace: [
      `coolingConsumptionKwh=${sanitised.coolingConsumptionKwh}`,
      `recoveredCoolingKwh=${sanitised.recoveredCoolingKwh}`,
      `netCoolingConsumptionKwh=${adjustedCoolingConsumptionKwh}`,
      `emissionFactorKgPerKwh=${sanitised.emissionFactorKgPerKwh}`,
      `renewableSharePercent=${sanitised.renewableSharePercent}`,
      `grossEmissionsKg=${grossEmissionsKg}`,
      `renewableReductionKg=${renewableReductionKg}`,
      `netEmissionsTonnes=${netEmissionsTonnes}`
    ],
    warnings
  })
}

function normaliseInput(raw: B3Input, warnings: string[]): SanitisedB3 {
  const hasAnyValue =
    raw != null &&
    Object.values(raw).some((value) => value != null && !Number.isNaN(Number(value)))

  const safeCoolingConsumption = toNonNegativeNumber(
    raw?.coolingConsumptionKwh,
    'coolingConsumptionKwh',
    warnings,
    hasAnyValue
  )
  const safeRecoveredCooling = toNonNegativeNumber(
    raw?.recoveredCoolingKwh,
    'recoveredCoolingKwh',
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
    coolingConsumptionKwh: safeCoolingConsumption,
    recoveredCoolingKwh: safeRecoveredCooling,
    emissionFactorKgPerKwh: safeEmissionFactor,
    renewableSharePercent: safeShare
  }
}

function toNonNegativeNumber(
  value: number | null | undefined,
  field: keyof B3Input,
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
  if (value > factors.b3.maximumRenewableSharePercent) {
    warnings.push(
      `Andelen af vedvarende energi er begrænset til ${factors.b3.maximumRenewableSharePercent}%.`
    )
    return factors.b3.maximumRenewableSharePercent
  }
  return value
}
