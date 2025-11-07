/**
 * Beregning for modul C15 – screening af øvrige Scope 3-kategorier.
 */
import type { C15Input, ModuleInput, ModuleResult } from '../../types'
import { factors } from '../factors'
import { withE1Insights } from '../e1Insights'

const c15Factors = factors.c15

export const c15Categories = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
  '13',
  '14',
  '15'
] as const

export type C15Category = (typeof c15Categories)[number]

export const c15CategoryLabels: Record<C15Category, string> = {
  '1': 'Kategori 1 – Indkøbte varer og services',
  '2': 'Kategori 2 – Kapitalgoder',
  '3': 'Kategori 3 – Brændstof- og energirelaterede emissioner (upstream)',
  '4': 'Kategori 4 – Upstream transport og distribution',
  '5': 'Kategori 5 – Affald fra drift',
  '6': 'Kategori 6 – Forretningsrejser',
  '7': 'Kategori 7 – Medarbejderpendling',
  '8': 'Kategori 8 – Upstream leasede aktiver',
  '9': 'Kategori 9 – Downstream transport og distribution',
  '10': 'Kategori 10 – Forarbejdning af solgte produkter',
  '11': 'Kategori 11 – Brug af solgte produkter',
  '12': 'Kategori 12 – End-of-life for solgte produkter',
  '13': 'Kategori 13 – Downstream leasede aktiver',
  '14': 'Kategori 14 – Franchises',
  '15': 'Kategori 15 – Investeringer'
}

export const c15EmissionFactorConfigurations = {
  category1Spend: {
    label: 'Spend-baseret screening',
    category: '1',
    unit: 'kg CO2e/DKK',
    factor: 0.28
  },
  category2Spend: {
    label: 'Spend-baseret screening',
    category: '2',
    unit: 'kg CO2e/DKK',
    factor: 0.22
  },
  category3Energy: {
    label: 'Energiintensitet (upstream)',
    category: '3',
    unit: 'kg CO2e/kWh',
    factor: 0.16
  },
  category4Logistics: {
    label: 'Logistik-intensitet',
    category: '4',
    unit: 'kg CO2e/tonkm',
    factor: 0.12
  },
  category5Waste: {
    label: 'Affaldsbehandling',
    category: '5',
    unit: 'kg CO2e/ton',
    factor: 320
  },
  category6Travel: {
    label: 'Rejseaktivitet',
    category: '6',
    unit: 'kg CO2e/km',
    factor: 0.15
  },
  category7Commuting: {
    label: 'Pendling',
    category: '7',
    unit: 'kg CO2e/km',
    factor: 0.12
  },
  category8LeasedAssets: {
    label: 'Leasede aktiver – energi',
    category: '8',
    unit: 'kg CO2e/kWh',
    factor: 0.18
  },
  category9DownstreamTransport: {
    label: 'Transport (downstream)',
    category: '9',
    unit: 'kg CO2e/tonkm',
    factor: 0.11
  },
  category10Processing: {
    label: 'Forarbejdning',
    category: '10',
    unit: 'kg CO2e/ton',
    factor: 410
  },
  category11UsePhase: {
    label: 'Brugsfase',
    category: '11',
    unit: 'kg CO2e/enhed',
    factor: 120
  },
  category12EndOfLife: {
    label: 'End-of-life',
    category: '12',
    unit: 'kg CO2e/ton',
    factor: 540
  },
  category13LeasedAssetsDownstream: {
    label: 'Leasede aktiver (downstream)',
    category: '13',
    unit: 'kg CO2e/kWh',
    factor: 0.17
  },
  category14Franchises: {
    label: 'Franchiseaktivitet',
    category: '14',
    unit: 'kg CO2e/DKK',
    factor: 0.24
  },
  category15Investments: {
    label: 'Investeringer',
    category: '15',
    unit: 'kg CO2e/DKK',
    factor: 0.35
  }
} as const

export type C15EmissionFactorKey = keyof typeof c15EmissionFactorConfigurations

export const defaultC15EmissionFactorKeyByCategory: Record<C15Category, C15EmissionFactorKey> = {
  '1': 'category1Spend',
  '2': 'category2Spend',
  '3': 'category3Energy',
  '4': 'category4Logistics',
  '5': 'category5Waste',
  '6': 'category6Travel',
  '7': 'category7Commuting',
  '8': 'category8LeasedAssets',
  '9': 'category9DownstreamTransport',
  '10': 'category10Processing',
  '11': 'category11UsePhase',
  '12': 'category12EndOfLife',
  '13': 'category13LeasedAssetsDownstream',
  '14': 'category14Franchises',
  '15': 'category15Investments'
}

type C15Line = NonNullable<C15Input['screeningLines']>[number]

type SanitisedLine = {
  category: C15Category
  description: string | null
  quantityUnit: string | null
  estimatedQuantity: number
  emissionFactorKey: C15EmissionFactorKey
  emissionFactorValue: number
  documentationQualityPercent: number
}

export function runC15(input: ModuleInput): ModuleResult {
  const warnings: string[] = []
  const assumptions: string[] = [
    'Screening af øvrige Scope 3-kategorier beregnes ved at multiplicere de estimerede mængder med valgte emissionsfaktorer.',
    `Hvis kategori mangler, anvendes ${c15CategoryLabels['1']}.`,
    'Manglende emissionsfaktor erstattes af standardværdien for kategorien.',
    `Manglende dokumentationskvalitet sættes til ${c15Factors.defaultDocumentationQualityPercent}%.`,
    `Konvertering fra kg til ton: ${c15Factors.kgToTonnes}.`
  ]

  const raw = (input.C15 ?? {}) as C15Input
  const rawLines = Array.isArray(raw?.screeningLines) ? raw.screeningLines : []

  const hasAnyValue = rawLines.some((line) =>
    line != null &&
    (line.category != null ||
      line.description != null ||
      line.quantityUnit != null ||
      line.estimatedQuantity != null ||
      line.emissionFactorKey != null ||
      line.documentationQualityPercent != null)
  )

  const sanitised = rawLines
    .map((line, index) => normaliseLine(line, index, warnings, hasAnyValue))
    .filter((line): line is SanitisedLine => line !== null)

  if (sanitised.length === 0 && hasAnyValue) {
    warnings.push('Ingen gyldige screeninglinjer kunne beregnes. Kontrollér indtastningerne.')
  }

  let totalEmissionsKg = 0
  const trace: string[] = []

  sanitised.forEach((line, index) => {
    const factorConfig = c15EmissionFactorConfigurations[line.emissionFactorKey]
    const lineEmissionsKg = line.estimatedQuantity * line.emissionFactorValue
    const lineEmissionsTonnes = lineEmissionsKg * c15Factors.kgToTonnes

    totalEmissionsKg += lineEmissionsKg

    trace.push(
      `line[${index}].category=${line.category}`,
      `line[${index}].description=${line.description ?? ''}`,
      `line[${index}].quantityUnit=${line.quantityUnit ?? ''}`,
      `line[${index}].estimatedQuantity=${line.estimatedQuantity}`,
      `line[${index}].emissionFactorKey=${line.emissionFactorKey}`,
      `line[${index}].emissionFactorValue=${line.emissionFactorValue}`,
      `line[${index}].documentationQualityPercent=${line.documentationQualityPercent}`,
      `line[${index}].emissionsKg=${lineEmissionsKg}`,
      `line[${index}].emissionsTonnes=${lineEmissionsTonnes}`
    )

    if (line.documentationQualityPercent < c15Factors.lowDocumentationQualityThresholdPercent) {
      warnings.push(
        `Dokumentationskvalitet for ${c15CategoryLabels[factorConfig.category]} på linje ${index + 1} er kun ${line.documentationQualityPercent}%. Overvej at forbedre datagrundlaget.`
      )
    }
  })

  const totalEmissionsTonnes = totalEmissionsKg * c15Factors.kgToTonnes
  const value = Number(totalEmissionsTonnes.toFixed(c15Factors.resultPrecision))

  trace.push(`totalEmissionsKg=${totalEmissionsKg}`)
  trace.push(`totalEmissionsTonnes=${totalEmissionsTonnes}`)

  return withE1Insights('C15', input, {
    value,
    unit: c15Factors.unit,
    assumptions,
    trace,
    warnings
  })
}

function normaliseLine(
  line: C15Line | undefined,
  index: number,
  warnings: string[],
  emitMissingWarning: boolean
): SanitisedLine | null {
  if (line == null) {
    return null
  }

  const hasInput =
    line.category != null ||
    line.description != null ||
    line.quantityUnit != null ||
    line.estimatedQuantity != null ||
    line.emissionFactorKey != null ||
    line.documentationQualityPercent != null

  if (!hasInput) {
    return null
  }

  const category = toCategory(line.category, index, warnings)
  const estimatedQuantity = toEstimatedQuantity(line.estimatedQuantity, index, warnings)
  const emissionFactorKey = toEmissionFactorKey(line.emissionFactorKey, category, index, warnings, emitMissingWarning)
  const emissionFactorValue = toEmissionFactorValue(emissionFactorKey)
  const documentationQualityPercent = toDocumentationQuality(line.documentationQualityPercent, index, warnings)

  return {
    category,
    description: normaliseString(line.description, 240),
    quantityUnit: normaliseString(line.quantityUnit, 32),
    estimatedQuantity,
    emissionFactorKey,
    emissionFactorValue,
    documentationQualityPercent
  }
}

function toCategory(
  value: C15Line['category'],
  index: number,
  warnings: string[]
): C15Category {
  if (value && c15Categories.includes(value as C15Category)) {
    return value as C15Category
  }

  if (value != null && !c15Categories.includes(value as C15Category)) {
    warnings.push(`Ukendt kategori på linje ${index + 1}. ${c15CategoryLabels['1']} anvendes som standard.`)
  }

  return '1'
}

function toEstimatedQuantity(
  value: C15Line['estimatedQuantity'],
  index: number,
  warnings: string[]
): number {
  if (value == null) {
    return 0
  }

  if (!Number.isFinite(value)) {
    warnings.push(`Estimeret mængde er ugyldig på linje ${index + 1}. 0 anvendes i stedet.`)
    return 0
  }

  if (value < 0) {
    warnings.push(`Estimeret mængde kan ikke være negativ på linje ${index + 1}. 0 anvendes i stedet.`)
    return 0
  }

  return value
}

function toEmissionFactorKey(
  value: C15Line['emissionFactorKey'],
  category: C15Category,
  index: number,
  warnings: string[],
  emitMissingWarning: boolean
): C15EmissionFactorKey {
  const keys = Object.keys(c15EmissionFactorConfigurations) as C15EmissionFactorKey[]

  if (value && keys.includes(value as C15EmissionFactorKey)) {
    return value as C15EmissionFactorKey
  }

  if (value != null && !keys.includes(value as C15EmissionFactorKey)) {
    warnings.push(`Ugyldig emissionsfaktor valgt på linje ${index + 1}. Standard for ${c15CategoryLabels[category]} anvendes.`)
  } else if (emitMissingWarning) {
    warnings.push(`Emissionsfaktor mangler på linje ${index + 1}. Standardfaktor for ${c15CategoryLabels[category]} anvendes.`)
  }

  return defaultC15EmissionFactorKeyByCategory[category]
}

function toEmissionFactorValue(key: C15EmissionFactorKey): number {
  return c15EmissionFactorConfigurations[key].factor
}

function toDocumentationQuality(
  value: C15Line['documentationQualityPercent'],
  index: number,
  warnings: string[]
): number {
  if (value == null) {
    warnings.push(
      `Dokumentationskvalitet mangler på linje ${index + 1}. Standard (${c15Factors.defaultDocumentationQualityPercent}%) anvendes.`
    )
    return c15Factors.defaultDocumentationQualityPercent
  }

  if (!Number.isFinite(value)) {
    warnings.push(
      `Dokumentationskvalitet er ugyldig på linje ${index + 1}. Standard (${c15Factors.defaultDocumentationQualityPercent}%) anvendes.`
    )
    return c15Factors.defaultDocumentationQualityPercent
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

function normaliseString(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  return trimmed.slice(0, maxLength)
}
