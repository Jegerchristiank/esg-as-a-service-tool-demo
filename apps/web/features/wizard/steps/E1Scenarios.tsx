/**
 * Wizardtrin for modul E1 – klimascenarier.
 */
'use client'

import { useCallback, useMemo } from 'react'
import type { ChangeEvent } from 'react'

import type {
  E1ScenarioType,
  E1ScenariosInput,
  ModuleInput,
  ModuleResult,
} from '@org/shared'
import { e1ScenarioTypeOptions, runE1Scenarios } from '@org/shared'

import type { WizardStepProps } from './StepTemplate'

const EMPTY_INPUT: E1ScenariosInput = {
  scenarios: [],
  scenarioNarrative: null,
}

const SCENARIO_TYPE_LABELS: Record<E1ScenarioType, string> = {
  netZero15: '1,5°C nettonul',
  wellBelow2: 'Vel under 2°C',
  currentPolicies: 'Nuværende politikker',
  stressTest: 'Stress-test',
  custom: 'Eget scenarie',
}

type ScenarioTimeHorizon = NonNullable<NonNullable<E1ScenariosInput['scenarios']>[number]['timeHorizon']>

const TIME_HORIZON_OPTIONS: Array<{ value: ScenarioTimeHorizon; label: string }> = [
  { value: 'shortTerm', label: 'Kort sigt' },
  { value: 'mediumTerm', label: 'Mellemlang sigt' },
  { value: 'longTerm', label: 'Lang sigt' },
]

const createEmptyScenario = (): NonNullable<E1ScenariosInput['scenarios']>[number] => ({
  name: null,
  provider: null,
  scenarioType: 'netZero15',
  timeHorizon: 'shortTerm',
  coveragePercent: null,
  description: null,
})

const toScenario = (
  scenario?: NonNullable<E1ScenariosInput['scenarios']>[number],
): NonNullable<E1ScenariosInput['scenarios']>[number] => ({
  ...createEmptyScenario(),
  ...(scenario ?? {}),
})

const parsePercent = (value: string): number | null => {
  const trimmed = value.trim()
  if (trimmed === '') {
    return null
  }
  const parsed = Number.parseFloat(trimmed.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

export function E1ScenariosStep({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.E1Scenarios as E1ScenariosInput | undefined) ?? EMPTY_INPUT

  const preview = useMemo<ModuleResult>(() => {
    return runE1Scenarios({ E1Scenarios: current } as ModuleInput)
  }, [current])

  const setScenarios = useCallback(
    (updater: (scenarios: NonNullable<E1ScenariosInput['scenarios']>) => NonNullable<E1ScenariosInput['scenarios']>) => {
      const previous = (current.scenarios ?? []).map((scenario) => toScenario(scenario))
      const next = updater(previous)
      onChange('E1Scenarios', { ...current, scenarios: next })
    },
    [current, onChange],
  )

  const handleScenarioFieldChange = useCallback(
    (index: number, field: keyof ReturnType<typeof createEmptyScenario>) =>
      (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setScenarios((scenarios) => {
          const next = scenarios.map((scenario, idx) => (idx === index ? { ...scenario } : scenario))
          const scenario = next[index]
          if (!scenario) {
            return next
          }
          if (field === 'coveragePercent') {
            const numeric = parsePercent(event.target.value)
            scenario.coveragePercent = numeric
          } else if (field === 'scenarioType') {
            scenario.scenarioType = event.target.value as E1ScenarioType
          } else if (field === 'timeHorizon') {
            const value = event.target.value as ScenarioTimeHorizon | ''
            scenario.timeHorizon = value === '' ? null : value
          } else {
            const value = event.target.value.trim()
            scenario[field] = value.length > 0 ? value : null
          }
          return next
        })
      },
    [setScenarios],
  )

  const handleAddScenario = useCallback(() => {
    setScenarios((scenarios) => [...scenarios, createEmptyScenario()])
  }, [setScenarios])

  const handleRemoveScenario = useCallback(
    (index: number) => () => {
      setScenarios((scenarios) => scenarios.filter((_, idx) => idx !== index))
    },
    [setScenarios],
  )

  const handleNarrativeChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const text = event.target.value.trim()
      onChange('E1Scenarios', { ...current, scenarioNarrative: text.length > 0 ? text : null })
    },
    [current, onChange],
  )

  const scenarios = (current.scenarios ?? []).map((scenario) => toScenario(scenario))
  const hasData = scenarios.length > 0 || (current.scenarioNarrative ?? '').trim().length > 0

  return (
    <form className="ds-form ds-stack" noValidate>
      <header className="ds-stack-sm">
        <h2 className="ds-heading-sm">E1 – Klimascenarier</h2>
        <p className="ds-text-muted">
          Registrer de scenarier der anvendes til risikovurdering. Angiv dækningsgrad for at dokumentere modenhed.
        </p>
      </header>

      <section className="ds-stack">
        <button type="button" className="ds-button ds-button-secondary" onClick={handleAddScenario}>
          Tilføj scenarie
        </button>
        {scenarios.length === 0 && <p>Ingen scenarier endnu. Tilføj mindst ét for at se beregningen.</p>}
        {scenarios.map((scenario, index) => (
          <fieldset key={index} className="ds-card ds-stack" style={{ padding: '1rem' }}>
            <legend className="ds-heading-xs">Scenarie #{index + 1}</legend>
            <div className="ds-grid-two">
              <label className="ds-field">
                <span>Navn</span>
                <input
                  type="text"
                  value={scenario.name ?? ''}
                  onChange={handleScenarioFieldChange(index, 'name')}
                  placeholder="IEA Net Zero"
                />
              </label>
              <label className="ds-field">
                <span>Udbyder</span>
                <input
                  type="text"
                  value={scenario.provider ?? ''}
                  onChange={handleScenarioFieldChange(index, 'provider')}
                  placeholder="IEA"
                />
              </label>
            </div>
            <div className="ds-grid-two">
              <label className="ds-field">
                <span>Type</span>
                <select value={scenario.scenarioType ?? 'netZero15'} onChange={handleScenarioFieldChange(index, 'scenarioType')}>
                  {e1ScenarioTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {SCENARIO_TYPE_LABELS[option]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ds-field">
                <span>Tidshorisont</span>
                <select value={scenario.timeHorizon ?? ''} onChange={handleScenarioFieldChange(index, 'timeHorizon')}>
                  <option value="">Vælg…</option>
                  {TIME_HORIZON_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="ds-field">
              <span>Dækningsgrad (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={scenario.coveragePercent ?? ''}
                onChange={handleScenarioFieldChange(index, 'coveragePercent')}
              />
            </label>
            <label className="ds-field">
              <span>Beskrivelse</span>
              <textarea
                rows={3}
                value={scenario.description ?? ''}
                onChange={handleScenarioFieldChange(index, 'description')}
              />
            </label>
            <button type="button" className="ds-button ds-button-tertiary" onClick={handleRemoveScenario(index)}>
              Fjern scenarie
            </button>
          </fieldset>
        ))}
      </section>

      <section className="ds-stack">
        <label className="ds-field">
          <span>Hvordan bruges scenarieanalysen?</span>
          <textarea rows={4} value={current.scenarioNarrative ?? ''} onChange={handleNarrativeChange} />
        </label>
      </section>

      <section className="ds-card ds-stack" style={{ padding: '1rem' }}>
        <h3 className="ds-heading-xs">Forhåndsvisning</h3>
        {hasData ? (
          <div className="ds-stack-sm">
            <div>
              <span className="ds-text-muted">Samlet antal scenarier</span>
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
          <p className="ds-text-muted">Udfyld felterne for at se beregningen.</p>
        )}
      </section>
    </form>
  )
}
