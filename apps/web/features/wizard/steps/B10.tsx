/**
 * Wizardtrin for modul B10 – virtuelle PPA-leverancer.
 */
'use client'

import { useMemo } from 'react'
import type { ChangeEvent } from 'react'
import type { B10Input, ModuleInput, ModuleResult } from '@org/shared'
import { runB10 } from '@org/shared'
import type { WizardStepProps } from './StepTemplate'

type FieldKey = keyof B10Input

type FieldConfig = {
  key: FieldKey
  label: string
  description: string
  unit: string
  placeholder?: string
}

const FIELD_CONFIG: FieldConfig[] = [
  {
    key: 'ppaSettledKwh',
    label: 'PPA-kontrakteret vedvarende el',
    description: 'Årlig mængde elektricitet der finansielt afregnes gennem den virtuelle PPA.',
    unit: 'kWh',
    placeholder: '10000'
  },
  {
    key: 'matchedConsumptionKwh',
    label: 'Matchet forbrug',
    description: 'Den del af virksomhedens elforbrug der forventes dækket af den virtuelle PPA.',
    unit: 'kWh',
    placeholder: '9500'
  },
  {
    key: 'marketSettlementPercent',
    label: 'Finansiel dækning',
    description: 'Forventet settlement-dækning efter basisrisiko for den virtuelle aftale.',
    unit: '%',
    placeholder: '85'
  },
  {
    key: 'residualEmissionFactorKgPerKwh',
    label: 'Residual emissionsfaktor',
    description: 'Kg CO2e pr. kWh for den residuale elmix der afløses.',
    unit: 'kg CO2e/kWh',
    placeholder: '0.233'
  },
  {
    key: 'documentationQualityPercent',
    label: 'Dokumentationskvalitet',
    description: 'Forventet andel af dokumentationen der godkendes ved revision.',
    unit: '%',
    placeholder: '0-100'
  }
]

const EMPTY_B10: B10Input = {
  ppaSettledKwh: null,
  matchedConsumptionKwh: null,
  marketSettlementPercent: null,
  residualEmissionFactorKgPerKwh: null,
  documentationQualityPercent: null
}

export function B10Step({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state['B10'] as B10Input | undefined) ?? EMPTY_B10

  const preview = useMemo<ModuleResult>(() => {
    return runB10({ B10: current } as ModuleInput)
  }, [current])

  const handleFieldChange = (field: FieldKey) => (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value.replace(',', '.')
    const parsed = rawValue === '' ? null : Number.parseFloat(rawValue)
    const next: B10Input = {
      ...current,
      [field]: Number.isFinite(parsed) ? parsed : null
    }
    onChange('B10', next)
  }

  const hasData =
    preview.trace.some((line) => line.includes('settlementAdjustedKwh')) &&
    (current.ppaSettledKwh != null ||
      current.matchedConsumptionKwh != null ||
      current.marketSettlementPercent != null ||
      current.residualEmissionFactorKgPerKwh != null ||
      current.documentationQualityPercent != null)

  const valueColour = preview.value < 0 ? '#047857' : '#111827'

  return (
    <form style={{ display: 'grid', gap: '1.5rem', maxWidth: '40rem' }}>
      <header style={{ display: 'grid', gap: '0.5rem' }}>
        <h2>B10 – Virtuel PPA for vedvarende el</h2>
        <p>
          Kortlæg finansielt afregnede PPA-aftaler, hvor basisrisiko reducerer den anvendelige mængde
          vedvarende el. Modulet estimerer revisionsrobuste reduktioner efter settlement og
          dokumentationskvalitet.
        </p>
      </header>
      <section style={{ display: 'grid', gap: '1rem' }}>
        {FIELD_CONFIG.map((field) => {
          const value = current[field.key]
          const commonProps =
            field.key === 'documentationQualityPercent'
              ? { min: 0, max: 100 }
              : field.key === 'marketSettlementPercent'
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
          <p style={{ margin: 0 }}>
            Udfyld felterne for at se, hvordan den virtuelle PPA påvirker Scope 2-regnskabet.
          </p>
        )}
      </section>
    </form>
  )
}
