/**
 * Beregning for modul A4 – kølemidler og andre flugtige gasser.
 */
import type { A4Input, ModuleInput, ModuleResult } from '../../types'
import { factors } from '../factors'
import { withE1Insights } from '../e1Insights'

export const a4RefrigerantConfigurations = {
  hfc134a: {
    label: 'HFC-134a (R-134a)',
    defaultGwp100: 1430
  },
  hfc125: {
    label: 'HFC-125 (R-125)',
    defaultGwp100: 3500
  },
  hfc32: {
    label: 'HFC-32 (R-32)',
    defaultGwp100: 675
  },
  r410a: {
    label: 'R410A (HFC-blanding)',
    defaultGwp100: 2088
  },
  r407c: {
    label: 'R407C (HFC-blanding)',
    defaultGwp100: 1774
  },
  sf6: {
    label: 'SF₆ (svovlhexafluorid)',
    defaultGwp100: 23500
  }
} as const

export type A4RefrigerantType = keyof typeof a4RefrigerantConfigurations

export type A4RefrigerantLine = {
  refrigerantType: A4RefrigerantType
  systemChargeKg: number | null | undefined
  leakagePercent: number | null | undefined
  gwp100: number | null | undefined
  documentationQualityPercent: number | null | undefined
}

type SanitisedRefrigerantLine = {
  refrigerantType: A4RefrigerantType
  systemChargeKg: number
  leakagePercent: number
  gwp100: number
  documentationQualityPercent: number
}

export const a4RefrigerantOptions = (
  Object.entries(a4RefrigerantConfigurations) as Array<
    [A4RefrigerantType, (typeof a4RefrigerantConfigurations)[A4RefrigerantType]]
  >
).map(([value, config]) => ({
  value,
  label: config.label,
  defaultGwp100: config.defaultGwp100
}))

export const a4DefaultLeakagePercent = factors.a4.defaultLeakagePercent

export function runA4(input: ModuleInput): ModuleResult {
  const warnings: string[] = []
  const assumptions: string[] = [
    'Emissioner beregnes pr. kølemiddellinje som fyldning × lækageandel × GWP100.',
    `Konvertering fra kg til ton: ${factors.a4.kgToTonnes}.`
  ]

  const raw = (input.A4 ?? {}) as A4Input
  const rawLines = Array.isArray(raw?.refrigerantLines) ? raw.refrigerantLines : []

  const hasAnyValue = rawLines.some((entry) =>
    entry != null &&
    (entry.systemChargeKg != null ||
      entry.leakagePercent != null ||
      entry.gwp100 != null ||
      entry.documentationQualityPercent != null)
  )

  const sanitised = rawLines
    .map((entry, index) => normaliseEntry(entry, index, warnings, assumptions, hasAnyValue))
    .filter((entry): entry is SanitisedRefrigerantLine => entry !== null)

  if (sanitised.length === 0 && hasAnyValue) {
    warnings.push('Ingen gyldige kølemiddellinjer kunne beregnes. Kontrollér indtastningerne.')
  }

  let totalEmissionsKg = 0
  const trace: string[] = []

  for (const [index, line] of sanitised.entries()) {
    const leakageRatio = line.leakagePercent * factors.a4.percentToRatio
    const leakedMassKg = line.systemChargeKg * leakageRatio
    const lineEmissionsKg = leakedMassKg * line.gwp100
    const lineEmissionsTonnes = lineEmissionsKg * factors.a4.kgToTonnes

    totalEmissionsKg += lineEmissionsKg

    trace.push(
      `entry[${index}].refrigerantType=${line.refrigerantType}`,
      `entry[${index}].systemChargeKg=${line.systemChargeKg}`,
      `entry[${index}].leakagePercent=${line.leakagePercent}`,
      `entry[${index}].gwp100=${line.gwp100}`,
      `entry[${index}].leakedMassKg=${leakedMassKg}`,
      `entry[${index}].emissionsKg=${lineEmissionsKg}`,
      `entry[${index}].emissionsTonnes=${lineEmissionsTonnes}`
    )

    if (line.documentationQualityPercent < factors.a4.lowDocumentationQualityThresholdPercent) {
      warnings.push(
        `Dokumentationskvalitet for ${a4RefrigerantConfigurations[line.refrigerantType].label} er kun ${line.documentationQualityPercent}%.` +
          ' Overvej at forbedre lækagekontrol, logning eller anvende konservative antagelser.'
      )
    }
  }

  const totalEmissionsTonnes = totalEmissionsKg * factors.a4.kgToTonnes
  const value = Number(totalEmissionsTonnes.toFixed(factors.a4.resultPrecision))

  trace.push(`totalEmissionsKg=${totalEmissionsKg}`)
  trace.push(`totalEmissionsTonnes=${totalEmissionsTonnes}`)

  return withE1Insights('A4', input, {
    value,
    unit: factors.a4.unit,
    assumptions,
    trace,
    warnings
  })
}

function normaliseEntry(
  entry: A4RefrigerantLine | undefined,
  index: number,
  warnings: string[],
  assumptions: string[],
  emitMissingWarning: boolean
): SanitisedRefrigerantLine | null {
  if (entry == null) {
    return null
  }

  const hasInput =
    entry.systemChargeKg != null ||
    entry.leakagePercent != null ||
    entry.gwp100 != null ||
    entry.documentationQualityPercent != null

  if (!hasInput) {
    return null
  }

  const refrigerantType = isRefrigerantType(entry.refrigerantType) ? entry.refrigerantType : 'hfc134a'
  if (!isRefrigerantType(entry.refrigerantType)) {
    warnings.push(
      `Ukendt kølemiddel på linje ${index + 1}. Standard (${a4RefrigerantConfigurations[refrigerantType].label}) anvendes.`
    )
  }

  const systemChargeKg = toNonNegativeNumber(entry.systemChargeKg, index, warnings, emitMissingWarning)
  const leakagePercent = toLeakagePercent(
    entry.leakagePercent,
    refrigerantType,
    index,
    warnings,
    assumptions,
    emitMissingWarning
  )
  const gwp100 = toGwpValue(entry.gwp100, refrigerantType, index, warnings, assumptions, emitMissingWarning)
  const documentationQualityPercent = toQualityPercent(
    entry.documentationQualityPercent,
    index,
    warnings,
    emitMissingWarning
  )

  const hasValues = systemChargeKg > 0 && leakagePercent > 0 && gwp100 > 0
  if (!hasValues) {
    return null
  }

  return {
    refrigerantType,
    systemChargeKg,
    leakagePercent,
    gwp100,
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
      warnings.push(`Fyldning mangler på linje ${index + 1} og behandles som 0.`)
    }
    return 0
  }
  if (value < 0) {
    warnings.push(`Fyldningen på linje ${index + 1} kan ikke være negativ. 0 kg anvendes i stedet.`)
    return 0
  }
  return value
}

function toLeakagePercent(
  value: number | null | undefined,
  refrigerantType: A4RefrigerantType,
  index: number,
  warnings: string[],
  assumptions: string[],
  emitMissingWarning: boolean
): number {
  if (value == null || Number.isNaN(value)) {
    const fallback = factors.a4.defaultLeakagePercent
    const assumptionMessage = `Standard lækageandel for ${a4RefrigerantConfigurations[refrigerantType].label}: ${fallback}%.`
    if (!assumptions.includes(assumptionMessage)) {
      assumptions.push(assumptionMessage)
    }
    if (emitMissingWarning) {
      warnings.push(
        `Lækageandel mangler på linje ${index + 1}. Standard på ${fallback}% anvendes.`
      )
    }
    return fallback
  }
  if (value < 0) {
    warnings.push(`Lækageandelen på linje ${index + 1} kan ikke være negativ. 0% anvendes i stedet.`)
    return 0
  }
  if (value > 100) {
    warnings.push(`Lækageandelen på linje ${index + 1} er begrænset til 100%.`)
    return 100
  }
  return value
}

function toGwpValue(
  value: number | null | undefined,
  refrigerantType: A4RefrigerantType,
  index: number,
  warnings: string[],
  assumptions: string[],
  emitMissingWarning: boolean
): number {
  if (value == null || Number.isNaN(value)) {
    const fallback = a4RefrigerantConfigurations[refrigerantType].defaultGwp100
    const assumptionMessage = `Standard GWP100 for ${a4RefrigerantConfigurations[refrigerantType].label}: ${fallback}.`
    if (!assumptions.includes(assumptionMessage)) {
      assumptions.push(assumptionMessage)
    }
    if (emitMissingWarning) {
      warnings.push(
        `GWP100 mangler på linje ${index + 1}. Standardværdi for ${a4RefrigerantConfigurations[refrigerantType].label} anvendes.`
      )
    }
    return fallback
  }
  if (value < 0) {
    warnings.push(`GWP100 på linje ${index + 1} kan ikke være negativ. 0 anvendes i stedet.`)
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
        `Dokumentationskvalitet mangler på linje ${index + 1}. Antager ${factors.a4.defaultDocumentationQualityPercent}%.`
      )
    }
    return factors.a4.defaultDocumentationQualityPercent
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

function isRefrigerantType(value: unknown): value is A4RefrigerantType {
  return typeof value === 'string' && value in a4RefrigerantConfigurations
}
