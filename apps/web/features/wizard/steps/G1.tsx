/**
 * Wizardtrin for modul G1 – governance-politikker og targets.
 */
'use client'

import { useMemo } from 'react'
import type { ChangeEvent } from 'react'

import {
  g1PolicyStatusOptions,
  g1TargetStatusOptions,
  runG1,
  type G1Input,
  type ModuleInput,
  type ModuleResult
} from '@org/shared'

import type { WizardStepProps } from './StepTemplate'

const EMPTY_G1: G1Input = {
  policies: [],
  targets: [],
  boardOversight: null,
  governanceNarrative: null
}

type PolicyRow = NonNullable<G1Input['policies']>[number]

type TargetRow = NonNullable<G1Input['targets']>[number]

const MAX_GOVERNANCE_TEXT = 2000

function createEmptyPolicy(): PolicyRow {
  return {
    topic: '',
    status: 'draft',
    owner: null,
    lastReviewed: null
  }
}

function createEmptyTarget(): TargetRow {
  return {
    topic: '',
    baselineYear: null,
    targetYear: null,
    targetValue: null,
    unit: null,
    status: 'notStarted',
    narrative: null
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

export function G1Step({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.G1 as G1Input | undefined) ?? EMPTY_G1
  const policies = current.policies ?? []
  const targets = current.targets ?? []

  const preview = useMemo<ModuleResult>(() => runG1({ G1: current } as ModuleInput), [current])

  const updateRoot = (partial: Partial<G1Input>) => {
    onChange('G1', { ...current, ...partial })
  }

  const handleOversightChange = (value: boolean | null) => () => {
    updateRoot({ boardOversight: value })
  }

  const handleNarrativeChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value.slice(0, MAX_GOVERNANCE_TEXT)
    updateRoot({ governanceNarrative: text.trim() === '' ? null : text })
  }

  const handleAddPolicy = () => {
    updateRoot({ policies: [...policies, createEmptyPolicy()] })
  }

  const handleRemovePolicy = (index: number) => () => {
    updateRoot({ policies: policies.filter((_, rowIndex) => rowIndex !== index) })
  }

  const handlePolicyFieldChange = (index: number, field: keyof PolicyRow) => (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = event.target.value
    const next = policies.map((policy, rowIndex) =>
      rowIndex === index
        ? {
            ...policy,
            [field]: value.trim() === '' ? (field === 'topic' ? '' : null) : value
          }
        : policy
    )
    updateRoot({ policies: next })
  }

  const handleAddTarget = () => {
    updateRoot({ targets: [...targets, createEmptyTarget()] })
  }

  const handleRemoveTarget = (index: number) => () => {
    updateRoot({ targets: targets.filter((_, rowIndex) => rowIndex !== index) })
  }

  const handleTargetTextChange = (index: number, field: keyof TargetRow) => (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value = event.target.value
    const next = targets.map((target, rowIndex) =>
      rowIndex === index
        ? {
            ...target,
            [field]: value.trim() === '' ? (field === 'topic' ? '' : null) : value
          }
        : target
    )
    updateRoot({ targets: next })
  }

  const handleTargetNumericChange = (index: number, field: 'baselineYear' | 'targetYear' | 'targetValue') => (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const parsed = parseNumber(event.target.value)
    const next = targets.map((target, rowIndex) =>
      rowIndex === index
        ? {
            ...target,
            [field]: parsed
          }
        : target
    )
    updateRoot({ targets: next })
  }

  const hasInput =
    policies.length > 0 ||
    targets.length > 0 ||
    current.boardOversight != null ||
    (current.governanceNarrative ?? '').length > 0

  return (
    <form className="ds-form ds-stack" noValidate>
      <header className="ds-stack-sm">
        <h2 className="ds-heading-sm">G1 – Governance-politikker &amp; targets</h2>
        <p className="ds-text-muted">
          Registrér politikker og mål for governance samt bestyrelsestilsyn. Resultatet fremhæver datagaps og prioriterer indsats.
        </p>
      </header>

      <section className="ds-card ds-stack" aria-label="Bestyrelsestilsyn">
        <fieldset className="ds-field" style={{ border: 'none', padding: 0 }}>
          <legend>Fører bestyrelsen tilsyn med ESG/CSRD?</legend>
          <div className="ds-stack-xs ds-stack--horizontal">
            <button
              type="button"
              className="ds-button"
              data-variant={current.boardOversight === true ? 'primary' : 'ghost'}
              onClick={handleOversightChange(true)}
            >
              Ja
            </button>
            <button
              type="button"
              className="ds-button"
              data-variant={current.boardOversight === false ? 'primary' : 'ghost'}
              onClick={handleOversightChange(false)}
            >
              Nej
            </button>
            <button
              type="button"
              className="ds-button"
              data-variant={current.boardOversight == null ? 'primary' : 'ghost'}
              onClick={handleOversightChange(null)}
            >
              Ikke angivet
            </button>
          </div>
        </fieldset>
      </section>

      <section className="ds-card ds-stack" aria-label="Politikker">
        <header className="ds-stack-xs">
          <h3 className="ds-heading-xs">Politikker</h3>
          <p className="ds-text-subtle">
            Angiv centrale politikker (kodeks, whistleblower, menneskerettigheder) med status, ejer og seneste review.
          </p>
          <button type="button" className="ds-button" onClick={handleAddPolicy}>
            Tilføj politik
          </button>
        </header>

        {policies.length > 0 ? (
          <div className="ds-stack" role="group" aria-label="Politikliste">
            {policies.map((policy, index) => (
              <div key={index} className="ds-card ds-stack-sm" data-variant="subtle">
                <div className="ds-stack-sm ds-stack--responsive">
                  <label className="ds-field">
                    <span>Politiknavn</span>
                    <input
                      value={policy.topic ?? ''}
                      onChange={handlePolicyFieldChange(index, 'topic')}
                      className="ds-input"
                      placeholder="ESG-politik"
                    />
                  </label>
                  <label className="ds-field">
                    <span>Status</span>
                    <select
                      value={policy.status ?? 'draft'}
                      onChange={handlePolicyFieldChange(index, 'status')}
                      className="ds-input"
                    >
                      {g1PolicyStatusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option === 'approved'
                            ? 'Godkendt'
                            : option === 'inReview'
                            ? 'Under review'
                            : option === 'draft'
                            ? 'Udkast'
                            : option === 'retired'
                            ? 'Retired'
                            : 'Mangler'}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="ds-field">
                    <span>Ejer</span>
                    <input
                      value={policy.owner ?? ''}
                      onChange={handlePolicyFieldChange(index, 'owner')}
                      className="ds-input"
                      placeholder="Legal/HR"
                    />
                  </label>
                  <label className="ds-field">
                    <span>Seneste review</span>
                    <input
                      value={policy.lastReviewed ?? ''}
                      onChange={handlePolicyFieldChange(index, 'lastReviewed')}
                      className="ds-input"
                      placeholder="2024-Q1"
                    />
                  </label>
                </div>
                <div className="ds-stack-xs">
                  <button type="button" className="ds-button ds-button--ghost" onClick={handleRemovePolicy(index)}>
                    Fjern politik
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="ds-text-subtle">Ingen politikker registreret endnu. Tilføj mindst én for at komme i gang.</p>
        )}
      </section>

      <section className="ds-card ds-stack" aria-label="Targets">
        <header className="ds-stack-xs">
          <h3 className="ds-heading-xs">Targets</h3>
          <p className="ds-text-subtle">
            Registrér governance-/compliance-targets med baseline, målår og status.
          </p>
          <button type="button" className="ds-button" onClick={handleAddTarget}>
            Tilføj target
          </button>
        </header>

        {targets.length > 0 ? (
          <div className="ds-stack" role="group" aria-label="Targetliste">
            {targets.map((target, index) => (
              <div key={index} className="ds-card ds-stack-sm" data-variant="subtle">
                <div className="ds-stack-sm ds-stack--responsive">
                  <label className="ds-field">
                    <span>Targetnavn</span>
                    <input
                      value={target.topic ?? ''}
                      onChange={handleTargetTextChange(index, 'topic')}
                      className="ds-input"
                      placeholder="CSRD readiness"
                    />
                  </label>
                  <label className="ds-field">
                    <span>Baselineår</span>
                    <input
                      type="number"
                      value={target.baselineYear ?? ''}
                      onChange={handleTargetNumericChange(index, 'baselineYear')}
                      className="ds-input"
                      min={1990}
                      max={2100}
                    />
                  </label>
                  <label className="ds-field">
                    <span>Målår</span>
                    <input
                      type="number"
                      value={target.targetYear ?? ''}
                      onChange={handleTargetNumericChange(index, 'targetYear')}
                      className="ds-input"
                      min={1990}
                      max={2100}
                    />
                  </label>
                  <label className="ds-field">
                    <span>Værdi</span>
                    <input
                      type="number"
                      value={target.targetValue ?? ''}
                      onChange={handleTargetNumericChange(index, 'targetValue')}
                      className="ds-input"
                      step="any"
                    />
                  </label>
                  <label className="ds-field">
                    <span>Enhed</span>
                    <input
                      value={target.unit ?? ''}
                      onChange={handleTargetTextChange(index, 'unit')}
                      className="ds-input"
                      placeholder="% eller antal"
                    />
                  </label>
                  <label className="ds-field">
                    <span>Status</span>
                    <select
                      value={target.status ?? 'notStarted'}
                      onChange={handleTargetTextChange(index, 'status')}
                      className="ds-input"
                    >
                      {g1TargetStatusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option === 'onTrack'
                            ? 'On track'
                            : option === 'lagging'
                            ? 'Sakket bagud'
                            : option === 'offTrack'
                            ? 'Afsporet'
                            : 'Ikke startet'}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="ds-field">
                  <span>Narrativ</span>
                  <input
                    value={target.narrative ?? ''}
                    onChange={handleTargetTextChange(index, 'narrative')}
                    className="ds-input"
                    placeholder="Kort statusnote"
                  />
                </label>
                <div className="ds-stack-xs">
                  <button type="button" className="ds-button ds-button--ghost" onClick={handleRemoveTarget(index)}>
                    Fjern target
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="ds-text-subtle">Ingen targets endnu. Tilføj mål for at følge governance-indsatsen.</p>
        )}
      </section>

      <section className="ds-card ds-stack">
        <h3 className="ds-heading-xs">Narrativ governance</h3>
        <p className="ds-text-subtle">
          Beskriv roller, incitamenter og planlagte forbedringer. Teksten bruges i supportguides og rapportering.
        </p>
        <textarea
          value={current.governanceNarrative ?? ''}
          onChange={handleNarrativeChange}
          maxLength={MAX_GOVERNANCE_TEXT}
          className="ds-textarea"
          rows={4}
          placeholder="Fx: Bestyrelsen modtager kvartalsvis ESG-dashboard, ledelsens bonus kobles til governance-KPI’er."
        />
      </section>

      {hasInput && (
        <aside className="ds-card ds-stack-sm" aria-live="polite">
          <h3 className="ds-heading-xs">Forhåndsresultat</h3>
          <p className="ds-text-strong">
            {preview.value} {preview.unit}
          </p>
          <ul className="ds-stack-xs">
            {preview.warnings.length === 0 ? (
              <li className="ds-text-subtle">Ingen advarsler registreret.</li>
            ) : (
              preview.warnings.map((warning, index) => <li key={index}>{warning}</li>)
            )}
          </ul>
        </aside>
      )}
    </form>
  )
}
