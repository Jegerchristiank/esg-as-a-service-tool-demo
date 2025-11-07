/**
 * Beregning for modul D2 – dobbelt væsentlighed og CSRD-gapstatus.
 */
import type {
  D2Input,
  ModuleEsrsFact,
  ModuleEsrsTable,
  ModuleInput,
  ModuleResult
} from '../../types'
import { factors } from '../factors'

const { d2 } = factors

const MAX_FINANCIAL_SCORE = 5
const UNKNOWN_LABEL = 'Ikke angivet'

type MaterialityTopic = NonNullable<D2Input['materialTopics']>[number]

type NormalisedTopic = {
  index: number
  name: string
  description: string | null
  impactType: NonNullable<MaterialityTopic['impactType']>
  severity: NonNullable<MaterialityTopic['severity']>
  likelihood: NonNullable<MaterialityTopic['likelihood']>
  valueChainSegment: MaterialityTopic['valueChainSegment']
  remediationStatus: NonNullable<MaterialityTopic['remediationStatus']>
  riskType: MaterialityTopic['riskType']
  timeline: MaterialityTopic['timeline']
  responsible: MaterialityTopic['responsible']
  csrdGapStatus: MaterialityTopic['csrdGapStatus']
  impactScore: number
  financialScore: number | null
  timelineScore: number | null
  combinedScore: number
  missingFinancial: boolean
  missingTimeline: boolean
  financialOverrideApproved: boolean
  financialOverrideJustification: string | null
  eligibleForPrioritisation: boolean
  priorityBand: 'priority' | 'attention' | 'monitor'
}

const impactTypeLabelMap = {
  actual: 'Faktisk påvirkning',
  potential: 'Potentiel påvirkning'
} as const

const severityLabelMap = {
  minor: 'Begrænset alvor',
  moderate: 'Middel alvor',
  major: 'Væsentlig alvor',
  severe: 'Kritisk alvor'
} as const

const likelihoodLabelMap = {
  rare: 'Sjælden',
  unlikely: 'Usandsynlig',
  possible: 'Mulig',
  likely: 'Sandsynlig',
  veryLikely: 'Meget sandsynlig'
} as const

const valueChainLabelMap: Record<string, string> = {
  ownOperations: 'Egne aktiviteter',
  upstream: 'Upstream',
  downstream: 'Downstream',
  unknown: UNKNOWN_LABEL
}

const remediationLabelMap = {
  none: 'Ingen afhjælpning',
  planned: 'Planlagt indsats',
  inPlace: 'Afhjælpning implementeret'
} as const

export function runD2(input: ModuleInput): ModuleResult {
  const raw = (input.D2 ?? null) as D2Input | null
  const topics = Array.isArray(raw?.materialTopics) ? raw!.materialTopics! : []

  const assumptions = [
    'Alvor/omfang multipliceres med sandsynlighed og justeres for påvirkningstype samt eksisterende afhjælpning.',
    'Finansielle scorer normaliseres fra 0-5 til 0-100 og indgår kun, når de er udfyldt.',
    'Tidslinjer vægter kort sigt højest; samlet prioritet er gennemsnittet af de tilgængelige dimensioner.'
  ]

  const trace: string[] = [`inputTopics=${topics.length}`]
  const warnings: string[] = []

  if (topics.length === 0) {
    warnings.push('Ingen væsentlige emner registreret. Tilføj materialitetsemner for at beregne prioritet.')
    return {
      value: 0,
      unit: d2.unit,
      assumptions,
      trace,
      warnings
    }
  }

  const severityWeights = d2.severityWeights
  const likelihoodWeights = d2.likelihoodWeights
  const timelineWeights = d2.timelineWeights
  const maxSeverityWeight = Math.max(...Object.values(severityWeights))
  const maxLikelihoodWeight = Math.max(...Object.values(likelihoodWeights))
  const maxMatrixScore = maxSeverityWeight * maxLikelihoodWeight
  const maxTimelineWeight = Math.max(...Object.values(timelineWeights))
  const missingFinancialPenalty = d2.missingFinancialPenalty ?? 0.6
  const financialOverrideMinLength = d2.financialOverrideJustificationMinLength ?? 20

  assumptions.push(
    `Manglende finansielle scorer reducerer kombinationsscoren med faktor ${missingFinancialPenalty}, medmindre en begrundet undtagelse er bekræftet.`
  )

  const normalisedTopics: NormalisedTopic[] = []
  const matrixCounts = new Map<string, number>()
  const impactTypeCounts = new Map<string, number>()
  const valueChainCounts = new Map<string, number>()
  const remediationCounts = new Map<string, number>()

  topics.forEach((topic, index) => {
    const name = (topic?.title ?? '').trim()
    if (name.length === 0) {
      warnings.push(`Emne ${index + 1} mangler titel og indgår ikke i beregningen.`)
      trace.push(`topic[${index}]=skipped|reason=no-title`)
      return
    }

    const severityKey = topic?.severity ?? null
    if (!severityKey || !(severityKey in severityWeights)) {
      warnings.push(`Emnet "${name}" mangler registreret alvor/omfang og indgår ikke i beregningen.`)
      trace.push(`topic[${index}]=skipped|reason=no-severity|name=${encodeTrace(name)}`)
      return
    }

    const likelihoodKey = topic?.likelihood ?? null
    if (!likelihoodKey || !(likelihoodKey in likelihoodWeights)) {
      warnings.push(`Emnet "${name}" mangler sandsynlighed og indgår ikke i beregningen.`)
      trace.push(`topic[${index}]=skipped|reason=no-likelihood|name=${encodeTrace(name)}`)
      return
    }

    const severityWeight = severityWeights[severityKey as keyof typeof severityWeights]
    const likelihoodWeight = likelihoodWeights[likelihoodKey as keyof typeof likelihoodWeights]
    const baseMatrixScore = severityWeight * likelihoodWeight

    const impactTypeKey = topic?.impactType && topic.impactType in d2.impactTypeModifiers ? topic.impactType : null
    const resolvedImpactType = (impactTypeKey ?? 'actual') as keyof typeof d2.impactTypeModifiers
    if (!impactTypeKey) {
      warnings.push(`Påvirkningstype mangler for "${name}" – antager faktisk påvirkning.`)
    }

    const remediationKey =
      topic?.remediationStatus && topic.remediationStatus in d2.remediationModifiers
        ? topic.remediationStatus
        : null
    const resolvedRemediation = (remediationKey ?? 'none') as keyof typeof d2.remediationModifiers
    if (!remediationKey) {
      warnings.push(`Afhjælpning er ikke registreret for "${name}" – antager ingen afhjælpning.`)
    }

    const impactModifier = d2.impactTypeModifiers[resolvedImpactType]
    const remediationModifier = d2.remediationModifiers[resolvedRemediation]
    const impactDimension = (baseMatrixScore / maxMatrixScore) * impactModifier * remediationModifier
    const impactScore = round(impactDimension * 100, 1)

    const financialRaw = clampFinancialScore(topic?.financialScore)
    const financialDimension = financialRaw != null ? financialRaw / MAX_FINANCIAL_SCORE : null
    const financialScore = financialDimension != null ? round(financialDimension * 100, 1) : null
    const missingFinancial = financialDimension == null

    const rawFinancialOverride =
      typeof topic?.financialExceptionJustification === 'string'
        ? topic.financialExceptionJustification.trim()
        : null
    const hasFinancialOverrideToggle = topic?.financialExceptionApproved === true
    const hasFinancialOverrideJustification =
      rawFinancialOverride != null && rawFinancialOverride.length >= financialOverrideMinLength
    const hasFinancialOverride = hasFinancialOverrideToggle && hasFinancialOverrideJustification

    if (missingFinancial) {
      warnings.push(
        `Finansiel score mangler for "${name}". Udfyld 0-5 eller registrér en begrundet undtagelse for at fastholde prioriteten.`
      )
    }

    if (hasFinancialOverrideToggle && !hasFinancialOverrideJustification) {
      warnings.push(
        `Undtagelse for manglende finansiel score på "${name}" kræver en begrundelse på mindst ${financialOverrideMinLength} tegn.`
      )
    }

    if (!hasFinancialOverrideToggle && rawFinancialOverride && rawFinancialOverride.length > 0) {
      warnings.push(
        `Begrundelse er angivet for finansiel undtagelse på "${name}", men afkrydsning mangler. Bekræft undtagelsen eller udfyld en score.`
      )
    }

    if (missingFinancial && hasFinancialOverride) {
      warnings.push(`Finansiel undtagelse er bekræftet for "${name}". Scoren markeres som dokumenteret uden tal.`)
    }

    const timelineKey = topic?.timeline ?? null
    const timelineWeight = timelineKey ? timelineWeights[timelineKey as keyof typeof timelineWeights] : null
    const timelineDimension = timelineWeight != null ? timelineWeight / maxTimelineWeight : null
    const timelineScore = timelineDimension != null ? round(timelineDimension * 100, 1) : null
    const missingTimeline = timelineDimension == null

    const activeDimensions = 1 + (financialDimension != null ? 1 : 0) + (timelineDimension != null ? 1 : 0)
    const combinedBase =
      (impactDimension + (financialDimension ?? 0) + (timelineDimension ?? 0)) / activeDimensions
    const penalisedCombined =
      missingFinancial && !hasFinancialOverride ? combinedBase * missingFinancialPenalty : combinedBase
    const combinedScore = round(penalisedCombined * 100, 1)

    const eligibleForPrioritisation = !missingFinancial || hasFinancialOverride

    const description = typeof topic?.description === 'string' ? topic.description.trim() : null
    const cleanedDescription = description && description.length > 0 ? description : null

    const valueChainKey = topic?.valueChainSegment ?? null
    const valueChainForCount = valueChainKey ?? 'unknown'

    const computedPriorityBand: NormalisedTopic['priorityBand'] =
      combinedScore >= d2.priorityThreshold
        ? 'priority'
        : combinedScore >= d2.attentionThreshold
        ? 'attention'
        : 'monitor'

    const priorityBand: NormalisedTopic['priorityBand'] = eligibleForPrioritisation
      ? computedPriorityBand
      : 'monitor'

    normalisedTopics.push({
      index,
      name,
      description: cleanedDescription,
      impactType: resolvedImpactType,
      severity: severityKey,
      likelihood: likelihoodKey,
      valueChainSegment: valueChainKey,
      remediationStatus: resolvedRemediation,
      riskType: topic?.riskType ?? null,
      timeline: timelineKey,
      responsible: topic?.responsible ?? null,
      csrdGapStatus: topic?.csrdGapStatus ?? null,
      impactScore,
      financialScore,
      timelineScore,
      combinedScore,
      missingFinancial,
      missingTimeline,
      financialOverrideApproved: hasFinancialOverride,
      financialOverrideJustification: hasFinancialOverride ? rawFinancialOverride : null,
      eligibleForPrioritisation,
      priorityBand
    })

    const matrixKey = `${severityKey}|${likelihoodKey}`
    matrixCounts.set(matrixKey, (matrixCounts.get(matrixKey) ?? 0) + 1)
    impactTypeCounts.set(resolvedImpactType, (impactTypeCounts.get(resolvedImpactType) ?? 0) + 1)
    valueChainCounts.set(valueChainForCount, (valueChainCounts.get(valueChainForCount) ?? 0) + 1)
    remediationCounts.set(resolvedRemediation, (remediationCounts.get(resolvedRemediation) ?? 0) + 1)

    const financialTrace = financialScore != null ? financialScore.toFixed(1) : 'null'
    const timelineTrace = timelineScore != null ? timelineScore.toFixed(1) : 'null'
    const overrideTrace = hasFinancialOverride
      ? 'approved'
      : hasFinancialOverrideToggle
      ? 'pending'
      : 'none'

    trace.push(
      `topic[${index}]=${encodeTrace(name)}|severity=${severityKey}|likelihood=${likelihoodKey}|impact=${impactScore.toFixed(
        1
      )}|financial=${financialTrace}|timelineScore=${timelineTrace}|combined=${combinedScore.toFixed(1)}|riskType=${
        topic?.riskType ?? 'null'
      }|timeline=${timelineKey ?? 'null'}|gap=${topic?.csrdGapStatus ?? 'null'}|financialOverride=${overrideTrace}|eligible=${
        eligibleForPrioritisation ? 'yes' : 'no'
      }`
    )
  })

  if (normalisedTopics.length === 0) {
    warnings.push('Ingen gyldige emner med scorer kunne beregnes. Kontrollér inputtene.')
    trace.push('validTopics=0')
    return {
      value: 0,
      unit: d2.unit,
      assumptions,
      trace,
      warnings
    }
  }

  const totalScore = normalisedTopics.reduce((sum, topic) => sum + topic.combinedScore, 0)
  const averageScore = totalScore / normalisedTopics.length
  const value = Number(round(averageScore, d2.resultPrecision).toFixed(d2.resultPrecision))

  const prioritisedTopics = normalisedTopics
    .filter((topic) => topic.eligibleForPrioritisation && topic.combinedScore >= d2.priorityThreshold)
    .sort((a, b) => b.combinedScore - a.combinedScore)
  const attentionTopics = normalisedTopics
    .filter(
      (topic) =>
        topic.eligibleForPrioritisation &&
        topic.combinedScore >= d2.attentionThreshold &&
        topic.combinedScore < d2.priorityThreshold
    )
    .sort((a, b) => b.combinedScore - a.combinedScore)

  const topSummary = prioritisedTopics
    .slice(0, d2.summaryLimit)
    .map((topic) => `${topic.name} (${topic.combinedScore.toFixed(1)})`)

  if (topSummary.length > 0) {
    assumptions.push(`Top prioriterede emner: ${topSummary.join(', ')}.`)
  } else {
    assumptions.push(`Ingen emner overstiger prioritetstærsklen på ${d2.priorityThreshold}.`)
  }

  if (attentionTopics.length > 0) {
    const list = attentionTopics
      .slice(0, d2.summaryLimit)
      .map((topic) => `${topic.name} (${topic.combinedScore.toFixed(1)})`)
    assumptions.push(`Emner tæt på prioritet: ${list.join(', ')}.`)
  }

  prioritisedTopics.forEach((topic) => {
    const priorityLabel =
      topic.riskType === 'opportunity'
        ? 'Udnyt mulighed'
        : topic.riskType === 'both'
        ? 'Håndtér risiko/mulighed'
        : 'Håndtér risiko'

    warnings.push(
      `Prioriteret emne: ${topic.name} (score ${topic.combinedScore.toFixed(1)}) – ${priorityLabel}.`
    )

    const gapStatus = topic.csrdGapStatus ?? null
    if (gapStatus && d2.gapWarningStatuses.includes(gapStatus)) {
      warnings.push(`CSRD-gap mangler for ${topic.name}. Fastlæg dokumentation og kontroller krav.`)
    }

    if (d2.timelineWarningForPriority && topic.missingTimeline) {
      warnings.push(`Angiv tidslinje for ${topic.name}, så handling kan planlægges.`)
    }

    if (d2.responsibleWarningForPriority && !topic.responsible) {
      warnings.push(`Tildel ansvarlig for ${topic.name} for at sikre opfølgning.`)
    }
  })

  trace.push(`validTopics=${normalisedTopics.length}`)
  trace.push(`averageCompositeScore=${averageScore.toFixed(2)}`)
  trace.push(`prioritised=${prioritisedTopics.length}`)
  trace.push(`attention=${attentionTopics.length}`)

  const narratives = normalisedTopics
    .map((topic) => {
      if (!topic.description) {
        return null
      }
      return {
        label: topic.name,
        content: topic.description
      }
    })
    .filter((entry): entry is { label: string; content: string } => entry !== null)

  const responsibilities = normalisedTopics
    .map((topic) => {
      if (!topic.responsible) {
        return null
      }
      return {
        subject: topic.name,
        owner: topic.responsible,
        role: 'Materialitet'
      }
    })
    .filter((entry): entry is { subject: string; owner: string; role: string } => entry !== null)

  const notes = normalisedTopics.map((topic) => {
    const impactTypeLabel = impactTypeLabelMap[topic.impactType] ?? topic.impactType
    const severityLabel = severityLabelMap[topic.severity] ?? topic.severity
    const likelihoodLabel = likelihoodLabelMap[topic.likelihood] ?? topic.likelihood
    const valueChainLabel =
      topic.valueChainSegment && valueChainLabelMap[topic.valueChainSegment]
        ? valueChainLabelMap[topic.valueChainSegment]
        : valueChainLabelMap['unknown']
    const remediationLabel = remediationLabelMap[topic.remediationStatus] ?? topic.remediationStatus

    return {
      label: topic.name,
      detail: `Impact-type: ${impactTypeLabel} · Alvor: ${severityLabel} · Sandsynlighed: ${likelihoodLabel} · Værdikæde: ${
        valueChainLabel
      } · Afhjælpning: ${remediationLabel}`
    }
  })

  const gapAlerts = normalisedTopics
    .filter((topic) => topic.csrdGapStatus === 'missing')
    .map((topic) => topic.name)

  const esrsFacts: ModuleEsrsFact[] = []
  const pushNumericFact = (key: string, factValue: number, unitId: string, decimals: number) => {
    if (!Number.isFinite(factValue)) {
      return
    }
    esrsFacts.push({ conceptKey: key, value: Number(factValue), unitId, decimals })
  }

  pushNumericFact('D2ValidTopicsCount', normalisedTopics.length, 'pure', 0)
  pushNumericFact('D2PrioritisedTopicsCount', prioritisedTopics.length, 'pure', 0)
  pushNumericFact('D2AttentionTopicsCount', attentionTopics.length, 'pure', 0)
  pushNumericFact('D2GapAlertsCount', gapAlerts.length, 'pure', 0)
  pushNumericFact('D2AverageWeightedScore', round(averageScore, 1), 'percent', 1)

  const esrsTables: ModuleEsrsTable[] = []

  if (normalisedTopics.length > 0) {
    esrsTables.push({
      conceptKey: 'D2MaterialTopicsTable',
      rows: normalisedTopics.map((topic) => ({
        name: topic.name,
        impactType: topic.impactType,
        severity: topic.severity,
        likelihood: topic.likelihood,
        impactScore: topic.impactScore,
        financialScore: topic.financialScore,
        timelineScore: topic.timelineScore,
        combinedScore: topic.combinedScore,
        riskType: topic.riskType ?? null,
        timeline: topic.timeline ?? null,
        valueChainSegment: topic.valueChainSegment ?? null,
        remediationStatus: topic.remediationStatus,
        responsible: topic.responsible ?? null,
        csrdGapStatus: topic.csrdGapStatus ?? null,
        missingFinancial: topic.missingFinancial,
        missingTimeline: topic.missingTimeline,
        financialOverrideApproved: topic.financialOverrideApproved,
        financialOverrideJustification: topic.financialOverrideJustification,
        eligibleForPrioritisation: topic.eligibleForPrioritisation,
        priorityBand: topic.priorityBand
      }))
    })
  }

  if (gapAlerts.length > 0) {
    esrsTables.push({
      conceptKey: 'D2GapAlertsTable',
      rows: gapAlerts.map((topic) => ({ topic }))
    })
  }

  const sortedTopics = [...normalisedTopics].sort((a, b) => b.combinedScore - a.combinedScore)
  const summaryTopics = sortedTopics.slice(0, d2.summaryLimit).map((topic) => ({
    name: topic.name,
    description: topic.description,
    riskType: topic.riskType ?? null,
    impactType: topic.impactType,
    severity: topic.severity,
    likelihood: topic.likelihood,
    impactScore: topic.impactScore,
    financialScore: topic.financialScore,
    timelineScore: topic.timelineScore,
    combinedScore: topic.combinedScore,
    timeline: topic.timeline ?? null,
    valueChainSegment: topic.valueChainSegment ?? null,
    responsible: topic.responsible ?? null,
    csrdGapStatus: topic.csrdGapStatus ?? null,
    remediationStatus: topic.remediationStatus,
    eligibleForPrioritisation: topic.eligibleForPrioritisation,
    priorityBand: topic.priorityBand
  }))

  const impactMatrix = Array.from(matrixCounts.entries())
    .map(([key, count]) => {
      const [severity, likelihood] = key.split('|') as [string, string]
      return {
        severity,
        likelihood,
        topics: count
      }
    })
    .sort((a, b) => {
      const severityDiff =
        (severityWeights[b.severity as keyof typeof severityWeights] ?? 0) -
        (severityWeights[a.severity as keyof typeof severityWeights] ?? 0)
      if (severityDiff !== 0) {
        return severityDiff
      }
      return (
        (likelihoodWeights[b.likelihood as keyof typeof likelihoodWeights] ?? 0) -
        (likelihoodWeights[a.likelihood as keyof typeof likelihoodWeights] ?? 0)
      )
    })

  const formatSummaryEntries = (entries: Map<string, number>, labels: Record<string, string>) =>
    Array.from(entries.entries())
      .map(([key, count]) => ({
        key,
        label: labels[key] ?? UNKNOWN_LABEL,
        topics: count
      }))
      .sort((a, b) => b.topics - a.topics)

  const dueDiligence = {
    impactTypes: formatSummaryEntries(impactTypeCounts, impactTypeLabelMap as Record<string, string>),
    valueChain: formatSummaryEntries(valueChainCounts, valueChainLabelMap),
    remediation: formatSummaryEntries(remediationCounts, remediationLabelMap as Record<string, string>)
  }

  return {
    value,
    unit: d2.unit,
    assumptions,
    trace,
    warnings,
    narratives,
    responsibilities,
    notes,
    doubleMateriality: {
      overview: {
        totalTopics: normalisedTopics.length,
        prioritisedTopics: prioritisedTopics.length,
        attentionTopics: attentionTopics.length,
        gapAlerts: gapAlerts.length,
        averageScore: round(averageScore, 1)
      },
      prioritisationCriteria: [
        {
          title: 'Impact-matrix',
          description:
            'Alvor/omfang multipliceret med sandsynlighed, justeret for påvirkningstype og eksisterende afhjælpning.'
        },
        {
          title: 'Finansielle effekter',
          description: 'Selvangivet finansiel score (0-5) omregnet til procentvis betydning.'
        },
        {
          title: 'Tidslinje',
          description: 'Kort sigt vægter højest, løbende og lange tidshorisonter reducerer scoren moderat.'
        }
      ],
      tables: {
        topics: summaryTopics,
        gapAlerts,
        impactMatrix
      },
      dueDiligence
    },
    ...(esrsFacts.length > 0 ? { esrsFacts } : {}),
    ...(esrsTables.length > 0 ? { esrsTables } : {})
  }
}

function clampFinancialScore(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(value)) {
    return null
  }
  const clamped = Math.min(Math.max(value, 0), MAX_FINANCIAL_SCORE)
  return Number.isFinite(clamped) ? clamped : null
}

function encodeTrace(value: string): string {
  return value.replace(/\s+/g, '_')
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}
