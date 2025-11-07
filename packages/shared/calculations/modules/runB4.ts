/**
 * Beregning for modul B4 der vurderer nettoemissioner fra dampforbrug.
 */
import type { B4Input, ModuleInput, ModuleResult } from '../../types'
import { factors } from '../factors'
import { withE1Insights } from '../e1Insights'

type SanitisedB4 = Required<{
  [Key in keyof B4Input]: number
}>

export function runB4(input: ModuleInput): ModuleResult {
  const warnings: string[] = []
  const assumptions = [
    `Fradrag for genindvundet damp: ${Math.round(factors.b4.recoveryCreditRate * 100)}%`,
    `Reduktion for vedvarende damp: ${Math.round(factors.b4.renewableMitigationRate * 100)}%`,
    `Konvertering fra kg til ton: ${factors.b4.kgToTonnes}`
  ]

  const raw = (input['B4'] ?? {}) as B4Input
  const sanitised = normaliseInput(raw, warnings)

  const adjustedSteamConsumptionKwh = Math.max(
    0,
    sanitised.steamConsumptionKwh - sanitised.recoveredSteamKwh * factors.b4.recoveryCreditRate
  )

  if (sanitised.recoveredSteamKwh > sanitised.steamConsumptionKwh) {
    warnings.push('Genindvundet damp overstiger det registrerede forbrug. Nettoforbruget sættes til 0.')
  }

  const grossEmissionsKg = adjustedSteamConsumptionKwh * sanitised.emissionFactorKgPerKwh
  const renewableReductionKg =
    grossEmissionsKg *
    sanitised.renewableSharePercent *
    factors.b4.percentToRatio *
    factors.b4.renewableMitigationRate
  const netEmissionsKg = Math.max(0, grossEmissionsKg - renewableReductionKg)
  const netEmissionsTonnes = netEmissionsKg * factors.b4.kgToTonnes

  const value = Number(netEmissionsTonnes.toFixed(factors.b4.resultPrecision))

  return withE1Insights('B4', input, {
    value,
    unit: factors.b4.unit,
    assumptions,
    trace: [
      `steamConsumptionKwh=${sanitised.steamConsumptionKwh}`,
      `recoveredSteamKwh=${sanitised.recoveredSteamKwh}`,
      `netSteamConsumptionKwh=${adjustedSteamConsumptionKwh}`,
      `emissionFactorKgPerKwh=${sanitised.emissionFactorKgPerKwh}`,
      `renewableSharePercent=${sanitised.renewableSharePercent}`,
      `grossEmissionsKg=${grossEmissionsKg}`,
      `renewableReductionKg=${renewableReductionKg}`,
      `netEmissionsTonnes=${netEmissionsTonnes}`
    ],
    warnings
  })
}

function normaliseInput(raw: B4Input, warnings: string[]): SanitisedB4 {
  const hasAnyValue =
    raw != null &&
    Object.values(raw).some((value) => value != null && !Number.isNaN(Number(value)))

  const safeSteamConsumption = toNonNegativeNumber(
    raw?.steamConsumptionKwh,
    'steamConsumptionKwh',
    warnings,
    hasAnyValue
  )
  const safeRecoveredSteam = toNonNegativeNumber(
    raw?.recoveredSteamKwh,
    'recoveredSteamKwh',
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
    steamConsumptionKwh: safeSteamConsumption,
    recoveredSteamKwh: safeRecoveredSteam,
    emissionFactorKgPerKwh: safeEmissionFactor,
    renewableSharePercent: safeShare
  }
}

function toNonNegativeNumber(
  value: number | null | undefined,
  field: keyof B4Input,
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
  if (value > factors.b4.maximumRenewableSharePercent) {
    warnings.push(
      `Andelen af vedvarende energi er begrænset til ${factors.b4.maximumRenewableSharePercent}%.`
    )
    return factors.b4.maximumRenewableSharePercent
  }
  return value
}
