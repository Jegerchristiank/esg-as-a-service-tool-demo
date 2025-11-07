/**
 * Beregning for modul B5 der vurderer øvrige Scope 2-energileverancer.
 */
import type { B5Input, ModuleInput, ModuleResult } from '../../types'
import { factors } from '../factors'
import { withE1Insights } from '../e1Insights'

type SanitisedB5 = Required<{
  [Key in keyof B5Input]: number
}>

export function runB5(input: ModuleInput): ModuleResult {
  const warnings: string[] = []
  const assumptions = [
    `Fradrag for genindvundet energi: ${Math.round(factors.b5.recoveryCreditRate * 100)}%`,
    `Reduktion for vedvarende energi: ${Math.round(factors.b5.renewableMitigationRate * 100)}%`,
    `Konvertering fra kg til ton: ${factors.b5.kgToTonnes}`
  ]

  const raw = (input.B5 ?? {}) as B5Input
  const sanitised = normaliseInput(raw, warnings)

  const adjustedEnergyConsumptionKwh = Math.max(
    0,
    sanitised.otherEnergyConsumptionKwh - sanitised.recoveredEnergyKwh * factors.b5.recoveryCreditRate
  )

  if (sanitised.recoveredEnergyKwh > sanitised.otherEnergyConsumptionKwh) {
    warnings.push('Genindvundet energi overstiger det registrerede forbrug. Nettoforbruget sættes til 0.')
  }

  const grossEmissionsKg = adjustedEnergyConsumptionKwh * sanitised.emissionFactorKgPerKwh
  const renewableReductionKg =
    grossEmissionsKg *
    sanitised.renewableSharePercent *
    factors.b5.percentToRatio *
    factors.b5.renewableMitigationRate
  const netEmissionsKg = Math.max(0, grossEmissionsKg - renewableReductionKg)
  const netEmissionsTonnes = netEmissionsKg * factors.b5.kgToTonnes

  const value = Number(netEmissionsTonnes.toFixed(factors.b5.resultPrecision))

  return withE1Insights('B5', input, {
    value,
    unit: factors.b5.unit,
    assumptions,
    trace: [
      `otherEnergyConsumptionKwh=${sanitised.otherEnergyConsumptionKwh}`,
      `recoveredEnergyKwh=${sanitised.recoveredEnergyKwh}`,
      `netOtherEnergyConsumptionKwh=${adjustedEnergyConsumptionKwh}`,
      `emissionFactorKgPerKwh=${sanitised.emissionFactorKgPerKwh}`,
      `renewableSharePercent=${sanitised.renewableSharePercent}`,
      `grossEmissionsKg=${grossEmissionsKg}`,
      `renewableReductionKg=${renewableReductionKg}`,
      `netEmissionsTonnes=${netEmissionsTonnes}`
    ],
    warnings
  })
}

function normaliseInput(raw: B5Input, warnings: string[]): SanitisedB5 {
  const hasAnyValue =
    raw != null &&
    Object.values(raw).some((value) => value != null && !Number.isNaN(Number(value)))

  const safeEnergyConsumption = toNonNegativeNumber(
    raw?.otherEnergyConsumptionKwh,
    'otherEnergyConsumptionKwh',
    warnings,
    hasAnyValue
  )
  const safeRecoveredEnergy = toNonNegativeNumber(
    raw?.recoveredEnergyKwh,
    'recoveredEnergyKwh',
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
    otherEnergyConsumptionKwh: safeEnergyConsumption,
    recoveredEnergyKwh: safeRecoveredEnergy,
    emissionFactorKgPerKwh: safeEmissionFactor,
    renewableSharePercent: safeShare
  }
}

function toNonNegativeNumber(
  value: number | null | undefined,
  field: keyof B5Input,
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
  if (value > factors.b5.maximumRenewableSharePercent) {
    warnings.push(
      `Andelen af vedvarende energi er begrænset til ${factors.b5.maximumRenewableSharePercent}%.`
    )
    return factors.b5.maximumRenewableSharePercent
  }
  return value
}
