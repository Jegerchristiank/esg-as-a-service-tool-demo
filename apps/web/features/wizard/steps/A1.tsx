/**
 * Wizardtrin for modul A1 – stationær forbrænding.
 */
'use client'

import { useMemo } from 'react'
import type { ChangeEvent } from 'react'
import type { A1Input, ModuleInput, ModuleResult } from '@org/shared'
import { a1FuelConfigurations, a1FuelOptions, runA1 } from '@org/shared'

import type { WizardStepProps } from './StepTemplate'

type FuelRow = NonNullable<A1Input['fuelConsumptions']>[number]
type FuelFieldKey = 'quantity' | 'emissionFactorKgPerUnit' | 'documentationQualityPercent'

const EMPTY_A1: A1Input = {
  fuelConsumptions: []
}

function createDefaultRow(fuelType: keyof typeof a1FuelConfigurations = 'naturgas'): FuelRow {
  const config = a1FuelConfigurations[fuelType]
  return {
    fuelType,
    unit: config.defaultUnit,
    quantity: null,
    emissionFactorKgPerUnit: config.defaultEmissionFactorKgPerUnit,
    documentationQualityPercent: 100
  }
}

const UNIT_OPTIONS: Array<{ value: FuelRow['unit']; label: string }> = [
  { value: 'liter', label: 'Liter' },
  { value: 'Nm³', label: 'Nm³' },
  { value: 'kg', label: 'Kilogram' }
]

export function A1Step({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.A1 as A1Input | undefined) ?? EMPTY_A1
  const rows = current.fuelConsumptions ?? []

  const preview = useMemo<ModuleResult>(() => {
    return runA1({ A1: current } as ModuleInput)
  }, [current])

  const updateRows = (nextRows: FuelRow[]) => {
    onChange('A1', { fuelConsumptions: nextRows })
  }

  const handleAddRow = () => {
    updateRows([...rows, createDefaultRow()])
  }

  const handleRemoveRow = (index: number) => () => {
    const next = rows.filter((_, rowIndex) => rowIndex !== index)
    updateRows(next)
  }

  const handleFuelTypeChange = (index: number) => (event: ChangeEvent<HTMLSelectElement>) => {
    const nextType = event.target.value as FuelRow['fuelType']
    const config = a1FuelConfigurations[nextType]
    const existing = rows[index]
    const nextRow: FuelRow = {
      fuelType: nextType,
      unit: config.defaultUnit,
      quantity: existing?.quantity ?? null,
      emissionFactorKgPerUnit: config.defaultEmissionFactorKgPerUnit,
      documentationQualityPercent: existing?.documentationQualityPercent ?? 100
    }
    const nextRows = rows.map((row, rowIndex) => (rowIndex === index ? nextRow : row))
    updateRows(nextRows)
  }

  const handleUnitChange = (index: number) => (event: ChangeEvent<HTMLSelectElement>) => {
    const nextUnit = event.target.value as FuelRow['unit']
    const nextRows = rows.map((row, rowIndex) =>
      rowIndex === index
        ? {
            ...row,
            unit: nextUnit
          }
        : row
    )
    updateRows(nextRows)
  }

  const handleFieldChange = (index: number, field: FuelFieldKey) => (event: ChangeEvent<HTMLInputElement>) => {
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
        <h2>A1 – Scope 1 stationære forbrændingskilder</h2>
        <p style={{ margin: 0 }}>
          Registrér brændselsforbrug for kedler, ovne og generatorer. Vælg brændstoftype, angiv mængde og juster
          emissionsfaktoren ved behov. Dokumentationskvalitet bruges til at fremhæve rækker med lav datakvalitet.
        </p>
      </header>

      <section style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <h3 style={{ margin: 0 }}>Brændselslinjer</h3>
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
            Tilføj brændsel
          </button>
        </div>

        {hasRows ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {rows.map((row, index) => {
              const fuelConfig = a1FuelConfigurations[row.fuelType]
              return (
                <article
                  key={`fuel-row-${index}`}
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
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#b4231f',
                        cursor: 'pointer'
                      }}
                    >
                      Fjern
                    </button>
                  </div>

                  <label style={{ display: 'grid', gap: '0.25rem' }}>
                    <span>Brændstoftype</span>
                    <select
                      value={row.fuelType}
                      onChange={handleFuelTypeChange(index)}
                      style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #c8d2cf' }}
                    >
                      {a1FuelOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                    <label style={{ display: 'grid', gap: '0.25rem' }}>
                      <span>Mængde</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        value={row.quantity ?? ''}
                        placeholder={`0 (${fuelConfig.defaultUnit})`}
                        onChange={handleFieldChange(index, 'quantity')}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #c8d2cf' }}
                      />
                    </label>

                    <label style={{ display: 'grid', gap: '0.25rem' }}>
                      <span>Enhed</span>
                      <select
                        value={row.unit}
                        onChange={handleUnitChange(index)}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #c8d2cf' }}
                      >
                        {UNIT_OPTIONS.map((unit) => (
                          <option key={unit.value} value={unit.value}>
                            {unit.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label style={{ display: 'grid', gap: '0.25rem' }}>
                      <span>Emissionsfaktor (kg CO₂e/enhed)</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        value={row.emissionFactorKgPerUnit ?? ''}
                        onChange={handleFieldChange(index, 'emissionFactorKgPerUnit')}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #c8d2cf' }}
                      />
                      <span style={{ fontSize: '0.8rem', color: '#5f6f6a' }}>
                        Standard: {fuelConfig.defaultEmissionFactorKgPerUnit} kg CO₂e/{fuelConfig.defaultUnit}
                      </span>
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
                        onChange={handleFieldChange(index, 'documentationQualityPercent')}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #c8d2cf' }}
                      />
                    </label>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <p style={{ margin: 0, color: '#5f6f6a' }}>
            Tilføj mindst én brændselslinje for at beregne Scope 1-emissioner.
          </p>
        )}
      </section>

      <section style={{ display: 'grid', gap: '0.75rem', background: '#f1f5f4', padding: '1rem', borderRadius: '0.75rem' }}>
        <h3 style={{ margin: 0 }}>Estimat</h3>
        {preview.trace.some((line) => line.startsWith('entry[')) ? (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>
              {preview.value} {preview.unit}
            </p>
            <div>
              <strong>Antagelser</strong>
              <ul>
                {preview.assumptions.map((assumption, index) => (
                  <li key={`assumption-${index}`}>{assumption}</li>
                ))}
              </ul>
            </div>
            {preview.warnings.length > 0 && (
              <div>
                <strong>Advarsler</strong>
                <ul>
                  {preview.warnings.map((warning, index) => (
                    <li key={`warning-${index}`}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
            <details>
              <summary>Teknisk trace</summary>
              <ul>
                {preview.trace.map((line, index) => (
                  <li key={`trace-${index}`} style={{ fontFamily: 'monospace' }}>
                    {line}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        ) : (
          <p style={{ margin: 0 }}>Udfyld brændselslinjer for at få beregnet Scope 1-emissioner.</p>
        )}
      </section>
    </form>
  )
}
