/**
 * Beregning for modul A2 – mobile forbrændingskilder.
 */
import type { A2Input, ModuleInput, ModuleResult } from '../../types'
import { factors } from '../factors'
import { withE1Insights } from '../e1Insights'

export const a2FuelConfigurations = {
  benzin: {
    label: 'Benzin',
    defaultUnit: 'liter',
    defaultEmissionFactorKgPerUnit: 2.31
  },
  diesel: {
    label: 'Diesel',
    defaultUnit: 'liter',
    defaultEmissionFactorKgPerUnit: 2.68
  },
  biodiesel: {
    label: 'Biodiesel (B100)',
    defaultUnit: 'liter',
    defaultEmissionFactorKgPerUnit: 1.2
  },
  cng: {
    label: 'CNG (komprimeret naturgas)',
    defaultUnit: 'kg',
    defaultEmissionFactorKgPerUnit: 2.75
  }
} as const

export type A2FuelType = keyof typeof a2FuelConfigurations

export type A2FuelConsumption = {
  fuelType: A2FuelType
  unit: A2Unit
  quantity: number | null | undefined
  emissionFactorKgPerUnit: number | null | undefined
  distanceKm: number | null | undefined
  documentationQualityPercent: number | null | undefined
}

export type A2Unit = 'liter' | 'kg'

type SanitisedFuelConsumption = {
  fuelType: A2FuelType
  unit: A2Unit
  quantity: number
  emissionFactorKgPerUnit: number
  distanceKm: number
  documentationQualityPercent: number
}

export const a2FuelOptions = (Object.entries(a2FuelConfigurations) as Array<
  [A2FuelType, (typeof a2FuelConfigurations)[A2FuelType]]
>).map(([value, config]) => ({
  value,
  label: config.label,
  unit: config.defaultUnit,
  defaultEmissionFactorKgPerUnit: config.defaultEmissionFactorKgPerUnit
}))

export function runA2(input: ModuleInput): ModuleResult {
  const warnings: string[] = []
  const assumptions: string[] = [
    'Emissioner beregnes pr. brændsel som mængde × emissionsfaktor.',
    'Angivne kilometer bruges til at følge intensitet og påvirker ikke udledningen direkte.',
    `Konvertering fra kg til ton: ${factors.a2.kgToTonnes}.`
  ]

  const raw = (input.A2 ?? {}) as A2Input
  const rawConsumptions = Array.isArray(raw?.vehicleConsumptions) ? raw.vehicleConsumptions : []

  const hasAnyValue = rawConsumptions.some((entry) =>
    entry != null &&
    (entry.quantity != null ||
      entry.emissionFactorKgPerUnit != null ||
      entry.distanceKm != null ||
      entry.documentationQualityPercent != null)
  )

  const sanitised = rawConsumptions
    .map((entry, index) => normaliseEntry(entry, index, warnings, assumptions, hasAnyValue))
    .filter((entry): entry is SanitisedFuelConsumption => entry !== null)

  if (sanitised.length === 0 && hasAnyValue) {
    warnings.push('Ingen gyldige mobile linjer kunne beregnes. Kontrollér indtastningerne.')
  }

  let totalEmissionsKg = 0
  let totalDistanceKm = 0
  const trace: string[] = []

  for (const [index, entry] of sanitised.entries()) {
    const entryEmissionsKg = entry.quantity * entry.emissionFactorKgPerUnit
    const entryEmissionsTonnes = entryEmissionsKg * factors.a2.kgToTonnes
    const entryIntensityKgPerKm = entry.distanceKm > 0 ? entryEmissionsKg / entry.distanceKm : null

    totalEmissionsKg += entryEmissionsKg
    totalDistanceKm += entry.distanceKm

    trace.push(
      `entry[${index}].fuelType=${entry.fuelType}`,
      `entry[${index}].unit=${entry.unit}`,
      `entry[${index}].quantity=${entry.quantity}`,
      `entry[${index}].emissionFactorKgPerUnit=${entry.emissionFactorKgPerUnit}`,
      `entry[${index}].distanceKm=${entry.distanceKm}`,
      `entry[${index}].documentationQualityPercent=${entry.documentationQualityPercent}`,
      `entry[${index}].emissionsKg=${entryEmissionsKg}`,
      `entry[${index}].emissionsTonnes=${entryEmissionsTonnes}`
    )

    if (entryIntensityKgPerKm != null) {
      trace.push(`entry[${index}].emissionsKgPerKm=${entryIntensityKgPerKm}`)
    }

    if (entry.documentationQualityPercent < factors.a2.lowDocumentationQualityThresholdPercent) {
      warnings.push(
        `Dokumentationskvalitet for ${a2FuelConfigurations[entry.fuelType].label} er kun ${entry.documentationQualityPercent}%.` +
          ' Overvej at forbedre dokumentation eller anvende konservative antagelser.'
      )
    }
  }

  const totalEmissionsTonnes = totalEmissionsKg * factors.a2.kgToTonnes
  const value = Number(totalEmissionsTonnes.toFixed(factors.a2.resultPrecision))

  trace.push(`totalEmissionsKg=${totalEmissionsKg}`)
  trace.push(`totalEmissionsTonnes=${totalEmissionsTonnes}`)
  trace.push(`totalDistanceKm=${totalDistanceKm}`)

  if (totalDistanceKm > 0) {
    trace.push(`fleetEmissionsKgPerKm=${totalEmissionsKg / totalDistanceKm}`)
  }

  return withE1Insights('A2', input, {
    value,
    unit: factors.a2.unit,
    assumptions,
    trace,
    warnings
  })
}

function normaliseEntry(
  entry: A2FuelConsumption | undefined,
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
    entry.distanceKm != null ||
    entry.documentationQualityPercent != null

  if (!hasInput) {
    return null
  }

  const fuelType = isFuelType(entry.fuelType) ? entry.fuelType : 'diesel'
  if (!isFuelType(entry.fuelType)) {
    warnings.push(
      `Ukendt brændstoftype på linje ${index + 1}. Standard (${a2FuelConfigurations[fuelType].label}) anvendes.`
    )
  }

  const unit = isUnit(entry.unit) ? entry.unit : a2FuelConfigurations[fuelType].defaultUnit
  if (!isUnit(entry.unit)) {
    warnings.push(
      `Ugyldig enhed på linje ${index + 1}. ${a2FuelConfigurations[fuelType].defaultUnit} anvendes i stedet.`
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
  const distanceKm = toDistanceKm(entry.distanceKm, index, warnings)
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
    distanceKm,
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
  fuelType: A2FuelType,
  index: number,
  warnings: string[],
  assumptions: string[],
  emitMissingWarning: boolean
): number {
  if (value == null || Number.isNaN(value)) {
    const fallback = a2FuelConfigurations[fuelType].defaultEmissionFactorKgPerUnit
    const assumptionMessage = `Standardfaktor for ${a2FuelConfigurations[fuelType].label}: ${fallback} kg CO2e/${a2FuelConfigurations[fuelType].defaultUnit}.`
    if (!assumptions.includes(assumptionMessage)) {
      assumptions.push(assumptionMessage)
    }
    if (emitMissingWarning) {
      warnings.push(
        `Emissionsfaktor mangler på linje ${index + 1}. Standardfaktor for ${a2FuelConfigurations[fuelType].label} anvendes.`
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
        `Dokumentationskvalitet mangler på linje ${index + 1}. Antager ${factors.a2.defaultDocumentationQualityPercent}%.`
      )
    }
    return factors.a2.defaultDocumentationQualityPercent
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

function toDistanceKm(value: number | null | undefined, index: number, warnings: string[]): number {
  if (value == null || Number.isNaN(value)) {
    return 0
  }
  if (value < 0) {
    warnings.push(`Distance kan ikke være negativ på linje ${index + 1}. 0 km anvendes i stedet.`)
    return 0
  }
  return value
}

function isFuelType(value: unknown): value is A2FuelType {
  return typeof value === 'string' && value in a2FuelConfigurations
}

function isUnit(value: unknown): value is A2Unit {
  return value === 'liter' || value === 'kg'
}
