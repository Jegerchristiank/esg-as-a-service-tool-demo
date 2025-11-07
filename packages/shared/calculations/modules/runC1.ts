/**
 * Beregning for modul C1 – medarbejderpendling.
 */
import type { C1Input, ModuleInput, ModuleResult } from '../../types'
import { factors } from '../factors'
import { withE1Insights } from '../e1Insights'

type SanitisedC1 = Required<{
  [Key in keyof C1Input]: number
}>

export function runC1(input: ModuleInput): ModuleResult {
  const warnings: string[] = []

  const raw = (input.C1 ?? {}) as C1Input
  const sanitised = normaliseInput(raw, warnings)

  const remoteRatio = Math.min(
    1,
    Math.max(0, sanitised.remoteWorkSharePercent * factors.c1.percentToRatio)
  )
  const commuteDaysPerEmployee = sanitised.commutingDaysPerWeek * sanitised.weeksPerYear
  const effectiveCommuteDays = commuteDaysPerEmployee * (1 - remoteRatio)
  const totalCommuteDays = sanitised.employeesCovered * effectiveCommuteDays
  const totalDistanceKm = totalCommuteDays * sanitised.averageCommuteDistanceKm
  const emissionsKg = totalDistanceKm * sanitised.emissionFactorKgPerKm
  const emissionsTonnes = emissionsKg * factors.c1.kgToTonnes
  const value = Number(emissionsTonnes.toFixed(factors.c1.resultPrecision))

  const assumptions = [
    `Pendling beregnes ud fra ${sanitised.weeksPerYear} arbejdsuger om året.`,
    `Konvertering fra kg til ton: ${factors.c1.kgToTonnes}`
  ]

  return withE1Insights('C1', input, {
    value,
    unit: factors.c1.unit,
    assumptions,
    trace: [
      `employeesCovered=${sanitised.employeesCovered}`,
      `averageCommuteDistanceKm=${sanitised.averageCommuteDistanceKm}`,
      `commutingDaysPerWeek=${sanitised.commutingDaysPerWeek}`,
      `weeksPerYear=${sanitised.weeksPerYear}`,
      `remoteWorkSharePercent=${sanitised.remoteWorkSharePercent}`,
      `emissionFactorKgPerKm=${sanitised.emissionFactorKgPerKm}`,
      `totalCommuteDays=${totalCommuteDays}`,
      `totalDistanceKm=${totalDistanceKm}`,
      `emissionsKg=${emissionsKg}`,
      `emissionsTonnes=${emissionsTonnes}`
    ],
    warnings
  })
}

function normaliseInput(raw: C1Input, warnings: string[]): SanitisedC1 {
  const hasAnyValue =
    raw != null &&
    Object.values(raw).some((value) => value != null && !Number.isNaN(Number(value)))

  const employees = toNonNegativeNumber(
    raw?.employeesCovered,
    'employeesCovered',
    warnings,
    hasAnyValue
  )
  const distance = toNonNegativeNumber(
    raw?.averageCommuteDistanceKm,
    'averageCommuteDistanceKm',
    warnings,
    hasAnyValue
  )
  const commutingDays = toBoundedNumber(
    raw?.commutingDaysPerWeek,
    'commutingDaysPerWeek',
    factors.c1.maximumDaysPerWeek,
    warnings,
    hasAnyValue
  )
  const weeksPerYear = toWeeksPerYear(raw?.weeksPerYear, warnings, hasAnyValue)
  const remoteShare = toSharePercent(
    raw?.remoteWorkSharePercent,
    'remoteWorkSharePercent',
    warnings,
    hasAnyValue
  )
  const emissionFactor = toNonNegativeNumber(
    raw?.emissionFactorKgPerKm,
    'emissionFactorKgPerKm',
    warnings,
    hasAnyValue
  )

  return {
    employeesCovered: employees,
    averageCommuteDistanceKm: distance,
    commutingDaysPerWeek: commutingDays,
    weeksPerYear,
    remoteWorkSharePercent: remoteShare,
    emissionFactorKgPerKm: emissionFactor
  }
}

function toNonNegativeNumber(
  value: number | null | undefined,
  field: keyof C1Input,
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

function toBoundedNumber(
  value: number | null | undefined,
  field: keyof C1Input,
  maximum: number,
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
  if (value > maximum) {
    warnings.push(`Feltet ${String(field)} er begrænset til ${maximum}.`)
    return maximum
  }
  return value
}

function toWeeksPerYear(
  value: number | null | undefined,
  warnings: string[],
  emitMissingWarning: boolean
): number {
  if (value == null || Number.isNaN(value)) {
    if (emitMissingWarning) {
      warnings.push(
        `Antager ${factors.c1.defaultWeeksPerYear} arbejdsuger om året, da feltet weeksPerYear mangler.`
      )
    }
    return factors.c1.defaultWeeksPerYear
  }
  if (value < 0) {
    warnings.push('Feltet weeksPerYear kan ikke være negativt. 0 anvendes i stedet.')
    return 0
  }
  if (value > factors.c1.maximumWeeksPerYear) {
    warnings.push(
      `Feltet weeksPerYear er begrænset til ${factors.c1.maximumWeeksPerYear} uger.`
    )
    return factors.c1.maximumWeeksPerYear
  }
  return value
}

function toSharePercent(
  value: number | null | undefined,
  field: keyof C1Input,
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
