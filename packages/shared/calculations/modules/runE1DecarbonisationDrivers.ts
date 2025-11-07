/**
 * Beregning for modul E1 – decarboniseringsdrivere.
 */
import type {
  E1DecarbonisationDriverType,
  E1DecarbonisationDriversInput,
  ModuleDecarbonisationDriver,
  ModuleEsrsFact,
  ModuleEsrsTable,
  ModuleInput,
  ModuleMetric,
  ModuleResult,
  ModuleTable,
} from '../../types'

const VALID_DRIVER_TYPES: ReadonlyArray<E1DecarbonisationDriverType> = [
  'energyEfficiency',
  'renewableEnergy',
  'processInnovation',
  'fuelSwitching',
  'carbonCapture',
  'valueChainEngagement',
  'other',
]

export function runE1DecarbonisationDrivers(input: ModuleInput): ModuleResult {
  const raw = ((input.E1DecarbonisationDrivers ?? {}) as E1DecarbonisationDriversInput) || {}
  const warnings: string[] = []
  const trace: string[] = []
  const assumptions = [
    'Drivere kobles til klimamål og beregnes som forventede reduktioner i tCO₂e.',
    'Manglende reduktionstal antages som 0 tCO₂e.',
  ]

  const rawDrivers = Array.isArray(raw.drivers) ? raw.drivers : []
  const drivers = rawDrivers
    .map((driver, index) => normaliseDriver(driver, index, warnings, trace))
    .filter((driver): driver is ModuleDecarbonisationDriver => driver !== null)

  const totalReduction = round(
    drivers.reduce((sum, driver) => sum + (driver.expectedReductionTonnes ?? 0), 0),
    1,
  )
  const totalInvestment = round(drivers.reduce((sum, driver) => sum + (driver.investmentNeedDkk ?? 0), 0), 0)
  const value = drivers.length > 0 ? totalReduction : 0

  trace.push(`decarbonisation.count=${drivers.length}`)
  trace.push(`decarbonisation.totalReduction=${totalReduction}`)
  trace.push(`decarbonisation.totalInvestment=${totalInvestment}`)

  const metrics: ModuleMetric[] = []
  if (drivers.length > 0) {
    metrics.push({ label: 'Antal drivere', value: drivers.length })
  }
  if (totalReduction > 0) {
    metrics.push({ label: 'Forventet reduktion', value: totalReduction, unit: 'tCO₂e' })
  }
  if (totalInvestment > 0) {
    metrics.push({ label: 'Estimeret investering', value: totalInvestment, unit: 'DKK' })
  }

  const tables: ModuleTable[] = drivers.length
    ? [
        {
          id: 'e1-decarbonisation-drivers',
          title: 'Decarboniseringsdrivere',
          columns: [
            { key: 'lever', label: 'Driver' },
            { key: 'name', label: 'Initiativ' },
            { key: 'expectedReductionTonnes', label: 'Reduktion (tCO₂e)', align: 'end', format: 'number' },
            { key: 'investmentNeedDkk', label: 'Investering (DKK)', align: 'end', format: 'number' },
            { key: 'startYear', label: 'Startår', align: 'end', format: 'number' },
            { key: 'description', label: 'Noter' },
          ],
          rows: drivers.map((driver) => ({
            lever: driver.lever ?? 'ukendt',
            name: driver.name ?? 'Initiativ',
            expectedReductionTonnes: driver.expectedReductionTonnes ?? null,
            investmentNeedDkk: driver.investmentNeedDkk ?? null,
            startYear: driver.startYear ?? null,
            description: driver.description ?? null,
          })),
        },
      ]
    : []

  const summaryNarrative = normaliseText(raw.summaryNarrative)
  const narratives = summaryNarrative
    ? [
        {
          label: 'Sammenfatning af drivere',
          content: summaryNarrative,
        },
      ]
    : []

  const leverTypes = new Set(
    drivers.map((driver) => driver.lever).filter((lever): lever is E1DecarbonisationDriverType => lever != null),
  )

  const esrsFacts: ModuleEsrsFact[] = []
  if (leverTypes.size > 0) {
    esrsFacts.push({ conceptKey: 'E1DecarbonisationLeverTypes', value: Array.from(leverTypes).join('|') })
  }
  if (summaryNarrative) {
    esrsFacts.push({ conceptKey: 'E1DecarbonisationNarrative', value: summaryNarrative })
  } else if (drivers.length > 0) {
    const fallbackNarrative = drivers
      .map((driver) => driver.name)
      .filter((name): name is string => !!name)
      .join(', ')
    if (fallbackNarrative) {
      esrsFacts.push({ conceptKey: 'E1DecarbonisationNarrative', value: fallbackNarrative })
    }
  }

  const esrsTables: ModuleEsrsTable[] = drivers.length
    ? [
        {
          conceptKey: 'E1DecarbonisationTable',
          rows: drivers.map((driver) => ({
            lever: driver.lever ?? 'other',
            name: driver.name ?? null,
            expectedReductionTonnes: driver.expectedReductionTonnes ?? null,
            investmentNeedDkk: driver.investmentNeedDkk ?? null,
            startYear: driver.startYear ?? null,
          })),
        },
      ]
    : []

  return {
    value,
    unit: 'tCO₂e',
    assumptions,
    trace,
    warnings,
    decarbonisationDrivers: drivers,
    ...(metrics.length ? { metrics } : {}),
    ...(tables.length ? { tables } : {}),
    ...(narratives.length ? { narratives } : {}),
    ...(esrsFacts.length ? { esrsFacts } : {}),
    ...(esrsTables.length ? { esrsTables } : {}),
  }
}

function normaliseDriver(
  driver: E1DecarbonisationDriversInput['drivers'] extends Array<infer T> ? T : unknown,
  index: number,
  warnings: string[],
  trace: string[],
): ModuleDecarbonisationDriver | null {
  if (!driver || typeof driver !== 'object') {
    return null
  }

  const lever = normaliseLever((driver as { lever?: unknown }).lever, index, warnings)
  const name = normaliseText((driver as { name?: unknown }).name)
  const description = normaliseText((driver as { description?: unknown }).description)
  const expectedReductionTonnes = normaliseNumber((driver as { expectedReductionTonnes?: unknown }).expectedReductionTonnes)
  const investmentNeedDkk = normaliseNumber((driver as { investmentNeedDkk?: unknown }).investmentNeedDkk)
  const startYear = normaliseYear((driver as { startYear?: unknown }).startYear)

  if (
    !lever &&
    !name &&
    !description &&
    expectedReductionTonnes == null &&
    investmentNeedDkk == null &&
    startYear == null
  ) {
    return null
  }

  if (expectedReductionTonnes != null) {
    trace.push(`decarbonisation[${index}].reduction=${expectedReductionTonnes}`)
  }
  if (investmentNeedDkk != null) {
    trace.push(`decarbonisation[${index}].investment=${investmentNeedDkk}`)
  }

  return {
    lever,
    name,
    description,
    expectedReductionTonnes,
    investmentNeedDkk,
    startYear,
  }
}

function normaliseLever(value: unknown, index: number, warnings: string[]): E1DecarbonisationDriverType | null {
  if (typeof value === 'string' && VALID_DRIVER_TYPES.includes(value as E1DecarbonisationDriverType)) {
    return value as E1DecarbonisationDriverType
  }
  if (value != null) {
    warnings.push(`Ukendt driver-type på række ${index + 1}.`)
  }
  return null
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

function normaliseYear(value: unknown): number | null {
  if (value == null) {
    return null
  }
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return null
  }
  if (numeric < 1900 || numeric > 2100) {
    return null
  }
  return Math.round(numeric)
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}
