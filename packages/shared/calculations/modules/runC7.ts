/**
 * Beregning for modul C7 – downstream transport og distribution.
 */
import type { C7Input, ModuleInput, ModuleResult } from '../../types'
import { factors } from '../factors'
import { withE1Insights } from '../e1Insights'

type SanitisedC7 = Required<{
  [Key in keyof C7Input]: number
}>

export function runC7(input: ModuleInput): ModuleResult {
  const warnings: string[] = []

  const raw = (input.C7 ?? {}) as C7Input
  const sanitised = normaliseInput(raw, warnings)

  const roadEmissionsKg = sanitised.roadTonnesKm * sanitised.roadEmissionFactorKgPerTonneKm
  const railEmissionsKg = sanitised.railTonnesKm * sanitised.railEmissionFactorKgPerTonneKm
  const seaEmissionsKg = sanitised.seaTonnesKm * sanitised.seaEmissionFactorKgPerTonneKm
  const airEmissionsKg = sanitised.airTonnesKm * sanitised.airEmissionFactorKgPerTonneKm

  const roadMitigationRatio = Math.min(
    1,
    Math.max(
      0,
      sanitised.lowEmissionVehicleSharePercent *
        factors.c7.percentToRatio *
        factors.c7.lowEmissionVehicleMitigationRate
    )
  )

  const adjustedRoadEmissionsKg = roadEmissionsKg * (1 - roadMitigationRatio)

  const warehousingEmissionsKg =
    sanitised.warehousingEnergyKwh * sanitised.warehousingEmissionFactorKgPerKwh

  const renewableWarehousingMitigationRatio = Math.min(
    1,
    Math.max(
      0,
      sanitised.renewableWarehousingSharePercent *
        factors.c7.percentToRatio *
        factors.c7.renewableWarehousingMitigationRate
    )
  )

  const adjustedWarehousingEmissionsKg = warehousingEmissionsKg * (1 - renewableWarehousingMitigationRatio)

  const totalEmissionsKg =
    adjustedRoadEmissionsKg +
    railEmissionsKg +
    seaEmissionsKg +
    airEmissionsKg +
    adjustedWarehousingEmissionsKg

  const emissionsTonnes = totalEmissionsKg * factors.c7.kgToTonnes
  const value = Number(emissionsTonnes.toFixed(factors.c7.resultPrecision))

  const assumptions = [
    `Lavemissionskøretøjer reducerer vejtransporten med faktor ${factors.c7.lowEmissionVehicleMitigationRate} af den dokumenterede andel.`,
    `Vedvarende energi i lagre reducerer energiforbruget med faktor ${factors.c7.renewableWarehousingMitigationRate} af den dokumenterede andel.`,
    `Konvertering fra kg til ton: ${factors.c7.kgToTonnes}`
  ]

  return withE1Insights('C7', input, {
    value,
    unit: factors.c7.unit,
    assumptions,
    trace: [
      `roadTonnesKm=${sanitised.roadTonnesKm}`,
      `roadEmissionFactorKgPerTonneKm=${sanitised.roadEmissionFactorKgPerTonneKm}`,
      `railTonnesKm=${sanitised.railTonnesKm}`,
      `railEmissionFactorKgPerTonneKm=${sanitised.railEmissionFactorKgPerTonneKm}`,
      `seaTonnesKm=${sanitised.seaTonnesKm}`,
      `seaEmissionFactorKgPerTonneKm=${sanitised.seaEmissionFactorKgPerTonneKm}`,
      `airTonnesKm=${sanitised.airTonnesKm}`,
      `airEmissionFactorKgPerTonneKm=${sanitised.airEmissionFactorKgPerTonneKm}`,
      `warehousingEnergyKwh=${sanitised.warehousingEnergyKwh}`,
      `warehousingEmissionFactorKgPerKwh=${sanitised.warehousingEmissionFactorKgPerKwh}`,
      `lowEmissionVehicleSharePercent=${sanitised.lowEmissionVehicleSharePercent}`,
      `renewableWarehousingSharePercent=${sanitised.renewableWarehousingSharePercent}`,
      `roadMitigationRatio=${roadMitigationRatio.toFixed(6)}`,
      `adjustedRoadEmissionsKg=${adjustedRoadEmissionsKg}`,
      `railEmissionsKg=${railEmissionsKg}`,
      `seaEmissionsKg=${seaEmissionsKg}`,
      `airEmissionsKg=${airEmissionsKg}`,
      `warehousingEmissionsKg=${warehousingEmissionsKg}`,
      `renewableWarehousingMitigationRatio=${renewableWarehousingMitigationRatio.toFixed(6)}`,
      `adjustedWarehousingEmissionsKg=${adjustedWarehousingEmissionsKg}`,
      `totalEmissionsKg=${totalEmissionsKg}`,
      `emissionsTonnes=${emissionsTonnes}`
    ],
    warnings
  })
}

function normaliseInput(raw: C7Input, warnings: string[]): SanitisedC7 {
  const hasAnyValue =
    raw != null && Object.values(raw).some((value) => value != null && !Number.isNaN(Number(value)))

  const roadTonnesKm = toNonNegativeNumber(raw?.roadTonnesKm, 'roadTonnesKm', warnings, hasAnyValue)
  const roadFactor = toNonNegativeNumber(
    raw?.roadEmissionFactorKgPerTonneKm,
    'roadEmissionFactorKgPerTonneKm',
    warnings,
    hasAnyValue
  )

  const railTonnesKm = toNonNegativeNumber(raw?.railTonnesKm, 'railTonnesKm', warnings, hasAnyValue)
  const railFactor = toNonNegativeNumber(
    raw?.railEmissionFactorKgPerTonneKm,
    'railEmissionFactorKgPerTonneKm',
    warnings,
    hasAnyValue
  )

  const seaTonnesKm = toNonNegativeNumber(raw?.seaTonnesKm, 'seaTonnesKm', warnings, hasAnyValue)
  const seaFactor = toNonNegativeNumber(
    raw?.seaEmissionFactorKgPerTonneKm,
    'seaEmissionFactorKgPerTonneKm',
    warnings,
    hasAnyValue
  )

  const airTonnesKm = toNonNegativeNumber(raw?.airTonnesKm, 'airTonnesKm', warnings, hasAnyValue)
  const airFactor = toNonNegativeNumber(
    raw?.airEmissionFactorKgPerTonneKm,
    'airEmissionFactorKgPerTonneKm',
    warnings,
    hasAnyValue
  )

  const warehousingEnergyKwh = toNonNegativeNumber(
    raw?.warehousingEnergyKwh,
    'warehousingEnergyKwh',
    warnings,
    hasAnyValue
  )
  const warehousingFactor = toNonNegativeNumber(
    raw?.warehousingEmissionFactorKgPerKwh,
    'warehousingEmissionFactorKgPerKwh',
    warnings,
    hasAnyValue
  )

  const lowEmissionVehicleSharePercent = toPercent(
    raw?.lowEmissionVehicleSharePercent,
    'lowEmissionVehicleSharePercent',
    warnings,
    hasAnyValue
  )
  const renewableWarehousingSharePercent = toPercent(
    raw?.renewableWarehousingSharePercent,
    'renewableWarehousingSharePercent',
    warnings,
    hasAnyValue
  )

  return {
    roadTonnesKm,
    roadEmissionFactorKgPerTonneKm: roadFactor,
    railTonnesKm,
    railEmissionFactorKgPerTonneKm: railFactor,
    seaTonnesKm,
    seaEmissionFactorKgPerTonneKm: seaFactor,
    airTonnesKm,
    airEmissionFactorKgPerTonneKm: airFactor,
    warehousingEnergyKwh,
    warehousingEmissionFactorKgPerKwh: warehousingFactor,
    lowEmissionVehicleSharePercent,
    renewableWarehousingSharePercent
  }
}

function toNonNegativeNumber(
  value: number | null | undefined,
  field: keyof C7Input,
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
  field: keyof C7Input,
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

  if (value > 100) {
    warnings.push(`Feltet ${String(field)} er begrænset til 100%.`)
    return 100
  }

  return value
}
