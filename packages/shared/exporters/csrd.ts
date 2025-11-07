/**
 * Hjælpefunktioner til at opbygge et minimalt CSRD/XBRL-rapporteringspayload.
 */
import {
  esrsConceptDefinitions,
  esrsEmissionConceptList,
  esrsNamespace,
  getEsrsConceptDefinition,
  type EsrsConceptKey,
  type EsrsPeriodType
} from './esrsTaxonomy'
import {
  moduleIds,
  type CalculatedModuleResult,
  type ModuleId,
  type ModuleResult,
  type ModuleEsrsFact,
  type ModuleEsrsTable,
  type ModuleEsrsTableRow
} from '../types'

const scope1ModuleIds = moduleIds.filter((id) => id.startsWith('A'))
const scope2LocationBasedModuleIds = moduleIds.filter((id) => id.startsWith('B') && Number(id.slice(1)) <= 6)
const scope2MarketAdjustmentModuleIds = moduleIds.filter((id) => id.startsWith('B') && Number(id.slice(1)) > 6)
const scope3ModuleIds = moduleIds.filter((id) => id.startsWith('C'))

const emissionUnit = 't CO2e'

const netRevenueIntensityDecimals = 9

type NetRevenueIntensityConceptKey =
  | 'E1IntensityLocationBasedPerNetRevenue'
  | 'E1IntensityMarketBasedPerNetRevenue'

export type ReportingPeriod = {
  start: string
  end: string
}

export type EntityIdentifier = {
  scheme: string
  value: string
}

export type XbrlDurationPeriod = ReportingPeriod & { type: 'duration' }

export type XbrlInstantPeriod = { type: 'instant'; instant: string }

export type XbrlContextPeriod = XbrlDurationPeriod | XbrlInstantPeriod

export type XbrlContext = {
  id: string
  entity: EntityIdentifier
  period: XbrlContextPeriod
}

export type XbrlUnit = {
  id: string
  measures: string[]
}

export type XbrlFact = {
  concept: string
  contextRef: string
  unitRef?: string
  decimals?: string
  value: string
}

export type BuildCsrdReportPackageInput = {
  results: CalculatedModuleResult[]
  reportingPeriod: ReportingPeriod
  entity: EntityIdentifier
  decimals?: number
}

export type CsrdReportPackage = {
  contexts: XbrlContext[]
  units: XbrlUnit[]
  facts: XbrlFact[]
  instance: string
}

type EmissionConceptKey = (typeof esrsEmissionConceptList)[number]['key']
type EmissionTotals = Partial<Record<EmissionConceptKey, number>>

type PreparedFact = {
  conceptKey: EsrsConceptKey
  value: string
  unitId?: string | null | undefined
  decimals?: string | undefined
  periodType: EsrsPeriodType
}

export type XbrlInstanceOptions = {
  profileId: string
  organisation?: string
  reportingPeriod?: ReportingPeriod
  entityIdentifier?: EntityIdentifier
  decimals?: number
}

export type ReportPackageOptions = XbrlInstanceOptions & {
  auditTrail?: unknown
  responsibilities?: unknown
}

export type SubmissionPayloadOptions = ReportPackageOptions & {
  includeXbrl?: boolean
}

export type SubmissionPayload = {
  profileId: string
  organisation?: string
  reportingPeriod: ReportingPeriod
  entityIdentifier: EntityIdentifier
  generatedAt: string
  auditTrail?: unknown
  responsibilities?: unknown
  results: CalculatedModuleResult[]
  csrd: CsrdReportPackage
  xbrl?: string
}

const defaultEntityScheme = 'urn:org:eaas:profile'

function resolveBaseContext(options?: XbrlInstanceOptions) {
  if (!options) {
    throw new Error('Report options er påkrævet for at generere CSRD-pakken')
  }

  const { profileId, organisation, reportingPeriod, entityIdentifier, decimals } = options
  if (!profileId) {
    throw new Error('Report options skal inkludere et profileId')
  }

  const resolvedReportingPeriod = reportingPeriod ?? inferDefaultReportingPeriod()
  const resolvedEntity =
    entityIdentifier ?? ({ scheme: defaultEntityScheme, value: profileId } satisfies EntityIdentifier)

  return {
    profileId,
    organisation,
    reportingPeriod: resolvedReportingPeriod,
    entity: resolvedEntity,
    decimals,
  }
}

function resolveReportPackageContext(options: ReportPackageOptions) {
  const base = resolveBaseContext(options)
  return {
    ...base,
    auditTrail: options.auditTrail,
    responsibilities: options.responsibilities,
  }
}

function inferDefaultReportingPeriod(): ReportingPeriod {
  const now = new Date()
  const year = now.getUTCFullYear()
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
  }
}

function buildCsrdReportPackageInternal({
  results,
  reportingPeriod,
  entity,
  decimals = 3,
}: BuildCsrdReportPackageInput): CsrdReportPackage {
  validatePeriod(reportingPeriod)
  validateEntity(entity)

  const totals = calculateEmissionTotals(results)
  const netRevenueDenominator = findNetRevenueDenominator(results)

  const preparedFacts: PreparedFact[] = []
  for (const { key, definition } of esrsEmissionConceptList) {
    const fact: PreparedFact = {
      conceptKey: key,
      value: formatDecimal(totals[key] ?? 0, decimals),
      decimals: String(decimals),
      periodType: definition.periodType
    }
    if (definition.unitId !== undefined) {
      fact.unitId = definition.unitId
    }
    preparedFacts.push(fact)
  }

  for (const { result } of results) {
    if (Array.isArray(result.esrsFacts)) {
      for (const fact of result.esrsFacts) {
        if (!isEsrsConceptKey(fact.conceptKey)) {
          continue
        }
        const serialised = serialiseModuleFact(fact, decimals)
        if (!serialised) {
          continue
        }
        const definition = getEsrsConceptDefinition(fact.conceptKey)
        const unitId = serialised.unitId ?? definition.unitId ?? undefined
        preparedFacts.push({
          conceptKey: fact.conceptKey,
          value: serialised.value,
          periodType: definition.periodType,
          ...(serialised.decimals ? { decimals: serialised.decimals } : {}),
          ...(unitId !== undefined ? { unitId } : {})
        })
      }
    }

    if (Array.isArray(result.esrsTables)) {
      for (const table of result.esrsTables) {
        if (!isEsrsConceptKey(table.conceptKey)) {
          continue
        }
        const serialised = serialiseTableRows(table)
        if (!serialised) {
          continue
        }
        const definition = getEsrsConceptDefinition(table.conceptKey)
        preparedFacts.push({
          conceptKey: table.conceptKey,
          value: serialised,
          periodType: definition.periodType,
          ...(definition.unitId !== undefined ? { unitId: definition.unitId } : {})
        })
      }
    }
  }

  if (netRevenueDenominator != null) {
    appendNetRevenueIntensityFacts(preparedFacts, totals, netRevenueDenominator)
  }

  const periodTypes = new Set<EsrsPeriodType>()
  for (const fact of preparedFacts) {
    periodTypes.add(fact.periodType)
  }

  const contextIdByPeriodType: Record<EsrsPeriodType, string> = {
    duration: 'ctx_reporting_period',
    instant: 'ctx_reporting_period_instant'
  }

  const contexts: XbrlContext[] = []
  for (const periodType of periodTypes) {
    if (periodType === 'duration') {
      contexts.push({
        id: contextIdByPeriodType.duration,
        entity,
        period: {
          type: 'duration',
          start: reportingPeriod.start,
          end: reportingPeriod.end
        }
      })
    } else {
      contexts.push({
        id: contextIdByPeriodType.instant,
        entity,
        period: {
          type: 'instant',
          instant: reportingPeriod.end
        }
      })
    }
  }

  const units: XbrlUnit[] = []
  const unitRefs = new Map<string, string>()
  for (const fact of preparedFacts) {
    if (!fact.unitId) {
      continue
    }
    if (!unitRefs.has(fact.unitId)) {
      const generatedId = `unit_${fact.unitId}`
      units.push({
        id: generatedId,
        measures: [toUnitMeasure(fact.unitId)]
      })
      unitRefs.set(fact.unitId, generatedId)
    }
  }

  const facts: XbrlFact[] = preparedFacts.map((fact) => {
    const definition = getEsrsConceptDefinition(fact.conceptKey)
    const unitRef = fact.unitId ? unitRefs.get(fact.unitId) : undefined
    const xbrlFact: XbrlFact = {
      concept: definition.qname,
      contextRef: contextIdByPeriodType[fact.periodType],
      value: fact.value
    }
    if (unitRef) {
      xbrlFact.unitRef = unitRef
    }
    if (fact.decimals) {
      xbrlFact.decimals = fact.decimals
    }
    return xbrlFact
  })

  const instance = buildXbrlInstanceInternal({ contexts, units, facts })

  return { contexts, units, facts, instance }
}

export type BuildXbrlInstanceInput = {
  contexts: XbrlContext[]
  units: XbrlUnit[]
  facts: XbrlFact[]
}

function buildXbrlInstanceInternal({ contexts, units, facts }: BuildXbrlInstanceInput): string {
  const contextXml = contexts.map((context) => createContextXml(context)).join('\n')
  const unitXml = units.map((unit) => createUnitXml(unit)).join('\n')
  const factXml = facts.map((fact) => createFactXml(fact)).join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<xbrli:xbrl xmlns:xbrli="http://www.xbrl.org/2003/instance"`,
    `            xmlns:link="http://www.xbrl.org/2003/linkbase"`,
    `            xmlns:xlink="http://www.w3.org/1999/xlink"`,
    `            xmlns:utr="http://www.xbrl.org/2009/utr"`,
    `            xmlns:dtr-types="http://www.xbrl.org/dtr/type/2024-01-31"`,
    `            xmlns:esrs="${esrsNamespace}">`,
    contextXml,
    unitXml,
    factXml,
    '</xbrli:xbrl>'
  ].join('\n')
}

export function buildCsrdReportPackage(input: BuildCsrdReportPackageInput): CsrdReportPackage
export function buildCsrdReportPackage(
  results: CalculatedModuleResult[],
  options: ReportPackageOptions
): CsrdReportPackage
export function buildCsrdReportPackage(
  first: BuildCsrdReportPackageInput | CalculatedModuleResult[],
  second?: ReportPackageOptions
): CsrdReportPackage {
  if (Array.isArray(first)) {
    if (!second) {
      throw new Error('Report options er påkrævet når resultater angives direkte')
    }
    const { reportingPeriod, entity, decimals } = resolveBaseContext(second)
    const packageInput: BuildCsrdReportPackageInput = {
      results: first,
      reportingPeriod,
      entity,
    }
    if (decimals !== undefined) {
      packageInput.decimals = decimals
    }
    return buildCsrdReportPackageInternal(packageInput)
  }

  return buildCsrdReportPackageInternal(first)
}

export function buildXbrlInstance(input: BuildXbrlInstanceInput): string
export function buildXbrlInstance(results: CalculatedModuleResult[], options: XbrlInstanceOptions): string
export function buildXbrlInstance(
  first: BuildXbrlInstanceInput | CalculatedModuleResult[],
  second?: XbrlInstanceOptions
): string {
  if (Array.isArray(first)) {
    if (!second) {
      throw new Error('XBRL options er påkrævet når resultater angives direkte')
    }
    const { reportingPeriod, entity, decimals } = resolveBaseContext(second)
    const packageInput: BuildCsrdReportPackageInput = {
      results: first,
      reportingPeriod,
      entity,
    }
    if (decimals !== undefined) {
      packageInput.decimals = decimals
    }
    const pkg = buildCsrdReportPackageInternal(packageInput)
    return pkg.instance
  }

  return buildXbrlInstanceInternal(first)
}

function isEsrsConceptKey(value: string): value is EsrsConceptKey {
  return Object.prototype.hasOwnProperty.call(esrsConceptDefinitions, value)
}

function findNetRevenueDenominator(results: CalculatedModuleResult[]): number | null {
  for (const { result } of results) {
    const intensities = result.intensities
    if (!Array.isArray(intensities)) {
      continue
    }
    for (const intensity of intensities) {
      if (intensity.basis !== 'netRevenue') {
        continue
      }
      const denominator = Number(intensity.denominatorValue)
      if (Number.isFinite(denominator) && denominator > 0) {
        return denominator
      }
    }
  }
  return null
}

function appendNetRevenueIntensityFacts(
  preparedFacts: PreparedFact[],
  totals: EmissionTotals,
  netRevenue: number,
): void {
  pushNetRevenueIntensityFact(
    preparedFacts,
    'E1IntensityLocationBasedPerNetRevenue',
    totals.totalLocationBased,
    netRevenue,
  )
  pushNetRevenueIntensityFact(
    preparedFacts,
    'E1IntensityMarketBasedPerNetRevenue',
    totals.totalMarketBased,
    netRevenue,
  )
}

function pushNetRevenueIntensityFact(
  preparedFacts: PreparedFact[],
  conceptKey: NetRevenueIntensityConceptKey,
  totalEmissions: number | undefined,
  netRevenue: number,
): void {
  if (typeof totalEmissions !== 'number' || !Number.isFinite(totalEmissions)) {
    return
  }

  if (netRevenue <= 0 || !Number.isFinite(netRevenue)) {
    return
  }

  if (preparedFacts.some((fact) => fact.conceptKey === conceptKey)) {
    return
  }

  const definition = getEsrsConceptDefinition(conceptKey)
  const intensity = totalEmissions / netRevenue
  if (!Number.isFinite(intensity)) {
    return
  }

  const prepared: PreparedFact = {
    conceptKey,
    value: formatDecimal(intensity, netRevenueIntensityDecimals),
    periodType: definition.periodType,
    decimals: String(netRevenueIntensityDecimals)
  }
  if (definition.unitId !== undefined) {
    prepared.unitId = definition.unitId
  }
  preparedFacts.push(prepared)
}

type SerialisedModuleFact = {
  value: string
  unitId?: string | null | undefined
  decimals?: string | undefined
}

function serialiseModuleFact(fact: ModuleEsrsFact, fallbackDecimals: number): SerialisedModuleFact | null {
  const rawValue = fact.value
  if (rawValue === null || rawValue === undefined) {
    return null
  }
  if (typeof rawValue === 'number') {
    if (!Number.isFinite(rawValue)) {
      return null
    }
    const decimals = fact.decimals ?? fallbackDecimals
    return {
      value: formatDecimal(rawValue, decimals),
      unitId: fact.unitId,
      decimals: String(decimals)
    }
  }
  if (typeof rawValue === 'boolean') {
    return {
      value: rawValue ? 'true' : 'false',
      unitId: fact.unitId ?? null
    }
  }
  const text = String(rawValue).trim()
  if (text.length === 0) {
    return null
  }
  return {
    value: text,
    unitId: fact.unitId ?? null
  }
}

function serialiseTableRows(table: ModuleEsrsTable): string | null {
  if (!Array.isArray(table.rows) || table.rows.length === 0) {
    return null
  }
  const normalised = table.rows
    .map((row) => normaliseTableRow(row))
    .filter((row) => Object.keys(row).length > 0)
  if (normalised.length === 0) {
    return null
  }
  return JSON.stringify(normalised)
}

function normaliseTableRow(row: ModuleEsrsTableRow): Record<string, string | number | boolean | null> {
  const ordered: Record<string, string | number | boolean | null> = {}
  const keys = Object.keys(row).sort()
  for (const key of keys) {
    const value = row[key]
    if (value === undefined) {
      continue
    }
    ordered[key] = value as string | number | boolean | null
  }
  return ordered
}

function toUnitMeasure(unitId: string): string {
  if (unitId === 'pure') {
    return 'xbrli:pure'
  }
  return `utr:${unitId}`
}

export function buildSubmissionPayload(
  results: CalculatedModuleResult[],
  options: SubmissionPayloadOptions
): SubmissionPayload {
  const { profileId, organisation, reportingPeriod, entity, decimals, auditTrail, responsibilities } =
    resolveReportPackageContext(options)

  const packageInput: BuildCsrdReportPackageInput = {
    results,
    reportingPeriod,
    entity,
  }
  if (decimals !== undefined) {
    packageInput.decimals = decimals
  }

  const csrd = buildCsrdReportPackageInternal(packageInput)

  const includeXbrl = options.includeXbrl ?? false

  const payload: SubmissionPayload = {
    profileId,
    reportingPeriod,
    entityIdentifier: entity,
    generatedAt: new Date().toISOString(),
    results,
    csrd,
  }

  if (organisation !== undefined) {
    payload.organisation = organisation
  }
  if (auditTrail !== undefined) {
    payload.auditTrail = auditTrail
  }
  if (responsibilities !== undefined) {
    payload.responsibilities = responsibilities
  }
  if (includeXbrl) {
    payload.xbrl = csrd.instance
  }

  return payload
}

function calculateEmissionTotals(results: CalculatedModuleResult[]): EmissionTotals {
  const resultMap = new Map<ModuleId, ModuleResult>()
  for (const entry of results) {
    resultMap.set(entry.moduleId, entry.result)
  }

  const scope1 = sumTonnes(resultMap, scope1ModuleIds)
  const scope2Location = sumTonnes(resultMap, scope2LocationBasedModuleIds)
  const scope2Adjustments = sumTonnes(resultMap, scope2MarketAdjustmentModuleIds)
  const scope2Market = scope2Location + scope2Adjustments
  const scope3 = sumTonnes(resultMap, scope3ModuleIds)

  return {
    scope1,
    scope2LocationBased: scope2Location,
    scope2MarketBased: scope2Market,
    scope3,
    totalLocationBased: scope1 + scope2Location + scope3,
    totalMarketBased: scope1 + scope2Market + scope3
  }
}

function sumTonnes(resultMap: Map<ModuleId, ModuleResult>, ids: ModuleId[]): number {
  let total = 0
  for (const moduleId of ids) {
    const result = resultMap.get(moduleId)
    if (!result || result.unit !== emissionUnit) {
      continue
    }
    const value = Number(result.value)
    if (Number.isFinite(value)) {
      total += value
    }
  }
  return total
}

function formatDecimal(value: number, decimals: number): string {
  if (!Number.isFinite(value)) {
    return '0'
  }
  const fixed = value.toFixed(decimals)
  const numeric = Number(fixed)
  if (Object.is(numeric, -0)) {
    return '0'
  }
  return numeric.toString()
}

function createContextXml(context: XbrlContext): string {
  const entityXml = [
    '    <xbrli:entity>',
    `      <xbrli:identifier scheme="${escapeXml(context.entity.scheme)}">${escapeXml(context.entity.value)}</xbrli:identifier>`,
    '    </xbrli:entity>'
  ].join('\n')

  const periodXml =
    context.period.type === 'instant'
      ? [
          '    <xbrli:period>',
          `      <xbrli:instant>${escapeXml(context.period.instant)}</xbrli:instant>`,
          '    </xbrli:period>'
        ].join('\n')
      : [
          '    <xbrli:period>',
          `      <xbrli:startDate>${escapeXml(context.period.start)}</xbrli:startDate>`,
          `      <xbrli:endDate>${escapeXml(context.period.end)}</xbrli:endDate>`,
          '    </xbrli:period>'
        ].join('\n')

  return [
    `  <xbrli:context id="${escapeXml(context.id)}">`,
    entityXml,
    periodXml,
    '  </xbrli:context>'
  ].join('\n')
}

function createUnitXml(unit: XbrlUnit): string {
  const measures = unit.measures
    .map((measure) => `    <xbrli:measure>${escapeXml(measure)}</xbrli:measure>`)
    .join('\n')
  return [
    `  <xbrli:unit id="${escapeXml(unit.id)}">`,
    measures,
    '  </xbrli:unit>'
  ].join('\n')
}

function createFactXml(fact: XbrlFact): string {
  const attributes = [
    `contextRef="${escapeXml(fact.contextRef)}"`,
    fact.unitRef ? `unitRef="${escapeXml(fact.unitRef)}"` : null,
    fact.decimals ? `decimals="${escapeXml(fact.decimals)}"` : null
  ]
    .filter((attribute): attribute is string => attribute != null)
    .join(' ')
  return `  <${fact.concept} ${attributes}>${escapeXml(fact.value)}</${fact.concept}>`
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function validatePeriod(period: ReportingPeriod): void {
  if (!period.start || !period.end) {
    throw new Error('Reporting period kræver både start- og slutdato')
  }
}

function validateEntity(entity: EntityIdentifier): void {
  if (!entity.scheme || !entity.value) {
    throw new Error('Entity-identifikator kræver både scheme og value')
  }
}
