/**
 * Wizardtrin for modul C8 – udlejede aktiver (downstream).
 */
'use client'

import { useMemo } from 'react'
import type { ChangeEvent } from 'react'
import type { C8Input, ModuleInput, ModuleResult } from '@org/shared'
import { runC8 } from '@org/shared'
import type { WizardStepProps } from './StepTemplate'

type FieldKey = keyof C8Input

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
    label: 'Udlejet areal under ansvar',
    description: 'Samlet m² hvor virksomheden fortsat leverer energi eller har emissionsansvar.',
    unit: 'm²',
    placeholder: 'fx 3 200',
    min: 0
  },
  {
    key: 'electricityIntensityKwhPerSqm',
    label: 'El-intensitet',
    description: 'Årligt elforbrug pr. m² baseret på afregninger eller målinger.',
    unit: 'kWh/m²',
    placeholder: 'fx 75',
    min: 0
  },
  {
    key: 'heatIntensityKwhPerSqm',
    label: 'Varme-intensitet',
    description: 'Årligt varmeforbrug pr. m² inklusive fjernvarme eller brændsler.',
    unit: 'kWh/m²',
    placeholder: 'fx 55',
    min: 0
  },
  {
    key: 'occupancySharePercent',
    label: 'Udnyttelsesgrad',
    description: 'Hvor stor en del af året arealet er i brug. Mangler data antages 100%.',
    unit: '%',
    placeholder: '0-100',
    min: 0,
    max: 100
  },
  {
    key: 'landlordEnergySharePercent',
    label: 'Udlejeransvar for energi',
    description: 'Andel af energiforbruget der fortsat afholdes af virksomheden som udlejer.',
    unit: '%',
    placeholder: '0-100',
    min: 0,
    max: 100
  },
  {
    key: 'energyEfficiencyImprovementPercent',
    label: 'Energieffektivisering',
    description: 'Dokumenteret forbedring i energiintensitet for lejemålene (maks 70%).',
    unit: '%',
    placeholder: '0-70',
    min: 0,
    max: 70
  },
  {
    key: 'electricityEmissionFactorKgPerKwh',
    label: 'El – emissionsfaktor',
    description: 'Kg CO2e pr. kWh for el leveret til de udlejede enheder.',
    unit: 'kg CO2e/kWh',
    placeholder: 'fx 0.18',
    min: 0
  },
  {
    key: 'heatEmissionFactorKgPerKwh',
    label: 'Varme – emissionsfaktor',
    description: 'Kg CO2e pr. kWh for varme leveret til de udlejede enheder.',
    unit: 'kg CO2e/kWh',
    placeholder: 'fx 0.07',
    min: 0
  },
  {
    key: 'renewableElectricitySharePercent',
    label: 'Vedvarende el',
    description: 'Andel af elforbruget der dækkes af dokumenteret vedvarende energi (maks 100%).',
    unit: '%',
    placeholder: '0-100',
    min: 0,
    max: 100
  },
  {
    key: 'renewableHeatSharePercent',
    label: 'Vedvarende varme',
    description: 'Andel af varmeforbruget der dækkes af dokumenteret vedvarende energi (maks 100%).',
    unit: '%',
    placeholder: '0-100',
    min: 0,
    max: 100
  }
]

const EMPTY_C8: C8Input = {
  leasedFloorAreaSqm: null,
  electricityIntensityKwhPerSqm: null,
  heatIntensityKwhPerSqm: null,
  occupancySharePercent: null,
  landlordEnergySharePercent: null,
  energyEfficiencyImprovementPercent: null,
  electricityEmissionFactorKgPerKwh: null,
  heatEmissionFactorKgPerKwh: null,
  renewableElectricitySharePercent: null,
  renewableHeatSharePercent: null
}

export function C8Step({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.C8 as C8Input | undefined) ?? EMPTY_C8

  const preview = useMemo<ModuleResult>(() => {
    return runC8({ C8: current } as ModuleInput)
  }, [current])

  const handleFieldChange = (field: FieldKey) => (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value.replace(',', '.')
    const parsed = rawValue === '' ? null : Number.parseFloat(rawValue)
    const next: C8Input = {
      ...current,
      [field]: Number.isFinite(parsed) ? parsed : null
    }
    onChange('C8', next)
  }

  const hasData = Object.values(current).some((value) => value != null)

  return (
    <form style={{ display: 'grid', gap: '1.5rem', maxWidth: '40rem' }}>
      <header style={{ display: 'grid', gap: '0.5rem' }}>
        <h2>C8 – Udlejede aktiver (downstream)</h2>
        <p>
          Kortlæg energiforbruget i aktiver som virksomheden udlejer, men stadig har ansvar for. Indtast areal,
          energiintensiteter, forbedringer og dokumenterede vedvarende andele for at få et præcist emissionsestimat.
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
