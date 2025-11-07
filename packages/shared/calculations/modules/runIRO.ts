/**
 * Modul til ESRS 2 IRO – impacts, risks og opportunities.
 */
import type {
  IroInput,
  ModuleInput,
  ModuleResult,
  ModuleNarrative,
  ModuleNote,
  ModuleResponsibility,
  ModuleEsrsFact,
  ModuleEsrsTable,
} from '../../types'

const MINIMUM_DETAIL_LENGTH = 120

const ASSUMPTIONS = [
  'ESRS 2 IRO kræver beskrivelser af processer for at identificere impacts, risici og muligheder.',
  'Scoren afspejler hvor mange processer og svar der er dokumenteret i forhold til registrerede elementer.',
]

type NarrativeField = {
  key: keyof IroInput
  label: string
  warning: string
}

const narrativeFields: NarrativeField[] = [
  {
    key: 'processNarrative',
    label: 'Identifikationsproces',
    warning: 'Beskriv processen for at identificere væsentlige impacts, risici og muligheder.',
  },
  {
    key: 'integrationNarrative',
    label: 'Integration i styring',
    warning: 'Forklar hvordan resultater integreres i beslutninger og styring.',
  },
  {
    key: 'stakeholderNarrative',
    label: 'Interessentinddragelse',
    warning: 'Dokumentér hvordan interessenter bidrager til analyserne.',
  },
  {
    key: 'dueDiligenceNarrative',
    label: 'Due diligence',
    warning: 'Beskriv due diligence-processer for værdikæden.',
  },
  {
    key: 'escalationNarrative',
    label: 'Eskalering og opfølgning',
    warning: 'Forklar hvordan alvorlige impacts eskaleres til ledelsen.',
  },
  {
    key: 'monitoringNarrative',
    label: 'Overvågning og KPI’er',
    warning: 'Dokumentér opfølgning og KPI’er for risici og muligheder.',
  },
]

export function runIRO(input: ModuleInput): ModuleResult {
  const raw = (input.IRO ?? null) as IroInput | null
  const trace: string[] = []
  const warnings: string[] = []

  const narratives: ModuleNarrative[] = []
  const notes: ModuleNote[] = []
  const responsibilities: ModuleResponsibility[] = []
  const fieldNarratives: Partial<Record<keyof IroInput, string>> = {}
  const processSummaries: string[] = []
  const responseSummaries: string[] = []
  const processRows: Array<{ subject: string; description: string | null; frequency: string | null; owner: string | null }> = []
  const responseRows: Array<{
    subject: string
    severity: string | null
    status: string | null
    response: string | null
    owner: string | null
  }> = []

  let totalElements = 0
  let completedCount = 0

  narrativeFields.forEach(({ key, label, warning }) => {
    totalElements += 1
    const value = normaliseText(raw?.[key])
    trace.push(`${String(key)}Length=${value?.length ?? 0}`)

    if (!value) {
      warnings.push(warning)
      return
    }

    narratives.push({ label, content: value })
    fieldNarratives[key] = value
    completedCount += 1

    if (value.length < MINIMUM_DETAIL_LENGTH) {
      warnings.push(`Uddyb processen i "${label}" for at opfylde ESRS 2 IRO.`)
    }
  })

  const processes = Array.isArray(raw?.riskProcesses) ? raw?.riskProcesses : []
  processes.forEach((entry, index) => {
    const step = normaliseText(entry?.step)
    const description = normaliseText(entry?.description)
    const frequency = normaliseText(entry?.frequency)
    const owner = normaliseText(entry?.owner)

    if (!step && !description && !frequency && !owner) {
      return
    }

    totalElements += 1
    trace.push(`riskProcess[${index}]=${step ?? 'ukendt'}`)

    if (description) {
      completedCount += 1
    } else {
      warnings.push(`Proces ${index + 1} mangler beskrivelse af fremgangsmåde.`)
    }

    notes.push({
      label: step ?? `Proces ${index + 1}`,
      detail: [description, frequency ? `Frekvens: ${frequency}` : null].filter(Boolean).join(' · ') || 'Ingen detaljer angivet.',
    })

    const summary = [
      step ?? `Proces ${index + 1}`,
      description,
      frequency ? `Frekvens: ${frequency}` : null,
      owner ? `Ansvarlig: ${owner}` : null,
    ]
      .filter(Boolean)
      .join(' · ')
    if (summary.length > 0) {
      processSummaries.push(summary)
    }

    processRows.push({
      subject: step ?? `Proces ${index + 1}`,
      description: description ?? null,
      frequency: frequency ?? null,
      owner: owner ?? null,
    })

    if (owner) {
      responsibilities.push({ subject: step ?? `Proces ${index + 1}`, owner, role: 'Procesansvarlig' })
    }
  })

  const responses = Array.isArray(raw?.impactResponses) ? raw?.impactResponses : []
  responses.forEach((entry, index) => {
    const topic = normaliseText(entry?.topic)
    const severity = normaliseText(entry?.severity)
    const response = normaliseText(entry?.response)
    const status = normaliseText(entry?.status)
    const responsible = normaliseText(entry?.responsible)

    if (!topic && !severity && !response && !status && !responsible) {
      return
    }

    totalElements += 1
    trace.push(`impactResponse[${index}]=${topic ?? 'ukendt'}`)

    if (response) {
      completedCount += 1
    } else {
      warnings.push(`Angiv afværge- eller handlingsplan for impact ${index + 1}.`)
    }

    const detailParts = [
      severity ? `Alvorlighed: ${severity}` : null,
      status ? `Status: ${status}` : null,
      response,
    ].filter(Boolean)

    notes.push({
      label: topic ?? `Impact ${index + 1}`,
      detail: detailParts.join(' · ') || 'Ingen detaljer angivet.',
    })

    const summary = [
      topic ?? `Impact ${index + 1}`,
      severity ? `Alvorlighed: ${severity}` : null,
      status ? `Status: ${status}` : null,
      response,
      responsible ? `Ansvarlig: ${responsible}` : null,
    ]
      .filter(Boolean)
      .join(' · ')
    if (summary.length > 0) {
      responseSummaries.push(summary)
    }

    responseRows.push({
      subject: topic ?? `Impact ${index + 1}`,
      severity: severity ?? null,
      status: status ?? null,
      response: response ?? null,
      owner: responsible ?? null,
    })

    if (responsible) {
      responsibilities.push({ subject: topic ?? `Impact ${index + 1}`, owner: responsible, role: 'Ansvarlig' })
    }
  })

  const score = totalElements > 0 ? Math.round((completedCount / totalElements) * 100) : 0

  const esrsFacts: ModuleEsrsFact[] = []
  const esrsTables: ModuleEsrsTable[] = []

  const processNarrativeParts: string[] = []
  if (fieldNarratives.processNarrative) {
    processNarrativeParts.push(fieldNarratives.processNarrative)
  }
  if (processSummaries.length > 0) {
    processNarrativeParts.push(`Procesoversigt:\n- ${processSummaries.join('\n- ')}`)
  }
  processNarrativeParts.push(`Intern vurdering: ${score}% af kravene er dokumenteret.`)
  esrsFacts.push({ conceptKey: 'IROProcessNarrative', value: processNarrativeParts.join('\n\n') })

  const integrationNarrativeParts: string[] = []
  if (fieldNarratives.integrationNarrative) {
    integrationNarrativeParts.push(fieldNarratives.integrationNarrative)
  }
  if (fieldNarratives.escalationNarrative) {
    integrationNarrativeParts.push(fieldNarratives.escalationNarrative)
  }
  if (integrationNarrativeParts.length > 0) {
    esrsFacts.push({
      conceptKey: 'IROIntegrationNarrative',
      value: integrationNarrativeParts.join('\n\n'),
    })
  }

  if (fieldNarratives.stakeholderNarrative) {
    esrsFacts.push({ conceptKey: 'IROStakeholderNarrative', value: fieldNarratives.stakeholderNarrative })
  }

  if (fieldNarratives.dueDiligenceNarrative) {
    esrsFacts.push({ conceptKey: 'IRODueDiligenceNarrative', value: fieldNarratives.dueDiligenceNarrative })
  }

  const monitoringNarrativeParts: string[] = []
  if (fieldNarratives.monitoringNarrative) {
    monitoringNarrativeParts.push(fieldNarratives.monitoringNarrative)
  }
  if (responseSummaries.length > 0) {
    monitoringNarrativeParts.push(`Responsoversigt:\n- ${responseSummaries.join('\n- ')}`)
  }
  if (monitoringNarrativeParts.length > 0) {
    esrsFacts.push({ conceptKey: 'IROMonitoringNarrative', value: monitoringNarrativeParts.join('\n\n') })
  }

  if (processRows.length > 0 || responseRows.length > 0) {
    esrsTables.push({
      conceptKey: 'IROActionsTable',
      rows: [
        ...processRows.map((row) => ({
          type: 'Proces',
          subject: row.subject,
          description: row.description,
          frequency: row.frequency,
          owner: row.owner,
        })),
        ...responseRows.map((row) => ({
          type: 'Impact',
          subject: row.subject,
          severity: row.severity,
          status: row.status,
          response: row.response,
          owner: row.owner,
        })),
      ],
    })
  }

  return {
    value: score,
    unit: 'score',
    assumptions: ASSUMPTIONS,
    trace,
    warnings,
    narratives,
    notes,
    responsibilities,
    ...(esrsFacts.length ? { esrsFacts } : {}),
    ...(esrsTables.length ? { esrsTables } : {}),
  }
}

function normaliseText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}
