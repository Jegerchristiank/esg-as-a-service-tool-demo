/**
 * Wizardtrin for modul E1 – risikogeografi.
 */
'use client'

import { useCallback, useMemo } from 'react'
import type { ChangeEvent } from 'react'

import type {
  E1RiskGeographyInput,
  E1RiskType,
  ModuleInput,
  ModuleResult,
} from '@org/shared'
import { e1RiskTypeOptions, runE1RiskGeography } from '@org/shared'

import type { WizardStepProps } from './StepTemplate'

const EMPTY_INPUT: E1RiskGeographyInput = {
  riskRegions: [],
  assessmentNarrative: null,
}

const RISK_TYPE_LABELS: Record<E1RiskType, string> = {
  acutePhysical: 'Akut fysisk risiko',
  chronicPhysical: 'Kronisk fysisk risiko',
  transition: 'Transitionrisiko',
}

type RiskTimeHorizon = NonNullable<NonNullable<E1RiskGeographyInput['riskRegions']>[number]['timeHorizon']>

const TIME_HORIZON_OPTIONS: Array<{ value: RiskTimeHorizon; label: string }> = [
  { value: 'shortTerm', label: 'Kort sigt' },
  { value: 'mediumTerm', label: 'Mellemlang sigt' },
  { value: 'longTerm', label: 'Lang sigt' },
]

const createEmptyRegion = (): NonNullable<E1RiskGeographyInput['riskRegions']>[number] => ({
  geography: null,
  riskType: 'transition',
  timeHorizon: 'mediumTerm',
  assetsAtRiskDkk: null,
  revenueAtRiskDkk: null,
  exposureNarrative: null,
})

const toRegion = (
  region?: NonNullable<E1RiskGeographyInput['riskRegions']>[number],
): NonNullable<E1RiskGeographyInput['riskRegions']>[number] => ({
  ...createEmptyRegion(),
  ...(region ?? {}),
})

const parseNumber = (value: string): number | null => {
  const trimmed = value.trim()
  if (trimmed === '') {
    return null
  }
  const parsed = Number.parseFloat(trimmed.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

export function E1RiskGeographyStep({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.E1RiskGeography as E1RiskGeographyInput | undefined) ?? EMPTY_INPUT

  const preview = useMemo<ModuleResult>(() => {
    return runE1RiskGeography({ E1RiskGeography: current } as ModuleInput)
  }, [current])

  const setRegions = useCallback(
    (updater: (regions: NonNullable<E1RiskGeographyInput['riskRegions']>) => NonNullable<E1RiskGeographyInput['riskRegions']>) => {
      const previous = (current.riskRegions ?? []).map((region) => toRegion(region))
      const next = updater(previous)
      onChange('E1RiskGeography', { ...current, riskRegions: next })
    },
    [current, onChange],
  )

  const handleRegionChange = useCallback(
    (
      index: number,
      field: keyof ReturnType<typeof createEmptyRegion>,
    ) =>
      (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setRegions((regions) => {
          const next = regions.map((region, idx) => (idx === index ? { ...region } : region))
          const region = next[index]
          if (!region) {
            return next
          }
          if (field === 'assetsAtRiskDkk' || field === 'revenueAtRiskDkk') {
            region[field] = parseNumber(event.target.value)
          } else if (field === 'riskType') {
            region.riskType = event.target.value as E1RiskType
          } else if (field === 'timeHorizon') {
            const value = event.target.value as RiskTimeHorizon | ''
            region.timeHorizon = value === '' ? null : value
          } else {
            const value = event.target.value.trim()
            region[field] = value.length > 0 ? value : null
          }
          return next
        })
      },
    [setRegions],
  )

  const handleAddRegion = useCallback(() => {
    setRegions((regions) => [...regions, createEmptyRegion()])
  }, [setRegions])

  const handleRemoveRegion = useCallback(
    (index: number) => () => {
      setRegions((regions) => regions.filter((_, idx) => idx !== index))
    },
    [setRegions],
  )

  const handleNarrativeChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const text = event.target.value.trim()
      onChange('E1RiskGeography', { ...current, assessmentNarrative: text.length > 0 ? text : null })
    },
    [current, onChange],
  )

  const regions = (current.riskRegions ?? []).map((region) => toRegion(region))
  const hasData = regions.length > 0 || (current.assessmentNarrative ?? '').trim().length > 0

  return (
    <form className="ds-form ds-stack" noValidate>
      <header className="ds-stack-sm">
        <h2 className="ds-heading-sm">E1 – Risikogeografi</h2>
        <p className="ds-text-muted">
          Kortlæg hvor virksomheden har materielle klimarisici. Brug kategorierne til at skelne mellem fysisk og transition.
        </p>
      </header>

      <section className="ds-stack">
        <button type="button" className="ds-button ds-button-secondary" onClick={handleAddRegion}>
          Tilføj geografi
        </button>
        {regions.length === 0 && <p>Ingen geografier tilføjet endnu.</p>}
        {regions.map((region, index) => (
          <fieldset key={index} className="ds-card ds-stack" style={{ padding: '1rem' }}>
            <legend className="ds-heading-xs">Geografi #{index + 1}</legend>
            <label className="ds-field">
              <span>Geografi / land</span>
              <input
                type="text"
                value={region.geography ?? ''}
                onChange={handleRegionChange(index, 'geography')}
                placeholder="EU, Sydøstasien, NUTS2..."
              />
            </label>
            <div className="ds-grid-two">
              <label className="ds-field">
                <span>Risikotype</span>
                <select value={region.riskType ?? 'transition'} onChange={handleRegionChange(index, 'riskType')}>
                  {e1RiskTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {RISK_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ds-field">
                <span>Tidshorisont</span>
                <select value={region.timeHorizon ?? ''} onChange={handleRegionChange(index, 'timeHorizon')}>
                  <option value="">Vælg…</option>
                  {TIME_HORIZON_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="ds-grid-two">
              <label className="ds-field">
                <span>Aktiver i risiko (DKK)</span>
                <input
                  type="number"
                  min={0}
                  step="1000"
                  value={region.assetsAtRiskDkk ?? ''}
                  onChange={handleRegionChange(index, 'assetsAtRiskDkk')}
                />
              </label>
              <label className="ds-field">
                <span>Nettoomsætning i risiko (DKK)</span>
                <input
                  type="number"
                  min={0}
                  step="1000"
                  value={region.revenueAtRiskDkk ?? ''}
                  onChange={handleRegionChange(index, 'revenueAtRiskDkk')}
                />
              </label>
            </div>
            <label className="ds-field">
              <span>Uddybning</span>
              <textarea
                rows={3}
                value={region.exposureNarrative ?? ''}
                onChange={handleRegionChange(index, 'exposureNarrative')}
              />
            </label>
            <button type="button" className="ds-button ds-button-tertiary" onClick={handleRemoveRegion(index)}>
              Fjern geografi
            </button>
          </fieldset>
        ))}
      </section>

      <section className="ds-stack">
        <label className="ds-field">
          <span>Opsummering af risikovurdering</span>
          <textarea rows={4} value={current.assessmentNarrative ?? ''} onChange={handleNarrativeChange} />
        </label>
      </section>

      <section className="ds-card ds-stack" style={{ padding: '1rem' }}>
        <h3 className="ds-heading-xs">Forhåndsvisning</h3>
        {hasData ? (
          <div className="ds-stack-sm">
            <div>
              <span className="ds-text-muted">Antal geografier</span>
              <p className="ds-heading-md" style={{ margin: 0 }}>
                {preview.value} {preview.unit}
              </p>
            </div>
            {preview.metrics && preview.metrics.length > 0 && (
              <ul className="ds-list-plain">
                {preview.metrics.map((metric) => (
                  <li key={metric.label}>
                    <strong>{metric.label}:</strong> {metric.value}
                    {metric.unit ? ` ${metric.unit}` : ''}
                  </li>
                ))}
              </ul>
            )}
            {preview.warnings.length > 0 && (
              <div>
                <strong>Advarsler</strong>
                <ul>
                  {preview.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="ds-text-muted">Tilføj en geografi for at se beregningen.</p>
        )}
      </section>
    </form>
  )
}
