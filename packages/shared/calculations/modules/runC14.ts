/**
 * Beregning for modul C14 – behandling af solgte produkter.
 */
import type { C14Input, ModuleInput, ModuleResult } from '../../types'
import { factors } from '../factors'
import { withE1Insights } from '../e1Insights'

const c14Factors = factors.c14

export const c14TreatmentTypes = ['recycling', 'incineration', 'landfill'] as const
export type C14TreatmentType = (typeof c14TreatmentTypes)[number]

export const c14EmissionFactorConfigurations = {
  recyclingConservative: {
    label: 'Genanvendelse – blandet fraktion',
    treatmentType: 'recycling',
    unit: 'kg CO2e/ton',
    factor: 200
  },
  recyclingOptimised: {
    label: 'Genanvendelse – høj kvalitet',
    treatmentType: 'recycling',
    unit: 'kg CO2e/ton',
    factor: 120
  },
  incinerationEnergyRecovery: {
    label: 'Forbrænding med energiudnyttelse',
    treatmentType: 'incineration',
    unit: 'kg CO2e/ton',
    factor: 650
  },
  incinerationNoRecovery: {
    label: 'Forbrænding uden energiudnyttelse',
    treatmentType: 'incineration',
    unit: 'kg CO2e/ton',
    factor: 900
  },
  landfillManaged: {
    label: 'Deponi – kontrolleret anlæg',
    treatmentType: 'landfill',
    unit: 'kg CO2e/ton',
    factor: 1000
  },
  landfillUnmanaged: {
    label: 'Deponi – ukontrolleret anlæg',
    treatmentType: 'landfill',
    unit: 'kg CO2e/ton',
    factor: 1400
  }
} as const

export type C14EmissionFactorKey = keyof typeof c14EmissionFactorConfigurations

export const defaultC14EmissionFactorKeyByTreatment: Record<C14TreatmentType, C14EmissionFactorKey> = {
  recycling: 'recyclingConservative',
  incineration: 'incinerationEnergyRecovery',
  landfill: 'landfillManaged'
}

type C14Line = NonNullable<C14Input['treatmentLines']>[number]

type SanitisedLine = {
  treatedTonnage: number
  treatmentType: C14TreatmentType
  emissionFactorKey: C14EmissionFactorKey
  emissionFactorValue: number
  documentationQualityPercent: number
}

export function runC14(input: ModuleInput): ModuleResult {
  const warnings: string[] = []
  const assumptions: string[] = [
    'Behandling af solgte produkter beregnes ved at multiplicere tonnage med den valgte behandlingsfaktor (kg CO2e/ton).',
    'Manglende eller ugyldig behandlingsform antages som genanvendelse.',
    'Manglende emissionsfaktor erstattes af standarden for den valgte behandlingsform.',
    `Manglende dokumentationskvalitet sættes til ${c14Factors.defaultDocumentationQualityPercent}%.`,
    `Konvertering fra kg til ton: ${c14Factors.kgToTonnes}.`
  ]

  const raw = (input.C14 ?? {}) as C14Input
  const rawLines = Array.isArray(raw?.treatmentLines) ? raw.treatmentLines : []

  const hasAnyValue = rawLines.some((line) =>
    line != null &&
    (line.tonnesTreated != null ||
      line.treatmentType != null ||
      line.emissionFactorKey != null ||
      line.documentationQualityPercent != null)
  )

  const sanitised = rawLines
    .map((line, index) => normaliseLine(line, index, warnings, hasAnyValue))
    .filter((line): line is SanitisedLine => line !== null)

  if (sanitised.length === 0 && hasAnyValue) {
    warnings.push('Ingen gyldige behandlingslinjer kunne beregnes. Kontrollér indtastningerne.')
  }

  let totalEmissionsKg = 0
  const trace: string[] = []

  sanitised.forEach((line, index) => {
    const factorConfig = c14EmissionFactorConfigurations[line.emissionFactorKey]
    const lineEmissionsKg = line.treatedTonnage * line.emissionFactorValue
    const lineEmissionsTonnes = lineEmissionsKg * c14Factors.kgToTonnes

    totalEmissionsKg += lineEmissionsKg

    trace.push(
      `line[${index}].treatedTonnage=${line.treatedTonnage}`,
      `line[${index}].treatmentType=${line.treatmentType}`,
      `line[${index}].emissionFactorKey=${line.emissionFactorKey}`,
      `line[${index}].emissionFactorValue=${line.emissionFactorValue}`,
      `line[${index}].documentationQualityPercent=${line.documentationQualityPercent}`,
      `line[${index}].emissionsKg=${lineEmissionsKg}`,
      `line[${index}].emissionsTonnes=${lineEmissionsTonnes}`
    )

    if (line.documentationQualityPercent < c14Factors.lowDocumentationQualityThresholdPercent) {
      warnings.push(
        `Dokumentationskvalitet for ${factorConfig.label} på linje ${index + 1} er kun ${line.documentationQualityPercent}%. Overvej at forbedre grundlaget.`
      )
    }
  })

  const totalEmissionsTonnes = totalEmissionsKg * c14Factors.kgToTonnes
  const value = Number(totalEmissionsTonnes.toFixed(c14Factors.resultPrecision))

  trace.push(`totalEmissionsKg=${totalEmissionsKg}`)
  trace.push(`totalEmissionsTonnes=${totalEmissionsTonnes}`)

  return withE1Insights('C14', input, {
    value,
    unit: c14Factors.unit,
    assumptions,
    trace,
    warnings
  })
}

function normaliseLine(
  line: C14Line | undefined,
  index: number,
  warnings: string[],
  emitMissingWarning: boolean
): SanitisedLine | null {
  if (line == null) {
    return null
  }

  const hasInput =
    line.tonnesTreated != null ||
    line.treatmentType != null ||
    line.emissionFactorKey != null ||
    line.documentationQualityPercent != null

  if (!hasInput) {
    return null
  }

  const treatmentType = toTreatmentType(line.treatmentType, index, warnings)
  const treatedTonnage = toNonNegativeNumber(line.tonnesTreated, index, warnings, emitMissingWarning)

  if (treatedTonnage === 0) {
    warnings.push(`Linje ${index + 1} mangler tonnage og udelades fra beregningen.`)
    return null
  }

  const emissionFactor = resolveEmissionFactor(
    line.emissionFactorKey,
    treatmentType,
    index,
    warnings,
    emitMissingWarning
  )
  const documentationQualityPercent = toDocumentationQuality(
    line.documentationQualityPercent,
    index,
    warnings,
    emitMissingWarning
  )

  return {
    treatedTonnage,
    treatmentType,
    emissionFactorKey: emissionFactor.key,
    emissionFactorValue: emissionFactor.value,
    documentationQualityPercent
  }
}

function toTreatmentType(
  value: C14TreatmentType | null | undefined,
  index: number,
  warnings: string[]
): C14TreatmentType {
  if (value && c14TreatmentTypes.includes(value)) {
    return value
  }

  if (value != null && !c14TreatmentTypes.includes(value as C14TreatmentType)) {
    warnings.push(`Ukendt behandlingstype på linje ${index + 1}. Genanvendelse anvendes som standard.`)
  }

  return 'recycling'
}

function resolveEmissionFactor(
  key: C14EmissionFactorKey | null | undefined,
  treatmentType: C14TreatmentType,
  index: number,
  warnings: string[],
  emitMissingWarning: boolean
): { key: C14EmissionFactorKey; value: number } {
  const fallbackKey = defaultC14EmissionFactorKeyByTreatment[treatmentType]
  const fallback = c14EmissionFactorConfigurations[fallbackKey]

  if (key == null) {
    if (emitMissingWarning) {
      warnings.push(
        `Emissionsfaktor mangler på linje ${index + 1}. Standard (${fallback.label}) anvendes.`
      )
    }
    return { key: fallbackKey, value: fallback.factor }
  }

  const config = c14EmissionFactorConfigurations[key]
  if (!config) {
    warnings.push(`Ukendt emissionsfaktor på linje ${index + 1}. Standard (${fallback.label}) anvendes.`)
    return { key: fallbackKey, value: fallback.factor }
  }

  if (config.treatmentType !== treatmentType) {
    warnings.push(
      `Valgt emissionsfaktor passer ikke til behandlingen på linje ${index + 1}. Standard (${fallback.label}) anvendes.`
    )
    return { key: fallbackKey, value: fallback.factor }
  }

  return { key, value: config.factor }
}

function toNonNegativeNumber(
  value: number | null | undefined,
  index: number,
  warnings: string[],
  emitMissingWarning: boolean
): number {
  if (value == null) {
    if (emitMissingWarning) {
      warnings.push(`Feltet tonnesTreated mangler på linje ${index + 1} og behandles som 0.`)
    }
    return 0
  }

  if (value < 0) {
    warnings.push(`Feltet tonnesTreated kan ikke være negativt på linje ${index + 1}. 0 anvendes i stedet.`)
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
  if (value == null) {
    if (emitMissingWarning) {
      warnings.push(
        `Dokumentationskvalitet mangler på linje ${index + 1}. Standard (${c14Factors.defaultDocumentationQualityPercent}%) anvendes.`
      )
    }
    return c14Factors.defaultDocumentationQualityPercent
  }

  if (value < 0) {
    warnings.push(`Dokumentationskvalitet kan ikke være negativ på linje ${index + 1}. 0% anvendes.`)
    return 0
  }

  if (value > 100) {
    warnings.push(`Dokumentationskvalitet er begrænset til 100% på linje ${index + 1}.`)
    return 100
  }

  return value
}
