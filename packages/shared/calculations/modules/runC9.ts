/**
 * Beregning for modul C9 – forarbejdning af solgte produkter.
 */
import type { C9Input, ModuleInput, ModuleResult } from '../../types'
import { factors } from '../factors'
import { withE1Insights } from '../e1Insights'

type SanitisedC9 = Required<{
  [Key in keyof C9Input]: number
}>

export function runC9(input: ModuleInput): ModuleResult {
  const warnings: string[] = []

  const raw = (input.C9 ?? {}) as C9Input
  const sanitised = normaliseInput(raw, warnings)

  const baseEnergyKwh =
    sanitised.processedOutputTonnes * sanitised.processingEnergyIntensityKwhPerTonne

  const efficiencyMitigationRatio = Math.min(
    1,
    Math.max(
      0,
      sanitised.processEfficiencyImprovementPercent *
        factors.c9.percentToRatio *
        factors.c9.efficiencyMitigationRate
    )
  )

  const adjustedEnergyIntensity =
    sanitised.processingEnergyIntensityKwhPerTonne * (1 - efficiencyMitigationRatio)

  const energyAfterEfficiency = sanitised.processedOutputTonnes * adjustedEnergyIntensity

  const secondaryMaterialMitigationRatio = Math.min(
    1,
    Math.max(
      0,
      sanitised.secondaryMaterialSharePercent *
        factors.c9.percentToRatio *
        factors.c9.secondaryMaterialMitigationRate
    )
  )

  const energyAfterSecondary = energyAfterEfficiency * (1 - secondaryMaterialMitigationRatio)

  const renewableMitigationRatio = Math.min(
    1,
    Math.max(
      0,
      sanitised.renewableEnergySharePercent *
        factors.c9.percentToRatio *
        factors.c9.renewableMitigationRate
    )
  )

  const emissionsKg =
    energyAfterSecondary *
    sanitised.processingEmissionFactorKgPerKwh *
    (1 - renewableMitigationRatio)

  const emissionsTonnes = emissionsKg * factors.c9.kgToTonnes
  const value = Number(emissionsTonnes.toFixed(factors.c9.resultPrecision))

  const assumptions = [
    `Energiintensiteten reduceres med faktor ${factors.c9.efficiencyMitigationRate} af den dokumenterede proceseffektivisering.`,
    `Sekundært materiale reducerer energibehovet med faktor ${factors.c9.secondaryMaterialMitigationRate} af den angivne andel.`,
    `Vedvarende energi reducerer emissionerne med faktor ${factors.c9.renewableMitigationRate} af den dokumenterede andel.`,
    `Konvertering fra kg til ton: ${factors.c9.kgToTonnes}`
  ]

  return withE1Insights('C9', input, {
    value,
    unit: factors.c9.unit,
    assumptions,
    trace: [
      `processedOutputTonnes=${sanitised.processedOutputTonnes}`,
      `processingEnergyIntensityKwhPerTonne=${sanitised.processingEnergyIntensityKwhPerTonne}`,
      `processingEmissionFactorKgPerKwh=${sanitised.processingEmissionFactorKgPerKwh}`,
      `processEfficiencyImprovementPercent=${sanitised.processEfficiencyImprovementPercent}`,
      `secondaryMaterialSharePercent=${sanitised.secondaryMaterialSharePercent}`,
      `renewableEnergySharePercent=${sanitised.renewableEnergySharePercent}`,
      `baseEnergyKwh=${baseEnergyKwh}`,
      `efficiencyMitigationRatio=${efficiencyMitigationRatio.toFixed(6)}`,
      `adjustedEnergyIntensity=${adjustedEnergyIntensity}`,
      `energyAfterEfficiency=${energyAfterEfficiency}`,
      `secondaryMaterialMitigationRatio=${secondaryMaterialMitigationRatio.toFixed(6)}`,
      `energyAfterSecondary=${energyAfterSecondary}`,
      `renewableMitigationRatio=${renewableMitigationRatio.toFixed(6)}`,
      `emissionsKg=${emissionsKg}`,
      `emissionsTonnes=${emissionsTonnes}`
    ],
    warnings
  })
}

function normaliseInput(raw: C9Input, warnings: string[]): SanitisedC9 {
  const hasAnyValue =
    raw != null && Object.values(raw).some((value) => value != null && !Number.isNaN(Number(value)))

  const processedOutputTonnes = toNonNegativeNumber(
    raw?.processedOutputTonnes,
    'processedOutputTonnes',
    warnings,
    hasAnyValue
  )

  const processingEnergyIntensity = toNonNegativeNumber(
    raw?.processingEnergyIntensityKwhPerTonne,
    'processingEnergyIntensityKwhPerTonne',
    warnings,
    hasAnyValue
  )

  const processingEmissionFactor = toNonNegativeNumber(
    raw?.processingEmissionFactorKgPerKwh,
    'processingEmissionFactorKgPerKwh',
    warnings,
    hasAnyValue
  )

  const processEfficiencyImprovement = toLimitedPercent(
    raw?.processEfficiencyImprovementPercent,
    'processEfficiencyImprovementPercent',
    factors.c9.maximumEfficiencyPercent,
    warnings,
    hasAnyValue
  )

  const secondaryMaterialShare = toLimitedPercent(
    raw?.secondaryMaterialSharePercent,
    'secondaryMaterialSharePercent',
    factors.c9.maximumSecondaryMaterialPercent,
    warnings,
    hasAnyValue
  )

  const renewableEnergyShare = toLimitedPercent(
    raw?.renewableEnergySharePercent,
    'renewableEnergySharePercent',
    factors.c9.maximumRenewableSharePercent,
    warnings,
    hasAnyValue
  )

  return {
    processedOutputTonnes,
    processingEnergyIntensityKwhPerTonne: processingEnergyIntensity,
    processingEmissionFactorKgPerKwh: processingEmissionFactor,
    processEfficiencyImprovementPercent: processEfficiencyImprovement,
    secondaryMaterialSharePercent: secondaryMaterialShare,
    renewableEnergySharePercent: renewableEnergyShare
  }
}

function toNonNegativeNumber(
  value: number | null | undefined,
  field: keyof C9Input,
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

function toLimitedPercent(
  value: number | null | undefined,
  field: keyof C9Input,
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
