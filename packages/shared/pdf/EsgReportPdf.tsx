/**
 * React-PDF dokument der strukturerer beregninger efter ESRS-sektioner.
 */
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { CalculatedModuleResult, ModuleMetric, ModuleTable } from '../types'
import { groupResultsByEsrs } from '../reporting/esrsLayout'

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    color: '#1b1b1b',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 18,
    paddingBottom: 12,
    borderBottom: '2 solid #1f6f4f',
  },
  pageTitle: {
    fontSize: 22,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#4b6158',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 14,
    marginBottom: 4,
    color: '#1f6f4f',
  },
  sectionDescription: {
    fontSize: 10,
    marginBottom: 8,
    color: '#4a4a4a',
  },
  module: {
    border: '1 solid #d0d7d5',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#f8faf9',
  },
  moduleHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  moduleMetric: {
    fontSize: 11,
    marginBottom: 6,
  },
  label: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#2f3e36',
  },
  list: {
    marginBottom: 4,
  },
  listItem: {
    fontSize: 9,
    marginLeft: 8,
    marginBottom: 2,
  },
  metricList: {
    marginBottom: 6,
  },
  inline: {
    fontSize: 9,
    marginBottom: 2,
  },
  topicRow: {
    borderBottom: '1 solid #d0d7d5',
    paddingVertical: 4,
  },
  topicHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  gapAlert: {
    fontSize: 9,
    color: '#b23d2e',
  },
  table: {
    borderWidth: 1,
    borderColor: '#d0d7d5',
    borderRadius: 4,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #d0d7d5',
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableHeaderRow: {
    backgroundColor: '#eef5f1',
  },
  tableHeaderCell: {
    flex: 1,
    padding: 4,
    fontSize: 8,
    fontWeight: 'bold',
  },
  tableCell: {
    flex: 1,
    padding: 4,
    fontSize: 8,
  },
})

const impactTypeLabels = {
  actual: 'Faktisk påvirkning',
  potential: 'Potentiel påvirkning',
} as const

const severityLabels = {
  minor: 'Begrænset alvor',
  moderate: 'Middel alvor',
  major: 'Væsentlig alvor',
  severe: 'Kritisk alvor',
} as const

const likelihoodLabels = {
  rare: 'Sjælden',
  unlikely: 'Usandsynlig',
  possible: 'Mulig',
  likely: 'Sandsynlig',
  veryLikely: 'Meget sandsynlig',
} as const

const valueChainLabels = {
  ownOperations: 'Egne aktiviteter',
  upstream: 'Upstream',
  downstream: 'Downstream',
} as const

const remediationLabels = {
  none: 'Ingen afhjælpning',
  planned: 'Planlagt indsats',
  inPlace: 'Afhjælpning implementeret',
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

function formatMetric(metric: ModuleMetric): string {
  const value = metric.value
  const formatted =
    value == null || (typeof value === 'number' && Number.isNaN(value))
      ? '–'
      : value
  const unit = metric.unit ? ` ${metric.unit}` : ''
  return `${formatted}${unit}`
}

function formatTableValue(value: string | number | null, format?: string): string {
  if (value == null || (typeof value === 'number' && Number.isNaN(value))) {
    return '–'
  }
  if (format === 'percent' && typeof value === 'number') {
    return `${value}%`
  }
  return String(value)
}

function resolveTextAlign(align: ModuleTable['columns'][number]['align']): 'left' | 'center' | 'right' {
  if (align === 'center') {
    return 'center'
  }
  if (align === 'end') {
    return 'right'
  }
  return 'left'
}

const riskLabels = {
  risk: 'Risiko',
  opportunity: 'Mulighed',
  both: 'Risiko & mulighed',
} as const

const timelineLabels = {
  shortTerm: '0-12 mdr.',
  mediumTerm: '1-3 år',
  longTerm: '3+ år',
  ongoing: 'Løbende',
} as const

const gapStatusLabels = {
  aligned: 'Ingen gap',
  partial: 'Delvist afdækket',
  missing: 'Gap mangler',
} as const

const priorityBandLabels = {
  priority: 'Høj prioritet',
  attention: 'Observation',
  monitor: 'Monitorering',
} as const

function formatLabel(value: string | null | undefined, labels: Record<string, string>): string {
  if (!value) {
    return 'Ukendt'
  }
  return labels[value] ?? value
}

type ModuleBlockProps = {
  entry: CalculatedModuleResult
}

function ModuleBlock({ entry }: ModuleBlockProps): JSX.Element {
  const { result } = entry

  return (
    <View style={styles.module} wrap={false}>
      <Text style={styles.moduleHeader}>{entry.title}</Text>
      <Text style={styles.moduleMetric}>
        Resultat: {String(result.value)} {result.unit}
      </Text>

      {result.metrics && result.metrics.length > 0 && (
        <View style={styles.metricList}>
          <Text style={styles.label}>Nøgletal</Text>
          {result.metrics.map((metric, index) => (
            <View key={`${entry.moduleId}-metric-${index}`} style={{ marginBottom: 2 }}>
              <Text style={styles.listItem}>• {metric.label}: {formatMetric(metric)}</Text>
              {metric.context ? <Text style={styles.inline}>{metric.context}</Text> : null}
            </View>
          ))}
        </View>
      )}

      {result.intensities && result.intensities.length > 0 && (
        <View style={styles.list}>
          <Text style={styles.label}>Intensiteter</Text>
          {result.intensities.map((intensity, index) => (
            <Text key={`${entry.moduleId}-intensity-${index}`} style={styles.listItem}>
              • {intensity.label}: {intensity.value} {intensity.unit}
            </Text>
          ))}
        </View>
      )}

      {result.trend && (
        <View style={styles.list}>
          <Text style={styles.label}>Udvikling</Text>
          <Text style={styles.listItem}>
            • {result.trend.label}: {result.trend.previousValue ?? '–'} → {result.trend.currentValue} {result.trend.unit}
          </Text>
          {result.trend.absoluteChange != null && (
            <Text style={styles.listItem}>
              • Ændring: {result.trend.absoluteChange} {result.trend.unit} ({
                result.trend.percentChange != null ? `${result.trend.percentChange}%` : 'n/a'
              })
            </Text>
          )}
        </View>
      )}

      {result.targetProgress && (
        <View style={styles.list}>
          <Text style={styles.label}>Målopfølgning</Text>
          <Text style={styles.listItem}>
            • {result.targetProgress.name ?? 'Mål'} ({result.targetProgress.scope}) – mål{' '}
            {result.targetProgress.targetYear ?? 'ukendt'}: {result.targetProgress.targetValueTonnes ?? '–'} tCO2e
          </Text>
          <Text style={styles.listItem}>
            • Status: {result.targetProgress.status ?? 'ukendt'} | Afvigelse:{' '}
            {result.targetProgress.varianceTonnes ?? 'n/a'} tCO2e
          </Text>
          {result.targetProgress.progressPercent != null && (
            <Text style={styles.listItem}>• Fremskridt: {result.targetProgress.progressPercent}%</Text>
          )}
        </View>
      )}

      {result.energyMix && result.energyMix.length > 0 && (
        <View style={styles.list}>
          <Text style={styles.label}>Energimix</Text>
          {result.energyMix.map((mixEntry, index) => (
            <Text key={`${entry.moduleId}-mix-${index}`} style={styles.listItem}>
              • {energyTypeLabels[mixEntry.energyType] ?? mixEntry.energyType}: {mixEntry.sharePercent}% ({
                mixEntry.consumptionKwh
              } kWh)
            </Text>
          ))}
        </View>
      )}

      {result.targetsOverview && result.targetsOverview.length > 0 && (
        <View style={styles.list}>
          <Text style={styles.label}>Måloversigt</Text>
          {result.targetsOverview.map((target, index) => (
            <Text key={`${entry.moduleId}-target-${index}`} style={styles.listItem}>
              • {target.name} ({target.scope}) – mål {target.targetYear ?? 'ukendt'}:{' '}
              {target.targetValueTonnes ?? '–'} tCO2e | Ansvarlig: {target.owner ?? 'n/a'}
            </Text>
          ))}
        </View>
      )}

      {result.plannedActions && result.plannedActions.length > 0 && (
        <View style={styles.list}>
          <Text style={styles.label}>Planlagte handlinger</Text>
          {result.plannedActions.map((action, index) => (
            <Text key={`${entry.moduleId}-action-${index}`} style={styles.listItem}>
              • {action.title ?? 'Handling'} – {action.status ?? 'ukendt'} ({action.dueQuarter ?? 'ukendt'})
            </Text>
          ))}
        </View>
      )}

      {result.transitionMeasures && result.transitionMeasures.length > 0 && (
        <View style={styles.list}>
          <Text style={styles.label}>Overgangstiltag</Text>
          {result.transitionMeasures.map((measure, index) => (
            <Text key={`${entry.moduleId}-transition-${index}`} style={styles.listItem}>
              • {measure.initiative ?? `Tiltag ${index + 1}`} – {measure.status ?? 'ukendt status'}
              {measure.milestoneYear != null ? ` · Milepæl: ${measure.milestoneYear}` : ''}
              {measure.investmentNeedDkk != null ? ` · Investering: ${measure.investmentNeedDkk} DKK` : ''}
            </Text>
          ))}
        </View>
      )}

      {result.financialEffects && result.financialEffects.length > 0 && (
        <View style={styles.list}>
          <Text style={styles.label}>Finansielle effekter</Text>
          {result.financialEffects.map((effect, index) => (
            <Text key={`${entry.moduleId}-finance-${index}`} style={styles.listItem}>
              • {effect.label ?? `Effekt ${index + 1}`} – {effect.type ?? 'ukendt type'}
              {effect.amountDkk != null ? ` · ${effect.amountDkk} DKK` : ''}
              {effect.timeframe ? ` · Periode: ${effect.timeframe}` : ''}
              {effect.description ? ` · ${effect.description}` : ''}
            </Text>
          ))}
        </View>
      )}

      {result.removalProjects && result.removalProjects.length > 0 && (
        <View style={styles.list}>
          <Text style={styles.label}>Removal-projekter</Text>
          {result.removalProjects.map((project, index) => (
            <Text key={`${entry.moduleId}-removal-${index}`} style={styles.listItem}>
              • {project.projectName ?? `Projekt ${index + 1}`} – {project.removalType ?? 'ukendt type'}
              {project.annualRemovalTonnes != null ? ` · ${project.annualRemovalTonnes} tCO2e/år` : ''}
              {project.qualityStandard ? ` · Standard: ${project.qualityStandard}` : ''}
              {project.storageDescription ? ` · Lager: ${project.storageDescription}` : ''}
            </Text>
          ))}
        </View>
      )}

      {result.narratives && result.narratives.length > 0 && (
        <View style={styles.list}>
          <Text style={styles.label}>Narrativer</Text>
          {result.narratives.map((narrative, index) => (
            <View key={`${entry.moduleId}-narrative-${index}`} style={{ marginBottom: 3 }}>
              <Text style={styles.listItem}>• {narrative.label}</Text>
              <Text style={styles.inline}>{narrative.content}</Text>
            </View>
          ))}
        </View>
      )}

      {result.responsibilities && result.responsibilities.length > 0 && (
        <View style={styles.list}>
          <Text style={styles.label}>Ansvar</Text>
          {result.responsibilities.map((responsible, index) => (
            <Text key={`${entry.moduleId}-responsible-${index}`} style={styles.listItem}>
              • {responsible.subject}: {responsible.owner}
              {responsible.role ? ` (${responsible.role})` : ''}
            </Text>
          ))}
        </View>
      )}

      {result.notes && result.notes.length > 0 && (
        <View style={styles.list}>
          <Text style={styles.label}>Noter</Text>
          {result.notes.map((note, index) => (
            <Text key={`${entry.moduleId}-note-${index}`} style={styles.listItem}>
              • {note.label}: {note.detail}
            </Text>
          ))}
        </View>
      )}

      {result.tables && result.tables.length > 0 && (
        <View style={styles.metricList}>
          {result.tables.map((table) => (
            <View key={`${entry.moduleId}-${table.id}`} style={{ marginBottom: 6 }}>
              <Text style={styles.label}>{table.title}</Text>
              {table.summary ? <Text style={styles.inline}>{table.summary}</Text> : null}
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                  {table.columns.map((column) => (
                    <View key={column.key} style={styles.tableHeaderCell}>
                      <Text style={{ fontSize: 8, fontWeight: 'bold', textAlign: resolveTextAlign(column.align ?? 'start') }}>
                        {column.label}
                      </Text>
                    </View>
                  ))}
                </View>
                {table.rows.map((row, rowIndex) => (
                  <View
                    key={`${entry.moduleId}-${table.id}-row-${rowIndex}`}
                    style={[styles.tableRow, ...(rowIndex === table.rows.length - 1 ? [styles.tableRowLast] : [])]}
                  >
                    {table.columns.map((column) => (
                      <View key={`${entry.moduleId}-${table.id}-row-${rowIndex}-${column.key}`} style={styles.tableCell}>
                        <Text style={{ fontSize: 8, textAlign: resolveTextAlign(column.align ?? 'start') }}>
                          {formatTableValue(row[column.key] ?? null, column.format)}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      {result.warnings.length > 0 && (
        <View style={styles.list}>
          <Text style={styles.label}>Advarsler</Text>
          {result.warnings.map((warning, index) => (
            <Text key={`${entry.moduleId}-warning-${index}`} style={styles.listItem}>
              • {warning}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.list}>
        <Text style={styles.label}>Antagelser</Text>
        {result.assumptions.map((assumption, index) => (
          <Text key={`${entry.moduleId}-assumption-${index}`} style={styles.listItem}>
            • {assumption}
          </Text>
        ))}
      </View>

      <View style={styles.list}>
        <Text style={styles.label}>Trace</Text>
        {result.trace.map((traceEntry, index) => (
          <Text key={`${entry.moduleId}-trace-${index}`} style={styles.listItem}>
            • {traceEntry}
          </Text>
        ))}
      </View>
    </View>
  )
}

function DoubleMaterialitySection({ entry }: { entry: CalculatedModuleResult }): JSX.Element {
  const { result } = entry
  const materiality = result.doubleMateriality

  if (!materiality) {
    return (
      <View style={styles.section} wrap={false}>
        <Text style={styles.sectionTitle}>Dobbelt væsentlighed</Text>
        <Text style={styles.sectionDescription}>
          Ingen registrerede emner i D2-modulet. Udfyld materialitet for at dokumentere dobbelt væsentlighed.
        </Text>
      </View>
    )
  }
  const { overview, prioritisationCriteria, tables, dueDiligence } = materiality
  const gapAlerts = tables.gapAlerts
  const topTopics = tables.topics
  const impactMatrix = tables.impactMatrix

  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>Dobbelt væsentlighed</Text>
      <Text style={styles.sectionDescription}>
        Prioritets-score {overview.averageScore.toFixed(1)} · Prioriterede emner {overview.prioritisedTopics}/
        {overview.totalTopics} · Gap-advarsler {overview.gapAlerts}
      </Text>

      <View style={styles.list}>
        <Text style={styles.label}>Overblik</Text>
        <Text style={styles.listItem}>• Emner i alt: {overview.totalTopics}</Text>
        <Text style={styles.listItem}>• Prioriterede emner: {overview.prioritisedTopics}</Text>
        <Text style={styles.listItem}>• Observationer: {overview.attentionTopics}</Text>
        <Text style={styles.listItem}>• Gap-advarsler: {overview.gapAlerts}</Text>
      </View>

      {prioritisationCriteria.length > 0 && (
        <View style={styles.list}>
          <Text style={styles.label}>Prioriteringskriterier</Text>
          {prioritisationCriteria.map((criterion, index) => (
            <Text key={`${entry.moduleId}-criterion-${index}`} style={styles.listItem}>
              • {criterion.title}: {criterion.description}
            </Text>
          ))}
        </View>
      )}

      {topTopics.map((topic, index) => (
        <View key={`${entry.moduleId}-topic-${index}`} style={styles.topicRow} wrap={false}>
          <Text style={styles.topicHeader}>{topic.name}</Text>
          <Text style={styles.inline}>
            {priorityBandLabels[topic.priorityBand]} · Score {topic.combinedScore.toFixed(1)}
          </Text>
          <Text style={styles.inline}>
            Impactmatrix: {formatLabel(topic.impactType, impactTypeLabels as Record<string, string>)} ·{' '}
            {formatLabel(topic.severity, severityLabels as Record<string, string>)} ·{' '}
            {formatLabel(topic.likelihood, likelihoodLabels as Record<string, string>)}
          </Text>
          <Text style={styles.inline}>
            Impactscore {topic.impactScore.toFixed(1)} · Finansiel score{' '}
            {topic.financialScore != null ? topic.financialScore.toFixed(1) : 'n/a'} · Tidslinje-score{' '}
            {topic.timelineScore != null ? topic.timelineScore.toFixed(1) : 'n/a'}
          </Text>
          <Text style={styles.inline}>
            Tidslinje {formatLabel(topic.timeline, timelineLabels as Record<string, string>)} · Værdikæde{' '}
            {formatLabel(topic.valueChainSegment, valueChainLabels as Record<string, string>)} · Afhjælpning{' '}
            {formatLabel(topic.remediationStatus, remediationLabels as Record<string, string>)} · Risiko{' '}
            {formatLabel(topic.riskType, riskLabels as Record<string, string>)} · CSRD-gap{' '}
            {formatLabel(topic.csrdGapStatus, gapStatusLabels as Record<string, string>)}
          </Text>
          {topic.description && <Text style={styles.inline}>Note: {topic.description}</Text>}
        </View>
      ))}

      {impactMatrix.length > 0 && (
        <View style={styles.list}>
          <Text style={styles.label}>Impact-matrix</Text>
          {impactMatrix.map((row, index) => (
            <Text key={`${entry.moduleId}-matrix-${index}`} style={styles.listItem}>
              • {formatLabel(row.severity, severityLabels as Record<string, string>)} ×{' '}
              {formatLabel(row.likelihood, likelihoodLabels as Record<string, string>)}: {row.topics}
            </Text>
          ))}
        </View>
      )}

      {(dueDiligence.impactTypes.length > 0 ||
        dueDiligence.valueChain.length > 0 ||
        dueDiligence.remediation.length > 0) && (
        <View style={styles.list}>
          <Text style={styles.label}>Due diligence reference</Text>
          {dueDiligence.impactTypes.length > 0 && (
            <Text style={styles.listItem}>
              • Påvirkningstyper: {dueDiligence.impactTypes.map((entry) => `${entry.label}: ${entry.topics}`).join(', ')}
            </Text>
          )}
          {dueDiligence.valueChain.length > 0 && (
            <Text style={styles.listItem}>
              • Værdikædeled: {dueDiligence.valueChain.map((entry) => `${entry.label}: ${entry.topics}`).join(', ')}
            </Text>
          )}
          {dueDiligence.remediation.length > 0 && (
            <Text style={styles.listItem}>
              • Afhjælpning: {dueDiligence.remediation.map((entry) => `${entry.label}: ${entry.topics}`).join(', ')}
            </Text>
          )}
        </View>
      )}

      {gapAlerts.length > 0 && (
        <View style={styles.list}>
          <Text style={styles.label}>Gap-advarsler</Text>
          {gapAlerts.map((topic, index) => (
            <Text key={`${entry.moduleId}-gap-${index}`} style={styles.gapAlert}>
              • Manglende CSRD-gap for {topic}
            </Text>
          ))}
        </View>
      )}
    </View>
  )
}

export function EsgReportPdf({ results }: { results: CalculatedModuleResult[] }): JSX.Element {
  const layout = groupResultsByEsrs(results)
  const hasResults = results.length > 0

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>ESRS-rapport</Text>
          <Text style={styles.subtitle}>
            Struktureret efter ESRS 2 (SBM, GOV, IRO, MR), politikker, mål, metrics og dobbelt væsentlighed.
          </Text>
        </View>

        {!hasResults && <Text>Ingen beregninger tilgængelige.</Text>}

        {hasResults && (
          <>
            <View style={styles.section} wrap={false}>
              <Text style={styles.sectionTitle}>Generelle oplysninger</Text>
              <Text style={styles.sectionDescription}>
                ESRS 2-modulerne for strategi (SBM), governance (GOV), IRO samt D1 beskriver grundlaget for rapporteringen.
              </Text>
              {layout.general.map((entry) => (
                <ModuleBlock key={entry.moduleId} entry={entry} />
              ))}
            </View>

            <View style={styles.section} wrap={false}>
              <Text style={styles.sectionTitle}>Politikker og governance</Text>
              <Text style={styles.sectionDescription}>
                G1 og relaterede moduler giver overblik over politikker, kontroller og due diligence.
              </Text>
              {layout.policies.map((entry) => (
                <ModuleBlock key={entry.moduleId} entry={entry} />
              ))}
              {layout.policies.length === 0 && (
                <Text style={styles.inline}>Ingen politikker registreret for den aktive profil.</Text>
              )}
            </View>

            <View style={styles.section} wrap={false}>
              <Text style={styles.sectionTitle}>Mål og fremskridt</Text>
              <Text style={styles.sectionDescription}>
                ESRS 2 MR og ESRS E1 samler mål, målinger, finansielle effekter og planlagte handlinger.
              </Text>
              {layout.targets.map((entry) => (
                <ModuleBlock key={entry.moduleId} entry={entry} />
              ))}
              {layout.targets.length === 0 && (
                <Text style={styles.inline}>Ingen mål er registreret endnu.</Text>
              )}
            </View>

            {layout.metrics.map((section) => (
              <View key={section.id} style={styles.section} wrap={false}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionDescription}>{section.description}</Text>
                {section.modules.map((entry) => (
                  <ModuleBlock key={entry.moduleId} entry={entry} />
                ))}
              </View>
            ))}

            {layout.doubleMateriality && <DoubleMaterialitySection entry={layout.doubleMateriality} />}
          </>
        )}
      </Page>
    </Document>
  )
}
