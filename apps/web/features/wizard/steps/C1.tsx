/**
 * Wizardtrin for modul C1 – medarbejderpendling.
 */
'use client'

import { useMemo } from 'react'
import type { ChangeEvent } from 'react'
import type { C1Input, ModuleInput, ModuleResult } from '@org/shared'
import { runC1 } from '@org/shared'
import type { WizardStepProps } from './StepTemplate'

type FieldKey = keyof C1Input

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
    key: 'employeesCovered',
    label: 'Antal ansatte omfattet',
    description: 'Angiv antal medarbejdere eller FTE, der pendler regelmæssigt.',
    unit: 'personer',
    min: 0
  },
  {
    key: 'averageCommuteDistanceKm',
    label: 'Gns. tur-retur distance',
    description: 'Samlet distance i km for en typisk pendlerdag (tur-retur).',
    unit: 'km',
    placeholder: 'fx 30',
    min: 0
  },
  {
    key: 'commutingDaysPerWeek',
    label: 'Pendlerdage pr. uge',
    description: 'Gennemsnitligt antal dage, hvor medarbejderne møder fysisk ind.',
    unit: 'dage',
    placeholder: '0-7',
    min: 0,
    max: 7
  },
  {
    key: 'weeksPerYear',
    label: 'Arbejdsuger pr. år',
    description: 'Fx 46 uger med fratrukket ferie og helligdage.',
    unit: 'uger',
    placeholder: '0-52',
    min: 0,
    max: 52
  },
  {
    key: 'remoteWorkSharePercent',
    label: 'Andel fjernarbejde',
    description: 'Reducerer pendlingen lineært i beregningen.',
    unit: '%',
    placeholder: '0-100',
    min: 0,
    max: 100
  },
  {
    key: 'emissionFactorKgPerKm',
    label: 'Emissionsfaktor',
    description: 'Kg CO2e per kørt km for den valgte transportprofil.',
    unit: 'kg CO2e/km',
    placeholder: 'fx 0.142',
    min: 0
  }
]

const EMPTY_C1: C1Input = {
  employeesCovered: null,
  averageCommuteDistanceKm: null,
  commutingDaysPerWeek: null,
  weeksPerYear: null,
  remoteWorkSharePercent: null,
  emissionFactorKgPerKm: null
}

export function C1Step({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.C1 as C1Input | undefined) ?? EMPTY_C1

  const preview = useMemo<ModuleResult>(() => {
    return runC1({ C1: current } as ModuleInput)
  }, [current])

  const handleFieldChange = (field: FieldKey) => (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value.replace(',', '.')
    const parsed = rawValue === '' ? null : Number.parseFloat(rawValue)
    const next: C1Input = {
      ...current,
      [field]: Number.isFinite(parsed) ? parsed : null
    }
    onChange('C1', next)
  }

  const hasData =
    current.employeesCovered != null ||
    current.averageCommuteDistanceKm != null ||
    current.commutingDaysPerWeek != null ||
    current.weeksPerYear != null ||
    current.remoteWorkSharePercent != null ||
    current.emissionFactorKgPerKm != null

  return (
    <form style={{ display: 'grid', gap: '1.5rem', maxWidth: '40rem' }}>
      <header style={{ display: 'grid', gap: '0.5rem' }}>
        <h2>C1 – Medarbejderpendling</h2>
        <p>
          Estimatet dækker emissioner fra daglig pendling baseret på antal medarbejdere,
          afstand, arbejdsuger og andelen af fjernarbejde.
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
          <p style={{ margin: 0 }}>Udfyld felterne for at se beregnet pendlingsemission.</p>
        )}
      </section>
    </form>
  )
}
