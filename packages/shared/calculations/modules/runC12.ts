/**
 * Beregning for modul C12 – franchising og downstream services.
 */
import type { C12Input, ModuleInput, ModuleResult } from '../../types'
import { factors } from '../factors'
import { withE1Insights } from '../e1Insights'

const c12Factors = factors.c12

export const c12ActivityBases = ['revenue', 'energy'] as const
export type C12ActivityBasis = (typeof c12ActivityBases)[number]

export const c12EmissionFactorConfigurations = {
  retailRevenue: {
    label: 'Detailhandel – omsætning',
    basis: 'revenue',
    unit: 'kg CO2e/DKK',
    factor: 0.00035
  },
  foodServiceRevenue: {
    label: 'Fødevare- og servicefranchises – omsætning',
    basis: 'revenue',
    unit: 'kg CO2e/DKK',
    factor: 0.00052
  },
  hospitalityRevenue: {
    label: 'Hotel & oplevelse – omsætning',
    basis: 'revenue',
    unit: 'kg CO2e/DKK',
    factor: 0.00042
  },
  genericRevenue: {
    label: 'Anden franchise – omsætning',
    basis: 'revenue',
    unit: 'kg CO2e/DKK',
    factor: 0.0003
  },
  electricityEnergy: {
    label: 'Elektricitet – energiforbrug',
    basis: 'energy',
    unit: 'kg CO2e/kWh',
    factor: 0.18
  },
  districtHeatEnergy: {
    label: 'Fjernvarme – energiforbrug',
    basis: 'energy',
    unit: 'kg CO2e/kWh',
    factor: 0.07
  },
  mixedEnergy: {
    label: 'Branchemix – energiforbrug',
    basis: 'energy',
    unit: 'kg CO2e/kWh',
    factor: 0.12
  }
} as const

export type C12EmissionFactorKey = keyof typeof c12EmissionFactorConfigurations

export const defaultC12EmissionFactorKeyByBasis: Record<C12ActivityBasis, C12EmissionFactorKey> = {
  revenue: 'retailRevenue',
  energy: 'electricityEnergy'
}

type C12Line = NonNullable<C12Input['franchiseLines']>[number]

type SanitisedLine = {
  activityBasis: C12ActivityBasis
  revenueDkk: number
  energyConsumptionKwh: number
  emissionFactorKey: C12EmissionFactorKey
  emissionFactorValue: number
  documentationQualityPercent: number
}

export function runC12(input: ModuleInput): ModuleResult {
  const warnings: string[] = []
  const assumptions: string[] = [
    'Omsætning multipliceres med branchefaktoren (kg CO2e/DKK), og energiforbrug multipliceres med kWh-faktoren for den valgte basis.',
    `Manglende emissionsfaktor erstattes af standardværdien for basis (omsætning: ${c12EmissionFactorConfigurations[defaultC12EmissionFactorKeyByBasis.revenue].label}, energi: ${c12EmissionFactorConfigurations[defaultC12EmissionFactorKeyByBasis.energy].label}).`,
    `Manglende dokumentationskvalitet sættes til ${c12Factors.defaultDocumentationQualityPercent}%.`,
    `Konvertering fra kg til ton: ${c12Factors.kgToTonnes}.`
  ]

  const raw = (input.C12 ?? {}) as C12Input
  const rawLines = Array.isArray(raw?.franchiseLines) ? raw.franchiseLines : []

  const hasAnyValue = rawLines.some((line) =>
    line != null &&
    (line.revenueDkk != null ||
      line.energyConsumptionKwh != null ||
      line.emissionFactorKey != null ||
      line.documentationQualityPercent != null)
  )

  const sanitised = rawLines
    .map((line, index) => normaliseLine(line, index, warnings, hasAnyValue))
    .filter((line): line is SanitisedLine => line !== null)

  if (sanitised.length === 0 && hasAnyValue) {
    warnings.push('Ingen gyldige franchiselinjer kunne beregnes. Kontrollér indtastningerne.')
  }

  let totalEmissionsKg = 0
  const trace: string[] = []

  sanitised.forEach((line, index) => {
    const factorConfig = c12EmissionFactorConfigurations[line.emissionFactorKey]
    const isRevenue = line.activityBasis === 'revenue'
    const metricValue = isRevenue ? line.revenueDkk : line.energyConsumptionKwh
    const lineEmissionsKg = metricValue * line.emissionFactorValue
    const lineEmissionsTonnes = lineEmissionsKg * c12Factors.kgToTonnes

    totalEmissionsKg += lineEmissionsKg

    trace.push(
      `line[${index}].activityBasis=${line.activityBasis}`,
      `line[${index}].metricValue=${metricValue}`,
      `line[${index}].emissionFactorKey=${line.emissionFactorKey}`,
      `line[${index}].emissionFactorValue=${line.emissionFactorValue}`,
      `line[${index}].documentationQualityPercent=${line.documentationQualityPercent}`,
      `line[${index}].emissionsKg=${lineEmissionsKg}`,
      `line[${index}].emissionsTonnes=${lineEmissionsTonnes}`
    )

    if (line.documentationQualityPercent < c12Factors.lowDocumentationQualityThresholdPercent) {
      warnings.push(
        `Dokumentationskvalitet for ${factorConfig.label} på linje ${index + 1} er kun ${line.documentationQualityPercent}%. Overvej at forbedre grundlaget.`
      )
    }
  })

  const totalEmissionsTonnes = totalEmissionsKg * c12Factors.kgToTonnes
  const value = Number(totalEmissionsTonnes.toFixed(c12Factors.resultPrecision))

  trace.push(`totalEmissionsKg=${totalEmissionsKg}`)
  trace.push(`totalEmissionsTonnes=${totalEmissionsTonnes}`)

  return withE1Insights('C12', input, {
    value,
    unit: c12Factors.unit,
    assumptions,
    trace,
    warnings
  })
}

function normaliseLine(
  line: C12Line | undefined,
  index: number,
  warnings: string[],
  emitMissingWarning: boolean
): SanitisedLine | null {
  if (line == null) {
    return null
  }

  const hasInput =
    line.revenueDkk != null ||
    line.energyConsumptionKwh != null ||
    line.emissionFactorKey != null ||
    line.documentationQualityPercent != null

  if (!hasInput) {
    return null
  }

  const activityBasis = isActivityBasis(line.activityBasis) ? line.activityBasis : 'revenue'
  if (!isActivityBasis(line.activityBasis)) {
    warnings.push(`Ukendt aktivitetsbasis på linje ${index + 1}. Omsætning anvendes som standard.`)
  }

  const revenueDkk = toNonNegativeNumber(line.revenueDkk, index, 'revenueDkk', warnings, emitMissingWarning)
  const energyConsumptionKwh = toNonNegativeNumber(
    line.energyConsumptionKwh,
    index,
    'energyConsumptionKwh',
    warnings,
    emitMissingWarning
  )

  const metricValue = activityBasis === 'revenue' ? revenueDkk : energyConsumptionKwh
  if (metricValue === 0) {
    warnings.push(
      activityBasis === 'revenue'
        ? `Linje ${index + 1} mangler omsætning og udelades fra beregningen.`
        : `Linje ${index + 1} mangler energiforbrug og udelades fra beregningen.`
    )
    return null
  }

  const emissionFactor = resolveEmissionFactor(line.emissionFactorKey, activityBasis, index, warnings)
  const documentationQualityPercent = toDocumentationQuality(
    line.documentationQualityPercent,
    index,
    warnings,
    emitMissingWarning
  )

  return {
    activityBasis,
    revenueDkk,
    energyConsumptionKwh,
    emissionFactorKey: emissionFactor.key,
    emissionFactorValue: emissionFactor.value,
    documentationQualityPercent
  }
}

function resolveEmissionFactor(
  key: C12EmissionFactorKey | null | undefined,
  basis: C12ActivityBasis,
  index: number,
  warnings: string[]
): { key: C12EmissionFactorKey; value: number } {
  const fallbackKey = defaultC12EmissionFactorKeyByBasis[basis]
  const fallback = c12EmissionFactorConfigurations[fallbackKey]

  if (key == null) {
    warnings.push(
      `Emissionsfaktor mangler på linje ${index + 1}. Standardfaktor for ${fallback.label} anvendes.`
    )
    return { key: fallbackKey, value: fallback.factor }
  }

  const config = c12EmissionFactorConfigurations[key]

  if (!config || config.basis !== basis) {
    warnings.push(
      `Emissionsfaktor på linje ${index + 1} passer ikke til ${basis === 'revenue' ? 'omsætning' : 'energiforbrug'}. Standard (${fallback.label}) anvendes.`
    )
    return { key: fallbackKey, value: fallback.factor }
  }

  return { key, value: config.factor }
}

function toNonNegativeNumber(
  value: number | null | undefined,
  index: number,
  field: 'revenueDkk' | 'energyConsumptionKwh',
  warnings: string[],
  emitMissingWarning: boolean
): number {
  if (value == null) {
    if (emitMissingWarning) {
      warnings.push(
        field === 'revenueDkk'
          ? `Feltet revenueDkk mangler på linje ${index + 1} og behandles som 0.`
          : `Feltet energyConsumptionKwh mangler på linje ${index + 1} og behandles som 0.`
      )
    }
    return 0
  }

  if (!Number.isFinite(value) || value < 0) {
    warnings.push(
      field === 'revenueDkk'
        ? `Feltet revenueDkk kan ikke være negativt på linje ${index + 1}. 0 anvendes i stedet.`
        : `Feltet energyConsumptionKwh kan ikke være negativt på linje ${index + 1}. 0 anvendes i stedet.`
    )
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
        `Dokumentationskvalitet mangler på linje ${index + 1}. Standard (${c12Factors.defaultDocumentationQualityPercent}%) anvendes.`
      )
    }
    return c12Factors.defaultDocumentationQualityPercent
  }

  if (!Number.isFinite(value) || value < 0) {
    warnings.push(`Dokumentationskvalitet kan ikke være negativ på linje ${index + 1}. 0% anvendes.`)
    return 0
  }

  if (value > 100) {
    warnings.push(`Dokumentationskvalitet er begrænset til 100% på linje ${index + 1}.`)
    return 100
  }

  return value
}

function isActivityBasis(value: unknown): value is C12ActivityBasis {
  return value === 'revenue' || value === 'energy'
}
