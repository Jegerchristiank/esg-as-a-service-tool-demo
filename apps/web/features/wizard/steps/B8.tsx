/**
 * Wizardtrin for modul B8 – egenproduceret vedvarende el.
 */
'use client'

import { useMemo } from 'react'
import type { ChangeEvent } from 'react'
import type { B8Input, ModuleInput, ModuleResult } from '@org/shared'
import { runB8 } from '@org/shared'
import type { WizardStepProps } from './StepTemplate'

type FieldKey = keyof B8Input

type FieldConfig = {
  key: FieldKey
  label: string
  description: string
  unit: string
  placeholder?: string
}

const FIELD_CONFIG: FieldConfig[] = [
  {
    key: 'onSiteRenewableKwh',
    label: 'Egenproduceret vedvarende el',
    description: 'Total egenproduktion af vedvarende elektricitet i kWh.',
    unit: 'kWh',
    placeholder: '12000'
  },
  {
    key: 'exportedRenewableKwh',
    label: 'Eksporteret vedvarende el',
    description: 'Andel af egenproduktionen der sælges eller leveres til nettet.',
    unit: 'kWh',
    placeholder: '0'
  },
  {
    key: 'residualEmissionFactorKgPerKwh',
    label: 'Residual emissionsfaktor',
    description: 'Kg CO2e pr. kWh for den residuale elmix egenproduktionen afløser.',
    unit: 'kg CO2e/kWh',
    placeholder: '0.233'
  },
  {
    key: 'documentationQualityPercent',
    label: 'Dokumentationskvalitet',
    description: 'Forventet andel af dokumentationen der bliver godkendt ved revision.',
    unit: '%',
    placeholder: '0-100'
  }
]

const EMPTY_B8: B8Input = {
  onSiteRenewableKwh: null,
  exportedRenewableKwh: null,
  residualEmissionFactorKgPerKwh: null,
  documentationQualityPercent: null
}

export function B8Step({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state['B8'] as B8Input | undefined) ?? EMPTY_B8

  const preview = useMemo<ModuleResult>(() => {
    return runB8({ B8: current } as ModuleInput)
  }, [current])

  const handleFieldChange = (field: FieldKey) => (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value.replace(',', '.')
    const parsed = rawValue === '' ? null : Number.parseFloat(rawValue)
    const next: B8Input = {
      ...current,
      [field]: Number.isFinite(parsed) ? parsed : null
    }
    onChange('B8', next)
  }

  const hasData =
    preview.trace.some((line) => line.includes('netSelfConsumptionKwh')) &&
    (current.onSiteRenewableKwh != null ||
      current.exportedRenewableKwh != null ||
      current.residualEmissionFactorKgPerKwh != null ||
      current.documentationQualityPercent != null)

  const valueColour = preview.value < 0 ? '#047857' : '#111827'

  return (
    <form style={{ display: 'grid', gap: '1.5rem', maxWidth: '40rem' }}>
      <header style={{ display: 'grid', gap: '0.5rem' }}>
        <h2>B8 – Egenproduceret vedvarende el</h2>
        <p>
          Registrer egenproduceret vedvarende elektricitet og eventuel eksport. Modulet estimerer den
          revisionsrobuste reduktion, når egenproduktionen afløser residual el.
        </p>
      </header>
      <section style={{ display: 'grid', gap: '1rem' }}>
        {FIELD_CONFIG.map((field) => {
          const value = current[field.key]
          const commonProps =
            field.key === 'documentationQualityPercent'
              ? { min: 0, max: 100 }
              : { min: 0 }
          return (
            <label key={field.key} style={{ display: 'grid', gap: '0.5rem' }}>
              <span style={{ fontWeight: 600 }}>
                {field.label} ({field.unit})
              </span>
              <span style={{ color: '#555', fontSize: '0.9rem' }}>{field.description}</span>
              <input
                type="number"
                step="any"
                value={value ?? ''}
                placeholder={field.placeholder}
                onChange={handleFieldChange(field.key)}
                style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #ccc' }}
                {...commonProps}
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
            <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: valueColour }}>
              {preview.value} {preview.unit}
            </p>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#374151' }}>
              Negative tal angiver en reduktion i Scope 2-emissioner.
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
          <p style={{ margin: 0 }}>Udfyld felterne for at se effekten af egenproduceret el.</p>
        )}
      </section>
    </form>
  )
}
