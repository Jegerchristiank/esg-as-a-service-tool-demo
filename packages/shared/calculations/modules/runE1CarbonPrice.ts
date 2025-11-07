/**
 * Beregning for modul E1 – interne CO₂-priser.
 */
import type {
  E1CarbonPriceInput,
  E1TargetScope,
  ModuleCarbonPriceScheme,
  ModuleEsrsFact,
  ModuleInput,
  ModuleMetric,
  ModuleResult,
  ModuleTable,
} from '../../types'

type CarbonPriceInputEntry = NonNullable<E1CarbonPriceInput['carbonPrices']>[number]

const VALID_SCOPES: ReadonlyArray<E1TargetScope> = ['scope1', 'scope2', 'scope3', 'combined']

const SCOPE_LABELS: Record<E1TargetScope, string> = {
  scope1: 'Scope 1',
  scope2: 'Scope 2',
  scope3: 'Scope 3',
  combined: 'Samlet (scope 1-3)',
}

export function runE1CarbonPrice(input: ModuleInput): ModuleResult {
  const raw = (input.E1CarbonPrice ?? {}) as Partial<E1CarbonPriceInput>
  const warnings: string[] = []
  const trace: string[] = []
  const assumptions = [
    'Interne CO₂-priser anvendes til investerings- og risikobeslutninger jf. ESRS E1-5.',
    'Manglende beløb tolkes som 0 DKK og udelades fra gennemsnit.',
  ]

  const rawSchemes: CarbonPriceInputEntry[] = Array.isArray(raw.carbonPrices)
    ? (raw.carbonPrices as CarbonPriceInputEntry[])
    : []
  const schemes = rawSchemes
    .map((scheme, index) => normaliseScheme(scheme, index, warnings, trace))
    .filter((scheme): scheme is ModuleCarbonPriceScheme => scheme !== null)

  const value = schemes.length
  trace.push(`carbonPrice.count=${value}`)

  const priceValues = schemes
    .map((scheme) => scheme.priceDkkPerTonne)
    .filter((price): price is number => price != null)
  const averagePrice = priceValues.length > 0 ? round(priceValues.reduce((sum, n) => sum + n, 0) / priceValues.length, 0) : null

  const coverageValues = schemes
    .map((scheme) => scheme.coveragePercent)
    .filter((coverage): coverage is number => coverage != null)
  const averageCoverage = coverageValues.length > 0 ? round(coverageValues.reduce((sum, n) => sum + n, 0) / coverageValues.length, 1) : null

  if (averagePrice != null) {
    trace.push(`carbonPrice.average=${averagePrice}`)
  }
  if (averageCoverage != null) {
    trace.push(`carbonPrice.coverage=${averageCoverage}`)
  }

  const metrics: ModuleMetric[] = []
  if (averagePrice != null) {
    metrics.push({ label: 'Gennemsnitlig CO₂-pris', value: averagePrice, unit: 'DKK/tCO₂e' })
  }
  if (averageCoverage != null) {
    metrics.push({ label: 'Gennemsnitlig dækningsgrad', value: averageCoverage, unit: '%' })
  }

  const tables: ModuleTable[] = schemes.length
    ? [
        {
          id: 'e1-carbon-price',
          title: 'Interne CO₂-priser',
          columns: [
            { key: 'scheme', label: 'Ordning' },
            { key: 'scope', label: 'Scope' },
            { key: 'priceDkkPerTonne', label: 'Pris (DKK/t)', align: 'end', format: 'number' },
            { key: 'coveragePercent', label: 'Dækning (%)', align: 'end', format: 'percent' },
            { key: 'appliesToCapex', label: 'Capex', align: 'center' },
            { key: 'appliesToOpex', label: 'Opex', align: 'center' },
            { key: 'appliesToInvestmentDecisions', label: 'Investering', align: 'center' },
            { key: 'alignedWithFinancialStatements', label: 'Afstemt regnskab', align: 'center' },
            { key: 'description', label: 'Noter' },
          ],
          rows: schemes.map((scheme) => ({
            scheme: scheme.scheme ?? 'Ordning',
            scope: scheme.scope ? SCOPE_LABELS[scheme.scope] : 'Ukendt',
            priceDkkPerTonne: scheme.priceDkkPerTonne ?? null,
            coveragePercent: scheme.coveragePercent ?? null,
            appliesToCapex: formatBooleanCell(scheme.appliesToCapex),
            appliesToOpex: formatBooleanCell(scheme.appliesToOpex),
            appliesToInvestmentDecisions: formatBooleanCell(scheme.appliesToInvestmentDecisions),
            alignedWithFinancialStatements: formatBooleanCell(scheme.alignedWithFinancialStatements),
            description: scheme.description ?? null,
          })),
        },
      ]
    : []

  const methodologyNarrative = normaliseText(raw.methodologyNarrative)
  const narratives = methodologyNarrative
    ? [
        {
          label: 'Metode til intern CO₂-prissætning',
          content: methodologyNarrative,
        },
      ]
    : []

  const anyAligned = schemes.some((scheme) => scheme.alignedWithFinancialStatements === true)

  const esrsFacts: ModuleEsrsFact[] = []
  if (averagePrice != null) {
    esrsFacts.push({ conceptKey: 'E1CarbonPriceAmount', value: averagePrice, unitId: 'DKK', decimals: 0 })
  }
  if (schemes.length > 0) {
    esrsFacts.push({ conceptKey: 'E1CarbonPriceAlignment', value: anyAligned })
  }
  if (methodologyNarrative) {
    esrsFacts.push({ conceptKey: 'E1CarbonPriceNarrative', value: methodologyNarrative })
  }

  return {
    value,
    unit: 'ordninger',
    assumptions,
    trace,
    warnings,
    carbonPriceSchemes: schemes,
    ...(metrics.length ? { metrics } : {}),
    ...(tables.length ? { tables } : {}),
    ...(narratives.length ? { narratives } : {}),
    ...(esrsFacts.length ? { esrsFacts } : {}),
  }
}

function normaliseScheme(
  scheme: CarbonPriceInputEntry | null | undefined,
  index: number,
  warnings: string[],
  trace: string[],
): ModuleCarbonPriceScheme | null {
  if (!scheme || typeof scheme !== 'object') {
    return null
  }

  const schemeName = normaliseText((scheme as { scheme?: unknown }).scheme)
  const rawScope = (scheme as { scope?: unknown }).scope
  const scope: E1TargetScope | null = isScope(rawScope) ? rawScope : null
  if (!scope && rawScope != null) {
    warnings.push(`Ugyldigt scope på CO₂-pris ${index + 1}. Værdien ignoreres.`)
  }

  const price = normaliseNumber((scheme as { priceDkkPerTonne?: unknown }).priceDkkPerTonne)
  const coveragePercent = clampPercent((scheme as { coveragePercent?: unknown }).coveragePercent)
  const appliesToCapex = normaliseBoolean((scheme as { appliesToCapex?: unknown }).appliesToCapex)
  const appliesToOpex = normaliseBoolean((scheme as { appliesToOpex?: unknown }).appliesToOpex)
  const appliesToInvestmentDecisions = normaliseBoolean(
    (scheme as { appliesToInvestmentDecisions?: unknown }).appliesToInvestmentDecisions,
  )
  const alignedWithFinancialStatements = normaliseBoolean(
    (scheme as { alignedWithFinancialStatements?: unknown }).alignedWithFinancialStatements,
  )
  const description = normaliseText((scheme as { description?: unknown }).description)

  if (
    !schemeName &&
    !scope &&
    price == null &&
    coveragePercent == null &&
    appliesToCapex == null &&
    appliesToOpex == null &&
    appliesToInvestmentDecisions == null &&
    alignedWithFinancialStatements == null &&
    !description
  ) {
    return null
  }

  if (price != null) {
    trace.push(`carbonPrice[${index}].price=${price}`)
  }
  if (coveragePercent != null) {
    trace.push(`carbonPrice[${index}].coverage=${coveragePercent}`)
  }

  return {
    scheme: schemeName,
    scope,
    priceDkkPerTonne: price,
    coveragePercent,
    appliesToCapex,
    appliesToOpex,
    appliesToInvestmentDecisions,
    alignedWithFinancialStatements,
    description,
  }
}

function isScope(value: unknown): value is E1TargetScope {
  return typeof value === 'string' && VALID_SCOPES.includes(value as E1TargetScope)
}

function normaliseText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function normaliseNumber(value: unknown): number | null {
  if (value == null) {
    return null
  }
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return null
  }
  return Math.max(0, numeric)
}

function clampPercent(value: unknown): number | null {
  if (value == null) {
    return null
  }
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return null
  }
  if (numeric < 0) {
    return 0
  }
  if (numeric > 100) {
    return 100
  }
  return round(numeric, 1)
}

function normaliseBoolean(value: unknown): boolean | null {
  if (value == null) {
    return null
  }
  if (typeof value === 'boolean') {
    return value
  }
  if (value === 'true' || value === '1') {
    return true
  }
  if (value === 'false' || value === '0') {
    return false
  }
  return null
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function formatBooleanCell(value: boolean | null): string | null {
  if (value == null) {
    return null
  }
  return value ? 'Ja' : 'Nej'
}
