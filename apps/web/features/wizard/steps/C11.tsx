/**
 * Wizardtrin for modul C11 – downstream leasede aktiver.
 */
'use client'

import { useMemo } from 'react'
import type { ChangeEvent } from 'react'
import type { C11Input, ModuleInput, ModuleResult } from '@org/shared'
import { c11EnergyConfigurations, runC11 } from '@org/shared'

import type { WizardStepProps } from './StepTemplate'

type C11Row = NonNullable<C11Input['leasedAssetLines']>[number]
type NumericFieldKey = 'floorAreaSqm' | 'energyConsumptionKwh' | 'emissionFactorKgPerKwh' | 'documentationQualityPercent'

type EnergyTypeOption = { value: C11Row['energyType']; label: string }

const ENERGY_TYPE_OPTIONS: EnergyTypeOption[] = [
  { value: 'electricity', label: 'Elektricitet' },
  { value: 'heat', label: 'Varme' }
]

const EMPTY_C11: C11Input = {
  leasedAssetLines: []
}

function createDefaultRow(energyType: C11Row['energyType'] = 'electricity'): C11Row {
  return {
    energyType,
    floorAreaSqm: null,
    energyConsumptionKwh: null,
    emissionFactorKgPerKwh: c11EnergyConfigurations[energyType].defaultEmissionFactorKgPerKwh,
    documentationQualityPercent: 100
  }
}

export function C11Step({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.C11 as C11Input | undefined) ?? EMPTY_C11
  const rows = current.leasedAssetLines ?? []

  const preview = useMemo<ModuleResult>(() => {
    return runC11({ C11: current } as ModuleInput)
  }, [current])

  const updateRows = (nextRows: C11Row[]) => {
    onChange('C11', { leasedAssetLines: nextRows })
  }

  const handleAddRow = () => {
    updateRows([...rows, createDefaultRow()])
  }

  const handleRemoveRow = (index: number) => () => {
    const next = rows.filter((_, rowIndex) => rowIndex !== index)
    updateRows(next)
  }

  const handleEnergyTypeChange = (index: number) => (event: ChangeEvent<HTMLSelectElement>) => {
    const nextType = event.target.value as C11Row['energyType']
    const nextRows = rows.map((row, rowIndex) =>
      rowIndex === index
        ? {
            ...row,
            energyType: nextType,
            emissionFactorKgPerKwh: c11EnergyConfigurations[nextType].defaultEmissionFactorKgPerKwh ?? null
          }
        : row
    )
    updateRows(nextRows)
  }

  const handleNumericFieldChange = (index: number, field: NumericFieldKey) => (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value.replace(',', '.')
    const parsed = rawValue === '' ? null : Number.parseFloat(rawValue)
    const nextRows = rows.map((row, rowIndex) =>
      rowIndex === index
        ? {
            ...row,
            [field]: Number.isFinite(parsed) ? parsed : null
          }
        : row
    )
    updateRows(nextRows)
  }

  const hasRows = rows.length > 0

  return (
    <form style={{ display: 'grid', gap: '1.5rem', maxWidth: '64rem' }}>
      <header style={{ display: 'grid', gap: '0.5rem' }}>
        <h2>C11 – Downstream leasede aktiver</h2>
        <p style={{ margin: 0 }}>
          Registrér energi for aktiver virksomheden har leaset ud, men hvor ansvaret for emissionerne
          fortsat ligger hos jer. Indtast enten målt energiforbrug eller areal – modulet estimerer kWh
          ud fra standardintensiteter og beregner emissioner baseret på den valgte energitype.
        </p>
      </header>

      <section style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <h3 style={{ margin: 0 }}>Udlejede aktiver</h3>
          <button
            type="button"
            onClick={handleAddRow}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              border: '1px solid #2f6f4f',
              background: '#2f6f4f',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Tilføj linje
          </button>
        </div>

        {hasRows ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {rows.map((row, index) => {
              const energyConfig = c11EnergyConfigurations[row.energyType]
              return (
                <article
                  key={`c11-row-${index}`}
                  style={{
                    border: '1px solid #d0d7d5',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    display: 'grid',
                    gap: '0.75rem',
                    background: '#f9fbfa'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>Linje {index + 1}</strong>
                    <button
                      type="button"
                      onClick={handleRemoveRow(index)}
                      style={{ border: 'none', background: 'transparent', color: '#b4231f', cursor: 'pointer' }}
                    >
                      Fjern
                    </button>
                  </div>

                  <label style={{ display: 'grid', gap: '0.25rem' }}>
                    <span>Energitype</span>
                    <select
                      value={row.energyType}
                      onChange={handleEnergyTypeChange(index)}
                      style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #c8d2cf' }}
                    >
                      {ENERGY_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                    <label style={{ display: 'grid', gap: '0.25rem' }}>
                      <span>Areal (m²)</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        value={row.floorAreaSqm ?? ''}
                        placeholder="fx 850"
                        onChange={handleNumericFieldChange(index, 'floorAreaSqm')}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #c8d2cf' }}
                      />
                    </label>

                    <label style={{ display: 'grid', gap: '0.25rem' }}>
                      <span>Energiforbrug (kWh)</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        value={row.energyConsumptionKwh ?? ''}
                        placeholder="fx 25 000"
                        onChange={handleNumericFieldChange(index, 'energyConsumptionKwh')}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #c8d2cf' }}
                      />
                    </label>

                    <label style={{ display: 'grid', gap: '0.25rem' }}>
                      <span>Emissionsfaktor (kg CO2e/kWh)</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        value={row.emissionFactorKgPerKwh ?? ''}
                        placeholder={`Standard ${energyConfig.defaultEmissionFactorKgPerKwh}`}
                        onChange={handleNumericFieldChange(index, 'emissionFactorKgPerKwh')}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #c8d2cf' }}
                      />
                    </label>

                    <label style={{ display: 'grid', gap: '0.25rem' }}>
                      <span>Dokumentationskvalitet (%)</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={100}
                        step="any"
                        value={row.documentationQualityPercent ?? ''}
                        placeholder="0-100"
                        onChange={handleNumericFieldChange(index, 'documentationQualityPercent')}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #c8d2cf' }}
                      />
                    </label>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#4f5d59' }}>
                    Mangler energiforbruget, estimeres det ud fra arealet og standardintensiteten for den
                    valgte energitype.
                  </p>
                </article>
              )
            })}
          </div>
        ) : (
          <p style={{ margin: 0, color: '#555' }}>
            Tilføj mindst én linje for at beregne emissionerne fra downstream leasede aktiver.
          </p>
        )}
      </section>

      <section
        style={{ display: 'grid', gap: '0.75rem', background: '#f1f5f4', padding: '1rem', borderRadius: '0.75rem' }}
      >
        <h3 style={{ margin: 0 }}>Estimat</h3>
        {hasRows ? (
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
          <p style={{ margin: 0 }}>Indtast data for at se et estimat.</p>
        )}
      </section>
    </form>
  )
}
