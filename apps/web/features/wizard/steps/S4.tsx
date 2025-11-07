/**
 * Wizardtrin for modul S4 – forbrugere og slutbrugere.
 */
'use client'

import { useMemo } from 'react'
import type { ChangeEvent } from 'react'

import {
  remediationStatusOptions,
  runS4,
  s4ConsumerIssueTypeOptions,
  s4SeverityLevelOptions,
  type ModuleInput,
  type ModuleResult,
  type S4Input
} from '@org/shared'

import type { WizardStepProps } from './StepTemplate'

const EMPTY_S4: S4Input = {
  productsAssessedPercent: null,
  severeIncidentsCount: null,
  recallsCount: null,
  complaintsResolvedPercent: null,
  dataBreachesCount: null,
  grievanceMechanismInPlace: null,
  escalationTimeframeDays: null,
  issues: [],
  vulnerableUsersNarrative: null,
  consumerEngagementNarrative: null
}

type IssueRow = NonNullable<S4Input['issues']>[number]

type NumericField =
  | 'productsAssessedPercent'
  | 'complaintsResolvedPercent'
  | 'severeIncidentsCount'
  | 'recallsCount'
  | 'dataBreachesCount'
  | 'escalationTimeframeDays'

const MAX_NARRATIVE_LENGTH = 2000

function createEmptyIssue(): IssueRow {
  return {
    productOrService: '',
    market: '',
    issueType: null,
    usersAffected: null,
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

export function S4Step({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.S4 as S4Input | undefined) ?? EMPTY_S4
  const issues = current.issues ?? []

  const preview = useMemo<ModuleResult>(() => runS4({ S4: current } as ModuleInput), [current])

  const rootErrors = useMemo(() => {
    const errors: Partial<Record<NumericField, string>> = {}
    const percentFields: Array<{ key: Extract<NumericField, `${string}Percent`>; label: string }> = [
      { key: 'productsAssessedPercent', label: 'Risikovurderede produkter' },
      { key: 'complaintsResolvedPercent', label: 'Klager løst' },
    ]
    for (const { key, label } of percentFields) {
      const value = current[key]
      if (value != null && (value < 0 || value > 100)) {
        errors[key] = `${label} skal være mellem 0 og 100%.`
      }
    }
    const countFields: Array<{ key: Extract<NumericField, `${string}Count` | `${string}Days`>; label: string }> = [
      { key: 'dataBreachesCount', label: 'Datasikkerhedsbrud' },
      { key: 'severeIncidentsCount', label: 'Alvorlige hændelser' },
      { key: 'recallsCount', label: 'Tilbagekaldelser' },
      { key: 'escalationTimeframeDays', label: 'Eskaleringsfrist' },
    ]
    for (const { key, label } of countFields) {
      const value = current[key]
      if (value != null && value < 0) {
        errors[key] = `${label} kan ikke være negativt.`
      }
    }
    return errors
  }, [current])

  const issueErrors = useMemo(() => {
    return issues.map((issue) => {
      const errors: { usersAffected?: string } = {}
      if (issue.usersAffected != null && issue.usersAffected < 0) {
        errors.usersAffected = 'Antal berørte skal være 0 eller højere.'
      }
      return errors
    })
  }, [issues])

  const updateRoot = (partial: Partial<S4Input>) => {
    onChange('S4', { ...current, ...partial })
  }

  const handleNumericChange = (field: NumericField) => (event: ChangeEvent<HTMLInputElement>) => {
    updateRoot({ [field]: parseNumber(event.target.value) } as Partial<S4Input>)
  }

  const handleMechanismChange = (value: boolean | null) => () => {
    updateRoot({ grievanceMechanismInPlace: value })
  }

  const handleNarrativeChange = (field: 'vulnerableUsersNarrative' | 'consumerEngagementNarrative') => (
    event: ChangeEvent<HTMLTextAreaElement>
  ) => {
    const text = event.target.value.slice(0, MAX_NARRATIVE_LENGTH)
    updateRoot({ [field]: text.trim() === '' ? null : text } as Partial<S4Input>)
  }

  const handleAddIssue = () => {
    updateRoot({ issues: [...issues, createEmptyIssue()] })
  }

  const handleRemoveIssue = (index: number) => () => {
    updateRoot({ issues: issues.filter((_, rowIndex) => rowIndex !== index) })
  }

  const handleIssueTextChange = (index: number, field: 'productOrService' | 'market') => (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const limit = field === 'productOrService' ? 160 : 120
    const value = event.target.value.slice(0, limit)
    const next = issues.map((issue, rowIndex) =>
      rowIndex === index
        ? {
            ...issue,
            [field]: value.trim() === '' ? '' : value
          }
        : issue
    )
    updateRoot({ issues: next })
  }

  const handleIssueNumericChange = (index: number) => (event: ChangeEvent<HTMLInputElement>) => {
    const parsed = parseNumber(event.target.value)
    const next = issues.map((issue, rowIndex) =>
      rowIndex === index
        ? {
            ...issue,
            usersAffected: parsed
          }
        : issue
    )
    updateRoot({ issues: next })
  }

  const handleIssueSelectChange = (index: number, field: 'issueType' | 'severityLevel' | 'remediationStatus') => (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    const value = event.target.value
    const next = issues.map((issue, rowIndex) =>
      rowIndex === index
        ? {
            ...issue,
            [field]: value === '' ? null : (value as IssueRow[typeof field])
          }
        : issue
    )
    updateRoot({ issues: next })
  }

  const handleIssueDescriptionChange = (index: number) => (event: ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value.slice(0, 500)
    const next = issues.map((issue, rowIndex) =>
      rowIndex === index
        ? {
            ...issue,
            description: text.trim() === '' ? null : text
          }
        : issue
    )
    updateRoot({ issues: next })
  }

  const hasIssues = issues.length > 0
  const hasInput =
    hasIssues ||
    current.productsAssessedPercent != null ||
    current.complaintsResolvedPercent != null ||
    current.grievanceMechanismInPlace != null ||
    (current.vulnerableUsersNarrative ?? '').length > 0 ||
    (current.consumerEngagementNarrative ?? '').length > 0

  return (
    <form className="ds-form ds-stack" noValidate>
      <header className="ds-stack-sm">
        <h2 className="ds-heading-sm">S4 – Forbrugere og slutbrugere</h2>
        <p className="ds-text-muted">
          Dokumentér dækning af produkt-risikovurderinger, klagehåndtering og datasikkerhed. Registrér hændelser og tilbagekald,
          så ESRS S4-kravene kan opfyldes.
        </p>
      </header>

      <section className="ds-card ds-stack" aria-label="Nøgletal for forbrugere">
        <div className="ds-stack-sm ds-stack--responsive">
          <label className="ds-field">
            <span>Produkter med risikovurdering (%)</span>
            <input
              type="number"
              value={current.productsAssessedPercent ?? ''}
              onChange={handleNumericChange('productsAssessedPercent')}
              className="ds-input"
              min={0}
              max={100}
              placeholder="65"
              data-invalid={rootErrors.productsAssessedPercent ? 'true' : 'false'}
              aria-invalid={Boolean(rootErrors.productsAssessedPercent)}
              aria-describedby={
                rootErrors.productsAssessedPercent ? 's4-productsAssessedPercent-error' : undefined
              }
            />
            {rootErrors.productsAssessedPercent && (
              <p id="s4-productsAssessedPercent-error" className="ds-error">
                {rootErrors.productsAssessedPercent}
              </p>
            )}
          </label>
          <label className="ds-field">
            <span>Klager løst inden for SLA (%)</span>
            <input
              type="number"
              value={current.complaintsResolvedPercent ?? ''}
              onChange={handleNumericChange('complaintsResolvedPercent')}
              className="ds-input"
              min={0}
              max={100}
              placeholder="80"
              data-invalid={rootErrors.complaintsResolvedPercent ? 'true' : 'false'}
              aria-invalid={Boolean(rootErrors.complaintsResolvedPercent)}
              aria-describedby={
                rootErrors.complaintsResolvedPercent ? 's4-complaintsResolvedPercent-error' : undefined
              }
            />
            {rootErrors.complaintsResolvedPercent && (
              <p id="s4-complaintsResolvedPercent-error" className="ds-error">
                {rootErrors.complaintsResolvedPercent}
              </p>
            )}
          </label>
          <label className="ds-field">
            <span>Datasikkerhedsbrud</span>
            <input
              type="number"
              value={current.dataBreachesCount ?? ''}
              onChange={handleNumericChange('dataBreachesCount')}
              className="ds-input"
              min={0}
              placeholder="0"
              data-invalid={rootErrors.dataBreachesCount ? 'true' : 'false'}
              aria-invalid={Boolean(rootErrors.dataBreachesCount)}
              aria-describedby={rootErrors.dataBreachesCount ? 's4-dataBreachesCount-error' : undefined}
            />
            {rootErrors.dataBreachesCount && (
              <p id="s4-dataBreachesCount-error" className="ds-error">
                {rootErrors.dataBreachesCount}
              </p>
            )}
          </label>
        </div>

        <div className="ds-stack-sm ds-stack--responsive">
          <label className="ds-field">
            <span>Alvorlige hændelser</span>
            <input
              type="number"
              value={current.severeIncidentsCount ?? ''}
              onChange={handleNumericChange('severeIncidentsCount')}
              className="ds-input"
              min={0}
              placeholder="1"
              data-invalid={rootErrors.severeIncidentsCount ? 'true' : 'false'}
              aria-invalid={Boolean(rootErrors.severeIncidentsCount)}
              aria-describedby={
                rootErrors.severeIncidentsCount ? 's4-severeIncidentsCount-error' : undefined
              }
            />
            {rootErrors.severeIncidentsCount && (
              <p id="s4-severeIncidentsCount-error" className="ds-error">
                {rootErrors.severeIncidentsCount}
              </p>
            )}
          </label>
          <label className="ds-field">
            <span>Produkt-/service-recalls</span>
            <input
              type="number"
              value={current.recallsCount ?? ''}
              onChange={handleNumericChange('recallsCount')}
              className="ds-input"
              min={0}
              placeholder="0"
              data-invalid={rootErrors.recallsCount ? 'true' : 'false'}
              aria-invalid={Boolean(rootErrors.recallsCount)}
              aria-describedby={rootErrors.recallsCount ? 's4-recallsCount-error' : undefined}
            />
            {rootErrors.recallsCount && (
              <p id="s4-recallsCount-error" className="ds-error">
                {rootErrors.recallsCount}
              </p>
            )}
          </label>
          <label className="ds-field">
            <span>Escalationstid (dage)</span>
            <input
              type="number"
              value={current.escalationTimeframeDays ?? ''}
              onChange={handleNumericChange('escalationTimeframeDays')}
              className="ds-input"
              min={0}
              placeholder="14"
              data-invalid={rootErrors.escalationTimeframeDays ? 'true' : 'false'}
              aria-invalid={Boolean(rootErrors.escalationTimeframeDays)}
              aria-describedby={
                rootErrors.escalationTimeframeDays ? 's4-escalationTimeframeDays-error' : undefined
              }
            />
            {rootErrors.escalationTimeframeDays && (
              <p id="s4-escalationTimeframeDays-error" className="ds-error">
                {rootErrors.escalationTimeframeDays}
              </p>
            )}
          </label>
        </div>

        <fieldset className="ds-field" style={{ border: 'none', padding: 0 }}>
          <legend>Klagemekanisme for forbrugere</legend>
          <div className="ds-stack-xs ds-stack--horizontal">
            <button
              type="button"
              className="ds-button"
              data-variant={current.grievanceMechanismInPlace === true ? 'primary' : 'ghost'}
              onClick={handleMechanismChange(true)}
            >
              Etableret
            </button>
            <button
              type="button"
              className="ds-button"
              data-variant={current.grievanceMechanismInPlace === false ? 'primary' : 'ghost'}
              onClick={handleMechanismChange(false)}
            >
              Mangler
            </button>
            <button
              type="button"
              className="ds-button"
              data-variant={current.grievanceMechanismInPlace == null ? 'primary' : 'ghost'}
              onClick={handleMechanismChange(null)}
            >
              Ikke angivet
            </button>
          </div>
        </fieldset>
      </section>

      <section className="ds-card ds-stack" aria-label="Hændelser for forbrugere">
        <header className="ds-stack-xs">
          <h3 className="ds-heading-xs">Registrerede impacts</h3>
          <p className="ds-text-subtle">
            Udfyld detaljer for alvorlige hændelser, fx produktsikkerhed, datasikkerhed eller tilgængelighed. Angiv antal
            berørte slutbrugere og status på afhjælpning.
          </p>
          <button type="button" className="ds-button" onClick={handleAddIssue}>
            Tilføj hændelse
          </button>
        </header>

        {hasIssues ? (
          <div className="ds-stack" role="group" aria-label="Hændelsesliste">
            {issues.map((issue, index) => (
              <div key={index} className="ds-card ds-stack-sm" data-variant="subtle">
                <div className="ds-stack-sm ds-stack--responsive">
                  <label className="ds-field">
                    <span>Produkt eller service</span>
                    <input
                      value={issue.productOrService ?? ''}
                      onChange={handleIssueTextChange(index, 'productOrService')}
                      className="ds-input"
                      placeholder="Fx SmartHome Hub"
                    />
                  </label>
                  <label className="ds-field">
                    <span>Marked/segment</span>
                    <input
                      value={issue.market ?? ''}
                      onChange={handleIssueTextChange(index, 'market')}
                      className="ds-input"
                      placeholder="EU – forbrugere"
                    />
                  </label>
                  <label className="ds-field">
                    <span>Hændelsestype</span>
                    <select
                      className="ds-input"
                      value={issue.issueType ?? ''}
                      onChange={handleIssueSelectChange(index, 'issueType')}
                    >
                      <option value="">Vælg</option>
                      {s4ConsumerIssueTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {translateIssueType(option)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="ds-field">
                    <span>Berørte slutbrugere</span>
                    <input
                      type="number"
                      value={issue.usersAffected ?? ''}
                      onChange={handleIssueNumericChange(index)}
                      className="ds-input"
                      min={0}
                      placeholder="150"
                      data-invalid={issueErrors[index]?.usersAffected ? 'true' : 'false'}
                      aria-invalid={Boolean(issueErrors[index]?.usersAffected)}
                      aria-describedby={
                        issueErrors[index]?.usersAffected ? `s4-issue-${index}-users-error` : undefined
                      }
                    />
                    {issueErrors[index]?.usersAffected && (
                      <p id={`s4-issue-${index}-users-error`} className="ds-error">
                        {issueErrors[index]?.usersAffected}
                      </p>
                    )}
                  </label>
                  <label className="ds-field">
                    <span>Alvorlighed</span>
                    <select
                      className="ds-input"
                      value={issue.severityLevel ?? ''}
                      onChange={handleIssueSelectChange(index, 'severityLevel')}
                    >
                      <option value="">Vælg</option>
                      {s4SeverityLevelOptions.map((option) => (
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
                      value={issue.remediationStatus ?? ''}
                      onChange={handleIssueSelectChange(index, 'remediationStatus')}
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
                    value={issue.description ?? ''}
                    onChange={handleIssueDescriptionChange(index)}
                    className="ds-textarea"
                    rows={3}
                    maxLength={500}
                    placeholder="Kort beskrivelse af hændelse, kommunikation og kompensation"
                  />
                </label>

                <div className="ds-stack-xs ds-stack--horizontal ds-justify-end">
                  <button type="button" className="ds-button" data-variant="danger" onClick={handleRemoveIssue(index)}>
                    Fjern
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="ds-text-subtle">Ingen forbrugerhændelser registreret endnu.</p>
        )}
      </section>

      <section className="ds-card ds-stack" aria-label="Narrativer">
        <label className="ds-field">
          <span>Støtte til udsatte brugergrupper</span>
          <textarea
            value={current.vulnerableUsersNarrative ?? ''}
            onChange={handleNarrativeChange('vulnerableUsersNarrative')}
            className="ds-textarea"
            rows={4}
            maxLength={MAX_NARRATIVE_LENGTH}
            placeholder="Beskriv tiltag for tilgængelighed, økonomisk støtte og kundebeskyttelse."
          />
        </label>
        <label className="ds-field">
          <span>Forbrugerengagement og uddannelse</span>
          <textarea
            value={current.consumerEngagementNarrative ?? ''}
            onChange={handleNarrativeChange('consumerEngagementNarrative')}
            className="ds-textarea"
            rows={4}
            maxLength={MAX_NARRATIVE_LENGTH}
            placeholder="Opsummer kommunikation, træning og samarbejde med brugerfora."
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
          <p className="ds-text-muted">Udfyld felterne for at se social score og relevante advarsler.</p>
        )}
      </section>
    </form>
  )
}

function translateIssueType(value: string): string {
  switch (value) {
    case 'productSafety':
      return 'Produktsikkerhed'
    case 'dataPrivacy':
      return 'Datasikkerhed og privatliv'
    case 'marketingPractices':
      return 'Markedsføring og etik'
    case 'accessibility':
      return 'Tilgængelighed'
    case 'productQuality':
      return 'Produktkvalitet'
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
