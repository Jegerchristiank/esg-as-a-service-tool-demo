/**
 * Wizardtrin for modul A4 – kølemidler og andre gasser.
 */
'use client'

import { useMemo } from 'react'
import type { ChangeEvent } from 'react'
import type { A4Input, ModuleInput, ModuleResult } from '@org/shared'
import {
  a4DefaultLeakagePercent,
  a4RefrigerantConfigurations,
  a4RefrigerantOptions,
  runA4
} from '@org/shared'

import type { WizardStepProps } from './StepTemplate'

const EMPTY_A4: A4Input = {
  refrigerantLines: []
}

type RefrigerantRow = NonNullable<A4Input['refrigerantLines']>[number]

type RefrigerantFieldKey =
  | 'systemChargeKg'
  | 'leakagePercent'
  | 'gwp100'
  | 'documentationQualityPercent'

type RefrigerantKey = keyof typeof a4RefrigerantConfigurations

function createDefaultRow(refrigerantType: RefrigerantKey = 'hfc134a'): RefrigerantRow {
  const config = a4RefrigerantConfigurations[refrigerantType]
  return {
    refrigerantType,
    systemChargeKg: null,
    leakagePercent: a4DefaultLeakagePercent,
    gwp100: config.defaultGwp100,
    documentationQualityPercent: 100
  }
}

export function A4Step({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.A4 as A4Input | undefined) ?? EMPTY_A4
  const rows = current.refrigerantLines ?? []

  const preview = useMemo<ModuleResult>(() => {
    return runA4({ A4: current } as ModuleInput)
  }, [current])

  const updateRows = (nextRows: RefrigerantRow[]) => {
    onChange('A4', { refrigerantLines: nextRows })
  }

  const handleAddRow = () => {
    updateRows([...rows, createDefaultRow()])
  }

  const handleRemoveRow = (index: number) => () => {
    const next = rows.filter((_, rowIndex) => rowIndex !== index)
    updateRows(next)
  }

  const handleRefrigerantChange = (index: number) => (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    const nextType = event.target.value as RefrigerantRow['refrigerantType']
    const config = a4RefrigerantConfigurations[nextType]
    const existing = rows[index]
    const nextRow: RefrigerantRow = {
      refrigerantType: nextType,
      systemChargeKg: existing?.systemChargeKg ?? null,
      leakagePercent: existing?.leakagePercent ?? a4DefaultLeakagePercent,
      gwp100: config.defaultGwp100,
      documentationQualityPercent: existing?.documentationQualityPercent ?? 100
    }
    const nextRows = rows.map((row, rowIndex) => (rowIndex === index ? nextRow : row))
    updateRows(nextRows)
  }

  const handleFieldChange = (index: number, field: RefrigerantFieldKey) => (
    event: ChangeEvent<HTMLInputElement>
  ) => {
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
        <h2>A4 – Scope 1 flugtige emissioner</h2>
        <p style={{ margin: 0 }}>
          Indsaml data om fyldning af kølemidler og øvrige gasser. Lækageandelen kombineret med GWP100-værdien afgør
          emissionerne. Dokumentationskvalitet bruges til at fremhæve anlæg med utilstrækkelig logning eller kontrol.
        </p>
      </header>

      <section style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <h3 style={{ margin: 0 }}>Kølemiddellinjer</h3>
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
            Tilføj kølemiddel
          </button>
        </div>

        {hasRows ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {rows.map((row, index) => {
              const config = a4RefrigerantConfigurations[row.refrigerantType]
              return (
                <article
                  key={`refrigerant-row-${index}`}
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
                    <strong>Anlæg {index + 1}</strong>
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
                    <span>Kølemiddeltype</span>
                    <select
                      value={row.refrigerantType}
                      onChange={handleRefrigerantChange(index)}
                      style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #c8d2cf' }}
                    >
                      {a4RefrigerantOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <label style={{ display: 'grid', gap: '0.25rem' }}>
                      <span>Fyldning (kg)</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        value={row.systemChargeKg ?? ''}
                        placeholder="0 kg"
                        onChange={handleFieldChange(index, 'systemChargeKg')}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #c8d2cf' }}
                      />
                    </label>

                    <label style={{ display: 'grid', gap: '0.25rem' }}>
                      <span>Lækageandel (%)</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={100}
                        step="any"
                        value={row.leakagePercent ?? ''}
                        placeholder="fx 10%"
                        onChange={handleFieldChange(index, 'leakagePercent')}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #c8d2cf' }}
                      />
                      <span style={{ fontSize: '0.8rem', color: '#5f6f6a' }}>
                        Angiv forventet årlig lækageandel. Manglende værdier antager standard på {a4DefaultLeakagePercent}%.
                      </span>
                    </label>

                    <label style={{ display: 'grid', gap: '0.25rem' }}>
                      <span>GWP100-værdi</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        value={row.gwp100 ?? ''}
                        onChange={handleFieldChange(index, 'gwp100')}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #c8d2cf' }}
                      />
                      <span style={{ fontSize: '0.8rem', color: '#5f6f6a' }}>
                        Standard: {config.defaultGwp100}
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
            Tilføj mindst én kølemiddellinje for at beregne Scope 1-emissioner.
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
          <p style={{ margin: 0 }}>Udfyld kølemiddellinjer for at få beregnet Scope 1-emissioner.</p>
        )}
      </section>
    </form>
  )
}
