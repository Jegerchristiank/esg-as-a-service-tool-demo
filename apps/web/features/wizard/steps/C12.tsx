/**
 * Wizardtrin for modul C12 – franchising og downstream services.
 */
'use client'

import { useMemo } from 'react'
import type { ChangeEvent } from 'react'
import type { C12Input, ModuleInput, ModuleResult } from '@org/shared'
import {
  c12EmissionFactorConfigurations,
  defaultC12EmissionFactorKeyByBasis,
  runC12,
  type C12ActivityBasis,
  type C12EmissionFactorKey
} from '@org/shared'

import type { WizardStepProps } from './StepTemplate'

type C12Row = NonNullable<C12Input['franchiseLines']>[number]
type NumericFieldKey = 'revenueDkk' | 'energyConsumptionKwh' | 'documentationQualityPercent'

type ActivityOption = { value: C12ActivityBasis; label: string }
type EmissionFactorOption = { value: C12EmissionFactorKey; label: string }

const ACTIVITY_OPTIONS: ActivityOption[] = [
  { value: 'revenue', label: 'Omsætning (DKK)' },
  { value: 'energy', label: 'Energiforbrug (kWh)' }
]

const EMPTY_C12: C12Input = {
  franchiseLines: []
}

const EMISSION_FACTOR_OPTIONS: Record<C12ActivityBasis, EmissionFactorOption[]> = ((): Record<
  C12ActivityBasis,
  EmissionFactorOption[]
> => {
  const bases: C12ActivityBasis[] = ['revenue', 'energy']
  return bases.reduce((acc, basis) => {
    acc[basis] = Object.entries(c12EmissionFactorConfigurations)
      .filter(([, config]) => config.basis === basis)
      .map(([key, config]) => {
        const decimals = config.basis === 'revenue' ? 5 : 3
        const formattedFactor = new Intl.NumberFormat('da-DK', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }).format(config.factor)
        return {
          value: key as C12EmissionFactorKey,
          label: `${config.label} (${formattedFactor} ${config.unit})`
        }
      })
    return acc
  }, {} as Record<C12ActivityBasis, EmissionFactorOption[]>)
})()

function createDefaultRow(basis: C12ActivityBasis = 'revenue'): C12Row {
  return {
    activityBasis: basis,
    revenueDkk: null,
    energyConsumptionKwh: null,
    emissionFactorKey: defaultC12EmissionFactorKeyByBasis[basis],
    documentationQualityPercent: 100
  }
}

export function C12Step({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.C12 as C12Input | undefined) ?? EMPTY_C12
  const rows = current.franchiseLines ?? []

  const preview = useMemo<ModuleResult>(() => {
    return runC12({ C12: current } as ModuleInput)
  }, [current])

  const updateRows = (nextRows: C12Row[]) => {
    onChange('C12', { franchiseLines: nextRows })
  }

  const handleAddRow = () => {
    updateRows([...rows, createDefaultRow()])
  }

  const handleRemoveRow = (index: number) => () => {
    updateRows(rows.filter((_, rowIndex) => rowIndex !== index))
  }

  const handleActivityBasisChange = (index: number) => (event: ChangeEvent<HTMLSelectElement>) => {
    const nextBasis = event.target.value as C12ActivityBasis
    const defaultKey = defaultC12EmissionFactorKeyByBasis[nextBasis]
    const nextRows = rows.map((row, rowIndex) =>
      rowIndex === index
        ? {
            ...row,
            activityBasis: nextBasis,
            emissionFactorKey: defaultKey
          }
        : row
    )
    updateRows(nextRows)
  }

  const handleEmissionFactorChange = (index: number) => (event: ChangeEvent<HTMLSelectElement>) => {
    const nextKey = event.target.value as C12EmissionFactorKey
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
    updateRows(nextRows as C12Row[])
  }

  const hasRows = rows.length > 0

  return (
    <form style={{ display: 'grid', gap: '1.5rem', maxWidth: '64rem' }}>
      <header style={{ display: 'grid', gap: '0.5rem' }}>
        <h2>C12 – Franchising og downstream services</h2>
        <p style={{ margin: 0 }}>
          Registrér franchiseomsætning eller energiforbrug for aktiviteter, som virksomheden har kontrol over downstream. Vælg
          basis, anvend branchespecifikke emissionsfaktorer og vurder dokumentationskvaliteten for at beregne Scope 3-emissioner
          fra franchiserede enheder.
        </p>
      </header>

      <section style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <h3 style={{ margin: 0 }}>Franchiselinjer</h3>
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
              const options = EMISSION_FACTOR_OPTIONS[row.activityBasis]
              const selectedKey = row.emissionFactorKey ?? defaultC12EmissionFactorKeyByBasis[row.activityBasis]

              return (
                <article
                  key={`c12-row-${index}`}
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

                  <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <label style={{ display: 'grid', gap: '0.25rem' }}>
                      <span>Aktivitetsbasis</span>
                      <select
                        value={row.activityBasis}
                        onChange={handleActivityBasisChange(index)}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #c8d2cf' }}
                      >
                        {ACTIVITY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    {row.activityBasis === 'revenue' ? (
                      <label style={{ display: 'grid', gap: '0.25rem' }}>
                        <span>Omsætning (DKK)</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="any"
                          value={row.revenueDkk ?? ''}
                          placeholder="fx 12 500 000"
                          onChange={handleNumericFieldChange(index, 'revenueDkk')}
                          style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #c8d2cf' }}
                        />
                      </label>
                    ) : (
                      <label style={{ display: 'grid', gap: '0.25rem' }}>
                        <span>Energiforbrug (kWh)</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="any"
                          value={row.energyConsumptionKwh ?? ''}
                          placeholder="fx 85 000"
                          onChange={handleNumericFieldChange(index, 'energyConsumptionKwh')}
                          style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #c8d2cf' }}
                        />
                      </label>
                    )}

                    <label style={{ display: 'grid', gap: '0.25rem' }}>
                      <span>Emissionsfaktor</span>
                      <select
                        value={selectedKey}
                        onChange={handleEmissionFactorChange(index)}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #c8d2cf' }}
                      >
                        {options.map((option) => (
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
                    Basisvalget styrer hvilke emissionsfaktorer der vises. Manglende emissionfaktor bruger standardværdien for den
                    valgte kategori.
                  </p>
                </article>
              )
            })}
          </div>
        ) : (
          <p style={{ margin: 0, color: '#555' }}>
            Tilføj mindst én linje for at beregne emissioner fra franchiserede aktiviteter.
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
