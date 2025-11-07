/**
 * Beregning for modul S4 – forbrugere og slutbrugere.
 */
import type {
  ModuleEsrsFact,
  ModuleEsrsTable,
  ModuleInput,
  ModuleMetric,
  ModuleNarrative,
  ModuleResult,
  ModuleTable,
  S4Input
} from '../../types'
import { factors } from '../factors'

const { s4 } = factors

type IssueRow = NonNullable<S4Input['issues']>[number]

type NormalisedIssueType = NonNullable<IssueRow['issueType']> | null
type NormalisedIssue = {
  index: number
  productOrService: string | null
  market: string | null
  issueType: NormalisedIssueType
  usersAffected: number | null
  severityLevel: NormalisedSeverity
  remediationStatus: NormalisedStatus
  description: string | null
}

type NormalisedSeverity = NonNullable<IssueRow['severityLevel']> | null
type NormalisedStatus = NonNullable<IssueRow['remediationStatus']> | null

type PercentLike = number | null | undefined

export function runS4(input: ModuleInput): ModuleResult {
  const raw = (input.S4 ?? null) as S4Input | null
  const issues = normaliseIssues(raw?.issues)
  const trace: string[] = []
  const warnings: string[] = []
  const assumptions = [
    'Scoren vægter risikovurdering af produkter (30 %), klagehåndtering (20 %), klagemekanismer (10 %) og databeskyttelse (15 %).',
    'Indberettede hændelser reducerer scoren efter alvorlighed, antal berørte brugere og status på afhjælpning.'
  ]

  const productsAssessedPercent = clampPercent(raw?.productsAssessedPercent)
  const severeIncidents = clampCount(raw?.severeIncidentsCount)
  const recalls = clampCount(raw?.recallsCount)
  const complaintsResolvedPercent = clampPercent(raw?.complaintsResolvedPercent)
  const dataBreaches = clampCount(raw?.dataBreachesCount)
  const grievanceMechanism = raw?.grievanceMechanismInPlace ?? null
  const escalationDays = raw?.escalationTimeframeDays ?? null

  const coverageScore = resolveCoverageScore(raw, trace, warnings)
  const complaintsScore = resolveComplaintsScore(raw, trace, warnings)
  const mechanismScore = resolveMechanismScore(raw, warnings)
  const dataProtectionScore = resolveDataProtectionScore(raw, trace, warnings)
  const incidentPenalty = computeIncidentPenalty(raw, issues, trace, warnings)
  const additionalPenalty = computeAdditionalPenalty(raw, trace, warnings)

  const baseScore =
    s4.coverageWeight * coverageScore +
    s4.complaintResolutionWeight * complaintsScore +
    s4.mechanismWeight * mechanismScore +
    s4.dataProtectionWeight * dataProtectionScore

  const penaltyRatio = Math.min(1, incidentPenalty + additionalPenalty)
  const incidentScore = s4.incidentWeight * (1 - penaltyRatio)
  const value = Number((Math.max(0, Math.min(1, baseScore + incidentScore)) * 100).toFixed(s4.resultPrecision))

  if (issues.length === 0) {
    trace.push('issues=0')
    if ((raw?.severeIncidentsCount ?? 0) > 0) {
      warnings.push('Der er registreret alvorlige hændelser, men ingen detaljeret liste. Udfyld S4 impacts-tabellen.')
    }
  }

  if (!hasNarrative(raw?.vulnerableUsersNarrative)) {
    warnings.push('Tilføj narrativ om støtte til udsatte brugergrupper og adgang til produkter (ESRS S4 §18).')
  }

  if (!hasNarrative(raw?.consumerEngagementNarrative)) {
    warnings.push('Tilføj narrativ om forbrugerkommunikation, uddannelse og samarbejde (ESRS S4 §22).')
  }

  const esrsFacts: ModuleEsrsFact[] = []
  const pushNumericFact = (key: string, value: number | null | undefined, unitId: string, decimals: number) => {
    if (value == null || Number.isNaN(value) || !Number.isFinite(Number(value))) {
      return
    }
    esrsFacts.push({ conceptKey: key, value: Number(value), unitId, decimals })
  }

  pushNumericFact('S4ProductsAssessedPercent', productsAssessedPercent, 'percent', 1)
  pushNumericFact('S4SevereIncidentsCount', severeIncidents, 'pure', 0)
  pushNumericFact('S4RecallsCount', recalls, 'pure', 0)
  pushNumericFact('S4ComplaintsResolvedPercent', complaintsResolvedPercent, 'percent', 1)
  pushNumericFact('S4DataBreachesCount', dataBreaches, 'pure', 0)

  if (grievanceMechanism !== null) {
    esrsFacts.push({ conceptKey: 'S4GrievanceMechanismInPlace', value: grievanceMechanism, unitId: null })
  }

  if (escalationDays != null && Number.isFinite(escalationDays)) {
    esrsFacts.push({ conceptKey: 'S4EscalationTimeframeDays', value: Number(escalationDays), unitId: 'day', decimals: 0 })
  }

  const issuesCount = issues.length
  pushNumericFact('S4IssuesCount', issuesCount, 'pure', 0)

  const usersAffectedTotal = issues
    .map((issue) => issue.usersAffected ?? 0)
    .reduce((sum, users) => sum + users, 0)
  pushNumericFact('S4UsersAffectedTotal', usersAffectedTotal, 'pure', 0)

  const vulnerableUsersNarrative = raw?.vulnerableUsersNarrative?.trim() ?? ''
  if (vulnerableUsersNarrative) {
    esrsFacts.push({ conceptKey: 'S4VulnerableUsersNarrative', value: vulnerableUsersNarrative })
  }

  const consumerEngagementNarrative = raw?.consumerEngagementNarrative?.trim() ?? ''
  if (consumerEngagementNarrative) {
    esrsFacts.push({ conceptKey: 'S4ConsumerEngagementNarrative', value: consumerEngagementNarrative })
  }

  const esrsTables: ModuleEsrsTable[] | undefined =
    issues.length === 0
      ? undefined
      : [
          {
            conceptKey: 'S4ConsumerIssuesTable',
            rows: issues.map((issue) => ({
              productOrService: issue.productOrService,
              market: issue.market,
              issueType: issue.issueType,
              usersAffected: issue.usersAffected,
              severityLevel: issue.severityLevel,
              remediationStatus: issue.remediationStatus,
              description: issue.description
            }))
          }
        ]

  const metrics: ModuleMetric[] = []
  if (productsAssessedPercent != null) {
    metrics.push({ label: 'Risikovurderede produkter', value: productsAssessedPercent, unit: '%' })
  }
  if (complaintsResolvedPercent != null) {
    metrics.push({ label: 'Klager løst inden SLA', value: complaintsResolvedPercent, unit: '%' })
  }
  if (grievanceMechanism != null) {
    metrics.push({ label: 'Klagemekanisme etableret', value: grievanceMechanism ? 'Ja' : 'Nej' })
  }
  if (escalationDays != null) {
    metrics.push({ label: 'Eskaleringsfrist', value: escalationDays, unit: 'dage' })
  }
  if (dataBreaches != null) {
    metrics.push({ label: 'Datasikkerhedsbrud', value: dataBreaches, unit: 'sager' })
  }
  if (severeIncidents != null) {
    metrics.push({ label: 'Alvorlige hændelser', value: severeIncidents, unit: 'sager' })
  }
  if (recalls != null) {
    metrics.push({ label: 'Tilbagekaldelser', value: recalls, unit: 'sager' })
  }
  if (issues.length > 0) {
    metrics.push({ label: 'Registrerede issues', value: issues.length, unit: 'sager' })
    metrics.push({ label: 'Berørte brugere', value: usersAffectedTotal, unit: 'personer' })
  }

  const tables: ModuleTable[] = []
  if (issues.length > 0) {
    tables.push({
      id: 's4-issues',
      title: 'Hændelser for forbrugere og slutbrugere',
      summary: 'Liste over produkt-/service-relaterede issues og status for afhjælpning.',
      columns: [
        { key: 'productOrService', label: 'Produkt/tjeneste' },
        { key: 'market', label: 'Marked' },
        { key: 'issueType', label: 'Issue-type' },
        { key: 'usersAffected', label: 'Berørte', align: 'end', format: 'number' },
        { key: 'severityLevel', label: 'Alvorlighed' },
        { key: 'remediationStatus', label: 'Status' },
        { key: 'description', label: 'Beskrivelse' }
      ],
      rows: issues.map((issue) => ({
        productOrService: issue.productOrService,
        market: issue.market,
        issueType: issue.issueType,
        usersAffected: issue.usersAffected,
        severityLevel: issue.severityLevel,
        remediationStatus: issue.remediationStatus,
        description: issue.description
      }))
    })
  }

  const narratives: ModuleNarrative[] = []
  if (vulnerableUsersNarrative) {
    narratives.push({ label: 'Indsatser for udsatte brugere', content: vulnerableUsersNarrative })
  }
  if (consumerEngagementNarrative) {
    narratives.push({ label: 'Forbrugerengagement', content: consumerEngagementNarrative })
  }

  return {
    value,
    unit: s4.unit,
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

function resolveCoverageScore(raw: S4Input | null, trace: string[], warnings: string[]): number {
  const percent = clampPercent(raw?.productsAssessedPercent)
  if (percent == null) {
    warnings.push('Angiv andel af produkter/tjenester med risikovurdering (ESRS S4 datapunkt S4-2).')
    return 0
  }
  trace.push('productsAssessedPercent=' + percent)
  if (percent < s4.productsCoverageWarningPercent) {
    warnings.push(
      'Kun ' +
        percent +
        '% af produkterne er risikovurderet – udvid processerne for at dække hele porteføljen.'
    )
  }
  return normalisePercent(percent)
}

function resolveComplaintsScore(raw: S4Input | null, trace: string[], warnings: string[]): number {
  const percent = clampPercent(raw?.complaintsResolvedPercent)
  if (percent == null) {
    warnings.push('Angiv hvor stor en andel af klager der løses inden for SLA.')
    return 0.5
  }
  trace.push('complaintsResolvedPercent=' + percent)
  if (percent < s4.complaintResolutionWarningPercent) {
    warnings.push('Kun ' + percent + '% af klagerne løses rettidigt – styrk kundeserviceprocesser.')
  }
  return normalisePercent(percent)
}

function resolveMechanismScore(raw: S4Input | null, warnings: string[]): number {
  if (raw?.grievanceMechanismInPlace == null) {
    warnings.push('Angiv om der findes klagemekanisme for forbrugere/slutbrugere.')
    return 0.5
  }
  if (raw.grievanceMechanismInPlace === false) {
    warnings.push('Ingen klagemekanisme markeret. Etabler hotline eller digitale kontaktpunkter.')
    return 0
  }
  if (raw.escalationTimeframeDays != null && raw.escalationTimeframeDays > s4.escalationWarningDays) {
    warnings.push(
      'Behandlingstiden for klager er ' +
        raw.escalationTimeframeDays +
        ' dage – reducer til under ' +
        s4.escalationWarningDays +
        ' dage.'
    )
  }
  return 1
}

function resolveDataProtectionScore(raw: S4Input | null, trace: string[], warnings: string[]): number {
  const breaches = clampCount(raw?.dataBreachesCount)
  if (breaches == null) {
    warnings.push('Angiv antal registrerede brud på datasikkerhed (ESRS S4 datapunkt S4-4).')
    return 0.6
  }
  trace.push('dataBreachesCount=' + breaches)
  if (breaches > 0) {
    warnings.push(
      String(breaches) +
        ' brud på datasikkerhed registreret – gennemgå kontroller og underret relevante myndigheder.'
    )
  }
  return Math.max(0, 1 - breaches * 0.15)
}

function computeIncidentPenalty(
  raw: S4Input | null,
  issues: NormalisedIssue[],
  trace: string[],
  warnings: string[]
): number {
  let penalty = 0

  issues.forEach((issue) => {
    const severity = issue.severityLevel ?? 'medium'
    const severityWeight = s4.severityWeights[severity]
    const statusMultiplier = resolveStatusMultiplier(issue.remediationStatus)
    const ratio = resolveIssueScale(issue.usersAffected)

    penalty += severityWeight * statusMultiplier * ratio

    if (issue.severityLevel === 'high' && issue.remediationStatus !== 'completed') {
      warnings.push(
        'Højrisiko-hændelsen for ' +
          formatLabel(issue.productOrService ?? 'produkt') +
          ' er ikke fuldt afhjulpet.'
      )
    }

    if (issue.remediationStatus == null) {
      warnings.push(
        'Angiv remedieringsstatus for hændelsen på ' +
          formatLabel(issue.productOrService ?? 'produkt') +
          '.'
      )
    }

    if (issue.usersAffected != null) {
      trace.push('usersAffected[' + issue.index + ']=' + issue.usersAffected)
      if (issue.usersAffected >= 500) {
        warnings.push(
          issue.usersAffected +
            ' brugere påvirket af ' +
            formatLabel(issue.productOrService ?? 'produkt') +
            ' – beskriv tilbagekaldelse og kompensation.'
        )
      }
    }

    trace.push(
      'issue[' +
        issue.index +
        ']=' +
        formatLabel(issue.productOrService ?? issue.market ?? 'ukendt') +
        '|type=' +
        (issue.issueType ?? 'null') +
        '|severity=' +
        (issue.severityLevel ?? 'null') +
        '|status=' +
        (issue.remediationStatus ?? 'null') +
        '|users=' +
        (issue.usersAffected ?? 'null')
    )
  })

  return penalty
}

function computeAdditionalPenalty(raw: S4Input | null, trace: string[], warnings: string[]): number {
  const severe = clampCount(raw?.severeIncidentsCount) ?? 0
  const recalls = clampCount(raw?.recallsCount) ?? 0

  trace.push('severeIncidentsCount=' + severe)
  trace.push('recallsCount=' + recalls)

  if (severe > 0) {
    warnings.push(
      String(severe) +
        ' alvorlige hændelser rapporteret – offentliggør detaljer og kompensation.'
    )
  }

  if (recalls > 0) {
    warnings.push(
      String(recalls) +
        ' produkt-/service-recalls registreret. Sikr dokumentation for forløb og kommunikation.'
    )
  }

  return severe * (s4.defaultIncidentScale * 2) + recalls * 0.05
}

function normaliseIssues(rows: S4Input['issues']): NormalisedIssue[] {
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
        productOrService: row.productOrService == null ? null : row.productOrService.trim() || null,
        market: row.market == null ? null : row.market.trim() || null,
        issueType: row.issueType ?? null,
        usersAffected: clampCount(row.usersAffected),
        severityLevel: row.severityLevel ?? null,
        remediationStatus: row.remediationStatus ?? null,
        description: row.description == null ? null : row.description.trim() || null
      }
    })
    .filter((row): row is NormalisedIssue => row != null)
}

function resolveStatusMultiplier(status: NormalisedStatus): number {
  if (status === 'completed') {
    return s4.resolvedMitigation
  }
  if (status === 'inProgress') {
    return s4.inProgressMitigation
  }
  return 1
}

function resolveIssueScale(usersAffected: number | null): number {
  if (usersAffected == null) {
    return s4.defaultIncidentScale
  }
  return Math.min(1, usersAffected / 1000)
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

function normalisePercent(value: number): number {
  return Math.max(0, Math.min(1, value / 100))
}

function hasNarrative(value: string | null | undefined): boolean {
  return value != null && value.trim().length >= 80
}

function formatLabel(label: string): string {
  return label.replaceAll('|', '/').replaceAll('\n', ' ').trim()
}
