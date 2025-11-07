/**
 * Wizardtrin for ESRS 2 – Strategy & Business Model (SBM).
 */
'use client'

import { useMemo } from 'react'
import type { ChangeEvent } from 'react'

import type { ModuleInput, ModuleResult, SbmInput } from '@org/shared'
import { e1TransitionStatusOptions, runSBM } from '@org/shared'

import type { WizardStepProps } from './StepTemplate'

const EMPTY_SBM: SbmInput = {
  businessModelNarrative: null,
  valueChainNarrative: null,
  sustainabilityStrategyNarrative: null,
  resilienceNarrative: null,
  transitionPlanNarrative: null,
  stakeholderNarrative: null,
  dependencies: [],
  opportunities: [],
  transitionPlanMeasures: [],
}

const MAX_TEXT = 2000

const EMPTY_DEPENDENCY: Required<NonNullable<SbmInput['dependencies']>>[number] = {
  dependency: null,
  impact: null,
  mitigation: null,
  responsible: null,
}

const EMPTY_OPPORTUNITY: Required<NonNullable<SbmInput['opportunities']>>[number] = {
  title: null,
  description: null,
  timeframe: null,
  owner: null,
}

const EMPTY_MEASURE: Required<NonNullable<SbmInput['transitionPlanMeasures']>>[number] = {
  initiative: null,
  milestoneYear: null,
  investmentNeedDkk: null,
  status: null,
  responsible: null,
  description: null,
}

function toNullableString(event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>): string | null {
  const next = event.target.value.trim()
  return next.length > 0 ? next : null
}

function toNullableNumber(event: ChangeEvent<HTMLInputElement>): number | null {
  const value = event.target.value.trim()
  if (value === '') {
    return null
  }
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function SBMStep({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.SBM as SbmInput | undefined) ?? EMPTY_SBM
  const preview = useMemo<ModuleResult>(() => runSBM({ SBM: current } as ModuleInput), [current])

  const handleNarrativeChange = (key: keyof SbmInput) => (event: ChangeEvent<HTMLTextAreaElement>) => {
    const next: SbmInput = { ...current, [key]: toNullableString(event) }
    onChange('SBM', next)
  }

  const handleDependencyChange = (index: number, field: keyof (typeof EMPTY_DEPENDENCY)) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const list = current.dependencies ? [...current.dependencies] : []
    const entry = { ...(list[index] ?? EMPTY_DEPENDENCY) }
    if (field === 'dependency' || field === 'impact' || field === 'mitigation' || field === 'responsible') {
      entry[field] = toNullableString(event)
    }
    list[index] = entry
    onChange('SBM', { ...current, dependencies: list })
  }

  const handleOpportunityChange = (index: number, field: keyof (typeof EMPTY_OPPORTUNITY)) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const list = current.opportunities ? [...current.opportunities] : []
    const entry = { ...(list[index] ?? EMPTY_OPPORTUNITY) }
    entry[field] = toNullableString(event)
    list[index] = entry
    onChange('SBM', { ...current, opportunities: list })
  }

  const handleMeasureChange = (index: number, field: keyof (typeof EMPTY_MEASURE)) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const list = current.transitionPlanMeasures ? [...current.transitionPlanMeasures] : []
    const entry = { ...(list[index] ?? EMPTY_MEASURE) }
    if (field === 'milestoneYear' || field === 'investmentNeedDkk') {
      entry[field] = toNullableNumber(event as ChangeEvent<HTMLInputElement>)
    } else if (field === 'status') {
      const value = event.target.value as NonNullable<SbmInput['transitionPlanMeasures']>[number]['status']
      entry.status = value ? (value as typeof entry.status) : null
    } else if (field === 'responsible' || field === 'initiative' || field === 'description') {
      entry[field] = toNullableString(event as ChangeEvent<HTMLTextAreaElement | HTMLInputElement>)
    }
    list[index] = entry
    onChange('SBM', { ...current, transitionPlanMeasures: list })
  }

  const handleAddDependency = () => {
    const list = current.dependencies ? [...current.dependencies] : []
    list.push({ ...EMPTY_DEPENDENCY })
    onChange('SBM', { ...current, dependencies: list })
  }

  const handleRemoveDependency = (index: number) => () => {
    const list = current.dependencies ? [...current.dependencies] : []
    list.splice(index, 1)
    onChange('SBM', { ...current, dependencies: list })
  }

  const handleAddOpportunity = () => {
    const list = current.opportunities ? [...current.opportunities] : []
    list.push({ ...EMPTY_OPPORTUNITY })
    onChange('SBM', { ...current, opportunities: list })
  }

  const handleRemoveOpportunity = (index: number) => () => {
    const list = current.opportunities ? [...current.opportunities] : []
    list.splice(index, 1)
    onChange('SBM', { ...current, opportunities: list })
  }

  const handleAddMeasure = () => {
    const list = current.transitionPlanMeasures ? [...current.transitionPlanMeasures] : []
    list.push({ ...EMPTY_MEASURE })
    onChange('SBM', { ...current, transitionPlanMeasures: list })
  }

  const handleRemoveMeasure = (index: number) => () => {
    const list = current.transitionPlanMeasures ? [...current.transitionPlanMeasures] : []
    list.splice(index, 1)
    onChange('SBM', { ...current, transitionPlanMeasures: list })
  }

  return (
    <form className="ds-form" noValidate>
      <header className="ds-stack-sm">
        <h2 className="ds-heading-sm">ESRS 2 – Strategi og forretningsmodel</h2>
        <p className="ds-text-muted">
          Beskriv forretningsmodellen, værdikæden og overgangsplaner for at dokumentere ESRS 2 SBM.
        </p>
      </header>

      <section className="ds-grid ds-grid-columns-2 ds-grid-gap-lg">
        <div className="ds-stack">
          <label className="ds-field">
            <span>Forretningsmodel</span>
            <textarea
              className="ds-textarea"
              maxLength={MAX_TEXT}
              value={current.businessModelNarrative ?? ''}
              onChange={handleNarrativeChange('businessModelNarrative')}
            />
          </label>

          <label className="ds-field">
            <span>Værdikæde og afhængigheder</span>
            <textarea
              className="ds-textarea"
              maxLength={MAX_TEXT}
              value={current.valueChainNarrative ?? ''}
              onChange={handleNarrativeChange('valueChainNarrative')}
            />
          </label>

          <label className="ds-field">
            <span>Strategisk integration af bæredygtighed</span>
            <textarea
              className="ds-textarea"
              maxLength={MAX_TEXT}
              value={current.sustainabilityStrategyNarrative ?? ''}
              onChange={handleNarrativeChange('sustainabilityStrategyNarrative')}
            />
          </label>

          <label className="ds-field">
            <span>Resiliens og scenarier</span>
            <textarea
              className="ds-textarea"
              maxLength={MAX_TEXT}
              value={current.resilienceNarrative ?? ''}
              onChange={handleNarrativeChange('resilienceNarrative')}
            />
          </label>

          <label className="ds-field">
            <span>Overgangsplan (overordnet)</span>
            <textarea
              className="ds-textarea"
              maxLength={MAX_TEXT}
              value={current.transitionPlanNarrative ?? ''}
              onChange={handleNarrativeChange('transitionPlanNarrative')}
            />
          </label>

          <label className="ds-field">
            <span>Interessentdialog</span>
            <textarea
              className="ds-textarea"
              maxLength={MAX_TEXT}
              value={current.stakeholderNarrative ?? ''}
              onChange={handleNarrativeChange('stakeholderNarrative')}
            />
          </label>

          <section className="ds-stack">
            <h3 className="ds-heading-xs">Nøgleafhængigheder</h3>
            <p className="ds-text-muted">Kortlæg centrale afhængigheder og afbødende tiltag.</p>
            {(current.dependencies ?? []).map((dependency, index) => (
              <fieldset key={`dependency-${index}`} className="ds-card ds-stack" aria-label={`Afhængighed ${index + 1}`}>
                <label className="ds-field">
                  <span>Afhængighed</span>
                  <input
                    className="ds-input"
                    value={dependency?.dependency ?? ''}
                    onChange={handleDependencyChange(index, 'dependency')}
                  />
                </label>
                <label className="ds-field">
                  <span>Påvirkning</span>
                  <textarea
                    className="ds-textarea"
                    value={dependency?.impact ?? ''}
                    onChange={handleDependencyChange(index, 'impact')}
                  />
                </label>
                <label className="ds-field">
                  <span>Afbødning</span>
                  <textarea
                    className="ds-textarea"
                    value={dependency?.mitigation ?? ''}
                    onChange={handleDependencyChange(index, 'mitigation')}
                  />
                </label>
                <label className="ds-field">
                  <span>Ansvarlig</span>
                  <input
                    className="ds-input"
                    value={dependency?.responsible ?? ''}
                    onChange={handleDependencyChange(index, 'responsible')}
                  />
                </label>
                <button type="button" className="ds-button ds-button--ghost" onClick={handleRemoveDependency(index)}>
                  Fjern afhængighed
                </button>
              </fieldset>
            ))}
            <button type="button" className="ds-button" onClick={handleAddDependency}>
              Tilføj afhængighed
            </button>
          </section>

          <section className="ds-stack">
            <h3 className="ds-heading-xs">Muligheder og innovation</h3>
            <p className="ds-text-muted">Dokumentér muligheder, tidsramme og ansvarlig.</p>
            {(current.opportunities ?? []).map((opportunity, index) => (
              <fieldset key={`opportunity-${index}`} className="ds-card ds-stack" aria-label={`Mulighed ${index + 1}`}>
                <label className="ds-field">
                  <span>Titel</span>
                  <input
                    className="ds-input"
                    value={opportunity?.title ?? ''}
                    onChange={handleOpportunityChange(index, 'title')}
                  />
                </label>
                <label className="ds-field">
                  <span>Beskrivelse</span>
                  <textarea
                    className="ds-textarea"
                    value={opportunity?.description ?? ''}
                    onChange={handleOpportunityChange(index, 'description')}
                  />
                </label>
                <label className="ds-field">
                  <span>Tidsramme</span>
                  <input
                    className="ds-input"
                    value={opportunity?.timeframe ?? ''}
                    onChange={handleOpportunityChange(index, 'timeframe')}
                  />
                </label>
                <label className="ds-field">
                  <span>Ansvarlig</span>
                  <input
                    className="ds-input"
                    value={opportunity?.owner ?? ''}
                    onChange={handleOpportunityChange(index, 'owner')}
                  />
                </label>
                <button type="button" className="ds-button ds-button--ghost" onClick={handleRemoveOpportunity(index)}>
                  Fjern mulighed
                </button>
              </fieldset>
            ))}
            <button type="button" className="ds-button" onClick={handleAddOpportunity}>
              Tilføj mulighed
            </button>
          </section>

          <section className="ds-stack">
            <h3 className="ds-heading-xs">Overgangstiltag</h3>
            <p className="ds-text-muted">Registrér konkrete initiativer, milepæle og investeringer.</p>
            {(current.transitionPlanMeasures ?? []).map((measure, index) => (
              <fieldset key={`measure-${index}`} className="ds-card ds-stack" aria-label={`Tiltag ${index + 1}`}>
                <label className="ds-field">
                  <span>Initiativ</span>
                  <input
                    className="ds-input"
                    value={measure?.initiative ?? ''}
                    onChange={handleMeasureChange(index, 'initiative')}
                  />
                </label>
                <label className="ds-field">
                  <span>Status</span>
                  <select
                    className="ds-select"
                    value={measure?.status ?? ''}
                    onChange={handleMeasureChange(index, 'status')}
                  >
                    <option value="">Vælg status</option>
                    {e1TransitionStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="ds-field">
                  <span>Milepæl (år)</span>
                  <input
                    className="ds-input"
                    type="number"
                    value={measure?.milestoneYear ?? ''}
                    onChange={handleMeasureChange(index, 'milestoneYear')}
                  />
                </label>
                <label className="ds-field">
                  <span>Investering (DKK)</span>
                  <input
                    className="ds-input"
                    type="number"
                    step="any"
                    value={measure?.investmentNeedDkk ?? ''}
                    onChange={handleMeasureChange(index, 'investmentNeedDkk')}
                  />
                </label>
                <label className="ds-field">
                  <span>Ansvarlig</span>
                  <input
                    className="ds-input"
                    value={measure?.responsible ?? ''}
                    onChange={handleMeasureChange(index, 'responsible')}
                  />
                </label>
                <label className="ds-field">
                  <span>Beskrivelse</span>
                  <textarea
                    className="ds-textarea"
                    value={measure?.description ?? ''}
                    onChange={handleMeasureChange(index, 'description')}
                  />
                </label>
                <button type="button" className="ds-button ds-button--ghost" onClick={handleRemoveMeasure(index)}>
                  Fjern tiltag
                </button>
              </fieldset>
            ))}
            <button type="button" className="ds-button" onClick={handleAddMeasure}>
              Tilføj overgangstiltag
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
