/**
 * Wizardtrin for modul C2 – forretningsrejser.
 */
'use client'

import { useMemo } from 'react'
import type { ChangeEvent } from 'react'
import type { C2Input, ModuleInput, ModuleResult } from '@org/shared'
import { runC2 } from '@org/shared'
import type { WizardStepProps } from './StepTemplate'

type FieldKey = keyof C2Input

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
    key: 'airTravelDistanceKm',
    label: 'Flyrejser – samlet distance',
    description:
      'Summer alle kilometer, der er fløjet i løbet af året. Brug tur-retur afstanden.',
    unit: 'km',
    placeholder: 'fx 12 500',
    min: 0
  },
  {
    key: 'airEmissionFactorKgPerKm',
    label: 'Flyrejser – emissionsfaktor',
    description: 'Kg CO2e pr. fløjet km. Hent fra jeres rejsebureau eller officielle faktorer.',
    unit: 'kg CO2e/km',
    placeholder: 'fx 0.158',
    min: 0
  },
  {
    key: 'railTravelDistanceKm',
    label: 'Togrejser – samlet distance',
    description: 'Indtast samlet antal kilometer rejst med tog.',
    unit: 'km',
    placeholder: 'fx 3 000',
    min: 0
  },
  {
    key: 'railEmissionFactorKgPerKm',
    label: 'Togrejser – emissionsfaktor',
    description: 'Kg CO2e pr. km for den anvendte togtype.',
    unit: 'kg CO2e/km',
    placeholder: 'fx 0.014',
    min: 0
  },
  {
    key: 'roadTravelDistanceKm',
    label: 'Vejtransport – samlet distance',
    description: 'Kilometer kørt i bil, taxa eller bus i forbindelse med rejser.',
    unit: 'km',
    placeholder: 'fx 8 000',
    min: 0
  },
  {
    key: 'roadEmissionFactorKgPerKm',
    label: 'Vejtransport – emissionsfaktor',
    description: 'Kg CO2e pr. km for den valgte vejtransportprofil.',
    unit: 'kg CO2e/km',
    placeholder: 'fx 0.192',
    min: 0
  },
  {
    key: 'hotelNights',
    label: 'Hotelovernatninger',
    description: 'Samlet antal nætter på hotel relateret til forretningsrejser.',
    unit: 'nætter',
    placeholder: 'fx 220',
    min: 0
  },
  {
    key: 'hotelEmissionFactorKgPerNight',
    label: 'Hotel – emissionsfaktor',
    description: 'Kg CO2e pr. nat. Efterlades feltet tomt anvendes standardfaktoren 15.',
    unit: 'kg CO2e/nat',
    placeholder: 'fx 12',
    min: 0
  },
  {
    key: 'virtualMeetingSharePercent',
    label: 'Andel virtuelle møder',
    description: 'Reducerer transportemissioner lineært. Angiv hvor meget rejseaktivitet der erstattes.',
    unit: '%',
    placeholder: '0-100',
    min: 0,
    max: 100
  }
]

const EMPTY_C2: C2Input = {
  airTravelDistanceKm: null,
  airEmissionFactorKgPerKm: null,
  railTravelDistanceKm: null,
  railEmissionFactorKgPerKm: null,
  roadTravelDistanceKm: null,
  roadEmissionFactorKgPerKm: null,
  hotelNights: null,
  hotelEmissionFactorKgPerNight: null,
  virtualMeetingSharePercent: null
}

export function C2Step({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.C2 as C2Input | undefined) ?? EMPTY_C2

  const preview = useMemo<ModuleResult>(() => {
    return runC2({ C2: current } as ModuleInput)
  }, [current])

  const handleFieldChange = (field: FieldKey) => (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value.replace(',', '.')
    const parsed = rawValue === '' ? null : Number.parseFloat(rawValue)
    const next: C2Input = {
      ...current,
      [field]: Number.isFinite(parsed) ? parsed : null
    }
    onChange('C2', next)
  }

  const hasData =
    current.airTravelDistanceKm != null ||
    current.airEmissionFactorKgPerKm != null ||
    current.railTravelDistanceKm != null ||
    current.railEmissionFactorKgPerKm != null ||
    current.roadTravelDistanceKm != null ||
    current.roadEmissionFactorKgPerKm != null ||
    current.hotelNights != null ||
    current.hotelEmissionFactorKgPerNight != null ||
    current.virtualMeetingSharePercent != null

  return (
    <form style={{ display: 'grid', gap: '1.5rem', maxWidth: '40rem' }}>
      <header style={{ display: 'grid', gap: '0.5rem' }}>
        <h2>C2 – Forretningsrejser</h2>
        <p>
          Beregningen kombinerer transport- og overnatningsdata for at estimere emissioner fra
          forretningsrejser. Andelen af virtuelle møder reducerer transportdelen direkte.
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
          <p style={{ margin: 0 }}>Udfyld felterne for at se emissioner fra forretningsrejser.</p>
        )}
      </section>
    </form>
  )
}
