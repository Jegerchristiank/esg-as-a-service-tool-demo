/**
 * Wizardtrin for ESRS 2 – Governance (GOV).
 */
'use client'

import { useMemo } from 'react'
import type { ChangeEvent } from 'react'

import type { GovInput, ModuleInput, ModuleResult } from '@org/shared'
import { runGOV } from '@org/shared'

import type { WizardStepProps } from './StepTemplate'

const EMPTY_GOV: GovInput = {
  oversightNarrative: null,
  managementNarrative: null,
  competenceNarrative: null,
  reportingNarrative: null,
  assuranceNarrative: null,
  incentiveNarrative: null,
  oversightBodies: [],
  controlProcesses: [],
  incentiveStructures: [],
}

const MAX_TEXT = 2000

const EMPTY_BODY: Required<NonNullable<GovInput['oversightBodies']>>[number] = {
  body: null,
  mandate: null,
  chair: null,
  meetingFrequency: null,
}

const EMPTY_CONTROL: Required<NonNullable<GovInput['controlProcesses']>>[number] = {
  process: null,
  description: null,
  owner: null,
}

const EMPTY_INCENTIVE: Required<NonNullable<GovInput['incentiveStructures']>>[number] = {
  role: null,
  incentive: null,
  metric: null,
}

function toNullableString(event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>): string | null {
  const next = event.target.value.trim()
  return next.length > 0 ? next : null
}

export function GOVStep({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.GOV as GovInput | undefined) ?? EMPTY_GOV
  const preview = useMemo<ModuleResult>(() => runGOV({ GOV: current } as ModuleInput), [current])

  const handleNarrativeChange = (key: keyof GovInput) => (event: ChangeEvent<HTMLTextAreaElement>) => {
    const next: GovInput = { ...current, [key]: toNullableString(event) }
    onChange('GOV', next)
  }

  const handleBodyChange = (index: number, field: keyof (typeof EMPTY_BODY)) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const list = current.oversightBodies ? [...current.oversightBodies] : []
    const entry = { ...(list[index] ?? EMPTY_BODY) }
    entry[field] = toNullableString(event)
    list[index] = entry
    onChange('GOV', { ...current, oversightBodies: list })
  }

  const handleControlChange = (index: number, field: keyof (typeof EMPTY_CONTROL)) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const list = current.controlProcesses ? [...current.controlProcesses] : []
    const entry = { ...(list[index] ?? EMPTY_CONTROL) }
    entry[field] = toNullableString(event)
    list[index] = entry
    onChange('GOV', { ...current, controlProcesses: list })
  }

  const handleIncentiveChange = (index: number, field: keyof (typeof EMPTY_INCENTIVE)) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const list = current.incentiveStructures ? [...current.incentiveStructures] : []
    const entry = { ...(list[index] ?? EMPTY_INCENTIVE) }
    entry[field] = toNullableString(event)
    list[index] = entry
    onChange('GOV', { ...current, incentiveStructures: list })
  }

  const handleAddBody = () => {
    const list = current.oversightBodies ? [...current.oversightBodies] : []
    list.push({ ...EMPTY_BODY })
    onChange('GOV', { ...current, oversightBodies: list })
  }

  const handleRemoveBody = (index: number) => () => {
    const list = current.oversightBodies ? [...current.oversightBodies] : []
    list.splice(index, 1)
    onChange('GOV', { ...current, oversightBodies: list })
  }

  const handleAddControl = () => {
    const list = current.controlProcesses ? [...current.controlProcesses] : []
    list.push({ ...EMPTY_CONTROL })
    onChange('GOV', { ...current, controlProcesses: list })
  }

  const handleRemoveControl = (index: number) => () => {
    const list = current.controlProcesses ? [...current.controlProcesses] : []
    list.splice(index, 1)
    onChange('GOV', { ...current, controlProcesses: list })
  }

  const handleAddIncentive = () => {
    const list = current.incentiveStructures ? [...current.incentiveStructures] : []
    list.push({ ...EMPTY_INCENTIVE })
    onChange('GOV', { ...current, incentiveStructures: list })
  }

  const handleRemoveIncentive = (index: number) => () => {
    const list = current.incentiveStructures ? [...current.incentiveStructures] : []
    list.splice(index, 1)
    onChange('GOV', { ...current, incentiveStructures: list })
  }

  return (
    <form className="ds-form" noValidate>
      <header className="ds-stack-sm">
        <h2 className="ds-heading-sm">ESRS 2 – Governance (GOV)</h2>
        <p className="ds-text-muted">Dokumentér governance-struktur, kontroller og incitamenter for bæredygtighed.</p>
      </header>

      <section className="ds-grid ds-grid-columns-2 ds-grid-gap-lg">
        <div className="ds-stack">
          <label className="ds-field">
            <span>Bestyrelsens tilsyn</span>
            <textarea
              className="ds-textarea"
              maxLength={MAX_TEXT}
              value={current.oversightNarrative ?? ''}
              onChange={handleNarrativeChange('oversightNarrative')}
            />
          </label>

          <label className="ds-field">
            <span>Direktionens roller</span>
            <textarea
              className="ds-textarea"
              maxLength={MAX_TEXT}
              value={current.managementNarrative ?? ''}
              onChange={handleNarrativeChange('managementNarrative')}
            />
          </label>

          <label className="ds-field">
            <span>ESG-kompetencer</span>
            <textarea
              className="ds-textarea"
              maxLength={MAX_TEXT}
              value={current.competenceNarrative ?? ''}
              onChange={handleNarrativeChange('competenceNarrative')}
            />
          </label>

          <label className="ds-field">
            <span>Rapporteringsproces</span>
            <textarea
              className="ds-textarea"
              maxLength={MAX_TEXT}
              value={current.reportingNarrative ?? ''}
              onChange={handleNarrativeChange('reportingNarrative')}
            />
          </label>

          <label className="ds-field">
            <span>Assurance</span>
            <textarea
              className="ds-textarea"
              maxLength={MAX_TEXT}
              value={current.assuranceNarrative ?? ''}
              onChange={handleNarrativeChange('assuranceNarrative')}
            />
          </label>

          <label className="ds-field">
            <span>Incitamenter</span>
            <textarea
              className="ds-textarea"
              maxLength={MAX_TEXT}
              value={current.incentiveNarrative ?? ''}
              onChange={handleNarrativeChange('incentiveNarrative')}
            />
          </label>

          <section className="ds-stack">
            <h3 className="ds-heading-xs">Governance-organer</h3>
            <p className="ds-text-muted">Angiv udvalg, mandat og mødefrekvens.</p>
            {(current.oversightBodies ?? []).map((body, index) => (
              <fieldset key={`body-${index}`} className="ds-card ds-stack" aria-label={`Governance-organ ${index + 1}`}>
                <label className="ds-field">
                  <span>Organ</span>
                  <input className="ds-input" value={body?.body ?? ''} onChange={handleBodyChange(index, 'body')} />
                </label>
                <label className="ds-field">
                  <span>Mandat</span>
                  <textarea className="ds-textarea" value={body?.mandate ?? ''} onChange={handleBodyChange(index, 'mandate')} />
                </label>
                <label className="ds-field">
                  <span>Formand/ansvarlig</span>
                  <input className="ds-input" value={body?.chair ?? ''} onChange={handleBodyChange(index, 'chair')} />
                </label>
                <label className="ds-field">
                  <span>Mødefrekvens</span>
                  <input
                    className="ds-input"
                    value={body?.meetingFrequency ?? ''}
                    onChange={handleBodyChange(index, 'meetingFrequency')}
                  />
                </label>
                <button type="button" className="ds-button ds-button--ghost" onClick={handleRemoveBody(index)}>
                  Fjern organ
                </button>
              </fieldset>
            ))}
            <button type="button" className="ds-button" onClick={handleAddBody}>
              Tilføj organ
            </button>
          </section>

          <section className="ds-stack">
            <h3 className="ds-heading-xs">Kontrolprocesser</h3>
            <p className="ds-text-muted">Beskriv kontroller og ansvarlige personer.</p>
            {(current.controlProcesses ?? []).map((control, index) => (
              <fieldset key={`control-${index}`} className="ds-card ds-stack" aria-label={`Kontrol ${index + 1}`}>
                <label className="ds-field">
                  <span>Proces</span>
                  <input className="ds-input" value={control?.process ?? ''} onChange={handleControlChange(index, 'process')} />
                </label>
                <label className="ds-field">
                  <span>Beskrivelse</span>
                  <textarea
                    className="ds-textarea"
                    value={control?.description ?? ''}
                    onChange={handleControlChange(index, 'description')}
                  />
                </label>
                <label className="ds-field">
                  <span>Ansvarlig</span>
                  <input className="ds-input" value={control?.owner ?? ''} onChange={handleControlChange(index, 'owner')} />
                </label>
                <button type="button" className="ds-button ds-button--ghost" onClick={handleRemoveControl(index)}>
                  Fjern kontrol
                </button>
              </fieldset>
            ))}
            <button type="button" className="ds-button" onClick={handleAddControl}>
              Tilføj kontrolproces
            </button>
          </section>

          <section className="ds-stack">
            <h3 className="ds-heading-xs">Incitamentstrukturer</h3>
            <p className="ds-text-muted">Kortlæg incitamenter og KPI’er for ledelsen.</p>
            {(current.incentiveStructures ?? []).map((entry, index) => (
              <fieldset key={`incentive-${index}`} className="ds-card ds-stack" aria-label={`Incitament ${index + 1}`}>
                <label className="ds-field">
                  <span>Rolle</span>
                  <input className="ds-input" value={entry?.role ?? ''} onChange={handleIncentiveChange(index, 'role')} />
                </label>
                <label className="ds-field">
                  <span>Incitament</span>
                  <textarea
                    className="ds-textarea"
                    value={entry?.incentive ?? ''}
                    onChange={handleIncentiveChange(index, 'incentive')}
                  />
                </label>
                <label className="ds-field">
                  <span>KPI</span>
                  <input className="ds-input" value={entry?.metric ?? ''} onChange={handleIncentiveChange(index, 'metric')} />
                </label>
                <button type="button" className="ds-button ds-button--ghost" onClick={handleRemoveIncentive(index)}>
                  Fjern incitament
                </button>
              </fieldset>
            ))}
            <button type="button" className="ds-button" onClick={handleAddIncentive}>
              Tilføj incitament
            </button>
          </section>
        </div>

        <aside className="ds-card ds-stack" aria-live="polite">
          <h3 className="ds-heading-xs">Forhåndsresultat</h3>
          <p className="ds-text-strong">
            {preview.value} {preview.unit}
          </p>
          <div className="ds-stack-xs">
            <h4 className="ds-text-muted">Advarsler</h4>
            {preview.warnings.length === 0 ? (
              <p className="ds-text-subtle">Ingen advarsler registreret.</p>
            ) : (
              <ul className="ds-stack-xs">
                {preview.warnings.map((warning, index) => (
                  <li key={`warning-${index}`} className="ds-text-subtle">
                    {warning}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </section>
    </form>
  )
}
