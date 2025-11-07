/**
 * Wizardtrin for modul C14 – behandling af solgte produkter.
 */
'use client'

import { useMemo } from 'react'
import type { ChangeEvent } from 'react'
import type { C14Input, ModuleInput, ModuleResult } from '@org/shared'
import {
  c14EmissionFactorConfigurations,
  c14TreatmentTypes,
  defaultC14EmissionFactorKeyByTreatment,
  runC14,
  type C14EmissionFactorKey,
  type C14TreatmentType
} from '@org/shared'

import type { WizardStepProps } from './StepTemplate'

const TREATMENT_OPTIONS: { value: C14TreatmentType; label: string }[] = c14TreatmentTypes.map((type) => {
  const labelMap: Record<C14TreatmentType, string> = {
    recycling: 'Genanvendelse',
    incineration: 'Forbrænding',
    landfill: 'Deponi'
  }
  return { value: type, label: labelMap[type] }
})

const EMISSION_FACTOR_OPTIONS_BY_TREATMENT: Record<C14TreatmentType, { value: C14EmissionFactorKey; label: string }[]> =
  c14TreatmentTypes.reduce((acc, treatmentType) => {
    const options = Object.entries(c14EmissionFactorConfigurations)
      .filter(([, config]) => config.treatmentType === treatmentType)
      .map(([key, config]) => {
        const formattedFactor = new Intl.NumberFormat('da-DK', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(config.factor)

        return {
          value: key as C14EmissionFactorKey,
          label: `${config.label} (${formattedFactor} ${config.unit})`
        }
      })

    acc[treatmentType] = options
    return acc
  }, {} as Record<C14TreatmentType, { value: C14EmissionFactorKey; label: string }[]>)

type C14Row = NonNullable<C14Input['treatmentLines']>[number]

type NumericFieldKey = 'tonnesTreated' | 'documentationQualityPercent'

const EMPTY_C14: C14Input = { treatmentLines: [] }

function createDefaultRow(): C14Row {
  const defaultTreatment: C14TreatmentType = 'recycling'
  const defaultFactorKey = defaultC14EmissionFactorKeyByTreatment[defaultTreatment]

  return {
    treatmentType: defaultTreatment,
    tonnesTreated: null,
    emissionFactorKey: defaultFactorKey,
    documentationQualityPercent: 100
  }
}

export function C14Step({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.C14 as C14Input | undefined) ?? EMPTY_C14
  const rows = current.treatmentLines ?? []

  const preview = useMemo<ModuleResult>(() => runC14({ C14: current } as ModuleInput), [current])

  const updateRows = (nextRows: C14Row[]) => {
    onChange('C14', { treatmentLines: nextRows })
  }

  const handleAddRow = () => {
    updateRows([...rows, createDefaultRow()])
  }

  const handleRemoveRow = (index: number) => () => {
    updateRows(rows.filter((_, rowIndex) => rowIndex !== index))
  }

  const handleTreatmentChange = (index: number) => (event: ChangeEvent<HTMLSelectElement>) => {
    const nextTreatment = event.target.value as C14TreatmentType
    const defaultFactorKey = defaultC14EmissionFactorKeyByTreatment[nextTreatment]
    const nextRows = rows.map((row, rowIndex) =>
      rowIndex === index
        ? {
            ...row,
            treatmentType: nextTreatment,
            emissionFactorKey: defaultFactorKey
          }
        : row
    )
    updateRows(nextRows)
  }

  const handleEmissionFactorChange = (index: number) => (event: ChangeEvent<HTMLSelectElement>) => {
    const nextKey = event.target.value as C14EmissionFactorKey
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
    updateRows(nextRows as C14Row[])
  }

  const hasRows = rows.length > 0

  return (
    <form style={{ display: 'grid', gap: '1.5rem', maxWidth: '64rem' }}>
      <header style={{ display: 'grid', gap: '0.5rem' }}>
        <h2>C14 – Behandling af solgte produkter</h2>
        <p style={{ margin: 0 }}>
          Registrér tonnagen af solgte produkter, der efterfølgende behandles ved genanvendelse, forbrænding eller deponi. Modulet
          multiplicerer tonnage med valgte emissionsfaktorer (kg CO2e/ton) og fremhæver lav dokumentationskvalitet under 60&nbsp;%.
        </p>
      </header>

      <section style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <h3 style={{ margin: 0 }}>Behandlingslinjer</h3>
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
            Tilføj behandlingslinje
          </button>
        </div>

        {hasRows ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {rows.map((row, index) => {
              const treatmentOptions = EMISSION_FACTOR_OPTIONS_BY_TREATMENT[
                row.treatmentType ?? 'recycling'
              ]
              const tonnesValue = row.tonnesTreated ?? ''
              const documentationValue = row.documentationQualityPercent ?? ''

              return (
                <article
                  key={`c14-row-${index}`}
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

                  <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    <label style={{ display: 'grid', gap: '0.25rem' }}>
                      <span>Behandlingstype</span>
                      <select
                        value={row.treatmentType ?? 'recycling'}
                        onChange={handleTreatmentChange(index)}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #c8d2cf' }}
                      >
                        {TREATMENT_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label style={{ display: 'grid', gap: '0.25rem' }}>
                      <span>Tonnage behandlet (ton)</span>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={tonnesValue}
                        onChange={handleNumericFieldChange(index, 'tonnesTreated')}
                        placeholder="fx 125"
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #c8d2cf' }}
                      />
                    </label>

                    <label style={{ display: 'grid', gap: '0.25rem' }}>
                      <span>Emissionsfaktor</span>
                      <select
                        value={row.emissionFactorKey ?? defaultC14EmissionFactorKeyByTreatment[row.treatmentType ?? 'recycling']}
                        onChange={handleEmissionFactorChange(index)}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #c8d2cf' }}
                      >
                        {treatmentOptions.map((option) => (
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
                        placeholder="fx 80"
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #c8d2cf' }}
                      />
                    </label>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <p style={{ margin: 0, color: '#4a635d' }}>
            Ingen behandlingslinjer er tilføjet endnu. Brug knappen ovenfor til at registrere produkter og deres efterfølgende
            behandling.
          </p>
        )}
      </section>

      <section style={{ display: 'grid', gap: '0.75rem' }}>
        <h3 style={{ margin: 0 }}>Resultatforhåndsvisning</h3>
        <div
          style={{
            border: '1px solid #d0d7d5',
            borderRadius: '0.75rem',
            padding: '1rem',
            background: '#ffffff'
          }}
        >
          <p style={{ margin: 0 }}>
            <strong>{preview.value} {preview.unit}</strong>
          </p>
          <ul style={{ margin: '0.75rem 0 0', paddingLeft: '1.25rem', color: '#34423b' }}>
            {preview.assumptions.map((assumption) => (
              <li key={assumption}>{assumption}</li>
            ))}
          </ul>
          {preview.warnings.length > 0 ? (
            <div style={{ marginTop: '0.75rem', color: '#b4231f' }}>
              <strong>Advarsler</strong>
              <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem' }}>
                {preview.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p style={{ marginTop: '0.75rem', color: '#2f6f4f' }}>Ingen advarsler registreret.</p>
          )}
        </div>
      </section>
    </form>
  )
}
