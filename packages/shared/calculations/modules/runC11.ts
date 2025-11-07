/**
 * Beregning for modul C11 – downstream leasede aktiver.
 */
import type { C11Input, ModuleInput, ModuleResult } from '../../types'
import { factors } from '../factors'
import { withE1Insights } from '../e1Insights'

const c11Factors = factors.c11

export const c11EnergyConfigurations = {
  electricity: {
    label: 'Elektricitet',
    defaultIntensityKwhPerSqm: c11Factors.defaultElectricityIntensityKwhPerSqm,
    defaultEmissionFactorKgPerKwh: c11Factors.defaultElectricityEmissionFactorKgPerKwh
  },
  heat: {
    label: 'Varme',
    defaultIntensityKwhPerSqm: c11Factors.defaultHeatIntensityKwhPerSqm,
    defaultEmissionFactorKgPerKwh: c11Factors.defaultHeatEmissionFactorKgPerKwh
  }
} as const

export type C11EnergyType = keyof typeof c11EnergyConfigurations

type C11Line = NonNullable<C11Input['leasedAssetLines']>[number]

type SanitisedLine = {
  energyType: C11EnergyType
  floorAreaSqm: number
  energyConsumptionKwh: number
  emissionFactorKgPerKwh: number
  documentationQualityPercent: number
}

export function runC11(input: ModuleInput): ModuleResult {
  const warnings: string[] = []
  const assumptions: string[] = [
    `Manglende energiforbrug omregnes fra areal med ${c11EnergyConfigurations.electricity.defaultIntensityKwhPerSqm} kWh/m² for el og ${
      c11EnergyConfigurations.heat.defaultIntensityKwhPerSqm
    } kWh/m² for varme.`,
    `Hvis emissionsfaktor mangler, anvendes standardværdier: el ${c11EnergyConfigurations.electricity.defaultEmissionFactorKgPerKwh} kg CO2e/kWh og varme ${
      c11EnergyConfigurations.heat.defaultEmissionFactorKgPerKwh
    } kg CO2e/kWh.`,
    `Konvertering fra kg til ton: ${c11Factors.kgToTonnes}.`
  ]

  const raw = (input.C11 ?? {}) as C11Input
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
    const config = c11EnergyConfigurations[line.energyType]
    const hasReportedEnergy = line.energyConsumptionKwh > 0
    const derivedEnergyKwh = line.floorAreaSqm * config.defaultIntensityKwhPerSqm
    const energyKwh = hasReportedEnergy ? line.energyConsumptionKwh : derivedEnergyKwh
    const energyBasis = hasReportedEnergy ? 'reported' : 'areaDerived'

    const entryEmissionsKg = energyKwh * line.emissionFactorKgPerKwh
    const entryEmissionsTonnes = entryEmissionsKg * c11Factors.kgToTonnes

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

    if (line.documentationQualityPercent < c11Factors.lowDocumentationQualityThresholdPercent) {
      warnings.push(
        `Dokumentationskvalitet for ${config.label} på linje ${index + 1} er kun ${line.documentationQualityPercent}%. Overvej at forbedre grundlaget.`
      )
    }
  })

  const totalEmissionsTonnes = totalEmissionsKg * c11Factors.kgToTonnes
  const value = Number(totalEmissionsTonnes.toFixed(c11Factors.resultPrecision))

  trace.push(`totalEmissionsKg=${totalEmissionsKg}`)
  trace.push(`totalEmissionsTonnes=${totalEmissionsTonnes}`)

  return withE1Insights('C11', input, {
    value,
    unit: c11Factors.unit,
    assumptions,
    trace,
    warnings
  })
}

function normaliseLine(
  line: C11Line | undefined,
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
    warnings.push(`Ukendt energitype på linje ${index + 1}. Standard (${c11EnergyConfigurations[energyType].label}) anvendes.`)
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
  field: keyof C11Line,
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
  energyType: C11EnergyType,
  warnings: string[],
  emitMissingWarning: boolean
): number {
  if (value == null || Number.isNaN(value)) {
    if (emitMissingWarning) {
      warnings.push(
        `Emissionsfaktor mangler på linje ${index + 1}. Standardfaktor for ${c11EnergyConfigurations[energyType].label} anvendes.`
      )
    }
    return c11EnergyConfigurations[energyType].defaultEmissionFactorKgPerKwh
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
        `Dokumentationskvalitet mangler på linje ${index + 1}. Standard (${c11Factors.defaultDocumentationQualityPercent}%) anvendes.`
      )
    }
    return c11Factors.defaultDocumentationQualityPercent
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

function isEnergyType(value: unknown): value is C11EnergyType {
  return value === 'electricity' || value === 'heat'
}

