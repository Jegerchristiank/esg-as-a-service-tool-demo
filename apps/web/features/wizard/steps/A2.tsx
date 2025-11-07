/**
 * Wizardtrin for modul A2 – mobile forbrændingskilder.
 */
'use client'

import { useMemo } from 'react'
import type { ChangeEvent } from 'react'
import type { A2Input, ModuleInput, ModuleResult } from '@org/shared'
import { a2FuelConfigurations, a2FuelOptions, runA2 } from '@org/shared'

import type { WizardStepProps } from './StepTemplate'

type VehicleRow = NonNullable<A2Input['vehicleConsumptions']>[number]
type VehicleFieldKey = 'quantity' | 'emissionFactorKgPerUnit' | 'distanceKm' | 'documentationQualityPercent'

const EMPTY_A2: A2Input = {
  vehicleConsumptions: []
}

function createDefaultRow(fuelType: keyof typeof a2FuelConfigurations = 'diesel'): VehicleRow {
  const config = a2FuelConfigurations[fuelType]
  return {
    fuelType,
    unit: config.defaultUnit,
    quantity: null,
    emissionFactorKgPerUnit: config.defaultEmissionFactorKgPerUnit,
    distanceKm: null,
    documentationQualityPercent: 100
  }
}

const UNIT_OPTIONS: Array<{ value: VehicleRow['unit']; label: string }> = [
  { value: 'liter', label: 'Liter' },
  { value: 'kg', label: 'Kilogram' }
]

const numberFormatter = new Intl.NumberFormat('da-DK', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3
})

function parseTraceValue(line: string | undefined): number | null {
  if (!line) {
    return null
  }
  const [, raw] = line.split('=')
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

export function A2Step({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.A2 as A2Input | undefined) ?? EMPTY_A2
  const rows = current.vehicleConsumptions ?? []

  const preview = useMemo<ModuleResult>(() => {
    return runA2({ A2: current } as ModuleInput)
  }, [current])

  const updateRows = (nextRows: VehicleRow[]) => {
    onChange('A2', { vehicleConsumptions: nextRows })
  }

  const handleAddRow = () => {
    updateRows([...rows, createDefaultRow()])
  }

  const handleRemoveRow = (index: number) => () => {
    const next = rows.filter((_, rowIndex) => rowIndex !== index)
    updateRows(next)
  }

  const handleFuelTypeChange = (index: number) => (event: ChangeEvent<HTMLSelectElement>) => {
    const nextType = event.target.value as VehicleRow['fuelType']
    const config = a2FuelConfigurations[nextType]
    const existing = rows[index]
    const nextRow: VehicleRow = {
      fuelType: nextType,
      unit: config.defaultUnit,
      quantity: existing?.quantity ?? null,
      emissionFactorKgPerUnit: config.defaultEmissionFactorKgPerUnit,
      distanceKm: existing?.distanceKm ?? null,
      documentationQualityPercent: existing?.documentationQualityPercent ?? 100
    }
    const nextRows = rows.map((row, rowIndex) => (rowIndex === index ? nextRow : row))
    updateRows(nextRows)
  }

  const handleUnitChange = (index: number) => (event: ChangeEvent<HTMLSelectElement>) => {
    const nextUnit = event.target.value as VehicleRow['unit']
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

  const handleFieldChange = (index: number, field: VehicleFieldKey) => (event: ChangeEvent<HTMLInputElement>) => {
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
  const totalDistance = parseTraceValue(preview.trace.find((line) => line.startsWith('totalDistanceKm=')))
  const fleetIntensity = parseTraceValue(preview.trace.find((line) => line.startsWith('fleetEmissionsKgPerKm=')))

  return (
    <form style={{ display: 'grid', gap: '1.5rem', maxWidth: '64rem' }}>
      <header style={{ display: 'grid', gap: '0.5rem' }}>
        <h2>A2 – Scope 1 mobile forbrændingskilder</h2>
        <p style={{ margin: 0 }}>
          Registrér brændselsforbrug for egne køretøjer, trucks og entreprenørmaskiner. Tilføj eventuel kørt distance for at
          følge udledningsintensitet, og marker rækker med lav dokumentationskvalitet.
        </p>
      </header>

      <section style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <h3 style={{ margin: 0 }}>Mobile brændselslinjer</h3>
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
            Tilføj køretøj
          </button>
        </div>

        {hasRows ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {rows.map((row, index) => {
              const fuelConfig = a2FuelConfigurations[row.fuelType]
              return (
                <article
                  key={`vehicle-row-${index}`}
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
                      {a2FuelOptions.map((option) => (
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
                      <span>Kørt distance (km)</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        value={row.distanceKm ?? ''}
                        placeholder="0 (valgfrit)"
                        onChange={handleFieldChange(index, 'distanceKm')}
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
            Tilføj mindst én køretøjslinje for at beregne Scope 1-emissioner.
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
            {fleetIntensity != null && totalDistance != null && totalDistance > 0 && (
              <p style={{ margin: 0, color: '#3a4b45' }}>
                Gns. intensitet: {numberFormatter.format(fleetIntensity)} kg CO₂e/km over{' '}
                {numberFormatter.format(totalDistance)} km.
              </p>
            )}
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
          <p style={{ margin: 0 }}>Udfyld køretøjslinjer for at få beregnet Scope 1-emissioner.</p>
        )}
      </section>
    </form>
  )
}
