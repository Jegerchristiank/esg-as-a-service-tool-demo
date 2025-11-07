/**
 * Wizardtrin for modul B6 – nettab i elnettet.
 */
'use client'

import { useMemo, useState } from 'react'
import type { ChangeEvent, FocusEvent } from 'react'
import type { B6Input, ModuleInput, ModuleResult } from '@org/shared'
import { runB6 } from '@org/shared'
import type { WizardStepProps } from './StepTemplate'

type FieldKey = keyof B6Input

type FieldConfig = {
  key: FieldKey
  label: string
  description: string
  unit: string
  placeholder?: string
  required?: boolean
}

const FIELD_CONFIG: FieldConfig[] = [
  {
    key: 'electricitySuppliedKwh',
    label: 'Årligt elforbrug (basis)',
    description: 'Den leverede mængde elektricitet som nettabbet beregnes ud fra (kWh).',
    unit: 'kWh',
    required: true
  },
  {
    key: 'gridLossPercent',
    label: 'Nettab',
    description: 'Forventet transmissions- og distributionstab angivet i procent af forbruget.',
    unit: '%',
    placeholder: '0-20',
    required: true
  },
  {
    key: 'emissionFactorKgPerKwh',
    label: 'Emissionsfaktor',
    description: 'Kg CO2e pr. tabt kWh elektricitet. Typisk samme faktor som for elforbrug.',
    unit: 'kg CO2e/kWh',
    placeholder: '0.233',
    required: true
  },
  {
    key: 'renewableSharePercent',
    label: 'Vedvarende dækning',
    description: 'Andel af tabet der dokumenteres dækket af vedvarende energi.',
    unit: '%',
    placeholder: '0-100'
  }
]

const EMPTY_B6: B6Input = {
  electricitySuppliedKwh: null,
  gridLossPercent: null,
  emissionFactorKgPerKwh: null,
  renewableSharePercent: null
}

type TouchedMap = Partial<Record<FieldKey, boolean>>

type ErrorMap = Partial<Record<FieldKey, string>>

export function B6Step({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.B6 as B6Input | undefined) ?? EMPTY_B6
  const [touched, setTouched] = useState<TouchedMap>({})

  const preview = useMemo<ModuleResult>(() => {
    return runB6({ B6: current } as ModuleInput)
  }, [current])

  const handleFieldBlur = (field: FieldKey) => (_event: FocusEvent<HTMLInputElement>) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const handleFieldChange = (field: FieldKey) => (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value.replace(',', '.')
    const parsed = rawValue === '' ? null : Number.parseFloat(rawValue)
    const next: B6Input = {
      ...current,
      [field]: Number.isFinite(parsed) ? parsed : null
    }
    onChange('B6', next)
  }

  const errors = useMemo<ErrorMap>(() => {
    const nextErrors: ErrorMap = {}

    FIELD_CONFIG.forEach(({ key, required, unit }) => {
      const value = current[key]
      if (value == null) {
        if (required && touched[key]) {
          nextErrors[key] = 'Feltet er påkrævet.'
        }
        return
      }

      if (Number.isNaN(value)) {
        nextErrors[key] = 'Angiv et gyldigt tal.'
        return
      }

      if (value < 0) {
        nextErrors[key] = 'Værdien skal være positiv.'
        return
      }

      if (unit === '%' && value > 100) {
        nextErrors[key] = 'Procentværdier kan højst være 100%.'
      }
    })

    return nextErrors
  }, [current, touched])

  const hasData =
    preview.trace.some((line) => line.includes('lossEnergyKwh')) &&
    (current.electricitySuppliedKwh != null ||
      current.gridLossPercent != null ||
      current.emissionFactorKgPerKwh != null ||
      current.renewableSharePercent != null)

  return (
    <form className="ds-form" noValidate>
      <header className="ds-stack-sm">
        <h2 className="ds-heading-sm">B6 – Scope 2 nettab i elnettet</h2>
        <p className="ds-text-muted">
          Indtast data for transmission- og distributionstab for elektricitet. Resultatet estimerer emissionerne fra tabet og
          reducerer for dokumenteret vedvarende dækning.
        </p>
        <p className="ds-text-subtle">Typiske nettab ligger mellem 3-8 %. Brug leverandørens faktiske tal, hvis de er tilgængelige.</p>
      </header>

      <section className="ds-stack">
        {FIELD_CONFIG.map((field) => {
          const value = current[field.key]
          const error = errors[field.key]
          const isInvalid = Boolean(error)
          const max = field.unit === '%' ? 100 : undefined
          return (
            <label key={field.key} className="ds-field">
              <span>
                {field.label} ({field.unit})
              </span>
              <span className="ds-field-help">{field.description}</span>
              <input
                type="number"
                step="any"
                value={value ?? ''}
                placeholder={field.placeholder}
                onChange={handleFieldChange(field.key)}
                onBlur={handleFieldBlur(field.key)}
                className="ds-input"
                data-invalid={isInvalid ? 'true' : 'false'}
                min={0}
                max={max}
                aria-invalid={isInvalid}
                aria-describedby={isInvalid ? `${field.key}-error` : undefined}
              />
              {isInvalid && (
                <p id={`${field.key}-error`} className="ds-error">
                  {error}
                </p>
              )}
            </label>
          )
        })}
      </section>

      <section className="ds-summary ds-stack-sm">
        <h3 className="ds-heading-sm">Estimat</h3>
        {hasData ? (
          <div className="ds-stack-sm">
            <p className="ds-value">
              {preview.value} {preview.unit}
            </p>
            <div className="ds-stack-sm">
              <strong>Antagelser</strong>
              <ul>
                {preview.assumptions.map((assumption, index) => (
                  <li key={index}>{assumption}</li>
                ))}
              </ul>
            </div>
            {preview.warnings.length > 0 && (
              <div className="ds-stack-sm">
                <strong>Advarsler</strong>
                <ul>
                  {preview.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
            <details className="ds-summary">
              <summary>Teknisk trace</summary>
              <ul>
                {preview.trace.map((line, index) => (
                  <li key={index} className="ds-code">
                    {line}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        ) : (
          <p className="ds-text-muted">Udfyld felterne for at se beregnet nettoemission.</p>
        )}
      </section>
    </form>
  )
}
