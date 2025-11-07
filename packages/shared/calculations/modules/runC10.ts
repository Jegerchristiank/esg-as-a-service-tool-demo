/**
 * Beregning for modul C10 – upstream leasede aktiver.
 */
import type { C10Input, ModuleInput, ModuleResult } from '../../types'
import { factors } from '../factors'
import { withE1Insights } from '../e1Insights'

const c10Factors = factors.c10

export const c10EnergyConfigurations = {
  electricity: {
    label: 'Elektricitet',
    defaultIntensityKwhPerSqm: c10Factors.defaultElectricityIntensityKwhPerSqm,
    defaultEmissionFactorKgPerKwh: c10Factors.defaultElectricityEmissionFactorKgPerKwh
  },
  heat: {
    label: 'Varme',
    defaultIntensityKwhPerSqm: c10Factors.defaultHeatIntensityKwhPerSqm,
    defaultEmissionFactorKgPerKwh: c10Factors.defaultHeatEmissionFactorKgPerKwh
  }
} as const

export type C10EnergyType = keyof typeof c10EnergyConfigurations

type C10Line = NonNullable<C10Input['leasedAssetLines']>[number]

type SanitisedLine = {
  energyType: C10EnergyType
  floorAreaSqm: number
  energyConsumptionKwh: number
  emissionFactorKgPerKwh: number
  documentationQualityPercent: number
}

export function runC10(input: ModuleInput): ModuleResult {
  const warnings: string[] = []
  const assumptions: string[] = [
    `Manglende energiforbrug omregnes fra areal med ${c10EnergyConfigurations.electricity.defaultIntensityKwhPerSqm} kWh/m² for el og ${c10EnergyConfigurations.heat.defaultIntensityKwhPerSqm} kWh/m² for varme.`,
    `Hvis emissionsfaktor mangler, anvendes standardværdier: el ${c10EnergyConfigurations.electricity.defaultEmissionFactorKgPerKwh} kg CO2e/kWh og varme ${c10EnergyConfigurations.heat.defaultEmissionFactorKgPerKwh} kg CO2e/kWh.`,
    `Konvertering fra kg til ton: ${c10Factors.kgToTonnes}.`
  ]

  const raw = (input.C10 ?? {}) as C10Input
  const rawLines = Array.isArray(raw?.leasedAssetLines) ? raw.leasedAssetLines : []

  const hasAnyValue = rawLines.some((line) =>
    line != null &&
    (line.floorAreaSqm != null ||
      line.energyConsumptionKwh != null ||
      line.emissionFactorKgPerKwh != null ||
      line.documentationQualityPercent != null)
  )

  const sanitised = rawLines
    .map((line, index) => normaliseLine(line, index, warnings, hasAnyValue))
    .filter((line): line is SanitisedLine => line !== null)

  if (sanitised.length === 0 && hasAnyValue) {
    warnings.push('Ingen gyldige leasede aktiver kunne beregnes. Kontrollér indtastningerne.')
  }

  let totalEmissionsKg = 0
  const trace: string[] = []

  sanitised.forEach((line, index) => {
    const config = c10EnergyConfigurations[line.energyType]
    const hasReportedEnergy = line.energyConsumptionKwh > 0
    const derivedEnergyKwh = line.floorAreaSqm * config.defaultIntensityKwhPerSqm
    const energyKwh = hasReportedEnergy ? line.energyConsumptionKwh : derivedEnergyKwh
    const energyBasis = hasReportedEnergy ? 'reported' : 'areaDerived'

    const entryEmissionsKg = energyKwh * line.emissionFactorKgPerKwh
    const entryEmissionsTonnes = entryEmissionsKg * c10Factors.kgToTonnes

    totalEmissionsKg += entryEmissionsKg

    trace.push(
      `line[${index}].energyType=${line.energyType}`,
      `line[${index}].floorAreaSqm=${line.floorAreaSqm}`,
      `line[${index}].energyConsumptionKwh=${line.energyConsumptionKwh}`,
      `line[${index}].emissionFactorKgPerKwh=${line.emissionFactorKgPerKwh}`,
      `line[${index}].documentationQualityPercent=${line.documentationQualityPercent}`,
      `line[${index}].energyBasis=${energyBasis}`,
      `line[${index}].derivedEnergyKwh=${derivedEnergyKwh}`,
      `line[${index}].effectiveEnergyKwh=${energyKwh}`,
      `line[${index}].emissionsKg=${entryEmissionsKg}`,
      `line[${index}].emissionsTonnes=${entryEmissionsTonnes}`
    )

    if (line.documentationQualityPercent < c10Factors.lowDocumentationQualityThresholdPercent) {
      warnings.push(
        `Dokumentationskvalitet for ${config.label} på linje ${index + 1} er kun ${line.documentationQualityPercent}%. Overvej at forbedre grundlaget.`
      )
    }
  })

  const totalEmissionsTonnes = totalEmissionsKg * c10Factors.kgToTonnes
  const value = Number(totalEmissionsTonnes.toFixed(c10Factors.resultPrecision))

  trace.push(`totalEmissionsKg=${totalEmissionsKg}`)
  trace.push(`totalEmissionsTonnes=${totalEmissionsTonnes}`)

  return withE1Insights('C10', input, {
    value,
    unit: c10Factors.unit,
    assumptions,
    trace,
    warnings
  })
}

function normaliseLine(
  line: C10Line | undefined,
  index: number,
  warnings: string[],
  emitMissingWarning: boolean
): SanitisedLine | null {
  if (line == null) {
    return null
  }

  const hasInput =
    line.floorAreaSqm != null ||
    line.energyConsumptionKwh != null ||
    line.emissionFactorKgPerKwh != null ||
    line.documentationQualityPercent != null

  if (!hasInput) {
    return null
  }

  const energyType = isEnergyType(line.energyType) ? line.energyType : 'electricity'
  if (!isEnergyType(line.energyType)) {
    warnings.push(`Ukendt energitype på linje ${index + 1}. Standard (${c10EnergyConfigurations[energyType].label}) anvendes.`)
  }

  const floorAreaSqm = toNonNegativeNumber(line.floorAreaSqm, index, 'floorAreaSqm', warnings, emitMissingWarning)
  const energyConsumptionKwh = toNonNegativeNumber(
    line.energyConsumptionKwh,
    index,
    'energyConsumptionKwh',
    warnings,
    emitMissingWarning
  )
  const emissionFactorKgPerKwh = toEmissionFactor(
    line.emissionFactorKgPerKwh,
    index,
    energyType,
    warnings,
    emitMissingWarning
  )
  const documentationQualityPercent = toDocumentationQuality(
    line.documentationQualityPercent,
    index,
    warnings,
    emitMissingWarning
  )

  if (floorAreaSqm === 0 && energyConsumptionKwh === 0) {
    warnings.push(`Linje ${index + 1} mangler både areal og energiforbrug og udelades fra beregningen.`)
    return null
  }

  return {
    energyType,
    floorAreaSqm,
    energyConsumptionKwh,
    emissionFactorKgPerKwh,
    documentationQualityPercent
  }
}

function toNonNegativeNumber(
  value: number | null | undefined,
  index: number,
  field: keyof C10Line,
  warnings: string[],
  emitMissingWarning: boolean
): number {
  if (value == null || Number.isNaN(value)) {
    if (emitMissingWarning) {
      warnings.push(`Feltet ${String(field)} mangler på linje ${index + 1} og behandles som 0.`)
    }
    return 0
  }

  if (value < 0) {
    warnings.push(`Feltet ${String(field)} kan ikke være negativt på linje ${index + 1}. 0 anvendes i stedet.`)
    return 0
  }

  return value
}

function toEmissionFactor(
  value: number | null | undefined,
  index: number,
  energyType: C10EnergyType,
  warnings: string[],
  emitMissingWarning: boolean
): number {
  if (value == null || Number.isNaN(value)) {
    if (emitMissingWarning) {
      warnings.push(
        `Emissionsfaktor mangler på linje ${index + 1}. Standardfaktor for ${c10EnergyConfigurations[energyType].label} anvendes.`
      )
    }
    return c10EnergyConfigurations[energyType].defaultEmissionFactorKgPerKwh
  }

  if (value < 0) {
    warnings.push(`Emissionsfaktoren kan ikke være negativ på linje ${index + 1}. 0 anvendes i stedet.`)
    return 0
  }

  return value
}

function toDocumentationQuality(
  value: number | null | undefined,
  index: number,
  warnings: string[],
  emitMissingWarning: boolean
): number {
  if (value == null || Number.isNaN(value)) {
    if (emitMissingWarning) {
      warnings.push(
        `Dokumentationskvalitet mangler på linje ${index + 1}. Standard (${c10Factors.defaultDocumentationQualityPercent}%) anvendes.`
      )
    }
    return c10Factors.defaultDocumentationQualityPercent
  }

  if (value < 0) {
    warnings.push(`Dokumentationskvalitet kan ikke være negativ på linje ${index + 1}. 0% anvendes i stedet.`)
    return 0
  }

  if (value > 100) {
    warnings.push(`Dokumentationskvalitet er begrænset til 100% på linje ${index + 1}.`)
    return 100
  }

  return value
}

function isEnergyType(value: unknown): value is C10EnergyType {
  return value === 'electricity' || value === 'heat'
}
