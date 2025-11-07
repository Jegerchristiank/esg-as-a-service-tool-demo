/**
 * Beregning for modul A1 – stationære forbrændingskilder.
 */
import type { A1Input, ModuleInput, ModuleResult } from '../../types'
import { factors } from '../factors'
import { withE1Insights } from '../e1Insights'

export const a1FuelConfigurations = {
  naturgas: {
    label: 'Naturgas',
    defaultUnit: 'Nm³',
    defaultEmissionFactorKgPerUnit: 2.05
  },
  diesel: {
    label: 'Diesel',
    defaultUnit: 'liter',
    defaultEmissionFactorKgPerUnit: 2.68
  },
  fyringsolie: {
    label: 'Fyringsolie',
    defaultUnit: 'liter',
    defaultEmissionFactorKgPerUnit: 2.96
  },
  biogas: {
    label: 'Biogas',
    defaultUnit: 'Nm³',
    defaultEmissionFactorKgPerUnit: 0.1
  }
} as const

export type A1FuelType = keyof typeof a1FuelConfigurations

export type A1FuelConsumption = {
  fuelType: A1FuelType
  unit: A1Unit
  quantity: number | null | undefined
  emissionFactorKgPerUnit: number | null | undefined
  documentationQualityPercent: number | null | undefined
}

export type A1Unit = 'liter' | 'Nm³' | 'kg'

type SanitisedFuelConsumption = {
  fuelType: A1FuelType
  unit: A1Unit
  quantity: number
  emissionFactorKgPerUnit: number
  documentationQualityPercent: number
}

export const a1FuelOptions = (Object.entries(a1FuelConfigurations) as Array<
  [A1FuelType, (typeof a1FuelConfigurations)[A1FuelType]]
>).map(([value, config]) => ({
  value,
  label: config.label,
  unit: config.defaultUnit,
  defaultEmissionFactorKgPerUnit: config.defaultEmissionFactorKgPerUnit
}))

export function runA1(input: ModuleInput): ModuleResult {
  const warnings: string[] = []
  const assumptions: string[] = [
    'Emissioner beregnes pr. brændsel som mængde × emissionsfaktor.',
    `Konvertering fra kg til ton: ${factors.a1.kgToTonnes}.`
  ]

  const raw = (input.A1 ?? {}) as A1Input
  const rawConsumptions = Array.isArray(raw?.fuelConsumptions) ? raw.fuelConsumptions : []

  const hasAnyValue = rawConsumptions.some((entry) =>
    entry != null &&
    (entry.quantity != null ||
      entry.emissionFactorKgPerUnit != null ||
      entry.documentationQualityPercent != null)
  )

  const sanitised = rawConsumptions
    .map((entry, index) => normaliseEntry(entry, index, warnings, assumptions, hasAnyValue))
    .filter((entry): entry is SanitisedFuelConsumption => entry !== null)

  if (sanitised.length === 0 && hasAnyValue) {
    warnings.push('Ingen gyldige brændselslinjer kunne beregnes. Kontrollér indtastningerne.')
  }

  let totalEmissionsKg = 0
  const trace: string[] = []

  for (const [index, entry] of sanitised.entries()) {
    const entryEmissionsKg = entry.quantity * entry.emissionFactorKgPerUnit
    const entryEmissionsTonnes = entryEmissionsKg * factors.a1.kgToTonnes
    totalEmissionsKg += entryEmissionsKg

    trace.push(
      `entry[${index}].fuelType=${entry.fuelType}`,
      `entry[${index}].unit=${entry.unit}`,
      `entry[${index}].quantity=${entry.quantity}`,
      `entry[${index}].emissionFactorKgPerUnit=${entry.emissionFactorKgPerUnit}`,
      `entry[${index}].documentationQualityPercent=${entry.documentationQualityPercent}`,
      `entry[${index}].emissionsKg=${entryEmissionsKg}`,
      `entry[${index}].emissionsTonnes=${entryEmissionsTonnes}`
    )

    if (entry.documentationQualityPercent < factors.a1.lowDocumentationQualityThresholdPercent) {
      warnings.push(
        `Dokumentationskvalitet for ${a1FuelConfigurations[entry.fuelType].label} er kun ${entry.documentationQualityPercent}%. ` +
          'Overvej at forbedre dokumentation eller anvende konservative antagelser.'
      )
    }
  }

  const totalEmissionsTonnes = totalEmissionsKg * factors.a1.kgToTonnes
  const value = Number(totalEmissionsTonnes.toFixed(factors.a1.resultPrecision))

  trace.push(`totalEmissionsKg=${totalEmissionsKg}`)
  trace.push(`totalEmissionsTonnes=${totalEmissionsTonnes}`)

  return withE1Insights('A1', input, {
    value,
    unit: factors.a1.unit,
    assumptions,
    trace,
    warnings
  })
}

function normaliseEntry(
  entry: A1FuelConsumption | undefined,
  index: number,
  warnings: string[],
  assumptions: string[],
  emitMissingWarning: boolean
): SanitisedFuelConsumption | null {
  if (entry == null) {
    return null
  }

  const hasInput =
    entry.quantity != null ||
    entry.emissionFactorKgPerUnit != null ||
    entry.documentationQualityPercent != null

  if (!hasInput) {
    return null
  }

  const fuelType = isFuelType(entry.fuelType) ? entry.fuelType : 'naturgas'
  if (!isFuelType(entry.fuelType)) {
    warnings.push(
      `Ukendt brændstoftype på linje ${index + 1}. Standard (${a1FuelConfigurations[fuelType].label}) anvendes.`
    )
  }

  const unit = isUnit(entry.unit) ? entry.unit : a1FuelConfigurations[fuelType].defaultUnit
  if (!isUnit(entry.unit)) {
    warnings.push(
      `Ugyldig enhed på linje ${index + 1}. ${a1FuelConfigurations[fuelType].defaultUnit} anvendes i stedet.`
    )
  }

  const quantity = toNonNegativeNumber(entry.quantity, index, warnings, emitMissingWarning)
  const emissionFactor = toEmissionFactor(
    entry.emissionFactorKgPerUnit,
    fuelType,
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

  const hasValues = quantity > 0 && emissionFactor > 0

  if (!hasValues) {
    return null
  }

  return {
    fuelType,
    unit,
    quantity,
    emissionFactorKgPerUnit: emissionFactor,
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
      warnings.push(`Mængde mangler på linje ${index + 1} og behandles som 0.`)
    }
    return 0
  }
  if (value < 0) {
    warnings.push(`Mængden på linje ${index + 1} kan ikke være negativ. 0 anvendes i stedet.`)
    return 0
  }
  return value
}

function toEmissionFactor(
  value: number | null | undefined,
  fuelType: A1FuelType,
  index: number,
  warnings: string[],
  assumptions: string[],
  emitMissingWarning: boolean
): number {
  if (value == null || Number.isNaN(value)) {
    const fallback = a1FuelConfigurations[fuelType].defaultEmissionFactorKgPerUnit
    const assumptionMessage = `Standardfaktor for ${a1FuelConfigurations[fuelType].label}: ${fallback} kg CO2e/${a1FuelConfigurations[fuelType].defaultUnit}.`
    if (!assumptions.includes(assumptionMessage)) {
      assumptions.push(assumptionMessage)
    }
    if (emitMissingWarning) {
      warnings.push(
        `Emissionsfaktor mangler på linje ${index + 1}. Standardfaktor for ${a1FuelConfigurations[fuelType].label} anvendes.`
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
      warnings.push(`Dokumentationskvalitet mangler på linje ${index + 1}. Antager ${factors.a1.defaultDocumentationQualityPercent}%.`)
    }
    return factors.a1.defaultDocumentationQualityPercent
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

function isFuelType(value: unknown): value is A1FuelType {
  return typeof value === 'string' && value in a1FuelConfigurations
}

function isUnit(value: unknown): value is A1Unit {
  return value === 'liter' || value === 'Nm³' || value === 'kg'
}
