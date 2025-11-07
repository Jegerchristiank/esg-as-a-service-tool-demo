/**
 * Beregning for modul C6 – udlejede aktiver (upstream).
 */
import type { C6Input, ModuleInput, ModuleResult } from '../../types'
import { factors } from '../factors'
import { withE1Insights } from '../e1Insights'

type SanitisedC6 = Required<{
  [Key in keyof C6Input]: number
}>

export function runC6(input: ModuleInput): ModuleResult {
  const warnings: string[] = []

  const raw = (input.C6 ?? {}) as C6Input
  const sanitised = normaliseInput(raw, warnings)

  const occupancyRatio = sanitised.occupancySharePercent * factors.c6.percentToRatio
  const sharedServiceRatio = sanitised.sharedServicesAllocationPercent * factors.c6.percentToRatio
  const effectiveAllocationRatio = Math.max(0, Math.min(1, occupancyRatio - sharedServiceRatio))

  const electricityDemandKwh = sanitised.leasedFloorAreaSqm * sanitised.electricityIntensityKwhPerSqm
  const heatDemandKwh = sanitised.leasedFloorAreaSqm * sanitised.heatIntensityKwhPerSqm

  const allocatedElectricityKwh = electricityDemandKwh * effectiveAllocationRatio
  const allocatedHeatKwh = heatDemandKwh * effectiveAllocationRatio

  const electricityMitigation = Math.min(
    1,
    Math.max(
      0,
      sanitised.renewableElectricitySharePercent *
        factors.c6.percentToRatio *
        factors.c6.electricityRenewableMitigationRate
    )
  )
  const heatMitigation = Math.min(
    1,
    Math.max(
      0,
      sanitised.renewableHeatSharePercent * factors.c6.percentToRatio * factors.c6.heatRenewableMitigationRate
    )
  )

  const electricityEmissionsKg =
    allocatedElectricityKwh * sanitised.electricityEmissionFactorKgPerKwh * (1 - electricityMitigation)
  const heatEmissionsKg = allocatedHeatKwh * sanitised.heatEmissionFactorKgPerKwh * (1 - heatMitigation)

  const totalEmissionsKg = electricityEmissionsKg + heatEmissionsKg
  const emissionsTonnes = totalEmissionsKg * factors.c6.kgToTonnes
  const value = Number(emissionsTonnes.toFixed(factors.c6.resultPrecision))

  const assumptions = [
    `Energiforbruget fordeles efter ${sanitised.occupancySharePercent}% lejerandel fratrukket ${sanitised.sharedServicesAllocationPercent}% fælles services.`,
    `Dokumenteret vedvarende el reducerer emissioner med faktor ${factors.c6.electricityRenewableMitigationRate} af den angivne andel.`,
    `Dokumenteret vedvarende varme reducerer emissioner med faktor ${factors.c6.heatRenewableMitigationRate} af den angivne andel.`,
    `Konvertering fra kg til ton: ${factors.c6.kgToTonnes}`
  ]

  return withE1Insights('C6', input, {
    value,
    unit: factors.c6.unit,
    assumptions,
    trace: [
      `leasedFloorAreaSqm=${sanitised.leasedFloorAreaSqm}`,
      `electricityIntensityKwhPerSqm=${sanitised.electricityIntensityKwhPerSqm}`,
      `heatIntensityKwhPerSqm=${sanitised.heatIntensityKwhPerSqm}`,
      `occupancySharePercent=${sanitised.occupancySharePercent}`,
      `sharedServicesAllocationPercent=${sanitised.sharedServicesAllocationPercent}`,
      `electricityEmissionFactorKgPerKwh=${sanitised.electricityEmissionFactorKgPerKwh}`,
      `heatEmissionFactorKgPerKwh=${sanitised.heatEmissionFactorKgPerKwh}`,
      `renewableElectricitySharePercent=${sanitised.renewableElectricitySharePercent}`,
      `renewableHeatSharePercent=${sanitised.renewableHeatSharePercent}`,
      `electricityDemandKwh=${electricityDemandKwh}`,
      `heatDemandKwh=${heatDemandKwh}`,
      `effectiveAllocationRatio=${effectiveAllocationRatio.toFixed(6)}`,
      `allocatedElectricityKwh=${allocatedElectricityKwh}`,
      `allocatedHeatKwh=${allocatedHeatKwh}`,
      `electricityMitigation=${electricityMitigation.toFixed(6)}`,
      `heatMitigation=${heatMitigation.toFixed(6)}`,
      `electricityEmissionsKg=${electricityEmissionsKg}`,
      `heatEmissionsKg=${heatEmissionsKg}`,
      `totalEmissionsKg=${totalEmissionsKg}`,
      `emissionsTonnes=${emissionsTonnes}`
    ],
    warnings
  })
}

function normaliseInput(raw: C6Input, warnings: string[]): SanitisedC6 {
  const hasAnyValue =
    raw != null && Object.values(raw).some((value) => value != null && !Number.isNaN(Number(value)))

  const leasedFloorAreaSqm = toNonNegativeNumber(
    raw?.leasedFloorAreaSqm,
    'leasedFloorAreaSqm',
    warnings,
    hasAnyValue
  )
  const electricityIntensity = toNonNegativeNumber(
    raw?.electricityIntensityKwhPerSqm,
    'electricityIntensityKwhPerSqm',
    warnings,
    hasAnyValue
  )
  const heatIntensity = toNonNegativeNumber(
    raw?.heatIntensityKwhPerSqm,
    'heatIntensityKwhPerSqm',
    warnings,
    hasAnyValue
  )

  const occupancyShare = toOccupancyPercent(
    raw?.occupancySharePercent,
    'occupancySharePercent',
    warnings,
    hasAnyValue
  )
  const sharedServices = toLimitedPercent(
    raw?.sharedServicesAllocationPercent,
    'sharedServicesAllocationPercent',
    factors.c6.maximumSharedServicesPercent,
    warnings,
    hasAnyValue
  )
  const electricityFactor = toNonNegativeNumber(
    raw?.electricityEmissionFactorKgPerKwh,
    'electricityEmissionFactorKgPerKwh',
    warnings,
    hasAnyValue
  )
  const heatFactor = toNonNegativeNumber(
    raw?.heatEmissionFactorKgPerKwh,
    'heatEmissionFactorKgPerKwh',
    warnings,
    hasAnyValue
  )
  const renewableElectricityShare = toLimitedPercent(
    raw?.renewableElectricitySharePercent,
    'renewableElectricitySharePercent',
    factors.c6.maximumRenewableSharePercent,
    warnings,
    hasAnyValue
  )
  const renewableHeatShare = toLimitedPercent(
    raw?.renewableHeatSharePercent,
    'renewableHeatSharePercent',
    factors.c6.maximumRenewableSharePercent,
    warnings,
    hasAnyValue
  )

  return {
    leasedFloorAreaSqm,
    electricityIntensityKwhPerSqm: electricityIntensity,
    heatIntensityKwhPerSqm: heatIntensity,
    occupancySharePercent: occupancyShare,
    sharedServicesAllocationPercent: sharedServices,
    electricityEmissionFactorKgPerKwh: electricityFactor,
    heatEmissionFactorKgPerKwh: heatFactor,
    renewableElectricitySharePercent: renewableElectricityShare,
    renewableHeatSharePercent: renewableHeatShare
  }
}

function toNonNegativeNumber(
  value: number | null | undefined,
  field: keyof C6Input,
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

function toOccupancyPercent(
  value: number | null | undefined,
  field: keyof C6Input,
  warnings: string[],
  emitMissingWarning: boolean
): number {
  if (value == null || Number.isNaN(value)) {
    if (emitMissingWarning) {
      warnings.push(`Feltet ${String(field)} mangler. Antager 100% lejerandel.`)
    }
    return factors.c6.maximumOccupancyPercent
  }

  if (value < 0) {
    warnings.push(`Feltet ${String(field)} kan ikke være negativt. 0% anvendes i stedet.`)
    return 0
  }

  if (value > factors.c6.maximumOccupancyPercent) {
    warnings.push(`Feltet ${String(field)} er begrænset til ${factors.c6.maximumOccupancyPercent}%.`)
    return factors.c6.maximumOccupancyPercent
  }

  return value
}

function toLimitedPercent(
  value: number | null | undefined,
  field: keyof C6Input,
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
