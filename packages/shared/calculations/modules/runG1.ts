/**
 * Beregning for modul G1 – governance-politikker og targets.
 */
import type {
  G1Input,
  ModuleEsrsFact,
  ModuleEsrsTable,
  ModuleInput,
  ModuleResult
} from '../../types'
import { factors } from '../factors'

const { g1 } = factors

type PolicyRow = NonNullable<G1Input['policies']>[number]

type TargetRow = NonNullable<G1Input['targets']>[number]

type NormalisedPolicy = {
  index: number
  topic: string
  status: NonNullable<PolicyRow['status']> | null
  owner: string | null
  lastReviewed: string | null
}

type NormalisedTarget = {
  index: number
  topic: string
  baselineYear: number | null
  targetYear: number | null
  targetValue: number | null
  unit: string | null
  status: NonNullable<TargetRow['status']> | null
}

const policyStatusScores = g1.policyStatusScores
const targetStatusScores = g1.targetStatusScores

export function runG1(input: ModuleInput): ModuleResult {
  const raw = (input.G1 ?? null) as G1Input | null
  const policies = normalisePolicies(raw?.policies)
  const targets = normaliseTargets(raw?.targets)
  const trace: string[] = []
  const warnings: string[] = []
  const assumptions = [
    'Scoren vægter politikker (40 %), mål/targets (40 %) og bestyrelsestilsyn (20 %).',
    'Politikstatus oversættes til en 0-1 skala: approved (1.0), inReview (0.7), draft (0.4), retired (0.2), missing (0).',
    'Targetstatus oversættes til en 0-1 skala: onTrack (1.0), lagging (0.6), offTrack (0.2), notStarted (0.1).'
  ]

  if (policies.length === 0) {
    warnings.push('Ingen governance-politikker registreret. Tilføj mindst ESG-, etik- eller menneskerettighedspolitikker.')
    trace.push('policies=0')
  }

  if (targets.length === 0) {
    warnings.push('Ingen governance- eller ESG-targets registreret. Angiv kvantitative mål for compliance.')
    trace.push('targets=0')
  }

  const policyScore = computeAverageScore(
    policies.map((policy) => {
      if (policy.status == null) {
        warnings.push(`Status mangler for politikken "${policy.topic}".`)
        return 0
      }
      const statusScore = policyStatusScores[policy.status]
      if (statusScore === undefined) {
        warnings.push(`Ukendt politikstatus for "${policy.topic}". Opdater input.`)
        return 0
      }
      if (policy.owner == null) {
        warnings.push(`Angiv ejer/ansvarlig for politikken "${policy.topic}".`)
      }
      return statusScore
    })
  )

  const targetScore = computeAverageScore(
    targets.map((target) => {
      if (target.status == null) {
        warnings.push(`Status mangler for target "${target.topic}".`)
        return 0
      }
      const statusScore = targetStatusScores[target.status]
      if (statusScore === undefined) {
        warnings.push(`Ukendt targetstatus for "${target.topic}".`)
        return 0
      }

      if (target.targetYear != null && target.baselineYear != null && target.targetYear <= target.baselineYear) {
        warnings.push(`Target "${target.topic}" har målår ${target.targetYear} før baseline ${target.baselineYear}. Kontrollér.`)
      }

      return statusScore
    })
  )

  const oversightScore = resolveOversightScore(raw, warnings)

  const policyNormalised = normaliseCollectionScore(policyScore, policies.length, g1.minPoliciesForFullScore)
  const targetNormalised = normaliseCollectionScore(targetScore, targets.length, g1.minTargetsForFullScore)

  const totalScore =
    g1.policyWeight * policyNormalised + g1.targetWeight * targetNormalised + g1.oversightWeight * oversightScore
  const value = Number((Math.max(0, Math.min(totalScore, 1)) * 100).toFixed(g1.resultPrecision))

  policies.forEach((policy) => {
    trace.push(
      `policy[${policy.index}]=${encodeTrace(policy.topic)}|status=${policy.status ?? 'null'}|owner=${policy.owner ?? 'null'}`
    )
  })

  targets.forEach((target) => {
    trace.push(
      `target[${target.index}]=${encodeTrace(target.topic)}|status=${target.status ?? 'null'}|baseline=${
        target.baselineYear ?? 'null'
      }|targetYear=${target.targetYear ?? 'null'}`
    )
  })

  const governanceNarrative = raw?.governanceNarrative?.trim() ?? ''

  if (governanceNarrative.length < 40) {
    warnings.push('Tilføj narrativ om governance-strukturen for at dokumentere roller, incitamenter og tilsyn.')
  }

  const esrsFacts: ModuleEsrsFact[] = []
  const pushNumericFact = (key: string, value: number | null | undefined, unitId: string, decimals: number) => {
    if (value == null || Number.isNaN(value) || !Number.isFinite(Number(value))) {
      return
    }
    esrsFacts.push({ conceptKey: key, value: Number(value), unitId, decimals })
  }

  pushNumericFact('G1PolicyCount', policies.length, 'pure', 0)
  pushNumericFact('G1TargetCount', targets.length, 'pure', 0)
  pushNumericFact('G1PolicyAverageScore', policyScore == null ? null : policyScore * 100, 'percent', 1)
  pushNumericFact('G1TargetAverageScore', targetScore == null ? null : targetScore * 100, 'percent', 1)
  pushNumericFact('G1OversightScore', oversightScore * 100, 'percent', 1)

  if (raw?.boardOversight != null) {
    esrsFacts.push({ conceptKey: 'G1BoardOversight', value: raw.boardOversight, unitId: null })
  }

  if (governanceNarrative) {
    esrsFacts.push({ conceptKey: 'G1GovernanceNarrative', value: governanceNarrative })
  }

  const esrsTables: ModuleEsrsTable[] = []
  if (policies.length > 0) {
    esrsTables.push({
      conceptKey: 'G1PoliciesTable',
      rows: policies.map((policy) => ({
        topic: policy.topic,
        status: policy.status,
        owner: policy.owner,
        lastReviewed: policy.lastReviewed
      }))
    })
  }

  if (targets.length > 0) {
    esrsTables.push({
      conceptKey: 'G1TargetsTable',
      rows: targets.map((target) => ({
        topic: target.topic,
        baselineYear: target.baselineYear,
        targetYear: target.targetYear,
        targetValue: target.targetValue,
        unit: target.unit,
        status: target.status
      }))
    })
  }

  return {
    value,
    unit: g1.unit,
    assumptions,
    trace,
    warnings,
    ...(esrsFacts.length > 0 ? { esrsFacts } : {}),
    ...(esrsTables.length > 0 ? { esrsTables } : {})
  }
}

function normalisePolicies(rows: G1Input['policies']): NormalisedPolicy[] {
  if (!Array.isArray(rows)) {
    return []
  }

  return rows
    .map((row, index) => {
      const topic = (row?.topic ?? '').trim()
      if (topic.length === 0) {
        return null
      }
      return {
        index,
        topic,
        status: row?.status ?? null,
        owner: row?.owner == null ? null : row.owner.trim() || null,
        lastReviewed: row?.lastReviewed == null ? null : row.lastReviewed.trim() || null
      }
    })
    .filter((row): row is NormalisedPolicy => row != null)
}

function normaliseTargets(rows: G1Input['targets']): NormalisedTarget[] {
  if (!Array.isArray(rows)) {
    return []
  }

  return rows
    .map((row, index) => {
      const topic = (row?.topic ?? '').trim()
      if (topic.length === 0) {
        return null
      }
      return {
        index,
        topic,
        baselineYear: clampYear(row?.baselineYear),
        targetYear: clampYear(row?.targetYear),
        targetValue: row?.targetValue == null || Number.isNaN(row.targetValue) ? null : Number(row.targetValue),
        unit: row?.unit == null ? null : row.unit.trim() || null,
        status: row?.status ?? null
      }
    })
    .filter((row): row is NormalisedTarget => row != null)
}

function computeAverageScore(scores: number[]): number | null {
  const valid = scores.filter((score) => Number.isFinite(score))
  if (valid.length === 0) {
    return null
  }
  const sum = valid.reduce((acc, score) => acc + score, 0)
  return sum / valid.length
}

function resolveOversightScore(raw: G1Input | null, warnings: string[]): number {
  if (raw?.boardOversight == null) {
    warnings.push('Angiv om bestyrelsen fører tilsyn med ESG/CSRD. Det er et eksplicit ESRS G1-krav.')
    return 0.5
  }

  if (raw.boardOversight === false) {
    warnings.push('Bestyrelsen fører ikke tilsyn med ESG – etabler governance struktur for compliance.')
    return 0
  }

  return 1
}

function normaliseCollectionScore(
  averageScore: number | null,
  itemCount: number,
  threshold: number
): number {
  if (averageScore == null || itemCount === 0) {
    return 0
  }
  const coverageRatio = Math.min(1, itemCount / Math.max(1, threshold))
  return Math.max(0, Math.min(1, averageScore * coverageRatio))
}

function clampYear(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(value)) {
    return null
  }
  const year = Math.round(value)
  if (year < 1990 || year > 2100) {
    return null
  }
  return year
}

function encodeTrace(value: string): string {
  return value.replaceAll('|', '/').replaceAll('\n', ' ')
}
