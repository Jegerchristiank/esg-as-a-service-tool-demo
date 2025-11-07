/**
 * Wizardtrin for modul A3 – procesemissioner.
 */
'use client'

import { useMemo } from 'react'
import type { ChangeEvent } from 'react'
import type { A3Input, ModuleInput, ModuleResult } from '@org/shared'
import { a3ProcessConfigurations, a3ProcessOptions, runA3 } from '@org/shared'

import type { WizardStepProps } from './StepTemplate'

const EMPTY_A3: A3Input = {
  processLines: []
}

type ProcessRow = NonNullable<A3Input['processLines']>[number]

type ProcessFieldKey = 'outputQuantityTon' | 'emissionFactorKgPerTon' | 'documentationQualityPercent'

type ProcessKey = keyof typeof a3ProcessConfigurations

function createDefaultRow(processType: ProcessKey = 'cementClinker'): ProcessRow {
  const config = a3ProcessConfigurations[processType]
  return {
    processType,
    outputQuantityTon: null,
    emissionFactorKgPerTon: config.defaultEmissionFactorKgPerTon,
    documentationQualityPercent: 100
  }
}

export function A3Step({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.A3 as A3Input | undefined) ?? EMPTY_A3
  const rows = current.processLines ?? []

  const preview = useMemo<ModuleResult>(() => {
    return runA3({ A3: current } as ModuleInput)
  }, [current])

  const updateRows = (nextRows: ProcessRow[]) => {
    onChange('A3', { processLines: nextRows })
  }

  const handleAddRow = () => {
    updateRows([...rows, createDefaultRow()])
  }

  const handleRemoveRow = (index: number) => () => {
    const next = rows.filter((_, rowIndex) => rowIndex !== index)
    updateRows(next)
  }

  const handleProcessChange = (index: number) => (event: ChangeEvent<HTMLSelectElement>) => {
    const nextType = event.target.value as ProcessRow['processType']
    const config = a3ProcessConfigurations[nextType]
    const existing = rows[index]
    const nextRow: ProcessRow = {
      processType: nextType,
      outputQuantityTon: existing?.outputQuantityTon ?? null,
      emissionFactorKgPerTon: config.defaultEmissionFactorKgPerTon,
      documentationQualityPercent: existing?.documentationQualityPercent ?? 100
    }
    const nextRows = rows.map((row, rowIndex) => (rowIndex === index ? nextRow : row))
    updateRows(nextRows)
  }

  const handleFieldChange = (index: number, field: ProcessFieldKey) => (event: ChangeEvent<HTMLInputElement>) => {
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
        <h2>A3 – Scope 1 procesemissioner</h2>
        <p style={{ margin: 0 }}>
          Kortlæg industrielle procesemissioner som cementproduktion, kalkudbrænding eller kemiske reaktioner. Angiv
          produceret mængde i ton og den relevante emissionsfaktor. Dokumentationskvalitet bruges til at fremhæve
          linjer med lav datakvalitet.
        </p>
      </header>

      <section style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <h3 style={{ margin: 0 }}>Proceslinjer</h3>
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
            Tilføj proces
          </button>
        </div>

        {hasRows ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {rows.map((row, index) => {
              const config = a3ProcessConfigurations[row.processType]
              return (
                <article
                  key={`process-row-${index}`}
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
                    <span>Proces/aktivitet</span>
                    <select
                      value={row.processType}
                      onChange={handleProcessChange(index)}
                      style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #c8d2cf' }}
                    >
                      {a3ProcessOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <label style={{ display: 'grid', gap: '0.25rem' }}>
                      <span>Outputmængde (ton)</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        value={row.outputQuantityTon ?? ''}
                        placeholder="0 ton"
                        onChange={handleFieldChange(index, 'outputQuantityTon')}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #c8d2cf' }}
                      />
                    </label>

                    <label style={{ display: 'grid', gap: '0.25rem' }}>
                      <span>Emissionsfaktor (kg CO₂e/ton)</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        value={row.emissionFactorKgPerTon ?? ''}
                        onChange={handleFieldChange(index, 'emissionFactorKgPerTon')}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #c8d2cf' }}
                      />
                      <span style={{ fontSize: '0.8rem', color: '#5f6f6a' }}>
                        Standard: {config.defaultEmissionFactorKgPerTon} kg CO₂e/ton
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
            Tilføj mindst én proceslinje for at beregne Scope 1-emissioner.
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
          <p style={{ margin: 0 }}>Udfyld proceslinjer for at få beregnet Scope 1-emissioner.</p>
        )}
      </section>
    </form>
  )
}
