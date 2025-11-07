/**
 * Wizardtrin for modul B5.
 */
'use client'

import { useMemo, useState } from 'react'
import type { ChangeEvent, FocusEvent } from 'react'
import type { B5Input, ModuleInput, ModuleResult } from '@org/shared'
import { runB5 } from '@org/shared'
import type { WizardStepProps } from './StepTemplate'

type FieldKey = keyof B5Input

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
    key: 'otherEnergyConsumptionKwh',
    label: 'Årligt forbrug',
    description: 'Samlet mængde indkøbt energi for den valgte leverance i kWh.',
    unit: 'kWh',
    required: true
  },
  {
    key: 'recoveredEnergyKwh',
    label: 'Genindvundet energi',
    description: 'Energi der udnyttes fra processer eller genanvendelse og reducerer behovet.',
    unit: 'kWh'
  },
  {
    key: 'emissionFactorKgPerKwh',
    label: 'Emissionsfaktor',
    description: 'Kg CO2e pr. kWh ifølge leverandørens miljødeklaration.',
    unit: 'kg CO2e/kWh',
    placeholder: '0.075',
    required: true
  },
  {
    key: 'renewableSharePercent',
    label: 'Vedvarende andel',
    description: 'Andel dokumenteret som vedvarende energi for leverancen.',
    unit: '%',
    placeholder: '0-100'
  }
]

const EMPTY_B5: B5Input = {
  otherEnergyConsumptionKwh: null,
  recoveredEnergyKwh: null,
  emissionFactorKgPerKwh: null,
  renewableSharePercent: null
}

type TouchedMap = Partial<Record<FieldKey, boolean>>

type ErrorMap = Partial<Record<FieldKey, string>>

export function B5Step({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.B5 as B5Input | undefined) ?? EMPTY_B5
  const [touched, setTouched] = useState<TouchedMap>({})

  const preview = useMemo<ModuleResult>(() => {
    return runB5({ B5: current } as ModuleInput)
  }, [current])

  const handleFieldBlur = (field: FieldKey) => (_event: FocusEvent<HTMLInputElement>) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const handleFieldChange = (field: FieldKey) => (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value.replace(',', '.')
    const parsed = rawValue === '' ? null : Number.parseFloat(rawValue)
    const next: B5Input = {
      ...current,
      [field]: Number.isFinite(parsed) ? parsed : null
    }
    onChange('B5', next)
  }

  const errors = useMemo<ErrorMap>(() => {
    const nextErrors: ErrorMap = {}

    FIELD_CONFIG.forEach(({ key, required }) => {
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

      if (key === 'renewableSharePercent' && value > 100) {
        nextErrors[key] = 'Vedvarende andel kan højst være 100%.'
      }
    })

    return nextErrors
  }, [current, touched])

  const hasData =
    preview.trace.some((line) => line.includes('netOtherEnergyConsumptionKwh')) &&
    (current.otherEnergyConsumptionKwh != null ||
      current.recoveredEnergyKwh != null ||
      current.emissionFactorKgPerKwh != null ||
      current.renewableSharePercent != null)

  return (
    <form className="ds-form" noValidate>
      <header className="ds-stack-sm">
        <h2 className="ds-heading-sm">B5 – Scope 2 øvrige energileverancer</h2>
        <p className="ds-text-muted">
          Indtast data for energileverancer, som ikke dækkes af el, varme, køling eller damp. Beregningen korrigerer for
          genindvundet energi og dokumenteret vedvarende andel.
        </p>
        <p className="ds-text-subtle">Benyt kWh som standardenhed for at sammenligne på tværs af energityper.</p>
      </header>

      <section className="ds-stack">
        {FIELD_CONFIG.map((field) => {
          const value = current[field.key]
          const error = errors[field.key]
          const isInvalid = Boolean(error)
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
