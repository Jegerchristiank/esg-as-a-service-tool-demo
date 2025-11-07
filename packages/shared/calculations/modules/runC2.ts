/**
 * Beregning for modul C2 – forretningsrejser.
 */
import type { C2Input, ModuleInput, ModuleResult } from '../../types'
import { factors } from '../factors'
import { withE1Insights } from '../e1Insights'

type SanitisedC2 = Required<{
  [Key in keyof C2Input]: number
}>

export function runC2(input: ModuleInput): ModuleResult {
  const warnings: string[] = []

  const raw = (input.C2 ?? {}) as C2Input
  const sanitised = normaliseInput(raw, warnings)

  const travelEmissionsKg =
    sanitised.airTravelDistanceKm * sanitised.airEmissionFactorKgPerKm +
    sanitised.railTravelDistanceKm * sanitised.railEmissionFactorKgPerKm +
    sanitised.roadTravelDistanceKm * sanitised.roadEmissionFactorKgPerKm

  const virtualReductionRatio = Math.min(
    1,
    Math.max(0, sanitised.virtualMeetingSharePercent * factors.c2.percentToRatio)
  )

  const adjustedTravelEmissionsKg = travelEmissionsKg * (1 - virtualReductionRatio)
  const accommodationEmissionsKg =
    sanitised.hotelNights * sanitised.hotelEmissionFactorKgPerNight

  const totalEmissionsKg = adjustedTravelEmissionsKg + accommodationEmissionsKg
  const emissionsTonnes = totalEmissionsKg * factors.c2.kgToTonnes
  const value = Number(emissionsTonnes.toFixed(factors.c2.resultPrecision))

  const assumptions = [
    `Virtuelle møder reducerer rejseemissioner med ${sanitised.virtualMeetingSharePercent}% af transportandelen.`,
    `Hotelovernatninger anvender en emissionsfaktor på ${sanitised.hotelEmissionFactorKgPerNight} kg CO2e pr. nat.`,
    `Konvertering fra kg til ton: ${factors.c2.kgToTonnes}`
  ]

  return withE1Insights('C2', input, {
    value,
    unit: factors.c2.unit,
    assumptions,
    trace: [
      `airTravelDistanceKm=${sanitised.airTravelDistanceKm}`,
      `airEmissionFactorKgPerKm=${sanitised.airEmissionFactorKgPerKm}`,
      `railTravelDistanceKm=${sanitised.railTravelDistanceKm}`,
      `railEmissionFactorKgPerKm=${sanitised.railEmissionFactorKgPerKm}`,
      `roadTravelDistanceKm=${sanitised.roadTravelDistanceKm}`,
      `roadEmissionFactorKgPerKm=${sanitised.roadEmissionFactorKgPerKm}`,
      `hotelNights=${sanitised.hotelNights}`,
      `hotelEmissionFactorKgPerNight=${sanitised.hotelEmissionFactorKgPerNight}`,
      `virtualMeetingSharePercent=${sanitised.virtualMeetingSharePercent}`,
      `travelEmissionsKg=${travelEmissionsKg}`,
      `virtualReductionRatio=${virtualReductionRatio}`,
      `adjustedTravelEmissionsKg=${adjustedTravelEmissionsKg}`,
      `accommodationEmissionsKg=${accommodationEmissionsKg}`,
      `totalEmissionsKg=${totalEmissionsKg}`,
      `emissionsTonnes=${emissionsTonnes}`
    ],
    warnings
  })
}

function normaliseInput(raw: C2Input, warnings: string[]): SanitisedC2 {
  const hasAnyValue =
    raw != null &&
    Object.values(raw).some((value) => value != null && !Number.isNaN(Number(value)))

  const airDistance = toNonNegativeNumber(
    raw?.airTravelDistanceKm,
    'airTravelDistanceKm',
    warnings,
    hasAnyValue
  )
  const airFactor = toNonNegativeNumber(
    raw?.airEmissionFactorKgPerKm,
    'airEmissionFactorKgPerKm',
    warnings,
    hasAnyValue
  )
  const railDistance = toNonNegativeNumber(
    raw?.railTravelDistanceKm,
    'railTravelDistanceKm',
    warnings,
    hasAnyValue
  )
  const railFactor = toNonNegativeNumber(
    raw?.railEmissionFactorKgPerKm,
    'railEmissionFactorKgPerKm',
    warnings,
    hasAnyValue
  )
  const roadDistance = toNonNegativeNumber(
    raw?.roadTravelDistanceKm,
    'roadTravelDistanceKm',
    warnings,
    hasAnyValue
  )
  const roadFactor = toNonNegativeNumber(
    raw?.roadEmissionFactorKgPerKm,
    'roadEmissionFactorKgPerKm',
    warnings,
    hasAnyValue
  )
  const hotelNights = toNonNegativeNumber(
    raw?.hotelNights,
    'hotelNights',
    warnings,
    hasAnyValue
  )
  const hotelFactor = toNonNegativeNumberWithDefault(
    raw?.hotelEmissionFactorKgPerNight,
    'hotelEmissionFactorKgPerNight',
    warnings,
    hasAnyValue,
    factors.c2.defaultHotelEmissionFactorKgPerNight
  )
  const virtualShare = toSharePercent(
    raw?.virtualMeetingSharePercent,
    'virtualMeetingSharePercent',
    warnings,
    hasAnyValue
  )

  return {
    airTravelDistanceKm: airDistance,
    airEmissionFactorKgPerKm: airFactor,
    railTravelDistanceKm: railDistance,
    railEmissionFactorKgPerKm: railFactor,
    roadTravelDistanceKm: roadDistance,
    roadEmissionFactorKgPerKm: roadFactor,
    hotelNights,
    hotelEmissionFactorKgPerNight: hotelFactor,
    virtualMeetingSharePercent: virtualShare
  }
}

function toNonNegativeNumber(
  value: number | null | undefined,
  field: keyof C2Input,
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

function toNonNegativeNumberWithDefault(
  value: number | null | undefined,
  field: keyof C2Input,
  warnings: string[],
  emitMissingWarning: boolean,
  defaultValue: number
): number {
  if (value == null || Number.isNaN(value)) {
    if (emitMissingWarning) {
      warnings.push(
        `Feltet ${String(field)} mangler. Standardfaktoren ${defaultValue} anvendes.`
      )
    }
    return defaultValue
  }
  if (value < 0) {
    warnings.push(`Feltet ${String(field)} kan ikke være negativt. 0 anvendes i stedet.`)
    return 0
  }
  return value
}

function toSharePercent(
  value: number | null | undefined,
  field: keyof C2Input,
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
