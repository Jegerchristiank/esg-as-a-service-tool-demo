/**
 * Wizardtrin for modul C5 – affald fra drift (upstream).
 */
'use client'

import { useMemo } from 'react'
import type { ChangeEvent } from 'react'
import type { C5Input, ModuleInput, ModuleResult } from '@org/shared'
import { runC5 } from '@org/shared'
import type { WizardStepProps } from './StepTemplate'

type FieldKey = keyof C5Input

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
    key: 'landfillWasteTonnes',
    label: 'Deponi (ton)',
    description: 'Mængde affald sendt til deponi angivet i ton.',
    unit: 't',
    placeholder: 'fx 120',
    min: 0
  },
  {
    key: 'landfillEmissionFactorKgPerTonne',
    label: 'Emissionsfaktor for deponi',
    description: 'Kg CO2e pr. ton affald der deponeres.',
    unit: 'kg CO2e/t',
    placeholder: 'fx 480',
    min: 0
  },
  {
    key: 'incinerationWasteTonnes',
    label: 'Forbrænding (ton)',
    description: 'Mængde affald sendt til energiforbrænding.',
    unit: 't',
    placeholder: 'fx 80',
    min: 0
  },
  {
    key: 'incinerationEmissionFactorKgPerTonne',
    label: 'Emissionsfaktor for forbrænding',
    description: 'Kg CO2e pr. ton affald der forbrændes.',
    unit: 'kg CO2e/t',
    placeholder: 'fx 320',
    min: 0
  },
  {
    key: 'recyclingWasteTonnes',
    label: 'Genanvendelse (ton)',
    description: 'Mængde affald sendt til genanvendelse eller materialegenbrug.',
    unit: 't',
    placeholder: 'fx 60',
    min: 0
  },
  {
    key: 'recyclingEmissionFactorKgPerTonne',
    label: 'Emissionsfaktor for genanvendelse',
    description: 'Kg CO2e pr. ton affald der genanvendes (inkl. transport).',
    unit: 'kg CO2e/t',
    placeholder: 'fx 50',
    min: 0
  },
  {
    key: 'compostingWasteTonnes',
    label: 'Kompostering/Biologisk behandling (ton)',
    description: 'Mængde organisk affald sendt til kompostering eller biogas.',
    unit: 't',
    placeholder: 'fx 40',
    min: 0
  },
  {
    key: 'compostingEmissionFactorKgPerTonne',
    label: 'Emissionsfaktor for kompostering',
    description: 'Kg CO2e pr. ton affald der komposteres eller bioforgasses.',
    unit: 'kg CO2e/t',
    placeholder: 'fx 100',
    min: 0
  },
  {
    key: 'recyclingRecoveryPercent',
    label: 'Dokumenteret genvindingsgrad',
    description: 'Andel af genanvendt materiale der reelt substituerer nyt materiale. Afgrænset til 90%.',
    unit: '%',
    placeholder: '0-90',
    min: 0,
    max: 90
  },
  {
    key: 'reuseSharePercent',
    label: 'Andel til genbrug/donation',
    description: 'Andel af affaldsmængder der afledes gennem direkte genbrug, donation eller reparation. Afgrænset til 60%.',
    unit: '%',
    placeholder: '0-60',
    min: 0,
    max: 60
  }
]

const EMPTY_C5: C5Input = {
  landfillWasteTonnes: null,
  landfillEmissionFactorKgPerTonne: null,
  incinerationWasteTonnes: null,
  incinerationEmissionFactorKgPerTonne: null,
  recyclingWasteTonnes: null,
  recyclingEmissionFactorKgPerTonne: null,
  compostingWasteTonnes: null,
  compostingEmissionFactorKgPerTonne: null,
  recyclingRecoveryPercent: null,
  reuseSharePercent: null
}

export function C5Step({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.C5 as C5Input | undefined) ?? EMPTY_C5

  const preview = useMemo<ModuleResult>(() => {
    return runC5({ C5: current } as ModuleInput)
  }, [current])

  const handleFieldChange = (field: FieldKey) => (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value.replace(',', '.')
    const parsed = rawValue === '' ? null : Number.parseFloat(rawValue)
    const next: C5Input = {
      ...current,
      [field]: Number.isFinite(parsed) ? parsed : null
    }
    onChange('C5', next)
  }

  const hasData = Object.values(current).some((value) => value != null)

  return (
    <form style={{ display: 'grid', gap: '1.5rem', maxWidth: '40rem' }}>
      <header style={{ display: 'grid', gap: '0.5rem' }}>
        <h2>C5 – Affald fra drift (upstream)</h2>
        <p>
          Indtast mængder og emissionsfaktorer for virksomhedens affaldsstrømme. Beregningen giver et estimat
          for upstream emissioner og reducerer resultatet for dokumenteret genanvendelse og genbrug.
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
            Udfyld felterne for at estimere emissioner fra affaldshåndtering og dokumenterede reduktioner.
          </p>
        )}
      </section>
    </form>
  )
}
