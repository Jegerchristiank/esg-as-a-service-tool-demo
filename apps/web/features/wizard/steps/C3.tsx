/**
 * Wizardtrin for modul C3 – brændstof- og energirelaterede aktiviteter.
 */
'use client'

import { useMemo } from 'react'
import type { ChangeEvent } from 'react'
import type { C3Input, ModuleInput, ModuleResult } from '@org/shared'
import { runC3 } from '@org/shared'
import type { WizardStepProps } from './StepTemplate'

type FieldKey = keyof C3Input

type FieldConfig = {
  key: FieldKey
  label: string
  description: string
  unit: string
  placeholder?: string
  min?: number
  max?: number
}

const FIELD_CONFIG: FieldConfig[] = [
  {
    key: 'purchasedElectricityKwh',
    label: 'Elforbrug til upstream-beregning',
    description:
      'Angiv den del af elforbruget (kWh) hvor der skal beregnes upstream emissioner.',
    unit: 'kWh',
    placeholder: 'fx 120 000',
    min: 0
  },
  {
    key: 'electricityUpstreamEmissionFactorKgPerKwh',
    label: 'Upstream emissionsfaktor for el',
    description:
      'Kg CO2e pr. kWh for upstream emissioner fra el (well-to-tank og T&D).',
    unit: 'kg CO2e/kWh',
    placeholder: 'fx 0.045',
    min: 0
  },
  {
    key: 'transmissionLossPercent',
    label: 'Transmissions- og distributionsspild',
    description: 'Angiv tab i elnettet. Værdien afgrænses til højst 20%.',
    unit: '%',
    placeholder: '0-20',
    min: 0,
    max: 20
  },
  {
    key: 'renewableSharePercent',
    label: 'Dokumenteret vedvarende el',
    description: 'Reducerer upstream emissioner. Angiv andelen af el med certificeret oprindelse.',
    unit: '%',
    placeholder: '0-100',
    min: 0,
    max: 100
  },
  {
    key: 'fuelConsumptionKwh',
    label: 'Brændstofforbrug (kWh)',
    description:
      'Brændstofforbrug konverteret til kWh. Indgår fuldt ud i upstream emissionerne.',
    unit: 'kWh',
    placeholder: 'fx 35 000',
    min: 0
  },
  {
    key: 'fuelUpstreamEmissionFactorKgPerKwh',
    label: 'Upstream emissionsfaktor for brændstof',
    description: 'Kg CO2e pr. kWh for well-to-tank emissioner fra brændstoffer.',
    unit: 'kg CO2e/kWh',
    placeholder: 'fx 0.068',
    min: 0
  }
]

const EMPTY_C3: C3Input = {
  purchasedElectricityKwh: null,
  electricityUpstreamEmissionFactorKgPerKwh: null,
  transmissionLossPercent: null,
  renewableSharePercent: null,
  fuelConsumptionKwh: null,
  fuelUpstreamEmissionFactorKgPerKwh: null
}

export function C3Step({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.C3 as C3Input | undefined) ?? EMPTY_C3

  const preview = useMemo<ModuleResult>(() => {
    return runC3({ C3: current } as ModuleInput)
  }, [current])

  const handleFieldChange = (field: FieldKey) => (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value.replace(',', '.')
    const parsed = rawValue === '' ? null : Number.parseFloat(rawValue)
    const next: C3Input = {
      ...current,
      [field]: Number.isFinite(parsed) ? parsed : null
    }
    onChange('C3', next)
  }

  const hasData =
    current.purchasedElectricityKwh != null ||
    current.electricityUpstreamEmissionFactorKgPerKwh != null ||
    current.transmissionLossPercent != null ||
    current.renewableSharePercent != null ||
    current.fuelConsumptionKwh != null ||
    current.fuelUpstreamEmissionFactorKgPerKwh != null

  return (
    <form style={{ display: 'grid', gap: '1.5rem', maxWidth: '40rem' }}>
      <header style={{ display: 'grid', gap: '0.5rem' }}>
        <h2>C3 – Brændstof- og energirelaterede aktiviteter</h2>
        <p>
          Beregningen estimerer upstream emissioner fra indkøbt energi og brændstoffer ved at
          kombinere forbrugstal, emissionsfaktorer og nettab. Vedvarende andele reducerer el-delen
          proportionalt.
        </p>
      </header>
      <section style={{ display: 'grid', gap: '1rem' }}>
        {FIELD_CONFIG.map((field) => {
          const value = current[field.key]
          return (
            <label key={field.key} style={{ display: 'grid', gap: '0.5rem' }}>
              <span style={{ fontWeight: 600 }}>
                {field.label}
                {field.unit ? ` (${field.unit})` : ''}
              </span>
              <span style={{ color: '#555', fontSize: '0.9rem' }}>{field.description}</span>
              <input
                type="number"
                step="any"
                value={value ?? ''}
                placeholder={field.placeholder}
                onChange={handleFieldChange(field.key)}
                style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #ccc' }}
                min={field.min}
                max={field.max}
              />
            </label>
          )
        })}
      </section>
      <section
        style={{ display: 'grid', gap: '0.75rem', background: '#f1f5f4', padding: '1rem', borderRadius: '0.75rem' }}
      >
        <h3 style={{ margin: 0 }}>Estimat</h3>
        {hasData ? (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
              {preview.value} {preview.unit}
            </p>
            <div>
              <strong>Antagelser</strong>
              <ul>
                {preview.assumptions.map((assumption, index) => (
                  <li key={index}>{assumption}</li>
                ))}
              </ul>
            </div>
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
            <details>
              <summary>Teknisk trace</summary>
              <ul>
                {preview.trace.map((line, index) => (
                  <li key={index} style={{ fontFamily: 'monospace' }}>
                    {line}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        ) : (
          <p style={{ margin: 0 }}>
            Udfyld felterne for at se upstream emissioner for brændstof- og energirelaterede
            aktiviteter.
          </p>
        )}
      </section>
    </form>
  )
}
