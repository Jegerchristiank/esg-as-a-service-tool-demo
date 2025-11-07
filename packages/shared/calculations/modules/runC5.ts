/**
 * Beregning for modul C5 – affald fra drift (upstream).
 */
import type { C5Input, ModuleInput, ModuleResult } from '../../types'
import { factors } from '../factors'
import { withE1Insights } from '../e1Insights'

type SanitisedC5 = Required<{
  [Key in keyof C5Input]: number
}>

export function runC5(input: ModuleInput): ModuleResult {
  const warnings: string[] = []

  const raw = (input.C5 ?? {}) as C5Input
  const sanitised = normaliseInput(raw, warnings)

  const landfillEmissionsKg = sanitised.landfillWasteTonnes * sanitised.landfillEmissionFactorKgPerTonne
  const incinerationEmissionsKg =
    sanitised.incinerationWasteTonnes * sanitised.incinerationEmissionFactorKgPerTonne
  const compostingEmissionsKg = sanitised.compostingWasteTonnes * sanitised.compostingEmissionFactorKgPerTonne
  const recyclingEmissionsKg = sanitised.recyclingWasteTonnes * sanitised.recyclingEmissionFactorKgPerTonne

  const grossEmissionsKg =
    landfillEmissionsKg + incinerationEmissionsKg + compostingEmissionsKg + recyclingEmissionsKg

  const recyclingMitigationRatio =
    sanitised.recyclingRecoveryPercent * factors.c5.percentToRatio * factors.c5.recyclingMitigationRate
  const reuseMitigationRatio =
    sanitised.reuseSharePercent * factors.c5.percentToRatio * factors.c5.reuseMitigationRate

  const mitigationMultiplier = Math.max(
    0,
    1 - Math.min(recyclingMitigationRatio + reuseMitigationRatio, 1)
  )

  const adjustedEmissionsKg = grossEmissionsKg * mitigationMultiplier
  const emissionsTonnes = adjustedEmissionsKg * factors.c5.kgToTonnes
  const value = Number(emissionsTonnes.toFixed(factors.c5.resultPrecision))

  const assumptions = [
    `Genanvendelses-kreditter reducerer emissioner med faktor ${factors.c5.recyclingMitigationRate} af dokumenteret genvinding.`,
    `Genbrug og donation reducerer emissioner med faktor ${factors.c5.reuseMitigationRate} af andelen der afledes.`,
    `Konvertering fra kg til ton: ${factors.c5.kgToTonnes}`
  ]

  return withE1Insights('C5', input, {
    value,
    unit: factors.c5.unit,
    assumptions,
    trace: [
      `landfillWasteTonnes=${sanitised.landfillWasteTonnes}`,
      `landfillEmissionFactorKgPerTonne=${sanitised.landfillEmissionFactorKgPerTonne}`,
      `incinerationWasteTonnes=${sanitised.incinerationWasteTonnes}`,
      `incinerationEmissionFactorKgPerTonne=${sanitised.incinerationEmissionFactorKgPerTonne}`,
      `compostingWasteTonnes=${sanitised.compostingWasteTonnes}`,
      `compostingEmissionFactorKgPerTonne=${sanitised.compostingEmissionFactorKgPerTonne}`,
      `recyclingWasteTonnes=${sanitised.recyclingWasteTonnes}`,
      `recyclingEmissionFactorKgPerTonne=${sanitised.recyclingEmissionFactorKgPerTonne}`,
      `recyclingRecoveryPercent=${sanitised.recyclingRecoveryPercent}`,
      `reuseSharePercent=${sanitised.reuseSharePercent}`,
      `landfillEmissionsKg=${landfillEmissionsKg}`,
      `incinerationEmissionsKg=${incinerationEmissionsKg}`,
      `compostingEmissionsKg=${compostingEmissionsKg}`,
      `recyclingEmissionsKg=${recyclingEmissionsKg}`,
      `grossEmissionsKg=${grossEmissionsKg}`,
      `recyclingMitigationRatio=${recyclingMitigationRatio.toFixed(6)}`,
      `reuseMitigationRatio=${reuseMitigationRatio.toFixed(6)}`,
      `mitigationMultiplier=${mitigationMultiplier.toFixed(6)}`,
      `adjustedEmissionsKg=${adjustedEmissionsKg}`,
      `emissionsTonnes=${emissionsTonnes}`
    ],
    warnings
  })
}

function normaliseInput(raw: C5Input, warnings: string[]): SanitisedC5 {
  const hasAnyValue =
    raw != null && Object.values(raw).some((value) => value != null && !Number.isNaN(Number(value)))

  const landfillWasteTonnes = toNonNegativeNumber(raw?.landfillWasteTonnes, 'landfillWasteTonnes', warnings, hasAnyValue)
  const landfillFactor = toNonNegativeNumber(
    raw?.landfillEmissionFactorKgPerTonne,
    'landfillEmissionFactorKgPerTonne',
    warnings,
    hasAnyValue
  )

  const incinerationWasteTonnes = toNonNegativeNumber(
    raw?.incinerationWasteTonnes,
    'incinerationWasteTonnes',
    warnings,
    hasAnyValue
  )
  const incinerationFactor = toNonNegativeNumber(
    raw?.incinerationEmissionFactorKgPerTonne,
    'incinerationEmissionFactorKgPerTonne',
    warnings,
    hasAnyValue
  )

  const compostingWasteTonnes = toNonNegativeNumber(
    raw?.compostingWasteTonnes,
    'compostingWasteTonnes',
    warnings,
    hasAnyValue
  )
  const compostingFactor = toNonNegativeNumber(
    raw?.compostingEmissionFactorKgPerTonne,
    'compostingEmissionFactorKgPerTonne',
    warnings,
    hasAnyValue
  )

  const recyclingWasteTonnes = toNonNegativeNumber(
    raw?.recyclingWasteTonnes,
    'recyclingWasteTonnes',
    warnings,
    hasAnyValue
  )
  const recyclingFactor = toNonNegativeNumber(
    raw?.recyclingEmissionFactorKgPerTonne,
    'recyclingEmissionFactorKgPerTonne',
    warnings,
    hasAnyValue
  )

  const recyclingRecoveryPercent = toPercent(
    raw?.recyclingRecoveryPercent,
    'recyclingRecoveryPercent',
    factors.c5.maximumRecyclingRecoveryPercent,
    warnings,
    hasAnyValue
  )

  const reuseSharePercent = toPercent(
    raw?.reuseSharePercent,
    'reuseSharePercent',
    factors.c5.maximumReuseSharePercent,
    warnings,
    hasAnyValue
  )

  return {
    landfillWasteTonnes,
    landfillEmissionFactorKgPerTonne: landfillFactor,
    incinerationWasteTonnes,
    incinerationEmissionFactorKgPerTonne: incinerationFactor,
    compostingWasteTonnes,
    compostingEmissionFactorKgPerTonne: compostingFactor,
    recyclingWasteTonnes,
    recyclingEmissionFactorKgPerTonne: recyclingFactor,
    recyclingRecoveryPercent,
    reuseSharePercent
  }
}

function toNonNegativeNumber(
  value: number | null | undefined,
  field: keyof C5Input,
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
  field: keyof C5Input,
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
