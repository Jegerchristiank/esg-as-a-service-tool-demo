/**
 * Wizardtrin for modul C7 – downstream transport og distribution.
 */
'use client'

import { useMemo } from 'react'
import type { ChangeEvent } from 'react'
import type { C7Input, ModuleInput, ModuleResult } from '@org/shared'
import { runC7 } from '@org/shared'
import type { WizardStepProps } from './StepTemplate'

type FieldKey = keyof C7Input

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
    label: 'Vejtransport – ton-kilometer',
    description: 'Samlet mængde gods leveret til kunder via vejtransport.',
    unit: 'ton-km',
    placeholder: 'fx 12 500',
    min: 0
  },
  {
    key: 'roadEmissionFactorKgPerTonneKm',
    label: 'Vejtransport – emissionsfaktor',
    description: 'Kg CO2e pr. ton-km for køretøjer anvendt i distributionen.',
    unit: 'kg CO2e/ton-km',
    placeholder: 'fx 0.12',
    min: 0
  },
  {
    key: 'railTonnesKm',
    label: 'Banetransport – ton-kilometer',
    description: 'Tonnage leveret med tog til downstream kunder.',
    unit: 'ton-km',
    placeholder: 'fx 4 200',
    min: 0
  },
  {
    key: 'railEmissionFactorKgPerTonneKm',
    label: 'Banetransport – emissionsfaktor',
    description: 'Kg CO2e pr. ton-km for raildistribution.',
    unit: 'kg CO2e/ton-km',
    placeholder: 'fx 0.03',
    min: 0
  },
  {
    key: 'seaTonnesKm',
    label: 'Søtransport – ton-kilometer',
    description: 'Gods leveret via skib til downstream kunder.',
    unit: 'ton-km',
    placeholder: 'fx 8 000',
    min: 0
  },
  {
    key: 'seaEmissionFactorKgPerTonneKm',
    label: 'Søtransport – emissionsfaktor',
    description: 'Kg CO2e pr. ton-km for søtransporten.',
    unit: 'kg CO2e/ton-km',
    placeholder: 'fx 0.015',
    min: 0
  },
  {
    key: 'airTonnesKm',
    label: 'Luftfragt – ton-kilometer',
    description: 'Tonnage distribueret med fly til kunder.',
    unit: 'ton-km',
    placeholder: 'fx 350',
    min: 0
  },
  {
    key: 'airEmissionFactorKgPerTonneKm',
    label: 'Luftfragt – emissionsfaktor',
    description: 'Kg CO2e pr. ton-km for luftfragt.',
    unit: 'kg CO2e/ton-km',
    placeholder: 'fx 0.5',
    min: 0
  },
  {
    key: 'warehousingEnergyKwh',
    label: 'Lagre – energiforbrug',
    description: 'Årligt energiforbrug i downstream-lagre og distributionscentre.',
    unit: 'kWh',
    placeholder: 'fx 180 000',
    min: 0
  },
  {
    key: 'warehousingEmissionFactorKgPerKwh',
    label: 'Lagre – emissionsfaktor',
    description: 'Kg CO2e pr. kWh for energikilden i lagrene.',
    unit: 'kg CO2e/kWh',
    placeholder: 'fx 0.07',
    min: 0
  },
  {
    key: 'lowEmissionVehicleSharePercent',
    label: 'Lavemissionskøretøjer',
    description: 'Andel af vejtransporten, der udføres med lavemissionskøretøjer (maks 100%).',
    unit: '%',
    placeholder: '0-100',
    min: 0,
    max: 100
  },
  {
    key: 'renewableWarehousingSharePercent',
    label: 'Vedvarende energi i lagre',
    description: 'Andel af lagerenergi dækket af dokumenteret vedvarende energi (maks 100%).',
    unit: '%',
    placeholder: '0-100',
    min: 0,
    max: 100
  }
]

const EMPTY_C7: C7Input = {
  roadTonnesKm: null,
  roadEmissionFactorKgPerTonneKm: null,
  railTonnesKm: null,
  railEmissionFactorKgPerTonneKm: null,
  seaTonnesKm: null,
  seaEmissionFactorKgPerTonneKm: null,
  airTonnesKm: null,
  airEmissionFactorKgPerTonneKm: null,
  warehousingEnergyKwh: null,
  warehousingEmissionFactorKgPerKwh: null,
  lowEmissionVehicleSharePercent: null,
  renewableWarehousingSharePercent: null
}

export function C7Step({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.C7 as C7Input | undefined) ?? EMPTY_C7

  const preview = useMemo<ModuleResult>(() => {
    return runC7({ C7: current } as ModuleInput)
  }, [current])

  const handleFieldChange = (field: FieldKey) => (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value.replace(',', '.')
    const parsed = rawValue === '' ? null : Number.parseFloat(rawValue)
    const next: C7Input = {
      ...current,
      [field]: Number.isFinite(parsed) ? parsed : null
    }
    onChange('C7', next)
  }

  const hasData = Object.values(current).some((value) => value != null)

  return (
    <form style={{ display: 'grid', gap: '1.5rem', maxWidth: '40rem' }}>
      <header style={{ display: 'grid', gap: '0.5rem' }}>
        <h2>C7 – Transport og distribution (downstream)</h2>
        <p>
          Indtast transportmængder, emissionsfaktorer og energiforbrug i downstream-lagre for at beregne emissionerne fra
          levering til kunder. Dokumentér eventuelle lavemissionskøretøjer og vedvarende energi for at reducere resultatet.
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
          <p style={{ margin: 0, color: '#555' }}>
            Udfyld felterne ovenfor for at se et estimat for downstream transport og lagerenergi.
          </p>
        )}
      </section>
    </form>
  )
}
