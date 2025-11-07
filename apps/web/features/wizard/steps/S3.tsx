/**
 * Wizardtrin for modul S3 – berørte lokalsamfund.
 */
'use client'

import { useMemo } from 'react'
import type { ChangeEvent } from 'react'

import {
  incidentSeverityLevelOptions,
  remediationStatusOptions,
  runS3,
  s3ImpactTypeOptions,
  type ModuleInput,
  type ModuleResult,
  type S3Input
} from '@org/shared'

import type { WizardStepProps } from './StepTemplate'

const EMPTY_S3: S3Input = {
  communitiesIdentifiedCount: null,
  impactAssessmentsCoveragePercent: null,
  highRiskCommunitySharePercent: null,
  grievancesOpenCount: null,
  incidents: [],
  engagementNarrative: null,
  remedyNarrative: null
}

type ImpactRow = NonNullable<S3Input['incidents']>[number]

type NumericField =
  | 'communitiesIdentifiedCount'
  | 'impactAssessmentsCoveragePercent'
  | 'highRiskCommunitySharePercent'
  | 'grievancesOpenCount'

const MAX_NARRATIVE_LENGTH = 2000

function createEmptyImpact(): ImpactRow {
  return {
    community: '',
    geography: '',
    impactType: null,
    householdsAffected: null,
    severityLevel: 'medium',
    remediationStatus: null,
    description: null
  }
}

function parseNumber(value: string): number | null {
  const normalised = value.replace(',', '.').trim()
  if (normalised === '') {
    return null
  }
  const parsed = Number.parseFloat(normalised)
  return Number.isFinite(parsed) ? parsed : null
}

export function S3Step({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.S3 as S3Input | undefined) ?? EMPTY_S3
  const impacts = current.incidents ?? []

  const preview = useMemo<ModuleResult>(() => runS3({ S3: current } as ModuleInput), [current])

  const rootErrors = useMemo(() => {
    const errors: Partial<Record<NumericField, string>> = {}
    if (current.communitiesIdentifiedCount != null && current.communitiesIdentifiedCount < 0) {
      errors.communitiesIdentifiedCount = 'Angiv 0 eller flere lokalsamfund.'
    }
    const percentFields: Array<{ key: Extract<NumericField, `${string}Percent`>; label: string }> = [
      { key: 'impactAssessmentsCoveragePercent', label: 'Konsekvensanalyser' },
      { key: 'highRiskCommunitySharePercent', label: 'Højrisikoandel' },
    ]
    for (const { key, label } of percentFields) {
      const value = current[key]
      if (value != null && (value < 0 || value > 100)) {
        errors[key] = `${label} skal være mellem 0 og 100%.`
      }
    }
    if (current.grievancesOpenCount != null && current.grievancesOpenCount < 0) {
      errors.grievancesOpenCount = 'Åbne klager kan ikke være negative.'
    }
    return errors
  }, [current])

  const impactErrors = useMemo(() => {
    return impacts.map((impact) => {
      const errors: { householdsAffected?: string } = {}
      if (impact.householdsAffected != null && impact.householdsAffected < 0) {
        errors.householdsAffected = 'Antal husholdninger skal være 0 eller højere.'
      }
      return errors
    })
  }, [impacts])

  const updateRoot = (partial: Partial<S3Input>) => {
    onChange('S3', { ...current, ...partial })
  }

  const handleNumericChange = (field: NumericField) => (event: ChangeEvent<HTMLInputElement>) => {
    updateRoot({ [field]: parseNumber(event.target.value) } as Partial<S3Input>)
  }

  const handleNarrativeChange = (field: 'engagementNarrative' | 'remedyNarrative') => (
    event: ChangeEvent<HTMLTextAreaElement>
  ) => {
    const text = event.target.value.slice(0, MAX_NARRATIVE_LENGTH)
    updateRoot({ [field]: text.trim() === '' ? null : text } as Partial<S3Input>)
  }

  const handleAddImpact = () => {
    updateRoot({ incidents: [...impacts, createEmptyImpact()] })
  }

  const handleRemoveImpact = (index: number) => () => {
    updateRoot({ incidents: impacts.filter((_, rowIndex) => rowIndex !== index) })
  }

  const handleImpactTextChange = (index: number, field: 'community' | 'geography') => (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const limit = field === 'community' ? 160 : 120
    const value = event.target.value.slice(0, limit)
    const next = impacts.map((impact, rowIndex) =>
      rowIndex === index
        ? {
            ...impact,
            [field]: value.trim() === '' ? '' : value
          }
        : impact
    )
    updateRoot({ incidents: next })
  }

  const handleImpactNumericChange = (index: number) => (event: ChangeEvent<HTMLInputElement>) => {
    const parsed = parseNumber(event.target.value)
    const next = impacts.map((impact, rowIndex) =>
      rowIndex === index
        ? {
            ...impact,
            householdsAffected: parsed
          }
        : impact
    )
    updateRoot({ incidents: next })
  }

  const handleImpactSelectChange = (index: number, field: 'impactType' | 'severityLevel' | 'remediationStatus') => (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    const value = event.target.value
    const next = impacts.map((impact, rowIndex) =>
      rowIndex === index
        ? {
            ...impact,
            [field]: value === '' ? null : (value as ImpactRow[typeof field])
          }
        : impact
    )
    updateRoot({ incidents: next })
  }

  const handleImpactDescriptionChange = (index: number) => (event: ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value.slice(0, 500)
    const next = impacts.map((impact, rowIndex) =>
      rowIndex === index
        ? {
            ...impact,
            description: text.trim() === '' ? null : text
          }
        : impact
    )
    updateRoot({ incidents: next })
  }

  const hasImpacts = impacts.length > 0
  const hasInput =
    hasImpacts ||
    current.communitiesIdentifiedCount != null ||
    current.impactAssessmentsCoveragePercent != null ||
    current.highRiskCommunitySharePercent != null ||
    (current.engagementNarrative ?? '').length > 0 ||
    (current.remedyNarrative ?? '').length > 0

  return (
    <form className="ds-form ds-stack" noValidate>
      <header className="ds-stack-sm">
        <h2 className="ds-heading-sm">S3 – Lokalsamfund og påvirkninger</h2>
        <p className="ds-text-muted">
          Indsaml data om identificerede lokalsamfund, konsekvensanalyser og klager. Registrér væsentlige impacts, så kravene i
          ESRS S3 kan dokumenteres.
        </p>
      </header>

      <section className="ds-card ds-stack" aria-label="Overblik over lokalsamfund">
        <div className="ds-stack-sm ds-stack--responsive">
          <label className="ds-field">
            <span>Identificerede lokalsamfund</span>
            <input
              type="number"
              value={current.communitiesIdentifiedCount ?? ''}
              onChange={handleNumericChange('communitiesIdentifiedCount')}
              className="ds-input"
              min={0}
              placeholder="6"
              data-invalid={rootErrors.communitiesIdentifiedCount ? 'true' : 'false'}
              aria-invalid={Boolean(rootErrors.communitiesIdentifiedCount)}
              aria-describedby={
                rootErrors.communitiesIdentifiedCount ? 's3-communitiesIdentifiedCount-error' : undefined
              }
            />
            {rootErrors.communitiesIdentifiedCount && (
              <p id="s3-communitiesIdentifiedCount-error" className="ds-error">
                {rootErrors.communitiesIdentifiedCount}
              </p>
            )}
          </label>
          <label className="ds-field">
            <span>Konsekvensanalyser dækket (%)</span>
            <input
              type="number"
              value={current.impactAssessmentsCoveragePercent ?? ''}
              onChange={handleNumericChange('impactAssessmentsCoveragePercent')}
              className="ds-input"
              min={0}
              max={100}
              placeholder="70"
              data-invalid={rootErrors.impactAssessmentsCoveragePercent ? 'true' : 'false'}
              aria-invalid={Boolean(rootErrors.impactAssessmentsCoveragePercent)}
              aria-describedby={
                rootErrors.impactAssessmentsCoveragePercent ? 's3-impactAssessmentsCoveragePercent-error' : undefined
              }
            />
            {rootErrors.impactAssessmentsCoveragePercent && (
              <p id="s3-impactAssessmentsCoveragePercent-error" className="ds-error">
                {rootErrors.impactAssessmentsCoveragePercent}
              </p>
            )}
          </label>
          <label className="ds-field">
            <span>Højrisiko-lokalsamfund (%)</span>
            <input
              type="number"
              value={current.highRiskCommunitySharePercent ?? ''}
              onChange={handleNumericChange('highRiskCommunitySharePercent')}
              className="ds-input"
              min={0}
              max={100}
              placeholder="25"
              data-invalid={rootErrors.highRiskCommunitySharePercent ? 'true' : 'false'}
              aria-invalid={Boolean(rootErrors.highRiskCommunitySharePercent)}
              aria-describedby={
                rootErrors.highRiskCommunitySharePercent ? 's3-highRiskCommunitySharePercent-error' : undefined
              }
            />
            {rootErrors.highRiskCommunitySharePercent && (
              <p id="s3-highRiskCommunitySharePercent-error" className="ds-error">
                {rootErrors.highRiskCommunitySharePercent}
              </p>
            )}
          </label>
          <label className="ds-field">
            <span>Åbne klager</span>
            <input
              type="number"
              value={current.grievancesOpenCount ?? ''}
              onChange={handleNumericChange('grievancesOpenCount')}
              className="ds-input"
              min={0}
              placeholder="1"
              data-invalid={rootErrors.grievancesOpenCount ? 'true' : 'false'}
              aria-invalid={Boolean(rootErrors.grievancesOpenCount)}
              aria-describedby={rootErrors.grievancesOpenCount ? 's3-grievancesOpenCount-error' : undefined}
            />
            {rootErrors.grievancesOpenCount && (
              <p id="s3-grievancesOpenCount-error" className="ds-error">
                {rootErrors.grievancesOpenCount}
              </p>
            )}
          </label>
        </div>
      </section>

      <section className="ds-card ds-stack" aria-label="Registrerede impacts">
        <header className="ds-stack-xs">
          <h3 className="ds-heading-xs">Negative påvirkninger</h3>
          <p className="ds-text-subtle">
            Beskriv lokalsamfund, påvirkningstype og antal berørte husholdninger. Angiv status for remediering og alvorlighed.
          </p>
          <button type="button" className="ds-button" onClick={handleAddImpact}>
            Tilføj påvirkning
          </button>
        </header>

        {hasImpacts ? (
          <div className="ds-stack" role="group" aria-label="Liste over påvirkninger">
            {impacts.map((impact, index) => (
              <div key={index} className="ds-card ds-stack-sm" data-variant="subtle">
                <div className="ds-stack-sm ds-stack--responsive">
                  <label className="ds-field">
                    <span>Lokalsamfund / projekt</span>
                    <input
                      value={impact.community ?? ''}
                      onChange={handleImpactTextChange(index, 'community')}
                      className="ds-input"
                      placeholder="Fx Landsby ved mineprojekt"
                    />
                  </label>
                  <label className="ds-field">
                    <span>Geografi</span>
                    <input
                      value={impact.geography ?? ''}
                      onChange={handleImpactTextChange(index, 'geography')}
                      className="ds-input"
                      placeholder="Peru – Arequipa"
                    />
                  </label>
                  <label className="ds-field">
                    <span>Påvirkningstype</span>
                    <select
                      className="ds-input"
                      value={impact.impactType ?? ''}
                      onChange={handleImpactSelectChange(index, 'impactType')}
                    >
                      <option value="">Vælg</option>
                      {s3ImpactTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {translateImpactType(option)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="ds-field">
                    <span>Berørte husholdninger</span>
                    <input
                      type="number"
                      value={impact.householdsAffected ?? ''}
                      onChange={handleImpactNumericChange(index)}
                      className="ds-input"
                      min={0}
                      placeholder="35"
                      data-invalid={impactErrors[index]?.householdsAffected ? 'true' : 'false'}
                      aria-invalid={Boolean(impactErrors[index]?.householdsAffected)}
                      aria-describedby={
                        impactErrors[index]?.householdsAffected ? `s3-impact-${index}-households-error` : undefined
                      }
                    />
                    {impactErrors[index]?.householdsAffected && (
                      <p id={`s3-impact-${index}-households-error`} className="ds-error">
                        {impactErrors[index]?.householdsAffected}
                      </p>
                    )}
                  </label>
                  <label className="ds-field">
                    <span>Alvorlighed</span>
                    <select
                      className="ds-input"
                      value={impact.severityLevel ?? ''}
                      onChange={handleImpactSelectChange(index, 'severityLevel')}
                    >
                      <option value="">Vælg</option>
                      {incidentSeverityLevelOptions.map((option) => (
                        <option key={option} value={option}>
                          {translateSeverity(option)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="ds-field">
                    <span>Remediering</span>
                    <select
                      className="ds-input"
                      value={impact.remediationStatus ?? ''}
                      onChange={handleImpactSelectChange(index, 'remediationStatus')}
                    >
                      <option value="">Vælg</option>
                      {remediationStatusOptions.map((option) => (
                        <option key={option} value={option}>
                          {translateRemediation(option)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="ds-field">
                  <span>Beskrivelse</span>
                  <textarea
                    value={impact.description ?? ''}
                    onChange={handleImpactDescriptionChange(index)}
                    className="ds-textarea"
                    rows={3}
                    maxLength={500}
                    placeholder="Kort beskrivelse af påvirkning og planlagte tiltag"
                  />
                </label>

                <div className="ds-stack-xs ds-stack--horizontal ds-justify-end">
                  <button type="button" className="ds-button" data-variant="danger" onClick={handleRemoveImpact(index)}>
                    Fjern
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="ds-text-subtle">Ingen påvirkninger registreret endnu.</p>
        )}
      </section>

      <section className="ds-card ds-stack" aria-label="Narrativer">
        <label className="ds-field">
          <span>Dialog og engagement</span>
          <textarea
            value={current.engagementNarrative ?? ''}
            onChange={handleNarrativeChange('engagementNarrative')}
            className="ds-textarea"
            rows={4}
            maxLength={MAX_NARRATIVE_LENGTH}
            placeholder="Beskriv konsultationer, FPIC-processer og samarbejde med lokalsamfund."
          />
        </label>
        <label className="ds-field">
          <span>Afhjælpning og samarbejde</span>
          <textarea
            value={current.remedyNarrative ?? ''}
            onChange={handleNarrativeChange('remedyNarrative')}
            className="ds-textarea"
            rows={4}
            maxLength={MAX_NARRATIVE_LENGTH}
            placeholder="Opsummer kompenserende tiltag, udviklingsprojekter og opfølgning."
          />
        </label>
      </section>

      <section className="ds-summary ds-stack-sm">
        <h3 className="ds-heading-sm">Status</h3>
        {hasInput ? (
          <div className="ds-stack-sm">
            <p className="ds-value">
              {preview.value} {preview.unit}
            </p>
            <div className="ds-stack-sm">
              <strong>Antagelser</strong>
              <ul>
                {preview.assumptions.map((assumption, index) => (
                  <li key={index}>{assumption}</li>
                ))}
              </ul>
            </div>
            {preview.warnings.length > 0 && (
              <div className="ds-stack-sm">
                <strong>Advarsler</strong>
                <ul>
                  {preview.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
            <details className="ds-summary">
              <summary>Teknisk trace</summary>
              <ul>
                {preview.trace.map((line, index) => (
                  <li key={index} className="ds-code">
                    {line}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        ) : (
          <p className="ds-text-muted">Udfyld felterne for at se social score og potentielle advarsler.</p>
        )}
      </section>
    </form>
  )
}

function translateImpactType(value: string): string {
  switch (value) {
    case 'landRights':
      return 'Jord- og brugsrettigheder'
    case 'environmentalDamage':
      return 'Miljøskade'
    case 'healthAndSafety':
      return 'Sundhed og sikkerhed'
    case 'culturalHeritage':
      return 'Kulturel arv'
    case 'securityAndConflict':
      return 'Sikkerhed/konflikt'
    default:
      return 'Andet'
  }
}

function translateSeverity(value: string): string {
  switch (value) {
    case 'high':
      return 'Høj'
    case 'medium':
      return 'Middel'
    case 'low':
    default:
      return 'Lav'
  }
}

function translateRemediation(value: string): string {
  switch (value) {
    case 'completed':
      return 'Afsluttet'
    case 'inProgress':
      return 'I gang'
    case 'notStarted':
    default:
      return 'Ikke startet'
  }
}
