/**
 * Modul til ESRS 2 GOV – governance og organisation.
 */
import type {
  GovInput,
  ModuleInput,
  ModuleResult,
  ModuleNarrative,
  ModuleNote,
  ModuleResponsibility,
  ModuleEsrsFact,
  ModuleEsrsTable,
} from '../../types'

const MINIMUM_DETAIL_LENGTH = 100

const ASSUMPTIONS = [
  'ESRS 2 GOV kræver dokumentation af ledelsens tilsyn, roller og incitamenter.',
  'Scoren beregnes som forholdet mellem udfyldte beskrivelser og registrerede governance-elementer.',
]

type NarrativeField = {
  key: keyof GovInput
  label: string
  warning: string
}

const narrativeFields: NarrativeField[] = [
  {
    key: 'oversightNarrative',
    label: 'Bestyrelsens tilsyn',
    warning: 'Beskriv bestyrelsens rolle i ESG-styring for ESRS 2 GOV.',
  },
  {
    key: 'managementNarrative',
    label: 'Direktionens roller',
    warning: 'Forklar hvordan direktionen driver ESG-dagsordenen.',
  },
  {
    key: 'competenceNarrative',
    label: 'ESG-kompetencer',
    warning: 'Dokumentér træning og kompetenceopbygning for ledelsen.',
  },
  {
    key: 'reportingNarrative',
    label: 'Rapporteringsproces',
    warning: 'Beskriv kontrolmiljø og rapporteringscyklus for ESG-data.',
  },
  {
    key: 'assuranceNarrative',
    label: 'Sikkerhed og assurance',
    warning: 'Angiv omfang af intern/ekstern assurance på ESG-rapporteringen.',
  },
  {
    key: 'incentiveNarrative',
    label: 'Incitamenter',
    warning: 'Forklar hvordan incitamentsstruktur knyttes til ESG-mål.',
  },
]

export function runGOV(input: ModuleInput): ModuleResult {
  const raw = (input.GOV ?? null) as GovInput | null
  const trace: string[] = []
  const warnings: string[] = []

  const narratives: ModuleNarrative[] = []
  const notes: ModuleNote[] = []
  const responsibilities: ModuleResponsibility[] = []
  const fieldNarratives: Partial<Record<keyof GovInput, string>> = {}
  const oversightSummaries: string[] = []
  const controlSummaries: string[] = []
  const incentiveSummaries: string[] = []

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
      warnings.push(`Uddyb sektionen "${label}" for at opfylde ESRS 2 GOV.`)
    }
  })

  const bodies = Array.isArray(raw?.oversightBodies) ? raw?.oversightBodies : []
  bodies.forEach((entry, index) => {
    const body = normaliseText(entry?.body)
    const mandate = normaliseText(entry?.mandate)
    const chair = normaliseText(entry?.chair)
    const frequency = normaliseText(entry?.meetingFrequency)

    if (!body && !mandate && !chair && !frequency) {
      return
    }

    totalElements += 1
    trace.push(`oversight[${index}]=${body ?? 'ukendt'}`)

    const details = [mandate, frequency ? `Mødefrekvens: ${frequency}` : null].filter(Boolean)
    const hasDetail = details.length > 0

    if (hasDetail) {
      completedCount += 1
    } else {
      warnings.push(`Tilføj mandat eller mødefrekvens for governance-organ ${index + 1}.`)
    }

    notes.push({
      label: body ?? `Governance-organ ${index + 1}`,
      detail: details.join(' · ') || 'Ingen detaljer angivet.',
    })

    const summary = [
      body ?? `Governance-organ ${index + 1}`,
      mandate,
      frequency ? `Mødefrekvens: ${frequency}` : null,
      chair ? `Formand: ${chair}` : null,
    ]
      .filter(Boolean)
      .join(' · ')
    if (summary.length > 0) {
      oversightSummaries.push(summary)
    }

    if (chair) {
      responsibilities.push({ subject: body ?? `Governance-organ ${index + 1}`, owner: chair, role: 'Formand' })
    }
  })

  const controls = Array.isArray(raw?.controlProcesses) ? raw?.controlProcesses : []
  controls.forEach((entry, index) => {
    const process = normaliseText(entry?.process)
    const description = normaliseText(entry?.description)
    const owner = normaliseText(entry?.owner)

    if (!process && !description && !owner) {
      return
    }

    totalElements += 1
    trace.push(`control[${index}]=${process ?? 'ukendt'}`)

    if (description) {
      completedCount += 1
    } else {
      warnings.push(`Kontrolproces ${index + 1} mangler beskrivelse.`)
    }

    notes.push({ label: process ?? `Kontrol ${index + 1}`, detail: description ?? 'Ingen detaljer angivet.' })

    const summary = [
      process ?? `Kontrol ${index + 1}`,
      description,
      owner ? `Ansvarlig: ${owner}` : null,
    ]
      .filter(Boolean)
      .join(' · ')
    if (summary.length > 0) {
      controlSummaries.push(summary)
    }

    if (owner) {
      responsibilities.push({ subject: process ?? `Kontrol ${index + 1}`, owner, role: 'Procesansvarlig' })
    }
  })

  const incentives = Array.isArray(raw?.incentiveStructures) ? raw?.incentiveStructures : []
  incentives.forEach((entry, index) => {
    const role = normaliseText(entry?.role)
    const incentive = normaliseText(entry?.incentive)
    const metric = normaliseText(entry?.metric)

    if (!role && !incentive && !metric) {
      return
    }

    totalElements += 1
    trace.push(`incentive[${index}]=${role ?? 'ukendt'}`)

    if (incentive) {
      completedCount += 1
    } else {
      warnings.push(`Incitament ${index + 1} mangler beskrivelse af kobling til ESG.`)
    }

    notes.push({
      label: role ?? `Incitament ${index + 1}`,
      detail: [incentive, metric ? `KPI: ${metric}` : null].filter(Boolean).join(' · ') || 'Ingen detaljer angivet.',
    })

    const summary = [
      role ?? `Incitament ${index + 1}`,
      incentive,
      metric ? `KPI: ${metric}` : null,
    ]
      .filter(Boolean)
      .join(' · ')
    if (summary.length > 0) {
      incentiveSummaries.push(summary)
    }

    if (role && incentive) {
      responsibilities.push({ subject: role, owner: role, role: 'Incitament' })
    }
  })

  const score = totalElements > 0 ? Math.round((completedCount / totalElements) * 100) : 0

  const esrsFacts: ModuleEsrsFact[] = []
  const esrsTables: ModuleEsrsTable[] = []

  const oversightNarrativeParts: string[] = []
  if (fieldNarratives.oversightNarrative) {
    oversightNarrativeParts.push(fieldNarratives.oversightNarrative)
  }
  if (oversightSummaries.length > 0) {
    oversightNarrativeParts.push(`Governance-organer:\n- ${oversightSummaries.join('\n- ')}`)
  }
  oversightNarrativeParts.push(`Intern vurdering: ${score}% af governance-kravene er dokumenteret.`)
  esrsFacts.push({
    conceptKey: 'GOVOversightNarrative',
    value: oversightNarrativeParts.join('\n\n'),
  })

  const managementNarrativeParts: string[] = []
  if (fieldNarratives.managementNarrative) {
    managementNarrativeParts.push(fieldNarratives.managementNarrative)
  }
  if (controlSummaries.length > 0) {
    managementNarrativeParts.push(`Kontrolprocesser:\n- ${controlSummaries.join('\n- ')}`)
  }
  if (managementNarrativeParts.length > 0) {
    esrsFacts.push({ conceptKey: 'GOVManagementNarrative', value: managementNarrativeParts.join('\n\n') })
  }

  if (fieldNarratives.competenceNarrative) {
    esrsFacts.push({ conceptKey: 'GOVCompetenceNarrative', value: fieldNarratives.competenceNarrative })
  }

  const reportingNarrativeParts: string[] = []
  if (fieldNarratives.reportingNarrative) {
    reportingNarrativeParts.push(fieldNarratives.reportingNarrative)
  }
  if (fieldNarratives.assuranceNarrative) {
    reportingNarrativeParts.push(fieldNarratives.assuranceNarrative)
  }
  if (reportingNarrativeParts.length > 0) {
    esrsFacts.push({ conceptKey: 'GOVReportingNarrative', value: reportingNarrativeParts.join('\n\n') })
  }

  const incentiveNarrativeParts: string[] = []
  if (fieldNarratives.incentiveNarrative) {
    incentiveNarrativeParts.push(fieldNarratives.incentiveNarrative)
  }
  if (incentiveSummaries.length > 0) {
    incentiveNarrativeParts.push(`Incitamentsstrukturer:\n- ${incentiveSummaries.join('\n- ')}`)
  }
  if (incentiveNarrativeParts.length > 0) {
    esrsFacts.push({ conceptKey: 'GOVIncentiveNarrative', value: incentiveNarrativeParts.join('\n\n') })
  }

  if (responsibilities.length > 0) {
    esrsTables.push({
      conceptKey: 'GOVResponsibilitiesTable',
      rows: responsibilities.map((entry) => ({
        subject: entry.subject,
        owner: entry.owner,
        role: entry.role ?? null,
      })),
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
