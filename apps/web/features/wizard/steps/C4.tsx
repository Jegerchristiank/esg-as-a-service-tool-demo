/**
 * Wizardtrin for modul C4 – transport og distribution (upstream).
 */
'use client'

import { useMemo } from 'react'
import type { ChangeEvent } from 'react'
import type { C4Input, ModuleInput, ModuleResult } from '@org/shared'
import { runC4 } from '@org/shared'
import type { WizardStepProps } from './StepTemplate'

type FieldKey = keyof C4Input

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
    key: 'roadTonnesKm',
    label: 'Vejtransport (ton-kilometer)',
    description: 'Angiv ton-kilometer for upstream transporter via vej.',
    unit: 't·km',
    placeholder: 'fx 5 000',
    min: 0
  },
  {
    key: 'roadEmissionFactorKgPerTonneKm',
    label: 'Emissionsfaktor for vejtransport',
    description: 'Kg CO2e pr. ton-kilometer for vejtransport.',
    unit: 'kg CO2e/(t·km)',
    placeholder: 'fx 0.12',
    min: 0
  },
  {
    key: 'railTonnesKm',
    label: 'Banetransport (ton-kilometer)',
    description: 'Ton-kilometer for upstream transporter via tog.',
    unit: 't·km',
    placeholder: 'fx 2 000',
    min: 0
  },
  {
    key: 'railEmissionFactorKgPerTonneKm',
    label: 'Emissionsfaktor for banetransport',
    description: 'Kg CO2e pr. ton-kilometer for togtransport.',
    unit: 'kg CO2e/(t·km)',
    placeholder: 'fx 0.03',
    min: 0
  },
  {
    key: 'seaTonnesKm',
    label: 'Søtransport (ton-kilometer)',
    description: 'Ton-kilometer for upstream transporter via søfart.',
    unit: 't·km',
    placeholder: 'fx 8 000',
    min: 0
  },
  {
    key: 'seaEmissionFactorKgPerTonneKm',
    label: 'Emissionsfaktor for søtransport',
    description: 'Kg CO2e pr. ton-kilometer for søtransport.',
    unit: 'kg CO2e/(t·km)',
    placeholder: 'fx 0.015',
    min: 0
  },
  {
    key: 'airTonnesKm',
    label: 'Lufttransport (ton-kilometer)',
    description: 'Ton-kilometer for upstream transporter via luftfragt.',
    unit: 't·km',
    placeholder: 'fx 500',
    min: 0
  },
  {
    key: 'airEmissionFactorKgPerTonneKm',
    label: 'Emissionsfaktor for lufttransport',
    description: 'Kg CO2e pr. ton-kilometer for luftfragt.',
    unit: 'kg CO2e/(t·km)',
    placeholder: 'fx 0.55',
    min: 0
  },
  {
    key: 'consolidationEfficiencyPercent',
    label: 'Effektivisering via konsolidering',
    description: 'Andel af transporter der reduceres via ruteoptimering og bedre lastudnyttelse. Afgrænset til 50%.',
    unit: '%',
    placeholder: '0-50',
    min: 0,
    max: 50
  },
  {
    key: 'lowCarbonSharePercent',
    label: 'Andel lavemissionsløsninger',
    description: 'Andel af transporter udført med dokumenteret lavemissionsløsninger (fx biobrændstoffer, el).',
    unit: '%',
    placeholder: '0-100',
    min: 0,
    max: 100
  }
]

const EMPTY_C4: C4Input = {
  roadTonnesKm: null,
  roadEmissionFactorKgPerTonneKm: null,
  railTonnesKm: null,
  railEmissionFactorKgPerTonneKm: null,
  seaTonnesKm: null,
  seaEmissionFactorKgPerTonneKm: null,
  airTonnesKm: null,
  airEmissionFactorKgPerTonneKm: null,
  consolidationEfficiencyPercent: null,
  lowCarbonSharePercent: null
}

export function C4Step({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.C4 as C4Input | undefined) ?? EMPTY_C4

  const preview = useMemo<ModuleResult>(() => {
    return runC4({ C4: current } as ModuleInput)
  }, [current])

  const handleFieldChange = (field: FieldKey) => (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value.replace(',', '.')
    const parsed = rawValue === '' ? null : Number.parseFloat(rawValue)
    const next: C4Input = {
      ...current,
      [field]: Number.isFinite(parsed) ? parsed : null
    }
    onChange('C4', next)
  }

  const hasData = Object.values(current).some((value) => value != null)

  return (
    <form style={{ display: 'grid', gap: '1.5rem', maxWidth: '40rem' }}>
      <header style={{ display: 'grid', gap: '0.5rem' }}>
        <h2>C4 – Transport og distribution (upstream)</h2>
        <p>
          Beregningen kombinerer ton-kilometer og emissionsfaktorer for forskellige transportmidler og
          reducerer resultatet ud fra dokumenteret konsolidering og lavemissionsløsninger.
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
            Udfyld felterne for at se upstream emissioner fra transport og distribution.
          </p>
        )}
      </section>
    </form>
  )
}
