/**
 * Beregning for modul C8 – udlejede aktiver (downstream).
 */
import type { C8Input, ModuleInput, ModuleResult } from '../../types'
import { factors } from '../factors'
import { withE1Insights } from '../e1Insights'

type SanitisedC8 = Required<{
  [Key in keyof C8Input]: number
}>

export function runC8(input: ModuleInput): ModuleResult {
  const warnings: string[] = []

  const raw = (input.C8 ?? {}) as C8Input
  const sanitised = normaliseInput(raw, warnings)

  const occupancyRatio = sanitised.occupancySharePercent * factors.c8.percentToRatio
  const landlordEnergyRatio = sanitised.landlordEnergySharePercent * factors.c8.percentToRatio

  const efficiencyMitigation = Math.min(
    1,
    Math.max(
      0,
      sanitised.energyEfficiencyImprovementPercent *
        factors.c8.percentToRatio *
        factors.c8.efficiencyMitigationRate
    )
  )

  const adjustedElectricityIntensity =
    sanitised.electricityIntensityKwhPerSqm * (1 - efficiencyMitigation)
  const adjustedHeatIntensity = sanitised.heatIntensityKwhPerSqm * (1 - efficiencyMitigation)

  const electricityDemandKwh =
    sanitised.leasedFloorAreaSqm *
    adjustedElectricityIntensity *
    occupancyRatio *
    landlordEnergyRatio

  const heatDemandKwh =
    sanitised.leasedFloorAreaSqm * adjustedHeatIntensity * occupancyRatio * landlordEnergyRatio

  const renewableElectricityMitigation = Math.min(
    1,
    Math.max(
      0,
      sanitised.renewableElectricitySharePercent *
        factors.c8.percentToRatio *
        factors.c8.renewableMitigationRate
    )
  )

  const renewableHeatMitigation = Math.min(
    1,
    Math.max(
      0,
      sanitised.renewableHeatSharePercent *
        factors.c8.percentToRatio *
        factors.c8.renewableMitigationRate
    )
  )

  const electricityEmissionsKg =
    electricityDemandKwh *
    sanitised.electricityEmissionFactorKgPerKwh *
    (1 - renewableElectricityMitigation)
  const heatEmissionsKg =
    heatDemandKwh * sanitised.heatEmissionFactorKgPerKwh * (1 - renewableHeatMitigation)

  const totalEmissionsKg = electricityEmissionsKg + heatEmissionsKg
  const emissionsTonnes = totalEmissionsKg * factors.c8.kgToTonnes
  const value = Number(emissionsTonnes.toFixed(factors.c8.resultPrecision))

  const assumptions = [
    `Energiforbruget beregnes ud fra ${sanitised.leasedFloorAreaSqm} m², ${sanitised.occupancySharePercent}% udnyttelse og ${sanitised.landlordEnergySharePercent}% udlejeransvar.`,
    `Energieffektivisering reducerer intensiteter med faktor ${factors.c8.efficiencyMitigationRate} af den angivne forbedringsprocent.`,
    `Dokumenteret vedvarende energi reducerer emissioner med faktor ${factors.c8.renewableMitigationRate} af de angivne andele.`,
    `Konvertering fra kg til ton: ${factors.c8.kgToTonnes}`
  ]

  return withE1Insights('C8', input, {
    value,
    unit: factors.c8.unit,
    assumptions,
    trace: [
      `leasedFloorAreaSqm=${sanitised.leasedFloorAreaSqm}`,
      `electricityIntensityKwhPerSqm=${sanitised.electricityIntensityKwhPerSqm}`,
      `heatIntensityKwhPerSqm=${sanitised.heatIntensityKwhPerSqm}`,
      `occupancySharePercent=${sanitised.occupancySharePercent}`,
      `landlordEnergySharePercent=${sanitised.landlordEnergySharePercent}`,
      `energyEfficiencyImprovementPercent=${sanitised.energyEfficiencyImprovementPercent}`,
      `electricityEmissionFactorKgPerKwh=${sanitised.electricityEmissionFactorKgPerKwh}`,
      `heatEmissionFactorKgPerKwh=${sanitised.heatEmissionFactorKgPerKwh}`,
      `renewableElectricitySharePercent=${sanitised.renewableElectricitySharePercent}`,
      `renewableHeatSharePercent=${sanitised.renewableHeatSharePercent}`,
      `occupancyRatio=${occupancyRatio.toFixed(6)}`,
      `landlordEnergyRatio=${landlordEnergyRatio.toFixed(6)}`,
      `efficiencyMitigation=${efficiencyMitigation.toFixed(6)}`,
      `adjustedElectricityIntensity=${adjustedElectricityIntensity}`,
      `adjustedHeatIntensity=${adjustedHeatIntensity}`,
      `electricityDemandKwh=${electricityDemandKwh}`,
      `heatDemandKwh=${heatDemandKwh}`,
      `renewableElectricityMitigation=${renewableElectricityMitigation.toFixed(6)}`,
      `renewableHeatMitigation=${renewableHeatMitigation.toFixed(6)}`,
      `electricityEmissionsKg=${electricityEmissionsKg}`,
      `heatEmissionsKg=${heatEmissionsKg}`,
      `totalEmissionsKg=${totalEmissionsKg}`,
      `emissionsTonnes=${emissionsTonnes}`
    ],
    warnings
  })
}

function normaliseInput(raw: C8Input, warnings: string[]): SanitisedC8 {
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

  const occupancyShare = toPercentWithDefault(
    raw?.occupancySharePercent,
    'occupancySharePercent',
    factors.c8.defaultOccupancyPercent,
    warnings,
    hasAnyValue
  )
  const landlordEnergyShare = toPercentWithDefault(
    raw?.landlordEnergySharePercent,
    'landlordEnergySharePercent',
    factors.c8.defaultLandlordSharePercent,
    warnings,
    hasAnyValue
  )

  const efficiencyImprovement = toLimitedPercent(
    raw?.energyEfficiencyImprovementPercent,
    'energyEfficiencyImprovementPercent',
    factors.c8.maximumEfficiencyPercent,
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
    factors.c8.maximumRenewableSharePercent,
    warnings,
    hasAnyValue
  )
  const renewableHeatShare = toLimitedPercent(
    raw?.renewableHeatSharePercent,
    'renewableHeatSharePercent',
    factors.c8.maximumRenewableSharePercent,
    warnings,
    hasAnyValue
  )

  return {
    leasedFloorAreaSqm,
    electricityIntensityKwhPerSqm: electricityIntensity,
    heatIntensityKwhPerSqm: heatIntensity,
    occupancySharePercent: occupancyShare,
    landlordEnergySharePercent: landlordEnergyShare,
    energyEfficiencyImprovementPercent: efficiencyImprovement,
    electricityEmissionFactorKgPerKwh: electricityFactor,
    heatEmissionFactorKgPerKwh: heatFactor,
    renewableElectricitySharePercent: renewableElectricityShare,
    renewableHeatSharePercent: renewableHeatShare
  }
}

function toNonNegativeNumber(
  value: number | null | undefined,
  field: keyof C8Input,
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

function toPercentWithDefault(
  value: number | null | undefined,
  field: keyof C8Input,
  defaultValue: number,
  warnings: string[],
  emitMissingWarning: boolean
): number {
  if (value == null || Number.isNaN(value)) {
    if (emitMissingWarning) {
      warnings.push(`Feltet ${String(field)} mangler. Antager ${defaultValue}%.`)
    }
    return defaultValue
  }

  if (value < 0) {
    warnings.push(`Feltet ${String(field)} kan ikke være negativt. 0% anvendes i stedet.`)
    return 0
  }

  if (value > 100) {
    warnings.push(`Feltet ${String(field)} er begrænset til 100%.`)
    return 100
  }

  return value
}

function toLimitedPercent(
  value: number | null | undefined,
  field: keyof C8Input,
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
