/**
 * Wizardtrin for modul C9 – forarbejdning af solgte produkter.
 */
'use client'

import { useMemo } from 'react'
import type { ChangeEvent } from 'react'
import type { C9Input, ModuleInput, ModuleResult } from '@org/shared'
import { runC9 } from '@org/shared'
import type { WizardStepProps } from './StepTemplate'

type FieldKey = keyof C9Input

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
    key: 'processedOutputTonnes',
    label: 'Solgte produkter til forarbejdning',
    description: 'Den samlede tonnage af solgte produkter, som kunder videreforarbejder.',
    unit: 'ton',
    placeholder: 'fx 2 400',
    min: 0
  },
  {
    key: 'processingEnergyIntensityKwhPerTonne',
    label: 'Energiforbrug pr. ton',
    description: 'Skøn eller dokumentation for energiforbrug pr. ton i kundernes forarbejdning.',
    unit: 'kWh/ton',
    placeholder: 'fx 420',
    min: 0
  },
  {
    key: 'processingEmissionFactorKgPerKwh',
    label: 'Emissionsfaktor for energi',
    description: 'Kg CO2e pr. kWh for den energimix kunderne anvender.',
    unit: 'kg CO2e/kWh',
    placeholder: 'fx 0.18',
    min: 0
  },
  {
    key: 'processEfficiencyImprovementPercent',
    label: 'Proceseffektivisering',
    description: 'Dokumenteret forbedring i energiintensitet fra kundernes effektiviseringer (maks 60%).',
    unit: '%',
    placeholder: '0-60',
    min: 0,
    max: 60
  },
  {
    key: 'secondaryMaterialSharePercent',
    label: 'Sekundært materiale',
    description: 'Andel af processen der anvender genanvendte/sekundære materialer (maks 80%).',
    unit: '%',
    placeholder: '0-80',
    min: 0,
    max: 80
  },
  {
    key: 'renewableEnergySharePercent',
    label: 'Vedvarende energi i processen',
    description: 'Andel af energiforbruget der er dokumenteret vedvarende (maks 100%).',
    unit: '%',
    placeholder: '0-100',
    min: 0,
    max: 100
  }
]

const EMPTY_C9: C9Input = {
  processedOutputTonnes: null,
  processingEnergyIntensityKwhPerTonne: null,
  processingEmissionFactorKgPerKwh: null,
  processEfficiencyImprovementPercent: null,
  secondaryMaterialSharePercent: null,
  renewableEnergySharePercent: null
}

export function C9Step({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.C9 as C9Input | undefined) ?? EMPTY_C9

  const preview = useMemo<ModuleResult>(() => {
    return runC9({ C9: current } as ModuleInput)
  }, [current])

  const handleFieldChange = (field: FieldKey) => (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value.replace(',', '.')
    const parsed = rawValue === '' ? null : Number.parseFloat(rawValue)
    const next: C9Input = {
      ...current,
      [field]: Number.isFinite(parsed) ? parsed : null
    }
    onChange('C9', next)
  }

  const hasData = Object.values(current).some((value) => value != null)

  return (
    <form style={{ display: 'grid', gap: '1.5rem', maxWidth: '40rem' }}>
      <header style={{ display: 'grid', gap: '0.5rem' }}>
        <h2>C9 – Forarbejdning af solgte produkter</h2>
        <p>
          Estimér emissionerne fra kunders videreforarbejdning af jeres produkter. Angiv tonnage, energiintensitet og
          emissionsfaktorer samt dokumenteret effektivisering, sekundære materialer og vedvarende energi for at se den
          samlede påvirkning.
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
          <p style={{ margin: 0 }}>Indtast værdier for at se estimatet.</p>
        )}
      </section>
    </form>
  )
}
