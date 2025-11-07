/**
 * Wizardtrin for ESRS 2 – Impacts, Risks & Opportunities (IRO).
 */
'use client'

import { useMemo } from 'react'
import type { ChangeEvent } from 'react'

import type { IroInput, ModuleInput, ModuleResult } from '@org/shared'
import { runIRO } from '@org/shared'

import type { WizardStepProps } from './StepTemplate'

const EMPTY_IRO: IroInput = {
  processNarrative: null,
  integrationNarrative: null,
  stakeholderNarrative: null,
  dueDiligenceNarrative: null,
  escalationNarrative: null,
  monitoringNarrative: null,
  riskProcesses: [],
  impactResponses: [],
}

const MAX_TEXT = 2000

const EMPTY_PROCESS: Required<NonNullable<IroInput['riskProcesses']>>[number] = {
  step: null,
  description: null,
  frequency: null,
  owner: null,
}

const EMPTY_RESPONSE: Required<NonNullable<IroInput['impactResponses']>>[number] = {
  topic: null,
  severity: null,
  response: null,
  status: null,
  responsible: null,
}

function toNullableString(event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>): string | null {
  const value = event.target.value.trim()
  return value.length > 0 ? value : null
}

export function IROStep({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.IRO as IroInput | undefined) ?? EMPTY_IRO
  const preview = useMemo<ModuleResult>(() => runIRO({ IRO: current } as ModuleInput), [current])

  const handleNarrativeChange = (key: keyof IroInput) => (event: ChangeEvent<HTMLTextAreaElement>) => {
    const next: IroInput = { ...current, [key]: toNullableString(event) }
    onChange('IRO', next)
  }

  const handleProcessChange = (index: number, field: keyof (typeof EMPTY_PROCESS)) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const list = current.riskProcesses ? [...current.riskProcesses] : []
    const entry = { ...(list[index] ?? EMPTY_PROCESS) }
    entry[field] = toNullableString(event)
    list[index] = entry
    onChange('IRO', { ...current, riskProcesses: list })
  }

  const handleResponseChange = (index: number, field: keyof (typeof EMPTY_RESPONSE)) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const list = current.impactResponses ? [...current.impactResponses] : []
    const entry = { ...(list[index] ?? EMPTY_RESPONSE) }
    entry[field] = toNullableString(event)
    list[index] = entry
    onChange('IRO', { ...current, impactResponses: list })
  }

  const handleAddProcess = () => {
    const list = current.riskProcesses ? [...current.riskProcesses] : []
    list.push({ ...EMPTY_PROCESS })
    onChange('IRO', { ...current, riskProcesses: list })
  }

  const handleRemoveProcess = (index: number) => () => {
    const list = current.riskProcesses ? [...current.riskProcesses] : []
    list.splice(index, 1)
    onChange('IRO', { ...current, riskProcesses: list })
  }

  const handleAddResponse = () => {
    const list = current.impactResponses ? [...current.impactResponses] : []
    list.push({ ...EMPTY_RESPONSE })
    onChange('IRO', { ...current, impactResponses: list })
  }

  const handleRemoveResponse = (index: number) => () => {
    const list = current.impactResponses ? [...current.impactResponses] : []
    list.splice(index, 1)
    onChange('IRO', { ...current, impactResponses: list })
  }

  return (
    <form className="ds-form" noValidate>
      <header className="ds-stack-sm">
        <h2 className="ds-heading-sm">ESRS 2 – Impacts, risks og opportunities</h2>
        <p className="ds-text-muted">Kortlæg processer for identificering, prioritering og opfølgning på impacts og risici.</p>
      </header>

      <section className="ds-grid ds-grid-columns-2 ds-grid-gap-lg">
        <div className="ds-stack">
          <label className="ds-field">
            <span>Identifikationsproces</span>
            <textarea
              className="ds-textarea"
              maxLength={MAX_TEXT}
              value={current.processNarrative ?? ''}
              onChange={handleNarrativeChange('processNarrative')}
            />
          </label>

          <label className="ds-field">
            <span>Integration i styring</span>
            <textarea
              className="ds-textarea"
              maxLength={MAX_TEXT}
              value={current.integrationNarrative ?? ''}
              onChange={handleNarrativeChange('integrationNarrative')}
            />
          </label>

          <label className="ds-field">
            <span>Interessentinddragelse</span>
            <textarea
              className="ds-textarea"
              maxLength={MAX_TEXT}
              value={current.stakeholderNarrative ?? ''}
              onChange={handleNarrativeChange('stakeholderNarrative')}
            />
          </label>

          <label className="ds-field">
            <span>Due diligence</span>
            <textarea
              className="ds-textarea"
              maxLength={MAX_TEXT}
              value={current.dueDiligenceNarrative ?? ''}
              onChange={handleNarrativeChange('dueDiligenceNarrative')}
            />
          </label>

          <label className="ds-field">
            <span>Eskalering</span>
            <textarea
              className="ds-textarea"
              maxLength={MAX_TEXT}
              value={current.escalationNarrative ?? ''}
              onChange={handleNarrativeChange('escalationNarrative')}
            />
          </label>

          <label className="ds-field">
            <span>Overvågning og KPI’er</span>
            <textarea
              className="ds-textarea"
              maxLength={MAX_TEXT}
              value={current.monitoringNarrative ?? ''}
              onChange={handleNarrativeChange('monitoringNarrative')}
            />
          </label>

          <section className="ds-stack">
            <h3 className="ds-heading-xs">Procesoversigt</h3>
            <p className="ds-text-muted">Angiv trin, hyppighed og ansvar.</p>
            {(current.riskProcesses ?? []).map((process, index) => (
              <fieldset key={`process-${index}`} className="ds-card ds-stack" aria-label={`Proces ${index + 1}`}>
                <label className="ds-field">
                  <span>Trin</span>
                  <input className="ds-input" value={process?.step ?? ''} onChange={handleProcessChange(index, 'step')} />
                </label>
                <label className="ds-field">
                  <span>Beskrivelse</span>
                  <textarea
                    className="ds-textarea"
                    value={process?.description ?? ''}
                    onChange={handleProcessChange(index, 'description')}
                  />
                </label>
                <label className="ds-field">
                  <span>Hyppighed</span>
                  <input className="ds-input" value={process?.frequency ?? ''} onChange={handleProcessChange(index, 'frequency')} />
                </label>
                <label className="ds-field">
                  <span>Ansvarlig</span>
                  <input className="ds-input" value={process?.owner ?? ''} onChange={handleProcessChange(index, 'owner')} />
                </label>
                <button type="button" className="ds-button ds-button--ghost" onClick={handleRemoveProcess(index)}>
                  Fjern proces
                </button>
              </fieldset>
            ))}
            <button type="button" className="ds-button" onClick={handleAddProcess}>
              Tilføj proces
            </button>
          </section>

          <section className="ds-stack">
            <h3 className="ds-heading-xs">Impacts og håndtering</h3>
            <p className="ds-text-muted">Beskriv alvorlighed, status og afværgeplaner.</p>
            {(current.impactResponses ?? []).map((response, index) => (
              <fieldset key={`response-${index}`} className="ds-card ds-stack" aria-label={`Impact ${index + 1}`}>
                <label className="ds-field">
                  <span>Emne</span>
                  <input className="ds-input" value={response?.topic ?? ''} onChange={handleResponseChange(index, 'topic')} />
                </label>
                <label className="ds-field">
                  <span>Alvorlighed</span>
                  <input
                    className="ds-input"
                    value={response?.severity ?? ''}
                    onChange={handleResponseChange(index, 'severity')}
                  />
                </label>
                <label className="ds-field">
                  <span>Afværgeplan</span>
                  <textarea
                    className="ds-textarea"
                    value={response?.response ?? ''}
                    onChange={handleResponseChange(index, 'response')}
                  />
                </label>
                <label className="ds-field">
                  <span>Status</span>
                  <input className="ds-input" value={response?.status ?? ''} onChange={handleResponseChange(index, 'status')} />
                </label>
                <label className="ds-field">
                  <span>Ansvarlig</span>
                  <input
                    className="ds-input"
                    value={response?.responsible ?? ''}
                    onChange={handleResponseChange(index, 'responsible')}
                  />
                </label>
                <button type="button" className="ds-button ds-button--ghost" onClick={handleRemoveResponse(index)}>
                  Fjern impact
                </button>
              </fieldset>
            ))}
            <button type="button" className="ds-button" onClick={handleAddResponse}>
              Tilføj impact
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
