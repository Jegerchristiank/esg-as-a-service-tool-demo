/**
 * Wizardtrin for modul C6 – udlejede aktiver (upstream).
 */
'use client'

import { useMemo } from 'react'
import type { ChangeEvent } from 'react'
import type { C6Input, ModuleInput, ModuleResult } from '@org/shared'
import { runC6 } from '@org/shared'
import type { WizardStepProps } from './StepTemplate'

type FieldKey = keyof C6Input

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
    key: 'leasedFloorAreaSqm',
    label: 'Lejet areal',
    description: 'Samlet kvadratmeter i de upstream-lejemål, hvor energiforbruget skal fordeles.',
    unit: 'm²',
    placeholder: 'fx 2 800',
    min: 0
  },
  {
    key: 'electricityIntensityKwhPerSqm',
    label: 'El-intensitet',
    description: 'Årligt elforbrug pr. m² baseret på regninger eller benchmarks.',
    unit: 'kWh/m²',
    placeholder: 'fx 85',
    min: 0
  },
  {
    key: 'heatIntensityKwhPerSqm',
    label: 'Varme-intensitet',
    description: 'Årligt varmeforbrug pr. m² (fjernvarme, gas, olie).',
    unit: 'kWh/m²',
    placeholder: 'fx 60',
    min: 0
  },
  {
    key: 'occupancySharePercent',
    label: 'Lejerandel',
    description: 'Hvor stor en andel af bygningen disponerer virksomheden over. Mangler data, antages 100%.',
    unit: '%',
    placeholder: '0-100',
    min: 0,
    max: 100
  },
  {
    key: 'sharedServicesAllocationPercent',
    label: 'Fradrag for fælles services',
    description: 'Andel af forbruget der dækkes af udlejer til fællesfaciliteter (maks 50%).',
    unit: '%',
    placeholder: '0-50',
    min: 0,
    max: 50
  },
  {
    key: 'electricityEmissionFactorKgPerKwh',
    label: 'El – emissionsfaktor',
    description: 'Kg CO2e pr. kWh for det lokale el-mix eller markedsfaktor.',
    unit: 'kg CO2e/kWh',
    placeholder: 'fx 0.233',
    min: 0
  },
  {
    key: 'heatEmissionFactorKgPerKwh',
    label: 'Varme – emissionsfaktor',
    description: 'Kg CO2e pr. kWh varme leveret via fjernvarme eller brændsel.',
    unit: 'kg CO2e/kWh',
    placeholder: 'fx 0.08',
    min: 0
  },
  {
    key: 'renewableElectricitySharePercent',
    label: 'Dokumenteret vedvarende el',
    description: 'Andel af elforbruget der er dækket af garantier eller grøn aftale. Afgrænset til 100%.',
    unit: '%',
    placeholder: '0-100',
    min: 0,
    max: 100
  },
  {
    key: 'renewableHeatSharePercent',
    label: 'Dokumenteret vedvarende varme',
    description: 'Andel af varmeforbruget der er dækket af certificeret grøn varme. Afgrænset til 100%.',
    unit: '%',
    placeholder: '0-100',
    min: 0,
    max: 100
  }
]

const EMPTY_C6: C6Input = {
  leasedFloorAreaSqm: null,
  electricityIntensityKwhPerSqm: null,
  heatIntensityKwhPerSqm: null,
  occupancySharePercent: null,
  sharedServicesAllocationPercent: null,
  electricityEmissionFactorKgPerKwh: null,
  heatEmissionFactorKgPerKwh: null,
  renewableElectricitySharePercent: null,
  renewableHeatSharePercent: null
}

export function C6Step({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.C6 as C6Input | undefined) ?? EMPTY_C6

  const preview = useMemo<ModuleResult>(() => {
    return runC6({ C6: current } as ModuleInput)
  }, [current])

  const handleFieldChange = (field: FieldKey) => (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value.replace(',', '.')
    const parsed = rawValue === '' ? null : Number.parseFloat(rawValue)
    const next: C6Input = {
      ...current,
      [field]: Number.isFinite(parsed) ? parsed : null
    }
    onChange('C6', next)
  }

  const hasData = Object.values(current).some((value) => value != null)

  return (
    <form style={{ display: 'grid', gap: '1.5rem', maxWidth: '40rem' }}>
      <header style={{ display: 'grid', gap: '0.5rem' }}>
        <h2>C6 – Udlejede aktiver (upstream)</h2>
        <p>
          Estimer energiforbruget og emissionerne fra upstream-lejemål baseret på areal, intensiteter og dokumenterede
          reduktioner. Brug feltet til fælles services til at fradrage energi, som udlejer selv afholder.
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
            Udfyld felterne for at beregne emissioner fra upstream-lejemål og dokumenterede reduktioner.
          </p>
        )}
      </section>
    </form>
  )
}
