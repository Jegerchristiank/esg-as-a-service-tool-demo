/**
 * Wizardtrin for ESRS 2 – Metrics & Targets (MR).
 */
'use client'

import { useMemo } from 'react'
import type { ChangeEvent } from 'react'

import type { ModuleInput, ModuleResult, MrInput } from '@org/shared'
import { mrProgressStatusOptions, runMR } from '@org/shared'

import type { WizardStepProps } from './StepTemplate'

const EMPTY_MR: MrInput = {
  intensityNarrative: null,
  targetNarrative: null,
  dataQualityNarrative: null,
  assuranceNarrative: null,
  transitionPlanNarrative: null,
  financialEffectNarrative: null,
  metrics: [],
  keyNarratives: [],
  financialEffects: [],
}

const MAX_TEXT = 2000

const EMPTY_METRIC: Required<NonNullable<MrInput['metrics']>>[number] = {
  name: null,
  unit: null,
  baselineYear: null,
  baselineValue: null,
  currentYear: null,
  currentValue: null,
  targetYear: null,
  targetValue: null,
  status: null,
  owner: null,
  description: null,
}

const EMPTY_NARRATIVE: Required<NonNullable<MrInput['keyNarratives']>>[number] = {
  title: null,
  content: null,
}

const EMPTY_FINANCIAL_EFFECT: Required<NonNullable<MrInput['financialEffects']>>[number] = {
  label: null,
  type: null,
  amountDkk: null,
  timeframe: null,
  description: null,
}

function toNullableString(event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement | HTMLSelectElement>): string | null {
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

export function MRStep({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.MR as MrInput | undefined) ?? EMPTY_MR
  const preview = useMemo<ModuleResult>(() => runMR({ MR: current } as ModuleInput), [current])
  const totalRequirements = preview.metrics?.length ?? 0

  const handleNarrativeChange = (key: keyof MrInput) => (event: ChangeEvent<HTMLTextAreaElement>) => {
    const next: MrInput = { ...current, [key]: toNullableString(event) }
    onChange('MR', next)
  }

  const handleMetricChange = (index: number, field: keyof (typeof EMPTY_METRIC)) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const list = current.metrics ? [...current.metrics] : []
    const entry = { ...(list[index] ?? EMPTY_METRIC) }

    if (field === 'baselineYear' || field === 'currentYear' || field === 'targetYear') {
      entry[field] = toNullableNumber(event as ChangeEvent<HTMLInputElement>)
    } else if (field === 'baselineValue' || field === 'currentValue' || field === 'targetValue') {
      entry[field] = toNullableNumber(event as ChangeEvent<HTMLInputElement>)
    } else if (field === 'status') {
      const value = event.target.value as typeof entry.status
      entry.status = value ? value : null
    } else {
      entry[field] = toNullableString(event as ChangeEvent<HTMLTextAreaElement | HTMLInputElement>)
    }

    list[index] = entry
    onChange('MR', { ...current, metrics: list })
  }

  const handleNarrativeItemChange = (index: number, field: keyof (typeof EMPTY_NARRATIVE)) => (event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const list = current.keyNarratives ? [...current.keyNarratives] : []
    const entry = { ...(list[index] ?? EMPTY_NARRATIVE) }
    entry[field] = toNullableString(event)
    list[index] = entry
    onChange('MR', { ...current, keyNarratives: list })
  }

  const handleFinancialEffectChange = (index: number, field: keyof (typeof EMPTY_FINANCIAL_EFFECT)) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const list = current.financialEffects ? [...current.financialEffects] : []
    const entry = { ...(list[index] ?? EMPTY_FINANCIAL_EFFECT) }

    if (field === 'amountDkk') {
      entry.amountDkk = toNullableNumber(event as ChangeEvent<HTMLInputElement>)
    } else if (field === 'type') {
      const value = event.target.value as typeof entry.type
      entry.type = value ? value : null
    } else {
      const value = toNullableString(event as ChangeEvent<HTMLTextAreaElement | HTMLInputElement>)
      if (field === 'label') {
        entry.label = value
      } else if (field === 'timeframe') {
        entry.timeframe = value
      } else {
        entry.description = value
      }
    }

    list[index] = entry
    onChange('MR', { ...current, financialEffects: list })
  }

  const handleAddMetric = () => {
    const list = current.metrics ? [...current.metrics] : []
    list.push({ ...EMPTY_METRIC })
    onChange('MR', { ...current, metrics: list })
  }

  const handleRemoveMetric = (index: number) => () => {
    const list = current.metrics ? [...current.metrics] : []
    list.splice(index, 1)
    onChange('MR', { ...current, metrics: list })
  }

  const handleAddNarrativeItem = () => {
    const list = current.keyNarratives ? [...current.keyNarratives] : []
    list.push({ ...EMPTY_NARRATIVE })
    onChange('MR', { ...current, keyNarratives: list })
  }

  const handleRemoveNarrativeItem = (index: number) => () => {
    const list = current.keyNarratives ? [...current.keyNarratives] : []
    list.splice(index, 1)
    onChange('MR', { ...current, keyNarratives: list })
  }

  const handleAddFinancialEffect = () => {
    const list = current.financialEffects ? [...current.financialEffects] : []
    list.push({ ...EMPTY_FINANCIAL_EFFECT })
    onChange('MR', { ...current, financialEffects: list })
  }

  const handleRemoveFinancialEffect = (index: number) => () => {
    const list = current.financialEffects ? [...current.financialEffects] : []
    list.splice(index, 1)
    onChange('MR', { ...current, financialEffects: list })
  }

  return (
    <form className="ds-form" noValidate>
      <header className="ds-stack-sm">
        <h2 className="ds-heading-sm">ESRS 2 – Metrics og targets</h2>
        <p className="ds-text-muted">Indtast nøgletal, mål og finansielle effekter for klimaindsatsen.</p>
      </header>

      <section className="ds-grid ds-grid-columns-2 ds-grid-gap-lg">
        <div className="ds-stack">
          <label className="ds-field">
            <span>Intensiteter og udvikling</span>
            <textarea
              className="ds-textarea"
              maxLength={MAX_TEXT}
              value={current.intensityNarrative ?? ''}
              onChange={handleNarrativeChange('intensityNarrative')}
            />
          </label>

          <label className="ds-field">
            <span>Mål og status</span>
            <textarea
              className="ds-textarea"
              maxLength={MAX_TEXT}
              value={current.targetNarrative ?? ''}
              onChange={handleNarrativeChange('targetNarrative')}
            />
          </label>

          <label className="ds-field">
            <span>Datakvalitet</span>
            <textarea
              className="ds-textarea"
              maxLength={MAX_TEXT}
              value={current.dataQualityNarrative ?? ''}
              onChange={handleNarrativeChange('dataQualityNarrative')}
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
            <span>Overgangsplan</span>
            <textarea
              className="ds-textarea"
              maxLength={MAX_TEXT}
              value={current.transitionPlanNarrative ?? ''}
              onChange={handleNarrativeChange('transitionPlanNarrative')}
            />
          </label>

          <label className="ds-field">
            <span>Finansielle effekter (narrativ)</span>
            <textarea
              className="ds-textarea"
              maxLength={MAX_TEXT}
              value={current.financialEffectNarrative ?? ''}
              onChange={handleNarrativeChange('financialEffectNarrative')}
            />
          </label>

          <section className="ds-stack">
            <h3 className="ds-heading-xs">Supplerende narrativer</h3>
            <p className="ds-text-muted">Opsummer centrale pointer til rapporteringen.</p>
            {(current.keyNarratives ?? []).map((item, index) => (
              <fieldset key={`narrative-${index}`} className="ds-card ds-stack" aria-label={`Narrativ ${index + 1}`}>
                <label className="ds-field">
                  <span>Titel</span>
                  <input className="ds-input" value={item?.title ?? ''} onChange={handleNarrativeItemChange(index, 'title')} />
                </label>
                <label className="ds-field">
                  <span>Indhold</span>
                  <textarea
                    className="ds-textarea"
                    value={item?.content ?? ''}
                    onChange={handleNarrativeItemChange(index, 'content')}
                  />
                </label>
                <button type="button" className="ds-button ds-button--ghost" onClick={handleRemoveNarrativeItem(index)}>
                  Fjern narrativ
                </button>
              </fieldset>
            ))}
            <button type="button" className="ds-button" onClick={handleAddNarrativeItem}>
              Tilføj narrativ
            </button>
          </section>

          <section className="ds-stack">
            <h3 className="ds-heading-xs">Metrics og KPI’er</h3>
            <p className="ds-text-muted">Indtast baseline, aktuelle tal og målsætninger.</p>
            {(current.metrics ?? []).map((metric, index) => (
              <fieldset key={`metric-${index}`} className="ds-card ds-stack" aria-label={`Metric ${index + 1}`}>
                <label className="ds-field">
                  <span>Navn</span>
                  <input className="ds-input" value={metric?.name ?? ''} onChange={handleMetricChange(index, 'name')} />
                </label>
                <label className="ds-field">
                  <span>Enhed</span>
                  <input className="ds-input" value={metric?.unit ?? ''} onChange={handleMetricChange(index, 'unit')} />
                </label>
                <div className="ds-grid ds-grid-columns-2 ds-grid-gap-sm">
                  <label className="ds-field">
                    <span>Baseline år</span>
                    <input
                      className="ds-input"
                      type="number"
                      value={metric?.baselineYear ?? ''}
                      onChange={handleMetricChange(index, 'baselineYear')}
                    />
                  </label>
                  <label className="ds-field">
                    <span>Baseline værdi</span>
                    <input
                      className="ds-input"
                      type="number"
                      step="any"
                      value={metric?.baselineValue ?? ''}
                      onChange={handleMetricChange(index, 'baselineValue')}
                    />
                  </label>
                  <label className="ds-field">
                    <span>Seneste år</span>
                    <input
                      className="ds-input"
                      type="number"
                      value={metric?.currentYear ?? ''}
                      onChange={handleMetricChange(index, 'currentYear')}
                    />
                  </label>
                  <label className="ds-field">
                    <span>Seneste værdi</span>
                    <input
                      className="ds-input"
                      type="number"
                      step="any"
                      value={metric?.currentValue ?? ''}
                      onChange={handleMetricChange(index, 'currentValue')}
                    />
                  </label>
                  <label className="ds-field">
                    <span>Mål år</span>
                    <input
                      className="ds-input"
                      type="number"
                      value={metric?.targetYear ?? ''}
                      onChange={handleMetricChange(index, 'targetYear')}
                    />
                  </label>
                  <label className="ds-field">
                    <span>Mål værdi</span>
                    <input
                      className="ds-input"
                      type="number"
                      step="any"
                      value={metric?.targetValue ?? ''}
                      onChange={handleMetricChange(index, 'targetValue')}
                    />
                  </label>
                </div>
                <label className="ds-field">
                  <span>Status</span>
                  <select className="ds-select" value={metric?.status ?? ''} onChange={handleMetricChange(index, 'status')}>
                    <option value="">Vælg status</option>
                    {mrProgressStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="ds-field">
                  <span>Ansvarlig</span>
                  <input className="ds-input" value={metric?.owner ?? ''} onChange={handleMetricChange(index, 'owner')} />
                </label>
                <label className="ds-field">
                  <span>Beskrivelse</span>
                  <textarea
                    className="ds-textarea"
                    value={metric?.description ?? ''}
                    onChange={handleMetricChange(index, 'description')}
                  />
                </label>
                <button type="button" className="ds-button ds-button--ghost" onClick={handleRemoveMetric(index)}>
                  Fjern metric
                </button>
              </fieldset>
            ))}
            <button type="button" className="ds-button" onClick={handleAddMetric}>
              Tilføj metric
            </button>
          </section>

          <section className="ds-stack">
            <h3 className="ds-heading-xs">Finansielle effekter</h3>
            <p className="ds-text-muted">Angiv kategori, beløb og periode for klimarelaterede effekter.</p>
            {(current.financialEffects ?? []).map((effect, index) => (
              <fieldset key={`finance-${index}`} className="ds-card ds-stack" aria-label={`Finansiel effekt ${index + 1}`}>
                <label className="ds-field">
                  <span>Label</span>
                  <input className="ds-input" value={effect?.label ?? ''} onChange={handleFinancialEffectChange(index, 'label')} />
                </label>
                <label className="ds-field">
                  <span>Type</span>
                  <select className="ds-select" value={effect?.type ?? ''} onChange={handleFinancialEffectChange(index, 'type')}>
                    <option value="">Vælg type</option>
                    <option value="capex">CapEx</option>
                    <option value="opex">OpEx</option>
                    <option value="revenues">Omsætning</option>
                    <option value="costs">Omkostninger</option>
                    <option value="impairments">Nedskrivninger</option>
                    <option value="other">Andet</option>
                  </select>
                </label>
                <label className="ds-field">
                  <span>Beløb (DKK)</span>
                  <input
                    className="ds-input"
                    type="number"
                    step="any"
                    value={effect?.amountDkk ?? ''}
                    onChange={handleFinancialEffectChange(index, 'amountDkk')}
                  />
                </label>
                <label className="ds-field">
                  <span>Periode</span>
                  <input
                    className="ds-input"
                    value={effect?.timeframe ?? ''}
                    onChange={handleFinancialEffectChange(index, 'timeframe')}
                  />
                </label>
                <label className="ds-field">
                  <span>Beskrivelse</span>
                  <textarea
                    className="ds-textarea"
                    value={effect?.description ?? ''}
                    onChange={handleFinancialEffectChange(index, 'description')}
                  />
                </label>
                <button type="button" className="ds-button ds-button--ghost" onClick={handleRemoveFinancialEffect(index)}>
                  Fjern effekt
                </button>
              </fieldset>
            ))}
            <button type="button" className="ds-button" onClick={handleAddFinancialEffect}>
              Tilføj finansiel effekt
            </button>
          </section>
        </div>

        <aside className="ds-card ds-stack" aria-live="polite">
          <h3 className="ds-heading-xs">ESRS 2 MR kravvurdering</h3>
          <p className="ds-text-strong">Opfyldte krav: {preview.value} / {totalRequirements}</p>
          {preview.metrics && preview.metrics.length > 0 && (
            <div className="ds-stack-xs">
              <h4 className="ds-text-muted">Kravstatus</h4>
              <ul className="ds-stack-xs">
                {preview.metrics.map((metric, index) => (
                  <li key={`metric-${index}`}>
                    <span className="ds-text-strong">{metric.label}:</span>{' '}
                    <span>{metric.value}</span>
                    {metric.context ? <div className="ds-text-subtle">{metric.context}</div> : null}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="ds-stack-xs">
            <h4 className="ds-text-muted">Antagelser</h4>
            <ul className="ds-stack-xs">
              {preview.assumptions.map((assumption, index) => (
                <li key={`assumption-${index}`}>{assumption}</li>
              ))}
            </ul>
          </div>
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
