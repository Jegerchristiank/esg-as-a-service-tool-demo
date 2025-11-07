/**
 * Beregning for modul A3 – procesemissioner.
 */
import type { A3Input, ModuleInput, ModuleResult } from '../../types'
import { factors } from '../factors'
import { withE1Insights } from '../e1Insights'

export const a3ProcessConfigurations = {
  cementClinker: {
    label: 'Cementklinker (CaCO₃ → CaO)',
    defaultEmissionFactorKgPerTon: 510
  },
  limeCalcination: {
    label: 'Kalkudbrænding (CaCO₃ → CaO)',
    defaultEmissionFactorKgPerTon: 785
  },
  ammoniaProduction: {
    label: 'Ammoniakproduktion (Haber-Bosch)',
    defaultEmissionFactorKgPerTon: 1800
  },
  aluminiumSmelting: {
    label: 'Primær aluminiumselektrolyse',
    defaultEmissionFactorKgPerTon: 1600
  }
} as const

export type A3ProcessType = keyof typeof a3ProcessConfigurations

export type A3ProcessLine = {
  processType: A3ProcessType
  outputQuantityTon: number | null | undefined
  emissionFactorKgPerTon: number | null | undefined
  documentationQualityPercent: number | null | undefined
}

type SanitisedProcessLine = {
  processType: A3ProcessType
  outputQuantityTon: number
  emissionFactorKgPerTon: number
  documentationQualityPercent: number
}

export const a3ProcessOptions = (Object.entries(a3ProcessConfigurations) as Array<
  [A3ProcessType, (typeof a3ProcessConfigurations)[A3ProcessType]]
>).map(([value, config]) => ({
  value,
  label: config.label,
  defaultEmissionFactorKgPerTon: config.defaultEmissionFactorKgPerTon
}))

export function runA3(input: ModuleInput): ModuleResult {
  const warnings: string[] = []
  const assumptions: string[] = [
    'Emissioner beregnes pr. proces som outputmængde × emissionsfaktor.',
    `Konvertering fra kg til ton: ${factors.a3.kgToTonnes}.`
  ]

  const raw = (input.A3 ?? {}) as A3Input
  const rawLines = Array.isArray(raw?.processLines) ? raw.processLines : []

  const hasAnyValue = rawLines.some((entry) =>
    entry != null &&
    (entry.outputQuantityTon != null ||
      entry.emissionFactorKgPerTon != null ||
      entry.documentationQualityPercent != null)
  )

  const sanitised = rawLines
    .map((entry, index) => normaliseEntry(entry, index, warnings, assumptions, hasAnyValue))
    .filter((entry): entry is SanitisedProcessLine => entry !== null)

  if (sanitised.length === 0 && hasAnyValue) {
    warnings.push('Ingen gyldige proceslinjer kunne beregnes. Kontrollér indtastningerne.')
  }

  let totalEmissionsKg = 0
  const trace: string[] = []

  for (const [index, line] of sanitised.entries()) {
    const lineEmissionsKg = line.outputQuantityTon * line.emissionFactorKgPerTon
    const lineEmissionsTonnes = lineEmissionsKg * factors.a3.kgToTonnes

    totalEmissionsKg += lineEmissionsKg

    trace.push(
      `entry[${index}].processType=${line.processType}`,
      `entry[${index}].outputQuantityTon=${line.outputQuantityTon}`,
      `entry[${index}].emissionFactorKgPerTon=${line.emissionFactorKgPerTon}`,
      `entry[${index}].documentationQualityPercent=${line.documentationQualityPercent}`,
      `entry[${index}].emissionsKg=${lineEmissionsKg}`,
      `entry[${index}].emissionsTonnes=${lineEmissionsTonnes}`
    )

    if (line.documentationQualityPercent < factors.a3.lowDocumentationQualityThresholdPercent) {
      warnings.push(
        `Dokumentationskvalitet for ${a3ProcessConfigurations[line.processType].label} er kun ${line.documentationQualityPercent}%.` +
          ' Overvej at forbedre dokumentation eller anvende konservative antagelser.'
      )
    }
  }

  const totalEmissionsTonnes = totalEmissionsKg * factors.a3.kgToTonnes
  const value = Number(totalEmissionsTonnes.toFixed(factors.a3.resultPrecision))

  trace.push(`totalEmissionsKg=${totalEmissionsKg}`)
  trace.push(`totalEmissionsTonnes=${totalEmissionsTonnes}`)

  return withE1Insights('A3', input, {
    value,
    unit: factors.a3.unit,
    assumptions,
    trace,
    warnings
  })
}

function normaliseEntry(
  entry: A3ProcessLine | undefined,
  index: number,
  warnings: string[],
  assumptions: string[],
  emitMissingWarning: boolean
): SanitisedProcessLine | null {
  if (entry == null) {
    return null
  }

  const hasInput =
    entry.outputQuantityTon != null ||
    entry.emissionFactorKgPerTon != null ||
    entry.documentationQualityPercent != null

  if (!hasInput) {
    return null
  }

  const processType = isProcessType(entry.processType) ? entry.processType : 'cementClinker'
  if (!isProcessType(entry.processType)) {
    warnings.push(
      `Ukendt proces på linje ${index + 1}. Standard (${a3ProcessConfigurations[processType].label}) anvendes.`
    )
  }

  const outputQuantityTon = toNonNegativeNumber(entry.outputQuantityTon, index, warnings, emitMissingWarning)
  const emissionFactorKgPerTon = toEmissionFactor(
    entry.emissionFactorKgPerTon,
    processType,
    index,
    warnings,
    assumptions,
    emitMissingWarning
  )
  const documentationQualityPercent = toQualityPercent(
    entry.documentationQualityPercent,
    index,
    warnings,
    emitMissingWarning
  )

  const hasValues = outputQuantityTon > 0 && emissionFactorKgPerTon > 0
  if (!hasValues) {
    return null
  }

  return {
    processType,
    outputQuantityTon,
    emissionFactorKgPerTon,
    documentationQualityPercent
  }
}

function toNonNegativeNumber(
  value: number | null | undefined,
  index: number,
  warnings: string[],
  emitMissingWarning: boolean
): number {
  if (value == null || Number.isNaN(value)) {
    if (emitMissingWarning) {
      warnings.push(`Outputmængde mangler på linje ${index + 1} og behandles som 0.`)
    }
    return 0
  }
  if (value < 0) {
    warnings.push(`Outputmængden på linje ${index + 1} kan ikke være negativ. 0 anvendes i stedet.`)
    return 0
  }
  return value
}

function toEmissionFactor(
  value: number | null | undefined,
  processType: A3ProcessType,
  index: number,
  warnings: string[],
  assumptions: string[],
  emitMissingWarning: boolean
): number {
  if (value == null || Number.isNaN(value)) {
    const fallback = a3ProcessConfigurations[processType].defaultEmissionFactorKgPerTon
    const assumptionMessage = `Standardfaktor for ${a3ProcessConfigurations[processType].label}: ${fallback} kg CO2e/ton.`
    if (!assumptions.includes(assumptionMessage)) {
      assumptions.push(assumptionMessage)
    }
    if (emitMissingWarning) {
      warnings.push(
        `Emissionsfaktor mangler på linje ${index + 1}. Standardfaktor for ${a3ProcessConfigurations[processType].label} anvendes.`
      )
    }
    return fallback
  }
  if (value < 0) {
    warnings.push(`Emissionsfaktoren på linje ${index + 1} kan ikke være negativ. 0 anvendes i stedet.`)
    return 0
  }
  return value
}

function toQualityPercent(
  value: number | null | undefined,
  index: number,
  warnings: string[],
  emitMissingWarning: boolean
): number {
  if (value == null || Number.isNaN(value)) {
    if (emitMissingWarning) {
      warnings.push(
        `Dokumentationskvalitet mangler på linje ${index + 1}. Antager ${factors.a3.defaultDocumentationQualityPercent}%.`
      )
    }
    return factors.a3.defaultDocumentationQualityPercent
  }
  if (value < 0) {
    warnings.push(`Dokumentationskvalitet på linje ${index + 1} kan ikke være negativ. 0% anvendes i stedet.`)
    return 0
  }
  if (value > 100) {
    warnings.push(`Dokumentationskvalitet på linje ${index + 1} er begrænset til 100%.`)
    return 100
  }
  return value
}

function isProcessType(value: unknown): value is A3ProcessType {
  return typeof value === 'string' && value in a3ProcessConfigurations
}
