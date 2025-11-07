/**
 * Wizardtrin for modul E1 – decarboniseringsdrivere.
 */
'use client'

import { useCallback, useMemo } from 'react'
import type { ChangeEvent } from 'react'

import type {
  E1DecarbonisationDriverType,
  E1DecarbonisationDriversInput,
  ModuleInput,
  ModuleResult,
} from '@org/shared'
import { e1DecarbonisationDriverOptions, runE1DecarbonisationDrivers } from '@org/shared'

import type { WizardStepProps } from './StepTemplate'

const EMPTY_INPUT: E1DecarbonisationDriversInput = {
  drivers: [],
  summaryNarrative: null,
}

const DRIVER_LABELS: Record<E1DecarbonisationDriverType, string> = {
  energyEfficiency: 'Energieffektivitet',
  renewableEnergy: 'Vedvarende energi',
  processInnovation: 'Procesinnovation',
  fuelSwitching: 'Brændselsskifte',
  carbonCapture: 'Carbon capture og lagring',
  valueChainEngagement: 'Værdikæde-samarbejde',
  other: 'Andet',
}

const createEmptyDriver = (): NonNullable<E1DecarbonisationDriversInput['drivers']>[number] => ({
  lever: 'energyEfficiency',
  name: null,
  description: null,
  expectedReductionTonnes: null,
  investmentNeedDkk: null,
  startYear: null,
})

const toDriver = (
  driver?: NonNullable<E1DecarbonisationDriversInput['drivers']>[number],
): NonNullable<E1DecarbonisationDriversInput['drivers']>[number] => ({
  ...createEmptyDriver(),
  ...(driver ?? {}),
})

const parseNumber = (value: string): number | null => {
  const trimmed = value.trim()
  if (trimmed === '') {
    return null
  }
  const parsed = Number.parseFloat(trimmed.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

const parseYear = (value: string): number | null => {
  const trimmed = value.trim()
  if (trimmed === '') {
    return null
  }
  const parsed = Number.parseInt(trimmed, 10)
  if (!Number.isFinite(parsed)) {
    return null
  }
  if (parsed < 1900 || parsed > 2100) {
    return null
  }
  return parsed
}

export function E1DecarbonisationDriversStep({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.E1DecarbonisationDrivers as E1DecarbonisationDriversInput | undefined) ?? EMPTY_INPUT

  const preview = useMemo<ModuleResult>(() => {
    return runE1DecarbonisationDrivers({ E1DecarbonisationDrivers: current } as ModuleInput)
  }, [current])

  const setDrivers = useCallback(
    (
      updater: (drivers: NonNullable<E1DecarbonisationDriversInput['drivers']>) => NonNullable<E1DecarbonisationDriversInput['drivers']>,
    ) => {
      const previous = (current.drivers ?? []).map((driver) => toDriver(driver))
      const next = updater(previous)
      onChange('E1DecarbonisationDrivers', { ...current, drivers: next })
    },
    [current, onChange],
  )

  const handleDriverChange = useCallback(
    (
      index: number,
      field: keyof ReturnType<typeof createEmptyDriver>,
    ) =>
      (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setDrivers((drivers) => {
          const next = drivers.map((driver, idx) => (idx === index ? { ...driver } : driver))
          const driver = next[index]
          if (!driver) {
            return next
          }
          if (field === 'expectedReductionTonnes' || field === 'investmentNeedDkk') {
            driver[field] = parseNumber(event.target.value)
          } else if (field === 'startYear') {
            driver.startYear = parseYear(event.target.value)
          } else if (field === 'lever') {
            driver.lever = event.target.value as E1DecarbonisationDriverType
          } else {
            const value = event.target.value.trim()
            driver[field] = value.length > 0 ? value : null
          }
          return next
        })
      },
    [setDrivers],
  )

  const handleAddDriver = useCallback(() => {
    setDrivers((drivers) => [...drivers, createEmptyDriver()])
  }, [setDrivers])

  const handleRemoveDriver = useCallback(
    (index: number) => () => {
      setDrivers((drivers) => drivers.filter((_, idx) => idx !== index))
    },
    [setDrivers],
  )

  const handleNarrativeChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const text = event.target.value.trim()
      onChange('E1DecarbonisationDrivers', { ...current, summaryNarrative: text.length > 0 ? text : null })
    },
    [current, onChange],
  )

  const drivers = (current.drivers ?? []).map((driver) => toDriver(driver))
  const hasData = drivers.length > 0 || (current.summaryNarrative ?? '').trim().length > 0

  return (
    <form className="ds-form ds-stack" noValidate>
      <header className="ds-stack-sm">
        <h2 className="ds-heading-sm">E1 – Decarboniseringsdrivere</h2>
        <p className="ds-text-muted">
          Beskriv de vigtigste initiativer, investeringer og forventede reduktioner der understøtter klimamålene.
        </p>
      </header>

      <section className="ds-stack">
        <button type="button" className="ds-button ds-button-secondary" onClick={handleAddDriver}>
          Tilføj driver
        </button>
        {drivers.length === 0 && <p>Ingen drivere tilføjet endnu.</p>}
        {drivers.map((driver, index) => (
          <fieldset key={index} className="ds-card ds-stack" style={{ padding: '1rem' }}>
            <legend className="ds-heading-xs">Driver #{index + 1}</legend>
            <div className="ds-grid-two">
              <label className="ds-field">
                <span>Type</span>
                <select value={driver.lever ?? 'energyEfficiency'} onChange={handleDriverChange(index, 'lever')}>
                  {e1DecarbonisationDriverOptions.map((option) => (
                    <option key={option} value={option}>
                      {DRIVER_LABELS[option]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ds-field">
                <span>Startår</span>
                <input
                  type="number"
                  min={1900}
                  max={2100}
                  value={driver.startYear ?? ''}
                  onChange={handleDriverChange(index, 'startYear')}
                />
              </label>
            </div>
            <label className="ds-field">
              <span>Navn / initiativ</span>
              <input type="text" value={driver.name ?? ''} onChange={handleDriverChange(index, 'name')} />
            </label>
            <div className="ds-grid-two">
              <label className="ds-field">
                <span>Forventet reduktion (tCO₂e)</span>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={driver.expectedReductionTonnes ?? ''}
                  onChange={handleDriverChange(index, 'expectedReductionTonnes')}
                />
              </label>
              <label className="ds-field">
                <span>Investering (DKK)</span>
                <input
                  type="number"
                  min={0}
                  step="1000"
                  value={driver.investmentNeedDkk ?? ''}
                  onChange={handleDriverChange(index, 'investmentNeedDkk')}
                />
              </label>
            </div>
            <label className="ds-field">
              <span>Beskrivelse</span>
              <textarea
                rows={3}
                value={driver.description ?? ''}
                onChange={handleDriverChange(index, 'description')}
              />
            </label>
            <button type="button" className="ds-button ds-button-tertiary" onClick={handleRemoveDriver(index)}>
              Fjern driver
            </button>
          </fieldset>
        ))}
      </section>

      <section className="ds-stack">
        <label className="ds-field">
          <span>Sammenfatning</span>
          <textarea rows={4} value={current.summaryNarrative ?? ''} onChange={handleNarrativeChange} />
        </label>
      </section>

      <section className="ds-card ds-stack" style={{ padding: '1rem' }}>
        <h3 className="ds-heading-xs">Forhåndsvisning</h3>
        {hasData ? (
          <div className="ds-stack-sm">
            <div>
              <span className="ds-text-muted">Samlet reduktion</span>
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
          <p className="ds-text-muted">Tilføj mindst én driver for at se beregningen.</p>
        )}
      </section>
    </form>
  )
}
