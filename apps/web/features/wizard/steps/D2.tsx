/**
 * Wizardtrin for modul D2 – dobbelt væsentlighed og CSRD-gapstatus.
 */
'use client'

import { useMemo } from 'react'
import type { ChangeEvent } from 'react'
import {
  materialityRiskOptions,
  materialityTimelineOptions,
  materialityGapStatusOptions,
  materialityImpactTypeOptions,
  materialitySeverityOptions,
  materialityLikelihoodOptions,
  materialityValueChainStageOptions,
  materialityRemediationStatusOptions,
  runD2,
  type D2Input,
  type ModuleInput,
  type ModuleResult
} from '@org/shared'

import type { WizardStepProps } from './StepTemplate'

type MaterialityRow = NonNullable<D2Input['materialTopics']>[number]

type NumericFieldKey = 'impactScore' | 'financialScore'
type TextFieldKey = 'title' | 'description' | 'responsible'

const EMPTY_D2: D2Input = { materialTopics: [] }
const SCORE_MAX = 5
const TITLE_LIMIT = 120
const DESCRIPTION_LIMIT = 500
const RESPONSIBLE_LIMIT = 120
const FINANCIAL_EXCEPTION_JUSTIFICATION_LIMIT = 500
const FINANCIAL_EXCEPTION_MIN_LENGTH = 20

const riskOptions = materialityRiskOptions.map((value) => ({
  value,
  label:
    value === 'risk' ? 'Risiko' : value === 'opportunity' ? 'Mulighed' : 'Risiko & mulighed'
}))

const riskLabels = Object.fromEntries(riskOptions.map((option) => [option.value, option.label])) as Record<
  NonNullable<MaterialityRow['riskType']>,
  string
>

const timelineOptions = materialityTimelineOptions.map((value) => ({
  value,
  label:
    value === 'shortTerm'
      ? '0-12 mdr.'
      : value === 'mediumTerm'
      ? '1-3 år'
      : value === 'longTerm'
      ? '3+ år'
      : 'Løbende'
}))

const timelineLabels = Object.fromEntries(
  timelineOptions.map((option) => [option.value, option.label])
) as Record<NonNullable<MaterialityRow['timeline']>, string>

const gapStatusOptions = materialityGapStatusOptions.map((value) => ({
  value,
  label:
    value === 'aligned'
      ? 'Ingen gap'
      : value === 'partial'
      ? 'Delvist afdækket'
      : 'Gap mangler'
}))

const gapStatusLabels = Object.fromEntries(
  gapStatusOptions.map((option) => [option.value, option.label])
) as Record<NonNullable<MaterialityRow['csrdGapStatus']>, string>

const impactTypeOptions = materialityImpactTypeOptions.map((value) => ({
  value,
  label: value === 'actual' ? 'Faktisk påvirkning' : 'Potentiel påvirkning'
}))

const severityOptions = materialitySeverityOptions.map((value) => ({
  value,
  label:
    value === 'minor'
      ? 'Begrænset alvor'
      : value === 'moderate'
      ? 'Middel alvor'
      : value === 'major'
      ? 'Væsentlig alvor'
      : 'Kritisk alvor'
}))

const likelihoodOptions = materialityLikelihoodOptions.map((value) => ({
  value,
  label:
    value === 'rare'
      ? 'Sjælden'
      : value === 'unlikely'
      ? 'Usandsynlig'
      : value === 'possible'
      ? 'Mulig'
      : value === 'likely'
      ? 'Sandsynlig'
      : 'Meget sandsynlig'
}))

const valueChainOptions = materialityValueChainStageOptions.map((value) => ({
  value,
  label:
    value === 'ownOperations'
      ? 'Egne aktiviteter'
      : value === 'upstream'
      ? 'Upstream'
      : 'Downstream'
}))

const remediationOptions = materialityRemediationStatusOptions.map((value) => ({
  value,
  label:
    value === 'none' ? 'Ingen afhjælpning' : value === 'planned' ? 'Planlagt indsats' : 'Afhjælpning implementeret'
}))

const impactTypeLabels = Object.fromEntries(impactTypeOptions.map((option) => [option.value, option.label])) as Record<
  NonNullable<MaterialityRow['impactType']>,
  string
>

const severityLabels = Object.fromEntries(severityOptions.map((option) => [option.value, option.label])) as Record<
  NonNullable<MaterialityRow['severity']>,
  string
>

const likelihoodLabels = Object.fromEntries(
  likelihoodOptions.map((option) => [option.value, option.label])
) as Record<NonNullable<MaterialityRow['likelihood']>, string>

const valueChainLabels = Object.fromEntries(
  valueChainOptions.map((option) => [option.value, option.label])
) as Record<NonNullable<MaterialityRow['valueChainSegment']>, string>

const remediationLabels = Object.fromEntries(
  remediationOptions.map((option) => [option.value, option.label])
) as Record<NonNullable<MaterialityRow['remediationStatus']>, string>

function createDefaultTopic(): MaterialityRow {
  return {
    title: '',
    description: null,
    riskType: 'risk',
    impactType: 'actual',
    severity: 'major',
    likelihood: 'likely',
    impactScore: null,
    financialScore: null,
    financialExceptionApproved: false,
    financialExceptionJustification: null,
    timeline: 'shortTerm',
    valueChainSegment: 'ownOperations',
    responsible: null,
    csrdGapStatus: 'partial',
    remediationStatus: 'none'
  }
}

export function D2Step({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.D2 as D2Input | undefined) ?? EMPTY_D2
  const topics = current.materialTopics ?? []

  const preview = useMemo<ModuleResult>(() => runD2({ D2: current } as ModuleInput), [current])
  const materialitySummary = preview.doubleMateriality ?? null

  const updateTopics = (next: MaterialityRow[]) => {
    onChange('D2', { materialTopics: next })
  }

  const handleAddTopic = () => {
    updateTopics([...topics, createDefaultTopic()])
  }

  const handleRemoveTopic = (index: number) => () => {
    updateTopics(topics.filter((_, rowIndex) => rowIndex !== index))
  }

  const handleNumericFieldChange = (index: number, field: NumericFieldKey) => (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const raw = event.target.value.replace(',', '.')
    const parsed = raw === '' ? null : Number.parseFloat(raw)
    const clamped = parsed == null || Number.isNaN(parsed) ? null : Math.min(Math.max(parsed, 0), SCORE_MAX)

    const next = topics.map((topic, rowIndex) =>
      rowIndex === index
        ? {
            ...topic,
            [field]: clamped
          }
        : topic
    )

    updateTopics(next as MaterialityRow[])
  }

  const handleTextFieldChange = (index: number, field: TextFieldKey, limit: number) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const raw = event.target.value.slice(0, limit)
    let nextValue: string | null = raw

    if (field === 'description') {
      nextValue = raw.trim() === '' ? null : raw
    } else if (field === 'responsible') {
      const trimmed = raw.trim()
      nextValue = trimmed === '' ? null : trimmed
    }

    const next = topics.map((topic, rowIndex) =>
      rowIndex === index
        ? {
            ...topic,
            [field]: nextValue
          }
        : topic
    )

    updateTopics(next as MaterialityRow[])
  }

  const handleRiskChange = (index: number) => (event: ChangeEvent<HTMLSelectElement>) => {
    const value =
      event.target.value === '' ? null : (event.target.value as MaterialityRow['riskType'])
    const next = topics.map((topic, rowIndex) =>
      rowIndex === index
        ? {
            ...topic,
            riskType: value
          }
        : topic
    )

    updateTopics(next as MaterialityRow[])
  }

  const handleTimelineChange = (index: number) => (event: ChangeEvent<HTMLSelectElement>) => {
    const value =
      event.target.value === '' ? null : (event.target.value as MaterialityRow['timeline'])
    const next = topics.map((topic, rowIndex) =>
      rowIndex === index
        ? {
            ...topic,
            timeline: value
          }
        : topic
    )

    updateTopics(next as MaterialityRow[])
  }

  const handleGapChange = (index: number) => (event: ChangeEvent<HTMLSelectElement>) => {
    const value =
      event.target.value === '' ? null : (event.target.value as MaterialityRow['csrdGapStatus'])
    const next = topics.map((topic, rowIndex) =>
      rowIndex === index
        ? {
            ...topic,
            csrdGapStatus: value
          }
        : topic
    )

    updateTopics(next as MaterialityRow[])
  }

  const handleFinancialExceptionToggle = (index: number) => (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const checked = event.target.checked
    const next = topics.map((topic, rowIndex) =>
      rowIndex === index
        ? {
            ...topic,
            financialExceptionApproved: checked,
            financialExceptionJustification: checked
              ? topic.financialExceptionJustification ?? ''
              : null
          }
        : topic
    )

    updateTopics(next as MaterialityRow[])
  }

  const handleFinancialExceptionJustificationChange = (index: number) => (
    event: ChangeEvent<HTMLTextAreaElement>
  ) => {
    const raw = event.target.value.slice(0, FINANCIAL_EXCEPTION_JUSTIFICATION_LIMIT)
    const nextValue = raw.trim().length === 0 ? null : raw
    const next = topics.map((topic, rowIndex) =>
      rowIndex === index
        ? {
            ...topic,
            financialExceptionJustification: nextValue
          }
        : topic
    )

    updateTopics(next as MaterialityRow[])
  }

  const handleImpactTypeChange = (index: number) => (event: ChangeEvent<HTMLSelectElement>) => {
    const value =
      event.target.value === '' ? null : (event.target.value as MaterialityRow['impactType'])
    const next = topics.map((topic, rowIndex) =>
      rowIndex === index
        ? {
            ...topic,
            impactType: value
          }
        : topic
    )

    updateTopics(next as MaterialityRow[])
  }

  const handleSeverityChange = (index: number) => (event: ChangeEvent<HTMLSelectElement>) => {
    const value =
      event.target.value === '' ? null : (event.target.value as MaterialityRow['severity'])
    const next = topics.map((topic, rowIndex) =>
      rowIndex === index
        ? {
            ...topic,
            severity: value
          }
        : topic
    )

    updateTopics(next as MaterialityRow[])
  }

  const handleLikelihoodChange = (index: number) => (event: ChangeEvent<HTMLSelectElement>) => {
    const value =
      event.target.value === '' ? null : (event.target.value as MaterialityRow['likelihood'])
    const next = topics.map((topic, rowIndex) =>
      rowIndex === index
        ? {
            ...topic,
            likelihood: value
          }
        : topic
    )

    updateTopics(next as MaterialityRow[])
  }

  const handleValueChainChange = (index: number) => (event: ChangeEvent<HTMLSelectElement>) => {
    const value =
      event.target.value === '' ? null : (event.target.value as MaterialityRow['valueChainSegment'])
    const next = topics.map((topic, rowIndex) =>
      rowIndex === index
        ? {
            ...topic,
            valueChainSegment: value
          }
        : topic
    )

    updateTopics(next as MaterialityRow[])
  }

  const handleRemediationChange = (index: number) => (event: ChangeEvent<HTMLSelectElement>) => {
    const value =
      event.target.value === '' ? null : (event.target.value as MaterialityRow['remediationStatus'])
    const next = topics.map((topic, rowIndex) =>
      rowIndex === index
        ? {
            ...topic,
            remediationStatus: value
          }
        : topic
    )

    updateTopics(next as MaterialityRow[])
  }

  const hasTopics = topics.length > 0

  const formatImpactType = (value: string | null) =>
    value ? impactTypeLabels[value as keyof typeof impactTypeLabels] ?? value : 'Ukendt'
  const formatSeverity = (value: string | null) =>
    value ? severityLabels[value as keyof typeof severityLabels] ?? value : 'Ukendt'
  const formatLikelihood = (value: string | null) =>
    value ? likelihoodLabels[value as keyof typeof likelihoodLabels] ?? value : 'Ukendt'
  const formatValueChain = (value: string | null) =>
    value ? valueChainLabels[value as keyof typeof valueChainLabels] ?? value : 'Ukendt'
  const formatRemediation = (value: string | null) =>
    value ? remediationLabels[value as keyof typeof remediationLabels] ?? value : 'Ukendt'
  const formatRisk = (value: string | null) =>
    value ? riskLabels[value as keyof typeof riskLabels] ?? value : 'Ukendt'
  const formatTimeline = (value: string | null) =>
    value ? timelineLabels[value as keyof typeof timelineLabels] ?? value : 'Ukendt'
  const formatGap = (value: string | null) =>
    value ? gapStatusLabels[value as keyof typeof gapStatusLabels] ?? value : 'Ukendt'
  const formatPriorityBand = (band: string) =>
    band === 'priority' ? 'Høj prioritet' : band === 'attention' ? 'Observation' : 'Monitorering'

  return (
    <form style={{ display: 'grid', gap: '1.5rem', maxWidth: '68rem' }}>
      <header style={{ display: 'grid', gap: '0.75rem' }}>
        <h2>D2 – Dobbelt væsentlighed &amp; CSRD-gaps</h2>
        <p style={{ margin: 0 }}>
          Registrér væsentlige emner, risici og muligheder samt ansvarlige og tidslinjer. Modulet giver et samlet
          prioriteringsscore og fremhæver, hvor CSRD-gap-indsatsen mangler.
        </p>
      </header>

      <section style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <h3 style={{ margin: 0 }}>Materialitetsemner</h3>
          <button
            type="button"
            onClick={handleAddTopic}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid #2f6f4f',
              background: '#2f6f4f',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Tilføj emne
          </button>
        </div>

        {hasTopics ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {topics.map((topic, index) => {
              const titleValue = topic.title
              const descriptionValue = topic.description ?? ''
              const responsibleValue = topic.responsible ?? ''
              const financialValue = topic.financialScore ?? ''
              const riskValue = topic.riskType ?? ''
              const timelineValue = topic.timeline ?? ''
              const gapValue = topic.csrdGapStatus ?? ''
              const impactTypeValue = topic.impactType ?? ''
              const severityValue = topic.severity ?? ''
              const likelihoodValue = topic.likelihood ?? ''
              const valueChainValue = topic.valueChainSegment ?? ''
              const remediationValue = topic.remediationStatus ?? ''

              return (
                <article
                  key={`d2-topic-${index}`}
                  style={{
                    border: '1px solid #d0d7d5',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    display: 'grid',
                    gap: '0.75rem',
                    background: '#f9fbfa'
                  }}
                >
                  <header style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'grid', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 600 }}>Titel på væsentligt emne</span>
                        <input
                          value={titleValue}
                          maxLength={TITLE_LIMIT}
                          onChange={handleTextFieldChange(index, 'title', TITLE_LIMIT)}
                          placeholder="Fx Klimarisiko i forsyningskæden"
                          style={{ padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid #cbd5d0' }}
                        />
                        <span style={{ fontSize: '0.8rem', color: '#5f6c66' }}>
                          {titleValue.length}/{TITLE_LIMIT} tegn
                        </span>
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveTopic(index)}
                      style={{
                        alignSelf: 'flex-start',
                        padding: '0.4rem 0.6rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #c8d1cc',
                        background: '#fff',
                        color: '#2f3c36',
                        cursor: 'pointer'
                      }}
                      aria-label={`Fjern emne ${index + 1}`}
                    >
                      Fjern
                    </button>
                  </header>

                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <label style={{ display: 'grid', gap: '0.4rem' }}>
                      <span style={{ fontWeight: 600 }}>Beskrivelse / notat</span>
                      <textarea
                        rows={3}
                        value={descriptionValue}
                        maxLength={DESCRIPTION_LIMIT}
                        onChange={handleTextFieldChange(index, 'description', DESCRIPTION_LIMIT)}
                        style={{
                          padding: '0.65rem',
                          borderRadius: '0.5rem',
                          border: '1px solid #cbd5d0',
                          fontFamily: 'inherit'
                        }}
                      />
                      <span style={{ fontSize: '0.8rem', color: '#5f6c66' }}>
                        {descriptionValue.length}/{DESCRIPTION_LIMIT} tegn
                      </span>
                    </label>

                    <div
                      style={{
                        display: 'grid',
                        gap: '0.75rem',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))'
                      }}
                    >
                      <label style={{ display: 'grid', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 600 }}>Påvirkningstype</span>
                        <select
                          value={impactTypeValue}
                          onChange={handleImpactTypeChange(index)}
                          style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #cbd5d0' }}
                        >
                          <option value="">Vælg...</option>
                          {impactTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label style={{ display: 'grid', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 600 }}>Alvor/omfang</span>
                        <select
                          value={severityValue}
                          onChange={handleSeverityChange(index)}
                          style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #cbd5d0' }}
                        >
                          <option value="">Vælg...</option>
                          {severityOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label style={{ display: 'grid', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 600 }}>Sandsynlighed</span>
                        <select
                          value={likelihoodValue}
                          onChange={handleLikelihoodChange(index)}
                          style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #cbd5d0' }}
                        >
                          <option value="">Vælg...</option>
                          {likelihoodOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label style={{ display: 'grid', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 600 }}>Værdikædeled</span>
                        <select
                          value={valueChainValue}
                          onChange={handleValueChainChange(index)}
                          style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #cbd5d0' }}
                        >
                          <option value="">Vælg...</option>
                          {valueChainOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label style={{ display: 'grid', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 600 }}>Eksisterende afhjælpning</span>
                        <select
                          value={remediationValue}
                          onChange={handleRemediationChange(index)}
                          style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #cbd5d0' }}
                        >
                          <option value="">Vælg...</option>
                          {remediationOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label style={{ display: 'grid', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 600 }}>Risiko eller mulighed</span>
                        <select
                          value={riskValue}
                          onChange={handleRiskChange(index)}
                          style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #cbd5d0' }}
                        >
                          <option value="">Vælg...</option>
                          {riskOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label style={{ display: 'grid', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 600 }}>Finansiel score (0-5)</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          max={SCORE_MAX}
                          step={0.1}
                          value={financialValue}
                          onChange={handleNumericFieldChange(index, 'financialScore')}
                          placeholder="0-5"
                      style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #cbd5d0' }}
                    />
                  </label>

                  <label style={{ display: 'grid', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600 }}>Begrundet undtagelse</span>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(topic.financialExceptionApproved)}
                        onChange={handleFinancialExceptionToggle(index)}
                        aria-label="Bekræft undtagelse for manglende finansiel score"
                      />
                      <span style={{ color: '#374741' }}>
                        Finansiel vurdering kan ikke beregnes (kræver begrundelse på mindst {FINANCIAL_EXCEPTION_MIN_LENGTH} tegn)
                      </span>
                    </div>
                    {topic.financialExceptionApproved && (
                      <textarea
                        value={topic.financialExceptionJustification ?? ''}
                        onChange={handleFinancialExceptionJustificationChange(index)}
                        placeholder="Beskriv hvorfor finansiel score ikke kan udfyldes"
                        rows={3}
                        style={{
                          padding: '0.6rem',
                          borderRadius: '0.5rem',
                          border: '1px solid #cbd5d0',
                          resize: 'vertical'
                        }}
                      />
                    )}
                    {topic.financialExceptionApproved &&
                      (topic.financialExceptionJustification ?? '').trim().length === 0 && (
                        <p style={{ margin: 0, color: '#b54708' }}>
                          Tilføj en begrundelse, så undtagelsen kan dokumenteres i beregningen.
                        </p>
                      )}
                    {topic.financialExceptionApproved &&
                      (topic.financialExceptionJustification ?? '').trim().length > 0 &&
                      (topic.financialExceptionJustification ?? '').trim().length <
                        FINANCIAL_EXCEPTION_MIN_LENGTH && (
                        <p style={{ margin: 0, color: '#b54708' }}>
                          Begrundelsen skal være på mindst {FINANCIAL_EXCEPTION_MIN_LENGTH} tegn for at undtagelsen accepteres i
                          beregningen.
                        </p>
                      )}
                  </label>

                  {topic.financialScore == null && !topic.financialExceptionApproved && (
                    <p
                      style={{
                        margin: 0,
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.5rem',
                        backgroundColor: '#fff4e5',
                        color: '#9a3412'
                      }}
                    >
                      Udfyld en finansiel score eller bekræft en begrundet undtagelse for at kunne prioritere emnet.
                    </p>
                  )}

                      <label style={{ display: 'grid', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 600 }}>Tidslinje</span>
                        <select
                          value={timelineValue}
                          onChange={handleTimelineChange(index)}
                          style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #cbd5d0' }}
                        >
                          <option value="">Vælg...</option>
                          {timelineOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label style={{ display: 'grid', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 600 }}>Ansvarlig</span>
                        <input
                          value={responsibleValue}
                          maxLength={RESPONSIBLE_LIMIT}
                          onChange={handleTextFieldChange(index, 'responsible', RESPONSIBLE_LIMIT)}
                          placeholder="Fx ESG-ansvarlig eller CFO"
                          style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #cbd5d0' }}
                        />
                      </label>

                      <label style={{ display: 'grid', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 600 }}>CSRD-gap status</span>
                        <select
                          value={gapValue}
                          onChange={handleGapChange(index)}
                          style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid #cbd5d0' }}
                        >
                          <option value="">Vælg...</option>
                          {gapStatusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <p style={{ margin: 0, color: '#5f6c66' }}>
            Tilføj jeres væsentlige emner for at beregne samlet prioritet og identificere gap-handlinger.
          </p>
        )}
      </section>

      <section
        style={{
          display: 'grid',
          gap: '0.75rem',
          background: '#f9fbfa',
          border: '1px solid #d5e1dc',
          borderRadius: '0.75rem',
          padding: '1.25rem'
        }}
      >
        <h3 style={{ margin: 0 }}>Materialitetsanalyse</h3>
        <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 600 }}>
          {preview.value} {preview.unit}
        </p>
        {materialitySummary ? (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div>
              <strong>Overblik</strong>
              <ul>
                <li>Emner i alt: {materialitySummary.overview.totalTopics}</li>
                <li>Prioriterede emner: {materialitySummary.overview.prioritisedTopics}</li>
                <li>Observationer: {materialitySummary.overview.attentionTopics}</li>
                <li>Gap-advarsler: {materialitySummary.overview.gapAlerts}</li>
                <li>Gennemsnitlig score: {materialitySummary.overview.averageScore.toFixed(1)}</li>
              </ul>
            </div>

            {materialitySummary.prioritisationCriteria.length > 0 && (
              <div>
                <strong>Prioriteringskriterier</strong>
                <ul>
                  {materialitySummary.prioritisationCriteria.map((criterion, index) => (
                    <li key={`criterion-${index}`}>
                      <span style={{ fontWeight: 600 }}>{criterion.title}:</span> {criterion.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {materialitySummary.tables.topics.length > 0 && (
              <div>
                <strong>Topemner</strong>
                <ul style={{ display: 'grid', gap: '0.5rem', paddingLeft: '1.2rem' }}>
                  {materialitySummary.tables.topics.map((topic, index) => (
                    <li
                      key={`topic-${index}`}
                      style={{ display: 'grid', gap: '0.25rem', listStyle: 'disc outside' }}
                    >
                      <span style={{ fontWeight: 600 }}>
                        {topic.name} · {formatPriorityBand(topic.priorityBand)} ({topic.combinedScore.toFixed(1)})
                      </span>
                      <small style={{ color: '#3c4c45' }}>
                        Impactmatrix: {formatImpactType(topic.impactType)} · {formatSeverity(topic.severity)} ·{' '}
                        {formatLikelihood(topic.likelihood)}
                      </small>
                      <small style={{ color: '#3c4c45' }}>
                        Impactscore: {topic.impactScore.toFixed(1)} · Finansiel score:{' '}
                        {topic.financialScore != null ? topic.financialScore.toFixed(1) : 'n/a'} · Tidslinje-score:{' '}
                        {topic.timelineScore != null ? topic.timelineScore.toFixed(1) : 'n/a'}
                      </small>
                      <small style={{ color: '#3c4c45' }}>
                        Tidslinje: {formatTimeline(topic.timeline)} · Værdikæde: {formatValueChain(topic.valueChainSegment)} ·{' '}
                        Afhjælpning: {formatRemediation(topic.remediationStatus)} · Risiko: {formatRisk(topic.riskType)} · CSRD-gap:{' '}
                        {formatGap(topic.csrdGapStatus)}
                      </small>
                      {topic.description && (
                        <small style={{ color: '#3c4c45' }}>Note: {topic.description}</small>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {materialitySummary.tables.impactMatrix.length > 0 && (
              <div>
                <strong>Impact-matrix</strong>
                <ul>
                  {materialitySummary.tables.impactMatrix.map((row, index) => (
                    <li key={`matrix-${index}`}>
                      {formatSeverity(row.severity)} × {formatLikelihood(row.likelihood)}: {row.topics}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(materialitySummary.dueDiligence.impactTypes.length > 0 ||
              materialitySummary.dueDiligence.valueChain.length > 0 ||
              materialitySummary.dueDiligence.remediation.length > 0) && (
              <div>
                <strong>Due diligence reference</strong>
                <div style={{ display: 'grid', gap: '0.4rem' }}>
                  {materialitySummary.dueDiligence.impactTypes.length > 0 && (
                    <span>
                      Påvirkningstyper:{' '}
                      {materialitySummary.dueDiligence.impactTypes
                        .map((entry) => `${entry.label}: ${entry.topics}`)
                        .join(', ')}
                    </span>
                  )}
                  {materialitySummary.dueDiligence.valueChain.length > 0 && (
                    <span>
                      Værdikædeled:{' '}
                      {materialitySummary.dueDiligence.valueChain
                        .map((entry) => `${entry.label}: ${entry.topics}`)
                        .join(', ')}
                    </span>
                  )}
                  {materialitySummary.dueDiligence.remediation.length > 0 && (
                    <span>
                      Afhjælpning:{' '}
                      {materialitySummary.dueDiligence.remediation
                        .map((entry) => `${entry.label}: ${entry.topics}`)
                        .join(', ')}
                    </span>
                  )}
                </div>
              </div>
            )}

            {materialitySummary.tables.gapAlerts.length > 0 && (
              <div>
                <strong>Gap-advarsler</strong>
                <ul>
                  {materialitySummary.tables.gapAlerts.map((topic, index) => (
                    <li key={`gap-${index}`}>Manglende CSRD-gap for {topic}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p style={{ margin: 0, color: '#5f6c66' }}>
            Tilføj væsentlige emner for at udløse prioriteringsoversigten og due diligence-referencer.
          </p>
        )}
        <div>
          <strong>Antagelser</strong>
          <ul>
            {preview.assumptions.map((assumption, index) => (
              <li key={`assumption-${index}`}>{assumption}</li>
            ))}
          </ul>
        </div>
        {preview.warnings.length > 0 && (
          <div
            style={{
              marginTop: '1.5rem',
              backgroundColor: '#fff4e5',
              border: '1px solid #f97316',
              borderRadius: '0.75rem',
              padding: '1rem 1.25rem'
            }}
          >
            <strong>Forslag til opfølgning</strong>
            <ul>
              {preview.warnings.map((warning, index) => (
                <li key={`warning-${index}`} style={{ color: '#9a3412' }}>
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}
        <details>
          <summary>Teknisk trace</summary>
          <ul>
            {preview.trace.map((traceEntry, index) => (
              <li key={`trace-${index}`} style={{ fontFamily: 'monospace' }}>
                {traceEntry}
              </li>
            ))}
          </ul>
        </details>
      </section>
    </form>
  )
}
