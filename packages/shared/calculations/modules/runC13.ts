/**
 * Beregning for modul C13 – investeringer og finansielle aktiviteter.
 */
import type { C13Input, ModuleInput, ModuleResult } from '../../types'
import { factors } from '../factors'
import { withE1Insights } from '../e1Insights'

const c13Factors = factors.c13

export const c13EmissionFactorConfigurations = {
  listedEquity: {
    label: 'Børsnoterede aktier',
    unit: 'kg CO2e/DKK',
    factor: 0.00028
  },
  corporateBonds: {
    label: 'Virksomhedsobligationer',
    unit: 'kg CO2e/DKK',
    factor: 0.00019
  },
  sovereignBonds: {
    label: 'Statsobligationer',
    unit: 'kg CO2e/DKK',
    factor: 0.00012
  },
  privateEquity: {
    label: 'Unoteret kapital (private equity)',
    unit: 'kg CO2e/DKK',
    factor: 0.00045
  },
  realEstate: {
    label: 'Ejendomsinvesteringer',
    unit: 'kg CO2e/DKK',
    factor: 0.00036
  },
  infrastructure: {
    label: 'Infrastrukturfonde',
    unit: 'kg CO2e/DKK',
    factor: 0.0004
  },
  diversifiedPortfolio: {
    label: 'Diversificeret portefølje',
    unit: 'kg CO2e/DKK',
    factor: 0.00025
  }
} as const

export type C13EmissionFactorKey = keyof typeof c13EmissionFactorConfigurations

export const defaultC13EmissionFactorKey: C13EmissionFactorKey = 'listedEquity'

type C13Line = NonNullable<C13Input['investmentLines']>[number]

type SanitisedLine = {
  investedAmountDkk: number
  emissionFactorKey: C13EmissionFactorKey
  emissionFactorValue: number
  documentationQualityPercent: number
}

export function runC13(input: ModuleInput): ModuleResult {
  const warnings: string[] = []
  const assumptions: string[] = [
    'Investeringer multipliceres med emissionsintensiteten (kg CO2e/DKK) for at beregne porteføljens emissioner.',
    `Manglende emissionsfaktor erstattes af standarden ${c13EmissionFactorConfigurations[defaultC13EmissionFactorKey].label}.`,
    `Manglende dokumentationskvalitet sættes til ${c13Factors.defaultDocumentationQualityPercent}%.`,
    `Konvertering fra kg til ton: ${c13Factors.kgToTonnes}.`
  ]

  const raw = (input.C13 ?? {}) as C13Input
  const rawLines = Array.isArray(raw?.investmentLines) ? raw.investmentLines : []

  const hasAnyValue = rawLines.some((line) =>
    line != null &&
    (line.investedAmountDkk != null || line.emissionFactorKey != null || line.documentationQualityPercent != null)
  )

  const sanitised = rawLines
    .map((line, index) => normaliseLine(line, index, warnings, hasAnyValue))
    .filter((line): line is SanitisedLine => line !== null)

  if (sanitised.length === 0 && hasAnyValue) {
    warnings.push('Ingen gyldige investeringslinjer kunne beregnes. Kontrollér indtastningerne.')
  }

  let totalEmissionsKg = 0
  const trace: string[] = []

  sanitised.forEach((line, index) => {
    const factorConfig = c13EmissionFactorConfigurations[line.emissionFactorKey]
    const lineEmissionsKg = line.investedAmountDkk * line.emissionFactorValue
    const lineEmissionsTonnes = lineEmissionsKg * c13Factors.kgToTonnes

    totalEmissionsKg += lineEmissionsKg

    trace.push(
      `line[${index}].investedAmountDkk=${line.investedAmountDkk}`,
      `line[${index}].emissionFactorKey=${line.emissionFactorKey}`,
      `line[${index}].emissionFactorValue=${line.emissionFactorValue}`,
      `line[${index}].documentationQualityPercent=${line.documentationQualityPercent}`,
      `line[${index}].emissionsKg=${lineEmissionsKg}`,
      `line[${index}].emissionsTonnes=${lineEmissionsTonnes}`
    )

    if (line.documentationQualityPercent < c13Factors.lowDocumentationQualityThresholdPercent) {
      warnings.push(
        `Dokumentationskvalitet for ${factorConfig.label} på linje ${index + 1} er kun ${line.documentationQualityPercent}%. Overvej at forbedre grundlaget.`
      )
    }
  })

  const totalEmissionsTonnes = totalEmissionsKg * c13Factors.kgToTonnes
  const value = Number(totalEmissionsTonnes.toFixed(c13Factors.resultPrecision))

  trace.push(`totalEmissionsKg=${totalEmissionsKg}`)
  trace.push(`totalEmissionsTonnes=${totalEmissionsTonnes}`)

  return withE1Insights('C13', input, {
    value,
    unit: c13Factors.unit,
    assumptions,
    trace,
    warnings
  })
}

function normaliseLine(
  line: C13Line | undefined,
  index: number,
  warnings: string[],
  emitMissingWarning: boolean
): SanitisedLine | null {
  if (line == null) {
    return null
  }

  const hasInput =
    line.investedAmountDkk != null || line.emissionFactorKey != null || line.documentationQualityPercent != null

  if (!hasInput) {
    return null
  }

  const investedAmountDkk = toNonNegativeNumber(line.investedAmountDkk, index, warnings, emitMissingWarning)
  if (investedAmountDkk === 0) {
    warnings.push(`Linje ${index + 1} mangler investeret beløb og udelades fra beregningen.`)
    return null
  }

  const emissionFactor = resolveEmissionFactor(line.emissionFactorKey, index, warnings, emitMissingWarning)
  const documentationQualityPercent = toDocumentationQuality(
    line.documentationQualityPercent,
    index,
    warnings,
    emitMissingWarning
  )

  return {
    investedAmountDkk,
    emissionFactorKey: emissionFactor.key,
    emissionFactorValue: emissionFactor.value,
    documentationQualityPercent
  }
}

function resolveEmissionFactor(
  key: C13EmissionFactorKey | null | undefined,
  index: number,
  warnings: string[],
  emitMissingWarning: boolean
): { key: C13EmissionFactorKey; value: number } {
  const fallbackKey = defaultC13EmissionFactorKey
  const fallback = c13EmissionFactorConfigurations[fallbackKey]

  if (key == null) {
    if (emitMissingWarning) {
      warnings.push(
        `Emissionsfaktor mangler på linje ${index + 1}. Standard (${fallback.label}) anvendes.`
      )
    }
    return { key: fallbackKey, value: fallback.factor }
  }

  const config = c13EmissionFactorConfigurations[key]
  if (!config) {
    warnings.push(`Ukendt emissionsfaktor på linje ${index + 1}. Standard (${fallback.label}) anvendes.`)
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
      warnings.push(`Feltet investedAmountDkk mangler på linje ${index + 1} og behandles som 0.`)
    }
    return 0
  }

  if (!Number.isFinite(value) || value < 0) {
    warnings.push(`Feltet investedAmountDkk kan ikke være negativt på linje ${index + 1}. 0 anvendes i stedet.`)
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
        `Dokumentationskvalitet mangler på linje ${index + 1}. Standard (${c13Factors.defaultDocumentationQualityPercent}%) anvendes.`
      )
    }
    return c13Factors.defaultDocumentationQualityPercent
  }

  if (!Number.isFinite(value)) {
    warnings.push(`Dokumentationskvalitet er ugyldig på linje ${index + 1}. Standard (${c13Factors.defaultDocumentationQualityPercent}%) anvendes.`)
    return c13Factors.defaultDocumentationQualityPercent
  }

  if (value < 0) {
    warnings.push(`Dokumentationskvalitet kan ikke være negativ på linje ${index + 1}. 0 anvendes i stedet.`)
    return 0
  }

  if (value > 100) {
    warnings.push(`Dokumentationskvalitet er begrænset til 100% på linje ${index + 1}.`)
    return 100
  }

  return value
}
