/**
 * Wizardtrin for modul C15 – screening af øvrige Scope 3-kategorier.
 */
'use client'

import { useMemo } from 'react'
import type { ChangeEvent } from 'react'
import type { C15Input, ModuleInput, ModuleResult } from '@org/shared'
import {
  c15Categories,
  c15CategoryLabels,
  c15EmissionFactorConfigurations,
  defaultC15EmissionFactorKeyByCategory,
  runC15,
  type C15Category,
  type C15EmissionFactorKey
} from '@org/shared'

import type { WizardStepProps } from './StepTemplate'

type C15Row = NonNullable<C15Input['screeningLines']>[number]

type NumericFieldKey = 'estimatedQuantity' | 'documentationQualityPercent'

type TextFieldKey = 'description' | 'quantityUnit'

const EMPTY_C15: C15Input = { screeningLines: [] }

const CATEGORY_OPTIONS: { value: C15Category; label: string }[] = c15Categories.map((category) => ({
  value: category,
  label: c15CategoryLabels[category]
}))

const EMISSION_FACTOR_OPTIONS_BY_CATEGORY: Record<
  C15Category,
  { value: C15EmissionFactorKey; label: string }[]
> = c15Categories.reduce((acc, category) => {
  const options = Object.entries(c15EmissionFactorConfigurations)
    .filter(([, config]) => config.category === category)
    .map(([key, config]) => {
      const formattedFactor = new Intl.NumberFormat('da-DK', {
        minimumFractionDigits: config.factor < 1 ? 3 : 0,
        maximumFractionDigits: config.factor < 1 ? 3 : 0
      }).format(config.factor)

      return {
        value: key as C15EmissionFactorKey,
        label: `${config.label} (${formattedFactor} ${config.unit})`
      }
    })

  acc[category] = options
  return acc
}, {} as Record<C15Category, { value: C15EmissionFactorKey; label: string }[]>)

function createDefaultRow(): C15Row {
  const defaultCategory: C15Category = '1'
  const defaultFactorKey = defaultC15EmissionFactorKeyByCategory[defaultCategory]

  return {
    category: defaultCategory,
    description: null,
    quantityUnit: 'DKK',
    estimatedQuantity: null,
    emissionFactorKey: defaultFactorKey,
    documentationQualityPercent: 100
  }
}

export function C15Step({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.C15 as C15Input | undefined) ?? EMPTY_C15
  const rows = current.screeningLines ?? []

  const preview = useMemo<ModuleResult>(() => runC15({ C15: current } as ModuleInput), [current])

  const updateRows = (nextRows: C15Row[]) => {
    onChange('C15', { screeningLines: nextRows })
  }

  const handleAddRow = () => {
    updateRows([...rows, createDefaultRow()])
  }

  const handleRemoveRow = (index: number) => () => {
    updateRows(rows.filter((_, rowIndex) => rowIndex !== index))
  }

  const handleCategoryChange = (index: number) => (event: ChangeEvent<HTMLSelectElement>) => {
    const nextCategory = event.target.value as C15Category
    const defaultFactorKey = defaultC15EmissionFactorKeyByCategory[nextCategory]
    const nextRows = rows.map((row, rowIndex) =>
      rowIndex === index
        ? {
            ...row,
            category: nextCategory,
            emissionFactorKey: defaultFactorKey
          }
        : row
    )
    updateRows(nextRows)
  }

  const handleEmissionFactorChange = (index: number) => (event: ChangeEvent<HTMLSelectElement>) => {
    const nextKey = event.target.value as C15EmissionFactorKey
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
    updateRows(nextRows as C15Row[])
  }

  const handleTextFieldChange = (index: number, field: TextFieldKey) => (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const rawValue = event.target.value
    const trimmed = rawValue.trim()
    const nextRows = rows.map((row, rowIndex) =>
      rowIndex === index
        ? {
            ...row,
            [field]: trimmed === '' ? null : trimmed
          }
        : row
    )
    updateRows(nextRows as C15Row[])
  }

  const hasRows = rows.length > 0

  return (
    <form style={{ display: 'grid', gap: '1.5rem', maxWidth: '64rem' }}>
      <header style={{ display: 'grid', gap: '0.5rem' }}>
        <h2>C15 – Øvrige kategorioplysninger</h2>
        <p style={{ margin: 0 }}>
          Registrér screening for de Scope 3-kategorier, der endnu ikke har dedikerede moduler. Kombinér beskrivelser, enheder
          og estimerede mængder med passende emissionsfaktorer for at få et hurtigt Scope 3-overblik. Modulet markerer lav
          dokumentationskvalitet under 60&nbsp;%.
        </p>
      </header>

      <section style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <h3 style={{ margin: 0 }}>Screeninglinjer</h3>
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
            Tilføj screeninglinje
          </button>
        </div>

        {hasRows ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {rows.map((row, index) => {
              const estimatedValue = row.estimatedQuantity ?? ''
              const documentationValue = row.documentationQualityPercent ?? ''
              const descriptionValue = row.description ?? ''
              const quantityUnitValue = row.quantityUnit ?? ''
              const category = (row.category as C15Category | null) ?? '1'
              const factorOptions = EMISSION_FACTOR_OPTIONS_BY_CATEGORY[category]

              return (
                <article
                  key={`c15-row-${index}`}
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
                    <strong>Screening {index + 1}</strong>
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
                      <span>Kategori</span>
                      <select value={category} onChange={handleCategoryChange(index)}>
                        {CATEGORY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label style={{ display: 'grid', gap: '0.25rem' }}>
                      <span>Beskrivelse/metode</span>
                      <input
                        type="text"
                        value={descriptionValue}
                        onChange={handleTextFieldChange(index, 'description')}
                        placeholder="fx Spend-baseret estimat for kategori 1"
                      />
                    </label>

                    <label style={{ display: 'grid', gap: '0.25rem' }}>
                      <span>Enhed</span>
                      <input
                        type="text"
                        value={quantityUnitValue}
                        onChange={handleTextFieldChange(index, 'quantityUnit')}
                        placeholder="fx DKK, ton, km"
                      />
                    </label>

                    <label style={{ display: 'grid', gap: '0.25rem' }}>
                      <span>Estimeret mængde</span>
                      <input
                        type="number"
                        step="any"
                        value={estimatedValue}
                        onChange={handleNumericFieldChange(index, 'estimatedQuantity')}
                        placeholder="fx 500000"
                      />
                    </label>

                    <label style={{ display: 'grid', gap: '0.25rem' }}>
                      <span>Faktor</span>
                      <select
                        value={row.emissionFactorKey ?? defaultC15EmissionFactorKeyByCategory[category]}
                        onChange={handleEmissionFactorChange(index)}
                      >
                        {factorOptions.map((option) => (
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
                        value={documentationValue}
                        onChange={handleNumericFieldChange(index, 'documentationQualityPercent')}
                        placeholder="fx 85"
                      />
                    </label>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <p style={{ margin: 0, color: '#555' }}>
            Tilføj screeninglinjer for at estimere emissioner for resterende Scope 3-kategorier. Du kan kombinere spend-baserede
            og aktivitetsbaserede estimater.
          </p>
        )}
      </section>

      <section
        style={{ display: 'grid', gap: '0.75rem', background: '#f0f7f4', borderRadius: '0.75rem', padding: '1rem' }}
      >
        <h3 style={{ margin: 0 }}>Resultat-preview</h3>
        <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
          {preview.value} {preview.unit}
        </p>
        {preview.warnings.length > 0 && (
          <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#a15500' }}>
            {preview.warnings.map((warning, index) => (
              <li key={`c15-warning-${index}`}>{warning}</li>
            ))}
          </ul>
        )}
        <details>
          <summary>Antagelser og trace</summary>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <div>
              <strong>Antagelser</strong>
              <ul>
                {preview.assumptions.map((assumption, index) => (
                  <li key={`c15-assumption-${index}`}>{assumption}</li>
                ))}
              </ul>
            </div>
            <div>
              <strong>Trace</strong>
              <ul>
                {preview.trace.map((entry, index) => (
                  <li key={`c15-trace-${index}`} style={{ fontFamily: 'monospace' }}>
                    {entry}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </details>
      </section>
    </form>
  )
}
