/**
 * Beregning for modul C3 – brændstof- og energirelaterede aktiviteter.
 */
import type { C3Input, ModuleInput, ModuleResult } from '../../types'
import { factors } from '../factors'
import { withE1Insights } from '../e1Insights'

type SanitisedC3 = Required<{
  [Key in keyof C3Input]: number
}>

export function runC3(input: ModuleInput): ModuleResult {
  const warnings: string[] = []

  const raw = (input.C3 ?? {}) as C3Input
  const sanitised = normaliseInput(raw, warnings)

  const lossMultiplier = 1 + sanitised.transmissionLossPercent * factors.c3.percentToRatio
  const renewableMitigationRatio =
    sanitised.renewableSharePercent * factors.c3.percentToRatio * factors.c3.renewableMitigationRate
  const renewableMitigationMultiplier = Math.max(0, 1 - Math.min(renewableMitigationRatio, 1))

  const electricityUpstreamKg =
    sanitised.purchasedElectricityKwh *
    sanitised.electricityUpstreamEmissionFactorKgPerKwh *
    lossMultiplier *
    renewableMitigationMultiplier

  const fuelUpstreamKg =
    sanitised.fuelConsumptionKwh * sanitised.fuelUpstreamEmissionFactorKgPerKwh

  const totalEmissionsKg = electricityUpstreamKg + fuelUpstreamKg
  const emissionsTonnes = totalEmissionsKg * factors.c3.kgToTonnes
  const value = Number(emissionsTonnes.toFixed(factors.c3.resultPrecision))

  const assumptions = [
    `Transmissions- og distributionsspild øger el-delen med ${sanitised.transmissionLossPercent}%.`,
    `Den vedvarende andel reducerer el-delen med faktor ${factors.c3.renewableMitigationRate} af ${sanitised.renewableSharePercent}%.`,
    `Konvertering fra kg til ton: ${factors.c3.kgToTonnes}`
  ]

  return withE1Insights('C3', input, {
    value,
    unit: factors.c3.unit,
    assumptions,
    trace: [
      `purchasedElectricityKwh=${sanitised.purchasedElectricityKwh}`,
      `electricityUpstreamEmissionFactorKgPerKwh=${sanitised.electricityUpstreamEmissionFactorKgPerKwh}`,
      `transmissionLossPercent=${sanitised.transmissionLossPercent}`,
      `renewableSharePercent=${sanitised.renewableSharePercent}`,
      `fuelConsumptionKwh=${sanitised.fuelConsumptionKwh}`,
      `fuelUpstreamEmissionFactorKgPerKwh=${sanitised.fuelUpstreamEmissionFactorKgPerKwh}`,
      `lossMultiplier=${lossMultiplier}`,
      `renewableMitigationMultiplier=${renewableMitigationMultiplier}`,
      `electricityUpstreamKg=${electricityUpstreamKg}`,
      `fuelUpstreamKg=${fuelUpstreamKg}`,
      `totalEmissionsKg=${totalEmissionsKg}`,
      `emissionsTonnes=${emissionsTonnes}`
    ],
    warnings
  })
}

function normaliseInput(raw: C3Input, warnings: string[]): SanitisedC3 {
  const hasAnyValue =
    raw != null &&
    Object.values(raw).some((value) => value != null && !Number.isNaN(Number(value)))

  const purchasedElectricity = toNonNegativeNumber(
    raw?.purchasedElectricityKwh,
    'purchasedElectricityKwh',
    warnings,
    hasAnyValue
  )

  const electricityFactor = toNonNegativeNumber(
    raw?.electricityUpstreamEmissionFactorKgPerKwh,
    'electricityUpstreamEmissionFactorKgPerKwh',
    warnings,
    hasAnyValue
  )

  const transmissionLoss = toPercent(
    raw?.transmissionLossPercent,
    'transmissionLossPercent',
    factors.c3.maximumTransmissionLossPercent,
    warnings,
    hasAnyValue
  )

  const renewableShare = toPercent(
    raw?.renewableSharePercent,
    'renewableSharePercent',
    factors.c3.maximumRenewableSharePercent,
    warnings,
    hasAnyValue
  )

  const fuelConsumption = toNonNegativeNumber(
    raw?.fuelConsumptionKwh,
    'fuelConsumptionKwh',
    warnings,
    hasAnyValue
  )

  const fuelFactor = toNonNegativeNumber(
    raw?.fuelUpstreamEmissionFactorKgPerKwh,
    'fuelUpstreamEmissionFactorKgPerKwh',
    warnings,
    hasAnyValue
  )

  return {
    purchasedElectricityKwh: purchasedElectricity,
    electricityUpstreamEmissionFactorKgPerKwh: electricityFactor,
    transmissionLossPercent: transmissionLoss,
    renewableSharePercent: renewableShare,
    fuelConsumptionKwh: fuelConsumption,
    fuelUpstreamEmissionFactorKgPerKwh: fuelFactor
  }
}

function toNonNegativeNumber(
  value: number | null | undefined,
  field: keyof C3Input,
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

function toPercent(
  value: number | null | undefined,
  field: keyof C3Input,
  maximum: number,
  warnings: string[],
  emitMissingWarning: boolean
): number {
  if (value == null || Number.isNaN(value)) {
    if (emitMissingWarning) {
      warnings.push(`Feltet ${String(field)} mangler og behandles som 0%.`)
    }
    return 0
  }
  if (value < 0) {
    warnings.push(`Feltet ${String(field)} kan ikke være negativt. 0% anvendes i stedet.`)
    return 0
  }
  if (value > maximum) {
    warnings.push(`Feltet ${String(field)} er begrænset til ${maximum}%.`)
    return maximum
  }
  return value
}
