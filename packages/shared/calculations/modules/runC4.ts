/**
 * Beregning for modul C4 – upstream transport og distribution.
 */
import type { C4Input, ModuleInput, ModuleResult } from '../../types'
import { factors } from '../factors'
import { withE1Insights } from '../e1Insights'

type SanitisedC4 = Required<{
  [Key in keyof C4Input]: number
}>

export function runC4(input: ModuleInput): ModuleResult {
  const warnings: string[] = []

  const raw = (input.C4 ?? {}) as C4Input
  const sanitised = normaliseInput(raw, warnings)

  const roadEmissionsKg = sanitised.roadTonnesKm * sanitised.roadEmissionFactorKgPerTonneKm
  const railEmissionsKg = sanitised.railTonnesKm * sanitised.railEmissionFactorKgPerTonneKm
  const seaEmissionsKg = sanitised.seaTonnesKm * sanitised.seaEmissionFactorKgPerTonneKm
  const airEmissionsKg = sanitised.airTonnesKm * sanitised.airEmissionFactorKgPerTonneKm

  const totalModalEmissionsKg = roadEmissionsKg + railEmissionsKg + seaEmissionsKg + airEmissionsKg

  const consolidationMitigationRatio =
    sanitised.consolidationEfficiencyPercent * factors.c4.percentToRatio * factors.c4.consolidationMitigationRate
  const lowCarbonMitigationRatio =
    sanitised.lowCarbonSharePercent * factors.c4.percentToRatio * factors.c4.lowCarbonMitigationRate

  const mitigationMultiplier = Math.max(
    0,
    1 - Math.min(consolidationMitigationRatio + lowCarbonMitigationRatio, 1)
  )

  const adjustedEmissionsKg = totalModalEmissionsKg * mitigationMultiplier
  const emissionsTonnes = adjustedEmissionsKg * factors.c4.kgToTonnes
  const value = Number(emissionsTonnes.toFixed(factors.c4.resultPrecision))

  const assumptions = [
    `Reduktion fra konsolidering anvender faktor ${factors.c4.consolidationMitigationRate} af effektiviseringsprocenten.`,
    `Lavemissionsløsninger reducerer med faktor ${factors.c4.lowCarbonMitigationRate} af den dokumenterede andel.`,
    `Konvertering fra kg til ton: ${factors.c4.kgToTonnes}`
  ]

  return withE1Insights('C4', input, {
    value,
    unit: factors.c4.unit,
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
      `consolidationEfficiencyPercent=${sanitised.consolidationEfficiencyPercent}`,
      `lowCarbonSharePercent=${sanitised.lowCarbonSharePercent}`,
      `totalModalEmissionsKg=${totalModalEmissionsKg}`,
      `consolidationMitigationRatio=${consolidationMitigationRatio.toFixed(6)}`,
      `lowCarbonMitigationRatio=${lowCarbonMitigationRatio.toFixed(6)}`,
      `mitigationMultiplier=${mitigationMultiplier.toFixed(6)}`,
      `adjustedEmissionsKg=${adjustedEmissionsKg}`,
      `emissionsTonnes=${emissionsTonnes}`
    ],
    warnings
  })
}

function normaliseInput(raw: C4Input, warnings: string[]): SanitisedC4 {
  const hasAnyValue =
    raw != null &&
    Object.values(raw).some((value) => value != null && !Number.isNaN(Number(value)))

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

  const consolidationEfficiencyPercent = toPercent(
    raw?.consolidationEfficiencyPercent,
    'consolidationEfficiencyPercent',
    factors.c4.maximumConsolidationPercent,
    warnings,
    hasAnyValue
  )

  const lowCarbonSharePercent = toPercent(
    raw?.lowCarbonSharePercent,
    'lowCarbonSharePercent',
    factors.c4.maximumLowCarbonSharePercent,
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
    consolidationEfficiencyPercent,
    lowCarbonSharePercent
  }
}

function toNonNegativeNumber(
  value: number | null | undefined,
  field: keyof C4Input,
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
  field: keyof C4Input,
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
