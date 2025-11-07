/**
 * Review-side med overblik og PDF-download entrypoint.
 */
'use client'

import {
  groupResultsByEsrs,
  type CalculatedModuleResult,
  type ModuleInput,
  type EsrsMetricSection,
  type ModuleMetric,
  type ModuleTableColumn,
} from '@org/shared'
import Link from 'next/link'
import { useMemo } from 'react'

import { PrimaryButton } from '../../../components/ui/PrimaryButton'
import {
  downloadReport,
  downloadCsrdPackage,
  downloadXbrl,
  submitReportPackage,
} from '../../../features/pdf/downloadClient'
import ReportPreviewClient from '../../../features/pdf/ReportPreviewClient'
import { useLiveResults } from '../../../features/results/useLiveResults'
import { ProfileSwitcher } from '../../../features/wizard/ProfileSwitcher'
import { wizardSteps } from '../../../features/wizard/steps'
import { WizardProvider, useWizardContext } from '../../../features/wizard/useWizard'
import { isModuleRelevant, type WizardProfile } from '../../../src/modules/wizard/profile'

const impactTypeLabels = {
  actual: 'Faktisk påvirkning',
  potential: 'Potentiel påvirkning'
} as const

const severityLabels = {
  minor: 'Begrænset alvor',
  moderate: 'Middel alvor',
  major: 'Væsentlig alvor',
  severe: 'Kritisk alvor'
} as const

const likelihoodLabels = {
  rare: 'Sjælden',
  unlikely: 'Usandsynlig',
  possible: 'Mulig',
  likely: 'Sandsynlig',
  veryLikely: 'Meget sandsynlig'
} as const

const valueChainLabels = {
  ownOperations: 'Egne aktiviteter',
  upstream: 'Upstream',
  downstream: 'Downstream'
} as const

const remediationLabels = {
  none: 'Ingen afhjælpning',
  planned: 'Planlagt indsats',
  inPlace: 'Afhjælpning implementeret'
} as const

const riskLabels = {
  risk: 'Risiko',
  opportunity: 'Mulighed',
  both: 'Risiko & mulighed'
} as const

const timelineLabels = {
  shortTerm: '0-12 mdr.',
  mediumTerm: '1-3 år',
  longTerm: '3+ år',
  ongoing: 'Løbende'
} as const

const gapStatusLabels = {
  aligned: 'Ingen gap',
  partial: 'Delvist afdækket',
  missing: 'Gap mangler'
} as const

const priorityBandLabels = {
  priority: 'Høj prioritet',
  attention: 'Observation',
  monitor: 'Monitorering'
} as const

const energyTypeLabels: Record<string, string> = {
  electricity: 'Elektricitet',
  districtHeat: 'Fjernvarme',
  steam: 'Damp',
  cooling: 'Køling',
  biogas: 'Biogas',
  diesel: 'Diesel',
  other: 'Andet',
}

export default function ReviewPage(): JSX.Element {
  return (
    <WizardProvider>
      <ReviewContent />
    </WizardProvider>
  )
}

function ReviewContent(): JSX.Element {
  const { results, activeProfileId } = useLiveResults()
  const { activeProfile, activeState, auditTrail, responsibilityIndex } = useWizardContext()

  const printable = useMemo(
    () => results.filter((entry) => !entry.result.assumptions.includes('Stubberegning')),
    [results],
  )

  const hasInputs = useMemo(() => hasAnyModuleInput(activeState), [activeState])
  const hasPrintableResults = hasInputs && printable.length > 0

  const layout = useMemo(() => (hasPrintableResults ? groupResultsByEsrs(printable) : null), [
    hasPrintableResults,
    printable,
  ])

  const recommendedStep = useMemo(() => resolveRecommendedStep(activeProfile.profile), [activeProfile.profile])

  const handleDownloadPdf = async (): Promise<void> => {
    await downloadReport(activeState)
  }

  const handleDownloadCsrd = async (): Promise<void> => {
    await downloadCsrdPackage(activeState, {
      profileId: activeProfileId,
      organisation: activeProfile.name,
      auditTrail,
      responsibilities: responsibilityIndex,
    })
  }

  const handleDownloadXbrl = async (): Promise<void> => {
    await downloadXbrl(activeState, {
      profileId: activeProfileId,
      organisation: activeProfile.name,
    })
  }

  const handleSubmit = async (): Promise<void> => {
    try {
      const response = await submitReportPackage(activeState, {
        profileId: activeProfileId,
        organisation: activeProfile.name,
        auditTrail,
        responsibilities: responsibilityIndex,
        includeXbrl: true,
      })
      if (response && !response.ok) {
        console.warn('Ekstern indsendelse returnerede en fejlstatus', response.status)
      }
    } catch (error) {
      console.error('Fejl ved indsendelse af rapportpakke', error)
    }
  }

  return (
    <main className="ds-page ds-stack">
      <header className="ds-stack-sm">
        <p className="ds-text-subtle">Version 5 · ESRS-review og eksport</p>
        <h1 className="ds-heading-lg">Review og download</h1>
        <p className="ds-text-subtle">Aktiv profil: {activeProfile.name}</p>
        <p className="ds-text-subtle">Profil-ID: {activeProfileId}</p>
        <p className="ds-text-muted">
          Få et struktureret overblik over ESRS-sektioner samt dobbelt væsentlighed. Alle ændringer spores til brug for
          revision og eksport.
        </p>
      </header>

      <ProfileSwitcher
        heading="Skift profil"
        description="Resultaterne opdateres automatisk, når du vælger en anden profil."
        className="ds-stack"
      />

      {hasPrintableResults && layout ? (
        <>
          <EsrsSection
            title="Generelle oplysninger"
            description="D1- og D2-moduler dokumenterer metodik, governance og væsentlighed."
            results={layout.general}
            emptyMessage="Ingen generelle oplysninger registreret."
          />

          <EsrsSection
            title="Politikker og governance"
            description="G1 og beslægtede moduler beskriver politikker, styring og due diligence."
            results={layout.policies}
            emptyMessage="Ingen politikker eller governance-oplysninger registreret."
          />

          <EsrsSection
            title="Mål og fremskridt"
            description="Klimamål, handlinger og ansvarlige fra ESRS E1 Targets."
            results={layout.targets}
            emptyMessage="Ingen klimamål registreret endnu."
          />

          <MetricSections sections={layout.metrics} />

          <DoubleMaterialityCard entry={layout.doubleMateriality} />

          <section className="ds-stack">
            <div className="ds-stack-sm">
              <h2 className="ds-section-heading">PDF-preview</h2>
              <p className="ds-text-subtle">
                Forhåndsvis rapporten direkte i browseren. Download-knappen genererer den samme rapport lokalt.
              </p>
            </div>
            <div className="ds-scroll-panel" data-size="tall">
              <ReportPreviewClient results={printable} />
            </div>
          </section>
        </>
      ) : (
        <EmptyStateCard profileName={activeProfile.name} recommendedStepLabel={recommendedStep?.label ?? null} />
      )}

      <section className="ds-toolbar">
        <PrimaryButton size="sm" onClick={handleDownloadPdf} disabled={!hasPrintableResults}>
          Download PDF
        </PrimaryButton>
        <PrimaryButton size="sm" variant="secondary" onClick={handleDownloadCsrd} disabled={!hasPrintableResults}>
          Download CSRD-pakke
        </PrimaryButton>
        <PrimaryButton size="sm" variant="secondary" onClick={handleDownloadXbrl} disabled={!hasPrintableResults}>
          Download XBRL
        </PrimaryButton>
        <PrimaryButton size="sm" variant="danger" onClick={handleSubmit} disabled={!hasPrintableResults}>
          Send til myndighed
        </PrimaryButton>
        <PrimaryButton as={Link} href="/wizard" variant="link" size="sm">
          Tilbage til wizard
        </PrimaryButton>
      </section>

      <details className="ds-card">
        <summary>Se rå data</summary>
        <pre className="ds-summary ds-code">
{JSON.stringify(
  {
    activeProfileId,
    results: printable,
    auditTrail,
    responsibilities: responsibilityIndex,
  },
  null,
  2,
)}
        </pre>
      </details>
    </main>
  )
}

function EsrsSection({
  title,
  description,
  results,
  emptyMessage,
}: {
  title: string
  description: string
  results: CalculatedModuleResult[]
  emptyMessage: string
}): JSX.Element {
  const hasResults = results.length > 0

  return (
    <section className="ds-stack">
      <div className="ds-stack-sm">
        <h2 className="ds-section-heading">{title}</h2>
        <p className="ds-text-subtle">{description}</p>
      </div>
      {hasResults ? (
        <div className="ds-stack">
          {results.map((entry) => (
            <ResultCard key={entry.moduleId} entry={entry} />
          ))}
        </div>
      ) : (
        <EmptyCard message={emptyMessage} />
      )}
    </section>
  )
}

function MetricSections({ sections }: { sections: EsrsMetricSection[] }): JSX.Element | null {
  if (sections.length === 0) {
    return null
  }

  return (
    <>
      {sections.map((section) => (
        <section key={section.id} className="ds-stack">
          <div className="ds-stack-sm">
            <h2 className="ds-section-heading">{section.title}</h2>
            <p className="ds-text-subtle">{section.description}</p>
          </div>
          <div className="ds-stack">
            {section.modules.map((entry) => (
              <ResultCard key={entry.moduleId} entry={entry} />
            ))}
          </div>
        </section>
      ))}
    </>
  )
}

function formatLabel(value: string | null | undefined, labels: Record<string, string>): string {
  if (!value) {
    return 'Ukendt'
  }
  return labels[value] ?? value
}

function DoubleMaterialityCard({ entry }: { entry: CalculatedModuleResult | null }): JSX.Element {
  if (!entry || !entry.result.doubleMateriality) {
    return (
      <section className="ds-card ds-stack-sm">
        <h2 className="ds-heading-sm">Dobbelt væsentlighed</h2>
        <p className="ds-text-subtle">
          Ingen registrerede emner i D2-modulet. Udfyld materialitet for at dokumentere dobbelt væsentlighed.
        </p>
      </section>
    )
  }

  const materiality = entry.result.doubleMateriality
  const { overview, prioritisationCriteria, tables, dueDiligence } = materiality
  const gapAlerts = tables.gapAlerts
  const topTopics = tables.topics
  const impactMatrix = tables.impactMatrix

  return (
    <section className="ds-card ds-stack">
      <div className="ds-stack-sm">
        <h2 className="ds-heading-sm">Dobbelt væsentlighed</h2>
        <p className="ds-text-subtle">
          Prioritets-score {overview.averageScore.toFixed(1)} · Prioriterede emner {overview.prioritisedTopics}/
          {overview.totalTopics} · Gap-advarsler {overview.gapAlerts}
        </p>
      </div>

      <div className="ds-stack-sm">
        <strong>Overblik</strong>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.25rem' }}>
          <li>Emner i alt: {overview.totalTopics}</li>
          <li>Prioriterede emner: {overview.prioritisedTopics}</li>
          <li>Observationer: {overview.attentionTopics}</li>
          <li>Gap-advarsler: {overview.gapAlerts}</li>
        </ul>
      </div>

      {prioritisationCriteria.length > 0 && (
        <div className="ds-stack-sm">
          <strong>Prioriteringskriterier</strong>
          <ul style={{ listStyle: 'disc inside', margin: 0, paddingLeft: '1.25rem', display: 'grid', gap: '0.25rem' }}>
            {prioritisationCriteria.map((criterion, index) => (
              <li key={`${entry.moduleId}-criterion-${index}`}>
                <span style={{ fontWeight: 600 }}>{criterion.title}:</span> {criterion.description}
              </li>
            ))}
          </ul>
        </div>
      )}

      {topTopics.length > 0 && (
        <div className="ds-stack-sm">
          <strong>Topemner</strong>
          <ul style={{ listStyle: 'disc inside', margin: 0, paddingLeft: '1.25rem', display: 'grid', gap: '0.5rem' }}>
            {topTopics.map((topic) => (
              <li key={`${entry.moduleId}-topic-${topic.name}`} style={{ display: 'grid', gap: '0.25rem' }}>
                <span style={{ fontWeight: 600 }}>
                  {topic.name} · {priorityBandLabels[topic.priorityBand]} ({topic.combinedScore.toFixed(1)})
                </span>
                <small className="ds-text-subtle">
                  Impactmatrix: {formatLabel(topic.impactType, impactTypeLabels as Record<string, string>)} ·{' '}
                  {formatLabel(topic.severity, severityLabels as Record<string, string>)} ·{' '}
                  {formatLabel(topic.likelihood, likelihoodLabels as Record<string, string>)}
                </small>
                <small className="ds-text-subtle">
                  Impactscore {topic.impactScore.toFixed(1)} · Finansiel score{' '}
                  {topic.financialScore != null ? topic.financialScore.toFixed(1) : 'n/a'} · Tidslinje-score{' '}
                  {topic.timelineScore != null ? topic.timelineScore.toFixed(1) : 'n/a'}
                </small>
                <small className="ds-text-subtle">
                  Tidslinje {formatLabel(topic.timeline, timelineLabels as Record<string, string>)} · Værdikæde{' '}
                  {formatLabel(topic.valueChainSegment, valueChainLabels as Record<string, string>)} · Afhjælpning{' '}
                  {formatLabel(topic.remediationStatus, remediationLabels as Record<string, string>)} · Risiko{' '}
                  {formatLabel(topic.riskType, riskLabels as Record<string, string>)} · CSRD-gap{' '}
                  {formatLabel(topic.csrdGapStatus, gapStatusLabels as Record<string, string>)}
                </small>
                {topic.description && <small className="ds-text-subtle">Note: {topic.description}</small>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {impactMatrix.length > 0 && (
        <div className="ds-stack-sm">
          <strong>Impact-matrix</strong>
          <ul style={{ listStyle: 'disc inside', margin: 0, paddingLeft: '1.25rem', display: 'grid', gap: '0.25rem' }}>
            {impactMatrix.map((row, index) => (
              <li key={`${entry.moduleId}-matrix-${index}`}>
                {formatLabel(row.severity, severityLabels as Record<string, string>)} ×{' '}
                {formatLabel(row.likelihood, likelihoodLabels as Record<string, string>)}: {row.topics}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(dueDiligence.impactTypes.length > 0 ||
        dueDiligence.valueChain.length > 0 ||
        dueDiligence.remediation.length > 0) && (
        <div className="ds-stack-sm">
          <strong>Due diligence reference</strong>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.25rem' }}>
            {dueDiligence.impactTypes.length > 0 && (
              <li>
                Påvirkningstyper:{' '}
                {dueDiligence.impactTypes.map((entry) => `${entry.label}: ${entry.topics}`).join(', ')}
              </li>
            )}
            {dueDiligence.valueChain.length > 0 && (
              <li>
                Værdikædeled:{' '}
                {dueDiligence.valueChain.map((entry) => `${entry.label}: ${entry.topics}`).join(', ')}
              </li>
            )}
            {dueDiligence.remediation.length > 0 && (
              <li>
                Afhjælpning:{' '}
                {dueDiligence.remediation.map((entry) => `${entry.label}: ${entry.topics}`).join(', ')}
              </li>
            )}
          </ul>
        </div>
      )}

      {gapAlerts.length > 0 && (
        <div className="ds-stack-sm">
          <strong>Gap-advarsler</strong>
          <ul>
            {gapAlerts.map((topic) => (
              <li key={`${entry.moduleId}-gap-${topic}`}>CSRD-gap mangler for {topic}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function ResultCard({ entry }: { entry: CalculatedModuleResult }): JSX.Element {
  const { result } = entry
  const formatMetricValue = (metric: ModuleMetric) => {
    const value = metric.value
    const formatted =
      value == null || (typeof value === 'number' && Number.isNaN(value))
        ? '–'
        : value
    const unit = metric.unit ? ` ${metric.unit}` : ''
    return `${formatted}${unit}`
  }

  const formatTableCell = (column: ModuleTableColumn, value: string | number | null) => {
    if (value == null || (typeof value === 'number' && Number.isNaN(value))) {
      return '–'
    }
    if (column.format === 'percent' && typeof value === 'number') {
      return `${value}%`
    }
    return value
  }

  return (
    <section className="ds-card">
      <header className="ds-stack-sm">
        <h3 className="ds-heading-sm">{entry.title}</h3>
        <p className="ds-value">
          {result.value} {result.unit}
        </p>
      </header>
      {result.metrics && result.metrics.length > 0 && (
        <div className="ds-stack-sm">
          <strong>Nøgletal</strong>
          <ul className="ds-stack-xs">
            {result.metrics.map((metric, index) => (
              <li key={`${entry.moduleId}-metric-${index}`}>
                <span className="ds-text-strong">{metric.label}</span>: {formatMetricValue(metric)}
                {metric.context ? <span className="ds-text-subtle"> – {metric.context}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      )}
      {result.intensities && result.intensities.length > 0 && (
        <div className="ds-stack-sm">
          <strong>E1-intensiteter</strong>
          <ul>
            {result.intensities.map((intensity, index) => (
              <li key={`${entry.moduleId}-intensity-${index}`}>
                {intensity.label}: {intensity.value} {intensity.unit}
              </li>
            ))}
          </ul>
        </div>
      )}
      {result.trend && (
        <div className="ds-stack-sm">
          <strong>Udvikling</strong>
          <p>
            {result.trend.label}: {result.trend.previousValue ?? '–'} → {result.trend.currentValue} {result.trend.unit}
          </p>
          {result.trend.absoluteChange != null && (
            <p>
              Ændring: {result.trend.absoluteChange} {result.trend.unit} ({
                result.trend.percentChange != null ? `${result.trend.percentChange}%` : 'n/a'
              })
            </p>
          )}
        </div>
      )}
      {result.targetProgress && (
        <div className="ds-stack-sm">
          <strong>Målopfølgning</strong>
          <p>
            {result.targetProgress.name ?? 'Mål'} ({result.targetProgress.scope}) – {result.targetProgress.status ?? 'ukendt'}
          </p>
          <p>
            Målværdi {result.targetProgress.targetValueTonnes ?? '–'} tCO2e i {result.targetProgress.targetYear ?? 'ukendt'} –
            afvigelse {result.targetProgress.varianceTonnes ?? 'n/a'} tCO2e
          </p>
          {result.targetProgress.progressPercent != null && (
            <p>Fremskridt: {result.targetProgress.progressPercent}%</p>
          )}
        </div>
      )}
      {result.energyMix && result.energyMix.length > 0 && (
        <div className="ds-stack-sm">
          <strong>Energimix</strong>
          <ul>
            {result.energyMix.map((entryMix, index) => (
              <li key={`${entry.moduleId}-energy-${index}`}>
                {energyTypeLabels[entryMix.energyType] ?? entryMix.energyType}: {entryMix.sharePercent}% ({
                  entryMix.consumptionKwh
                } kWh)
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="ds-stack-sm">
        <strong>Antagelser</strong>
        <ul>
          {result.assumptions.map((assumption, index) => (
            <li key={`${entry.moduleId}-assumption-${index}`}>{assumption}</li>
          ))}
        </ul>
      </div>
      {result.warnings.length > 0 && (
        <div className="ds-stack-sm">
          <strong>Advarsler</strong>
          <ul>
            {result.warnings.map((warning, index) => (
              <li key={`${entry.moduleId}-warning-${index}`}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
      {result.targetsOverview && result.targetsOverview.length > 0 && (
        <div className="ds-stack-sm">
          <strong>E1-mål</strong>
          <ul>
            {result.targetsOverview.map((target, index) => (
              <li key={`${entry.moduleId}-target-${index}`}>
                {target.name} ({target.scope}) – mål {target.targetYear ?? 'ukendt'}: {target.targetValueTonnes ?? '–'} tCO2e
              </li>
            ))}
          </ul>
        </div>
      )}
      {result.plannedActions && result.plannedActions.length > 0 && (
        <div className="ds-stack-sm">
          <strong>Planlagte handlinger</strong>
          <ul>
            {result.plannedActions.map((action, index) => (
              <li key={`${entry.moduleId}-action-${index}`}>
                {action.title ?? 'Handling'} – {action.status ?? 'ukendt'} ({action.dueQuarter ?? 'ukendt'})
              </li>
            ))}
          </ul>
        </div>
      )}
      {result.narratives && result.narratives.length > 0 && (
        <div className="ds-stack-sm">
          <strong>Narrativer</strong>
          <ul className="ds-stack-sm">
            {result.narratives.map((narrative, index) => (
              <li key={`${entry.moduleId}-narrative-${index}`} className="ds-stack-2xs">
                <span className="ds-text-strong">{narrative.label}</span>
                <span className="ds-text-muted">{narrative.content}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {result.responsibilities && result.responsibilities.length > 0 && (
        <div className="ds-stack-sm">
          <strong>Ansvar</strong>
          <ul>
            {result.responsibilities.map((responsible, index) => (
              <li key={`${entry.moduleId}-responsible-${index}`}>
                {responsible.subject}: {responsible.owner}
                {responsible.role ? ` (${responsible.role})` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
      {result.notes && result.notes.length > 0 && (
        <div className="ds-stack-sm">
          <strong>Noter</strong>
          <ul>
            {result.notes.map((note, index) => (
              <li key={`${entry.moduleId}-note-${index}`}>
                {note.label}: {note.detail}
              </li>
            ))}
          </ul>
        </div>
      )}
      {result.tables && result.tables.length > 0 && (
        <div className="ds-stack-sm ds-stack">
          {result.tables.map((table) => (
            <div key={`${entry.moduleId}-${table.id}`} className="ds-stack-sm">
              <strong>{table.title}</strong>
              {table.summary && <p className="ds-text-subtle">{table.summary}</p>}
              <div className="ds-table-wrapper">
                <table className="ds-table">
                  <thead>
                    <tr>
                      {table.columns.map((column) => (
                        <th key={column.key} data-align={column.align ?? 'start'}>
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row, rowIndex) => (
                      <tr key={`${entry.moduleId}-${table.id}-row-${rowIndex}`}>
                        {table.columns.map((column) => (
                          <td key={`${entry.moduleId}-${table.id}-row-${rowIndex}-${column.key}`} data-align={column.align ?? 'start'}>
                            {formatTableCell(column, row[column.key] ?? null)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
      <details className="ds-summary">
        <summary>Trace</summary>
        <ul>
          {result.trace.map((traceEntry, index) => (
            <li key={`${entry.moduleId}-trace-${index}`} className="ds-code">
              {traceEntry}
            </li>
          ))}
        </ul>
      </details>
    </section>
  )
}

function EmptyCard({ message }: { message?: string }): JSX.Element {
  return (
    <section className="ds-card ds-card--muted">
      <h2 className="ds-heading-sm">Ingen data endnu</h2>
      <p>
        {message ??
          'Når du udfylder de beregningsklare moduler vises resultaterne her. Governance-modulet D1 beregner en samlet score for metode, screening og politikker.'}
      </p>
    </section>
  )
}

function EmptyStateCard({
  profileName,
  recommendedStepLabel,
}: {
  profileName: string
  recommendedStepLabel: string | null
}): JSX.Element {
  return (
    <section className="ds-card ds-stack">
      <h2 className="ds-heading-sm">Ingen beregninger for {profileName} endnu</h2>
      <p className="ds-text-muted">
        Start med at udfylde {recommendedStepLabel ?? 'det næste relevante modul'} i wizard-flowet. Når du har gennemført
        mindst ét modul, viser review-siden resultater og PDF-preview for profilen.
      </p>
      <PrimaryButton as={Link} href="/wizard" size="md">
        Gå til wizard
      </PrimaryButton>
    </section>
  )
}

function hasAnyModuleInput(state: ModuleInput): boolean {
  return Object.values(state).some((value) => hasValueRecursive(value))
}

function hasValueRecursive(value: unknown): boolean {
  if (value == null) {
    return false
  }
  if (typeof value === 'number') {
    return !Number.isNaN(value)
  }
  if (typeof value === 'boolean') {
    return true
  }
  if (typeof value === 'string') {
    return value.trim().length > 0
  }
  if (Array.isArray(value)) {
    return value.some((entry) => hasValueRecursive(entry))
  }
  if (typeof value === 'object') {
    return Object.values(value).some((entry) => hasValueRecursive(entry))
  }
  return false
}

function resolveRecommendedStep(profile: WizardProfile) {
  const readySteps = wizardSteps.filter((step) => step.status === 'ready')
  const relevant = readySteps.find((step) => isModuleRelevant(profile, step.id))
  return relevant ?? readySteps[0] ?? null
}
