/**
 * Beregning for modul S3 – berørte lokalsamfund.
 */
import type {
  ModuleEsrsFact,
  ModuleEsrsTable,
  ModuleInput,
  ModuleMetric,
  ModuleNarrative,
  ModuleResult,
  ModuleTable,
  S3Input
} from '../../types'
import { factors } from '../factors'

const { s3 } = factors

type ImpactRow = NonNullable<S3Input['incidents']>[number]

type NormalisedImpactType = NonNullable<ImpactRow['impactType']> | null
type NormalisedImpact = {
  index: number
  community: string | null
  geography: string | null
  impactType: NormalisedImpactType
  householdsAffected: number | null
  severityLevel: NormalisedSeverity
  remediationStatus: NormalisedStatus
  description: string | null
}

type NormalisedSeverity = NonNullable<ImpactRow['severityLevel']> | null
type NormalisedStatus = NonNullable<ImpactRow['remediationStatus']> | null

type PercentLike = number | null | undefined

type NarrativeField = 'engagementNarrative' | 'remedyNarrative'

export function runS3(input: ModuleInput): ModuleResult {
  const raw = (input.S3 ?? null) as S3Input | null
  const impacts = normaliseImpacts(raw?.incidents)
  const trace: string[] = []
  const warnings: string[] = []
  const assumptions = [
    'Scoren vægter dækning af konsekvensanalyser (35 %), andel højrisiko-lokalsamfund (20 %), håndtering af klager (15 %) og engagement/narrativ (15 %).',
    'Registrerede impacts reducerer score afhængigt af alvorlighed, antal husholdninger og status på remediering.'
  ]

  const communitiesIdentified = clampCount(raw?.communitiesIdentifiedCount)
  const impactAssessmentPercent = clampPercent(raw?.impactAssessmentsCoveragePercent)
  const highRiskSharePercent = clampPercent(raw?.highRiskCommunitySharePercent)
  const grievancesOpen = clampCount(raw?.grievancesOpenCount)

  const assessmentScore = resolveAssessmentScore(raw, trace, warnings)
  const highRiskScore = resolveHighRiskScore(raw, trace, warnings)
  const grievanceScore = resolveGrievanceScore(raw, trace, warnings)
  const engagementScore = resolveNarrativeScore(raw, 'engagementNarrative', warnings)
  const incidentPenalty = computeIncidentPenalty(raw, impacts, trace, warnings)

  const baseScore =
    s3.assessmentWeight * assessmentScore +
    s3.highRiskWeight * highRiskScore +
    s3.grievanceWeight * grievanceScore +
    s3.engagementWeight * engagementScore

  const penaltyRatio = Math.min(1, incidentPenalty)
  const incidentScore = s3.incidentWeight * (1 - penaltyRatio)
  const value = Number((Math.max(0, Math.min(1, baseScore + incidentScore)) * 100).toFixed(s3.resultPrecision))

  if (impacts.length === 0) {
    trace.push('impacts=0')
    if ((raw?.highRiskCommunitySharePercent ?? 0) > 0) {
      warnings.push('Ingen påvirkninger er registreret, men der er angivet højrisiko-lokalsamfund. Bekræft konsekvensanalysen.')
    }
  }

  if (needsDetailedNarrative(raw, 'remedyNarrative')) {
    warnings.push('Tilføj narrativ om afhjælpning og samarbejde med lokalsamfund (ESRS S3 §23-27).')
  }

  const esrsFacts: ModuleEsrsFact[] = []
  const pushNumericFact = (key: string, value: number | null | undefined, unitId: string, decimals: number) => {
    if (value == null || Number.isNaN(value) || !Number.isFinite(Number(value))) {
      return
    }
    esrsFacts.push({ conceptKey: key, value: Number(value), unitId, decimals })
  }

  pushNumericFact('S3CommunitiesIdentifiedCount', communitiesIdentified, 'pure', 0)
  pushNumericFact('S3ImpactAssessmentsCoveragePercent', impactAssessmentPercent, 'percent', 1)
  pushNumericFact('S3HighRiskCommunitySharePercent', highRiskSharePercent, 'percent', 1)
  pushNumericFact('S3GrievancesOpenCount', grievancesOpen, 'pure', 0)

  const incidentsCount = impacts.length
  pushNumericFact('S3ImpactsCount', incidentsCount, 'pure', 0)

  const householdsAffectedTotal = impacts
    .map((impact) => impact.householdsAffected ?? 0)
    .reduce((sum, households) => sum + households, 0)
  pushNumericFact('S3HouseholdsAffectedTotal', householdsAffectedTotal, 'pure', 0)

  const engagementNarrative = raw?.engagementNarrative?.trim() ?? ''
  if (engagementNarrative) {
    esrsFacts.push({ conceptKey: 'S3EngagementNarrative', value: engagementNarrative })
  }

  const remedyNarrative = raw?.remedyNarrative?.trim() ?? ''
  if (remedyNarrative) {
    esrsFacts.push({ conceptKey: 'S3RemedyNarrative', value: remedyNarrative })
  }

  const esrsTables: ModuleEsrsTable[] | undefined =
    impacts.length === 0
      ? undefined
      : [
          {
            conceptKey: 'S3CommunityImpactsTable',
            rows: impacts.map((impact) => ({
              community: impact.community,
              geography: impact.geography,
              impactType: impact.impactType,
              householdsAffected: impact.householdsAffected,
              severityLevel: impact.severityLevel,
              remediationStatus: impact.remediationStatus,
              description: impact.description
            }))
          }
        ]

  const metrics: ModuleMetric[] = []
  if (communitiesIdentified != null) {
    metrics.push({ label: 'Identificerede lokalsamfund', value: communitiesIdentified, unit: 'stk.' })
  }
  if (impactAssessmentPercent != null) {
    metrics.push({ label: 'Konsekvensanalyser dækket', value: impactAssessmentPercent, unit: '%' })
  }
  if (highRiskSharePercent != null) {
    metrics.push({ label: 'Højrisiko-lokalsamfund', value: highRiskSharePercent, unit: '%' })
  }
  if (grievancesOpen != null) {
    metrics.push({ label: 'Åbne lokalsamfundsklager', value: grievancesOpen, unit: 'sager' })
  }
  if (impacts.length > 0) {
    metrics.push({ label: 'Registrerede impacts', value: impacts.length, unit: 'sager' })
    metrics.push({ label: 'Berørte husholdninger', value: householdsAffectedTotal, unit: 'husholdninger' })
  }

  const tables: ModuleTable[] = []
  if (impacts.length > 0) {
    tables.push({
      id: 's3-community-impacts',
      title: 'Hændelser i lokalsamfund',
      summary: 'Oversigt over påvirkninger, berørte områder og status for afhjælpning.',
      columns: [
        { key: 'community', label: 'Lokalsamfund' },
        { key: 'geography', label: 'Geografi' },
        { key: 'impactType', label: 'Impact-type' },
        { key: 'householdsAffected', label: 'Husholdninger', align: 'end', format: 'number' },
        { key: 'severityLevel', label: 'Alvorlighed' },
        { key: 'remediationStatus', label: 'Status' },
        { key: 'description', label: 'Beskrivelse' }
      ],
      rows: impacts.map((impact) => ({
        community: impact.community,
        geography: impact.geography,
        impactType: impact.impactType,
        householdsAffected: impact.householdsAffected,
        severityLevel: impact.severityLevel,
        remediationStatus: impact.remediationStatus,
        description: impact.description
      }))
    })
  }

  const narratives: ModuleNarrative[] = []
  if (engagementNarrative) {
    narratives.push({ label: 'Engagement og samarbejde', content: engagementNarrative })
  }
  if (remedyNarrative) {
    narratives.push({ label: 'Afhjælpning og kompensation', content: remedyNarrative })
  }

  return {
    value,
    unit: s3.unit,
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

function resolveAssessmentScore(raw: S3Input | null, trace: string[], warnings: string[]): number {
  const percent = clampPercent(raw?.impactAssessmentsCoveragePercent)
  if (percent == null) {
    warnings.push('Angiv andel af aktiviteter med lokalsamfundsvurderinger (ESRS S3 datapunkt S3-2).')
    return 0
  }
  trace.push(`impactAssessmentsCoveragePercent=${percent}`)
  if (percent < s3.assessmentWarningThresholdPercent) {
    warnings.push(`Konsekvensanalyser dækker kun ${percent}% af aktiviteterne – øg dækningen for at reducere risiko.`)
  }
  return normalisePercent(percent)
}

function resolveHighRiskScore(raw: S3Input | null, trace: string[], warnings: string[]): number {
  const share = clampPercent(raw?.highRiskCommunitySharePercent)
  if (share == null) {
    warnings.push('Angiv andelen af lokalsamfund klassificeret som højrisiko.')
    return 0.5
  }
  trace.push(`highRiskCommunitySharePercent=${share}`)
  if (share > s3.highRiskWarningThresholdPercent) {
    warnings.push(`Højrisiko-lokalsamfund udgør ${share}% – styrk due diligence og engagement.`)
  }
  return Math.max(0, 1 - normalisePercent(share))
}

function resolveGrievanceScore(raw: S3Input | null, trace: string[], warnings: string[]): number {
  const open = clampCount(raw?.grievancesOpenCount)
  if (open == null) {
    return 1
  }
  trace.push(`grievancesOpenCount=${open}`)
  if (open > 0) {
    warnings.push(`${open} klager fra lokalsamfund er åbne – dokumentér plan for lukning.`)
  }
  return Math.max(0, 1 - open * s3.openGrievancePenaltyPerCase)
}

function resolveNarrativeScore(raw: S3Input | null, field: NarrativeField, warnings: string[]): number {
  const value = raw?.[field]
  if (value == null || value.trim().length === 0) {
    warnings.push('Tilføj narrativ dialog med lokalsamfund og dokumentér processer (ESRS S3 §21).')
    return 0.3
  }
  const length = value.trim().length
  if (length < 80) {
    warnings.push('Narrativet for lokalsamfund er meget kort – uddybt beskrivelse anbefales.')
    return 0.6
  }
  return Math.min(1, length / 400)
}

function needsDetailedNarrative(raw: S3Input | null, field: NarrativeField): boolean {
  const value = raw?.[field]
  return value == null || value.trim().length < 60
}

function computeIncidentPenalty(
  raw: S3Input | null,
  impacts: NormalisedImpact[],
  trace: string[],
  warnings: string[]
): number {
  const baselineCommunities = raw?.communitiesIdentifiedCount ?? null
  let penalty = 0

  impacts.forEach((impact) => {
    const severity = impact.severityLevel ?? 'medium'
    const severityWeight = s3.severityWeights[severity]
    const statusMultiplier = resolveStatusMultiplier(impact.remediationStatus)
    const ratio = resolveImpactScale(impact.householdsAffected, baselineCommunities)

    penalty += severityWeight * statusMultiplier * ratio

    if (impact.severityLevel === 'high' && impact.remediationStatus !== 'completed') {
      warnings.push(`Højrisiko-påvirkningen ved ${formatLabel(impact.community ?? 'lokalsamfund')} er ikke fuldt afhjulpet.`)
    }

    if (impact.remediationStatus == null) {
      warnings.push(`Angiv remedieringsstatus for påvirkningen ved ${formatLabel(impact.community ?? 'lokalsamfund')}.`)
    }

    if (impact.householdsAffected != null) {
      trace.push(`householdsAffected[${impact.index}]=${impact.householdsAffected}`)
      if (impact.householdsAffected >= 50) {
        warnings.push(
          `${impact.householdsAffected} husholdninger berørt i ${formatLabel(impact.community ?? 'lokalsamfund')} – dokumentér kompenserende handlinger.`
        )
      }
    }

    trace.push(
      `impact[${impact.index}]=${formatLabel(impact.community ?? impact.geography ?? 'ukendt')}|type=${
        impact.impactType ?? 'null'
      }|severity=${impact.severityLevel ?? 'null'}|status=${impact.remediationStatus ?? 'null'}|households=${
        impact.householdsAffected ?? 'null'
      }`
    )
  })

  return penalty
}

function normaliseImpacts(rows: S3Input['incidents']): NormalisedImpact[] {
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
        community: row.community == null ? null : row.community.trim() || null,
        geography: row.geography == null ? null : row.geography.trim() || null,
        impactType: row.impactType ?? null,
        householdsAffected: clampCount(row.householdsAffected),
        severityLevel: row.severityLevel ?? null,
        remediationStatus: row.remediationStatus ?? null,
        description: row.description == null ? null : row.description.trim() || null
      }
    })
    .filter((row): row is NormalisedImpact => row != null)
}

function resolveStatusMultiplier(status: NormalisedStatus): number {
  if (status === 'completed') {
    return s3.resolvedMitigation
  }
  if (status === 'inProgress') {
    return s3.inProgressMitigation
  }
  return 1
}

function resolveImpactScale(householdsAffected: number | null, baselineCommunities: number | null): number {
  if (householdsAffected != null) {
    return Math.min(1, householdsAffected / 500)
  }
  if (baselineCommunities != null && baselineCommunities > 0) {
    return Math.min(1, s3.defaultIncidentScale * Math.max(1, baselineCommunities / 5))
  }
  return s3.defaultIncidentScale
}

function clampPercent(value: PercentLike): number | null {
  if (value == null || Number.isNaN(Number(value))) {
    return null
  }
  const numeric = Number(value)
  return Math.max(0, Math.min(100, numeric))
}

function normalisePercent(value: number): number {
  return Math.max(0, Math.min(1, value / 100))
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
