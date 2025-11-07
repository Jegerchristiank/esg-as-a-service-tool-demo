/**
 * Wizardtrin for modul C13 – investeringer og finansielle aktiviteter.
 */
'use client'

import { useMemo } from 'react'
import type { ChangeEvent } from 'react'
import type { C13Input, ModuleInput, ModuleResult } from '@org/shared'
import {
  c13EmissionFactorConfigurations,
  defaultC13EmissionFactorKey,
  runC13,
  type C13EmissionFactorKey
} from '@org/shared'

import type { WizardStepProps } from './StepTemplate'

type C13Row = NonNullable<C13Input['investmentLines']>[number]
type NumericFieldKey = 'investedAmountDkk' | 'documentationQualityPercent'

type EmissionFactorOption = { value: C13EmissionFactorKey; label: string }

const EMPTY_C13: C13Input = { investmentLines: [] }

const EMISSION_FACTOR_OPTIONS: EmissionFactorOption[] = Object.entries(c13EmissionFactorConfigurations).map(
  ([key, config]) => {
    const formattedFactor = new Intl.NumberFormat('da-DK', {
      minimumFractionDigits: 5,
      maximumFractionDigits: 5
    }).format(config.factor)

    return {
      value: key as C13EmissionFactorKey,
      label: `${config.label} (${formattedFactor} ${config.unit})`
    }
  }
)

function createDefaultRow(): C13Row {
  return {
    investedAmountDkk: null,
    emissionFactorKey: defaultC13EmissionFactorKey,
    documentationQualityPercent: 100
  }
}

export function C13Step({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.C13 as C13Input | undefined) ?? EMPTY_C13
  const rows = current.investmentLines ?? []

  const preview = useMemo<ModuleResult>(() => runC13({ C13: current } as ModuleInput), [current])

  const updateRows = (nextRows: C13Row[]) => {
    onChange('C13', { investmentLines: nextRows })
  }

  const handleAddRow = () => {
    updateRows([...rows, createDefaultRow()])
  }

  const handleRemoveRow = (index: number) => () => {
    updateRows(rows.filter((_, rowIndex) => rowIndex !== index))
  }

  const handleEmissionFactorChange = (index: number) => (event: ChangeEvent<HTMLSelectElement>) => {
    const nextKey = event.target.value as C13EmissionFactorKey
    const nextRows = rows.map((row, rowIndex) =>
      rowIndex === index
        ? {
            ...row,
            emissionFactorKey: nextKey
          }
        : row
    )
    updateRows(nextRows)
  }

  const handleNumericFieldChange = (index: number, field: NumericFieldKey) => (
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
    updateRows(nextRows as C13Row[])
  }

  const hasRows = rows.length > 0

  return (
    <form style={{ display: 'grid', gap: '1.5rem', maxWidth: '64rem' }}>
      <header style={{ display: 'grid', gap: '0.5rem' }}>
        <h2>C13 – Investeringer og finansielle aktiviteter</h2>
        <p style={{ margin: 0 }}>
          Registrér investeringsbeløb og emissionsintensitet for porteføljer, fonde eller finansielle produkter. Modulet
          beregner Scope 3-emissioner ved at multiplicere investeret kapital med valgte faktorer og flagger lav
          dokumentationskvalitet under 60&nbsp;%.
        </p>
      </header>

      <section style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <h3 style={{ margin: 0 }}>Investeringslinjer</h3>
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
            Tilføj investering
          </button>
        </div>

        {hasRows ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {rows.map((row, index) => {
              const investedValue = row.investedAmountDkk ?? ''
              const documentationValue = row.documentationQualityPercent ?? ''

              return (
                <article
                  key={`c13-row-${index}`}
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
                    <strong>Investering {index + 1}</strong>
                    <button
                      type="button"
                      onClick={handleRemoveRow(index)}
                      style={{ border: 'none', background: 'transparent', color: '#b4231f', cursor: 'pointer' }}
                    >
                      Fjern
                    </button>
                  </div>

                  <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    <label style={{ display: 'grid', gap: '0.25rem' }}>
                      <span>Beløb investeret (DKK)</span>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={investedValue}
                        onChange={handleNumericFieldChange(index, 'investedAmountDkk')}
                        placeholder="fx 2.500.000"
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #c8d2cf' }}
                      />
                    </label>

                    <label style={{ display: 'grid', gap: '0.25rem' }}>
                      <span>Emissionsfaktor</span>
                      <select
                        value={row.emissionFactorKey ?? defaultC13EmissionFactorKey}
                        onChange={handleEmissionFactorChange(index)}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #c8d2cf' }}
                      >
                        {EMISSION_FACTOR_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label style={{ display: 'grid', gap: '0.25rem' }}>
                      <span>Dokumentationskvalitet (%)</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="any"
                        value={documentationValue}
                        onChange={handleNumericFieldChange(index, 'documentationQualityPercent')}
                        placeholder="fx 85"
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #c8d2cf' }}
                      />
                    </label>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <p style={{ margin: 0, color: '#6b7f78' }}>
            Tilføj en eller flere investeringer for at beregne porteføljens emissioner. Mindst ét beløb i DKK er nødvendigt.
          </p>
        )}
      </section>

      <section
        style={{
          display: 'grid',
          gap: '0.75rem',
          background: '#f9fbfa',
          border: '1px solid #d0d7d5',
          borderRadius: '0.75rem',
          padding: '1rem'
        }}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '1rem' }}>
          <h3 style={{ margin: 0 }}>Beregning</h3>
          <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>
            {preview.value} {preview.unit}
          </span>
        </header>
        <div>
          <strong>Antagelser</strong>
          <ul>
            {preview.assumptions.map((assumption, index) => (
              <li key={`c13-assumption-${index}`}>{assumption}</li>
            ))}
          </ul>
        </div>
        {preview.warnings.length > 0 && (
          <div>
            <strong>Advarsler</strong>
            <ul>
              {preview.warnings.map((warning, index) => (
                <li key={`c13-warning-${index}`}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
        <details>
          <summary>Teknisk trace</summary>
          <ul>
            {preview.trace.map((entry, index) => (
              <li key={`c13-trace-${index}`} style={{ fontFamily: 'monospace' }}>
                {entry}
              </li>
            ))}
          </ul>
        </details>
      </section>
    </form>
  )
}
