/**
 * Beregning for modul S2 – værdikædearbejdere og arbejdsforhold.
 */
import type {
  ModuleEsrsFact,
  ModuleEsrsTable,
  ModuleInput,
  ModuleMetric,
  ModuleNarrative,
  ModuleResult,
  ModuleTable,
  S2Input
} from '../../types'
import { factors } from '../factors'

const { s2 } = factors

type IncidentRow = NonNullable<S2Input['incidents']>[number]

type NormalisedIssueType = NonNullable<IncidentRow['issueType']> | null
type NormalisedIncident = {
  index: number
  supplier: string | null
  country: string | null
  issueType: NormalisedIssueType
  workersAffected: number | null
  severityLevel: NormalisedSeverity
  remediationStatus: NormalisedStatus
  description: string | null
}

type NormalisedSeverity = NonNullable<IncidentRow['severityLevel']> | null
type NormalisedStatus = NonNullable<IncidentRow['remediationStatus']> | null

type PercentLike = number | null | undefined

export function runS2(input: ModuleInput): ModuleResult {
  const raw = (input.S2 ?? null) as S2Input | null
  const incidents = normaliseIncidents(raw?.incidents)
  const trace: string[] = []
  const warnings: string[] = []
  const assumptions = [
    'Scoren vægter værdikædedækning (35 %), arbejdstagerbeskyttelse (25 %), audits (15 %) og klagemekanismer (15 %).',
    'Alvorlige hændelser reducerer score afhængigt af antal berørte arbejdstagere og status på remediering.'
  ]

  const valueChainWorkers = clampCount(raw?.valueChainWorkersCount)
  const workersAtRisk = clampCount(raw?.workersAtRiskCount)
  const valueChainCoveragePercent = clampPercent(raw?.valueChainCoveragePercent)
  const highRiskSupplierPercent = clampPercent(raw?.highRiskSupplierSharePercent)
  const livingWagePercent = clampPercent(raw?.livingWageCoveragePercent)
  const bargainingPercent = clampPercent(raw?.collectiveBargainingCoveragePercent)
  const socialAuditPercent = clampPercent(raw?.socialAuditsCompletedPercent)
  const grievancesOpen = clampCount(raw?.grievancesOpenCount)
  const grievanceMechanism = raw?.grievanceMechanismForWorkers ?? null

  const coverageScore = resolveCoverageScore(raw, trace, warnings)
  const protectionScore = resolveProtectionScore(raw, warnings, trace)
  const auditScore = resolveAuditScore(raw, warnings, trace)
  const mechanismScore = resolveMechanismScore(raw, warnings)
  const incidentPenalty = computeIncidentPenalty(raw, incidents, trace, warnings)
  const grievancePenalty = computeGrievancePenalty(raw, trace, warnings)

  const baseScore =
    s2.coverageWeight * coverageScore +
    s2.protectionWeight * protectionScore +
    s2.auditWeight * auditScore +
    s2.grievanceWeight * mechanismScore

  const penaltyRatio = Math.min(1, incidentPenalty + grievancePenalty)
  const incidentScore = s2.incidentWeight * (1 - penaltyRatio)
  const value = Number((Math.max(0, Math.min(1, baseScore + incidentScore)) * 100).toFixed(s2.resultPrecision))

  if (incidents.length === 0) {
    trace.push('incidents=0')
    if ((raw?.workersAtRiskCount ?? 0) > 0) {
      warnings.push('Ingen hændelser registreret, men der er angivet risikofyldte arbejdstagere. Verificér screeningen.')
    }
  }

  if (raw?.socialDialogueNarrative == null || raw.socialDialogueNarrative.trim().length < 40) {
    warnings.push('Tilføj narrativ om dialog og træning af leverandørarbejdere (ESRS S2 §21-23).')
  }

  if (raw?.remediationNarrative == null || raw.remediationNarrative.trim().length < 40) {
    warnings.push('Tilføj narrativ om afhjælpning og kompensation til leverandørarbejdere (ESRS S2 §28).')
  }

  const esrsFacts: ModuleEsrsFact[] = []
  const pushNumericFact = (key: string, value: number | null | undefined, unitId: string, decimals: number) => {
    if (value == null || Number.isNaN(value) || !Number.isFinite(Number(value))) {
      return
    }
    esrsFacts.push({ conceptKey: key, value: Number(value), unitId, decimals })
  }

  pushNumericFact('S2ValueChainWorkersCount', valueChainWorkers, 'pure', 0)
  pushNumericFact('S2WorkersAtRiskCount', workersAtRisk, 'pure', 0)
  pushNumericFact('S2ValueChainCoveragePercent', valueChainCoveragePercent, 'percent', 1)
  pushNumericFact('S2HighRiskSupplierSharePercent', highRiskSupplierPercent, 'percent', 1)
  pushNumericFact('S2LivingWageCoveragePercent', livingWagePercent, 'percent', 1)
  pushNumericFact('S2CollectiveBargainingCoveragePercent', bargainingPercent, 'percent', 1)
  pushNumericFact('S2SocialAuditsCompletedPercent', socialAuditPercent, 'percent', 1)
  pushNumericFact('S2GrievancesOpenCount', grievancesOpen, 'pure', 0)

  if (grievanceMechanism !== null) {
    esrsFacts.push({ conceptKey: 'S2GrievanceMechanismForWorkers', value: grievanceMechanism, unitId: null })
  }

  const incidentsCount = incidents.length
  pushNumericFact('S2IncidentsCount', incidentsCount, 'pure', 0)

  const totalWorkersAffected = incidents
    .map((incident) => incident.workersAffected ?? 0)
    .reduce((sum, workers) => sum + workers, 0)
  pushNumericFact('S2WorkersAffectedTotal', totalWorkersAffected, 'pure', 0)

  const socialDialogueNarrative = raw?.socialDialogueNarrative?.trim() ?? ''
  if (socialDialogueNarrative) {
    esrsFacts.push({ conceptKey: 'S2SocialDialogueNarrative', value: socialDialogueNarrative })
  }

  const remediationNarrative = raw?.remediationNarrative?.trim() ?? ''
  if (remediationNarrative) {
    esrsFacts.push({ conceptKey: 'S2RemediationNarrative', value: remediationNarrative })
  }

  const esrsTables: ModuleEsrsTable[] | undefined =
    incidents.length === 0
      ? undefined
      : [
          {
            conceptKey: 'S2IncidentsTable',
            rows: incidents.map((incident) => ({
              supplier: incident.supplier,
              country: incident.country,
              issueType: incident.issueType,
              workersAffected: incident.workersAffected,
              severityLevel: incident.severityLevel,
              remediationStatus: incident.remediationStatus,
              description: incident.description
            }))
          }
        ]

  const metrics: ModuleMetric[] = []
  if (valueChainWorkers != null) {
    metrics.push({ label: 'Arbejdstagere i værdikæden', value: valueChainWorkers, unit: 'personer' })
  }
  if (workersAtRisk != null) {
    metrics.push({ label: 'Arbejdstagere i risikogrupper', value: workersAtRisk, unit: 'personer' })
  }
  if (valueChainCoveragePercent != null) {
    metrics.push({ label: 'Screening af værdikæden', value: valueChainCoveragePercent, unit: '%' })
  }
  if (highRiskSupplierPercent != null) {
    metrics.push({ label: 'Højrisikoleverandører', value: highRiskSupplierPercent, unit: '%' })
  }
  if (livingWagePercent != null) {
    metrics.push({ label: 'Dækning af leve-/mindsteløn', value: livingWagePercent, unit: '%' })
  }
  if (bargainingPercent != null) {
    metrics.push({ label: 'Kollektive aftaler', value: bargainingPercent, unit: '%' })
  }
  if (socialAuditPercent != null) {
    metrics.push({ label: 'Gennemførte sociale audits', value: socialAuditPercent, unit: '%' })
  }
  if (grievancesOpen != null) {
    metrics.push({ label: 'Åbne klager', value: grievancesOpen, unit: 'sager' })
  }
  if (incidents.length > 0) {
    metrics.push({ label: 'Registrerede hændelser', value: incidents.length, unit: 'sager' })
    metrics.push({ label: 'Berørte arbejdstagere', value: totalWorkersAffected, unit: 'personer' })
  }

  const tables: ModuleTable[] = []
  if (incidents.length > 0) {
    tables.push({
      id: 's2-incident-list',
      title: 'Hændelser i værdikæden',
      summary: 'Registrerede hændelser fordelt på leverandører, type og status.',
      columns: [
        { key: 'supplier', label: 'Leverandør' },
        { key: 'country', label: 'Land' },
        { key: 'issueType', label: 'Issue-type' },
        { key: 'workersAffected', label: 'Berørte', align: 'end', format: 'number' },
        { key: 'severityLevel', label: 'Alvorlighed' },
        { key: 'remediationStatus', label: 'Status' },
        { key: 'description', label: 'Beskrivelse' }
      ],
      rows: incidents.map((incident) => ({
        supplier: incident.supplier,
        country: incident.country,
        issueType: incident.issueType,
        workersAffected: incident.workersAffected,
        severityLevel: incident.severityLevel,
        remediationStatus: incident.remediationStatus,
        description: incident.description
      }))
    })
  }

  const narratives: ModuleNarrative[] = []
  if (socialDialogueNarrative) {
    narratives.push({
      label: 'Social dialog og træning',
      content: socialDialogueNarrative
    })
  }
  if (remediationNarrative) {
    narratives.push({
      label: 'Afhjælpning og kompensation',
      content: remediationNarrative
    })
  }

  return {
    value,
    unit: s2.unit,
    assumptions,
    trace,
    warnings,
    ...(metrics.length > 0 ? { metrics } : {}),
    ...(narratives.length > 0 ? { narratives } : {}),
    ...(tables.length > 0 ? { tables } : {}),
    ...(esrsFacts.length > 0 ? { esrsFacts } : {}),
    ...(esrsTables ? { esrsTables } : {})
  }
}

function resolveCoverageScore(raw: S2Input | null, trace: string[], warnings: string[]): number {
  const percent = clampPercent(raw?.valueChainCoveragePercent)
  if (percent == null) {
    warnings.push('Angiv værdikædedækning i procent – feltet er nødvendigt for ESRS S2 datapunkt S2-2.2.')
    return 0
  }

  trace.push(`valueChainCoveragePercent=${percent}`)
  if (percent < s2.coverageWarningThresholdPercent) {
    warnings.push(
      `Værdikædedækningen er ${percent}% – gennemfør flere risikovurderinger for højere compliance (mål ≥ ${s2.coverageWarningThresholdPercent}%).`
    )
  }
  return normalisePercent(percent)
}

function resolveProtectionScore(raw: S2Input | null, warnings: string[], trace: string[]): number {
  const livingWage = clampPercent(raw?.livingWageCoveragePercent)
  const bargaining = clampPercent(raw?.collectiveBargainingCoveragePercent)
  const values: number[] = []

  if (livingWage != null) {
    trace.push(`livingWageCoveragePercent=${livingWage}`)
    if (livingWage < s2.livingWageWarningThresholdPercent) {
      warnings.push(
        `Kun ${livingWage}% af værdikædearbejderne er dækket af leve-/mindsteløn. Forbedr lønkrav i kontrakter (ESRS S2 datapunkt S2-5).`
      )
    }
    values.push(normalisePercent(livingWage))
  } else {
    warnings.push('Angiv andelen af værdikædearbejdere med leve- eller mindsteløn.')
  }

  if (bargaining != null) {
    trace.push(`collectiveBargainingCoveragePercent=${bargaining}`)
    if (bargaining < s2.bargainingWarningThresholdPercent) {
      warnings.push(
        `Andelen med kollektive aftaler eller repræsentation er ${bargaining}% – styrk organisationsfriheden (ESRS S2 datapunkt S2-5).`
      )
    }
    values.push(normalisePercent(bargaining))
  } else {
    warnings.push('Angiv dækning af kollektive aftaler og organisationsfrihed for leverandørarbejdere.')
  }

  if (values.length === 0) {
    return 0
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function resolveAuditScore(raw: S2Input | null, warnings: string[], trace: string[]): number {
  const percent = clampPercent(raw?.socialAuditsCompletedPercent)
  if (percent == null) {
    warnings.push('Angiv hvor stor en andel af planlagte sociale audits der er gennemført (ESRS S2 datapunkt S2-2.3).')
    return 0
  }

  trace.push(`socialAuditsCompletedPercent=${percent}`)
  if (percent < s2.auditWarningThresholdPercent) {
    warnings.push(`Kun ${percent}% af sociale audits er gennemført. Øg auditfrekvensen for højrisikoleverandører.`)
  }

  return normalisePercent(percent)
}

function resolveMechanismScore(raw: S2Input | null, warnings: string[]): number {
  if (raw?.grievanceMechanismForWorkers == null) {
    warnings.push('Angiv om leverandørarbejdere har adgang til klagemekanismer (ESRS S2 datapunkt S2-5).')
    return s2.mechanismUnknownScore
  }

  if (raw.grievanceMechanismForWorkers === false) {
    warnings.push('Ingen klagemekanisme for leverandørarbejdere. Etabler hotline eller samarbejde med fagforeninger.')
    return 0
  }

  return 1
}

function computeIncidentPenalty(
  raw: S2Input | null,
  incidents: NormalisedIncident[],
  trace: string[],
  warnings: string[]
): number {
  const totalWorkers = raw?.valueChainWorkersCount ?? null
  let penalty = 0

  incidents.forEach((incident) => {
    const severity = incident.severityLevel ?? 'medium'
    const severityWeight = s2.severityWeights[severity]
    const statusMultiplier = resolveStatusMultiplier(incident.remediationStatus)
    const ratio = resolveIncidentScale(incident.workersAffected, totalWorkers, s2.defaultIncidentScale)

    penalty += severityWeight * statusMultiplier * ratio

    if (incident.severityLevel === 'high' && incident.remediationStatus !== 'completed') {
      warnings.push(
        `Højrisiko-hændelsen "${formatLabel(incident.supplier ?? incident.country ?? 'Ukendt')}" er ikke fuldt afhjulpet.`
      )
    }

    if (incident.remediationStatus == null) {
      warnings.push(`Angiv remedieringsstatus for hændelsen på ${formatLabel(incident.supplier ?? 'leverandør')}.`)
    }

    if (incident.workersAffected != null && totalWorkers != null && totalWorkers > 0) {
      const share = (incident.workersAffected / totalWorkers) * 100
      if (share >= 10) {
        warnings.push(
          `${incident.workersAffected} arbejdstagere påvirket hos ${formatLabel(incident.supplier ?? 'leverandør')} – dokumentér kompensation og opfølgning.`
        )
      }
      trace.push(`incidentShare[${incident.index}]=${share.toFixed(1)}`)
    }

    trace.push(
      `incident[${incident.index}]=${formatLabel(incident.supplier ?? incident.country ?? 'ukendt')}|type=${
        incident.issueType ?? 'null'
      }|severity=${incident.severityLevel ?? 'null'}|status=${incident.remediationStatus ?? 'null'}|workers=${
        incident.workersAffected ?? 'null'
      }`
    )
  })

  return penalty
}

function computeGrievancePenalty(raw: S2Input | null, trace: string[], warnings: string[]): number {
  const open = clampCount(raw?.grievancesOpenCount)
  if (open == null) {
    return 0
  }

  trace.push(`grievancesOpenCount=${open}`)
  if (open > 0) {
    warnings.push(`${open} klager fra leverandørarbejdere er åbne. Følg op og luk dem for at undgå ESRS S2 advarsler.`)
  }

  return open * s2.openGrievancePenaltyPerCase
}

function normaliseIncidents(rows: S2Input['incidents']): NormalisedIncident[] {
  if (!Array.isArray(rows)) {
    return []
  }

  return rows
    .map((row, index) => {
      if (row == null) {
        return null
      }

      return {
        index,
        supplier: row.supplier == null ? null : row.supplier.trim() || null,
        country: row.country == null ? null : row.country.trim() || null,
        issueType: row.issueType ?? null,
        workersAffected: clampCount(row.workersAffected),
        severityLevel: row.severityLevel ?? null,
        remediationStatus: row.remediationStatus ?? null,
        description: row.description == null ? null : row.description.trim() || null
      }
    })
    .filter((row): row is NormalisedIncident => row != null)
}

function resolveStatusMultiplier(status: NormalisedStatus): number {
  if (status === 'completed') {
    return s2.resolvedMitigation
  }
  if (status === 'inProgress') {
    return s2.inProgressMitigation
  }
  return 1
}

function resolveIncidentScale(
  workersAffected: number | null,
  totalWorkers: number | null,
  fallback: number
): number {
  if (workersAffected != null) {
    if (totalWorkers != null && totalWorkers > 0) {
      return Math.min(1, workersAffected / totalWorkers)
    }
    return Math.min(1, workersAffected / 500)
  }

  if (totalWorkers != null && totalWorkers > 0) {
    return Math.min(1, fallback * Math.max(1, totalWorkers / 500))
  }

  return fallback
}

function normalisePercent(value: PercentLike): number {
  if (value == null || Number.isNaN(Number(value))) {
    return 0
  }
  return Math.max(0, Math.min(1, Number(value) / 100))
}

function clampPercent(value: PercentLike): number | null {
  if (value == null || Number.isNaN(Number(value))) {
    return null
  }
  const numeric = Number(value)
  return Math.max(0, Math.min(100, numeric))
}

function clampCount(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(Number(value))) {
    return null
  }
  const numeric = Math.max(0, Math.floor(Number(value)))
  return Number.isFinite(numeric) ? numeric : null
}

function formatLabel(label: string): string {
  return label.replaceAll('|', '/').replaceAll('\n', ' ').trim()
}
