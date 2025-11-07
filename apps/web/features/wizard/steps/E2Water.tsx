/**
 * Wizardtrin for modul E2 – vandforbrug og vandstress.
 */
'use client'

import { useMemo, useState } from 'react'
import type { ChangeEvent, FocusEvent } from 'react'

import type { E2WaterInput, ModuleInput, ModuleResult } from '@org/shared'
import { runE2Water } from '@org/shared'

import type { WizardStepProps } from './StepTemplate'

type FieldKey = keyof E2WaterInput

type FieldConfig = {
  key: FieldKey
  label: string
  description: string
  unit: string
  required?: boolean
}

const FIELD_CONFIG: FieldConfig[] = [
  {
    key: 'totalWithdrawalM3',
    label: 'Samlet vandudtag',
    description: 'Årligt udtag fra alle kilder i kubikmeter.',
    unit: 'm³',
    required: true,
  },
  {
    key: 'withdrawalInStressRegionsM3',
    label: 'Udtag i vandstressede områder',
    description: 'Andel af udtag lokaliseret i højrisiko-vandbassiner.',
    unit: 'm³',
  },
  {
    key: 'dischargeM3',
    label: 'Udledt vand',
    description: 'Mængde vand der returneres til miljøet efter behandling.',
    unit: 'm³',
  },
  {
    key: 'reusePercent',
    label: 'Genbrug af procesvand',
    description: 'Andel af vandforbruget der recirkuleres internt.',
    unit: '%',
  },
  {
    key: 'dataQualityPercent',
    label: 'Dokumentationskvalitet',
    description: 'Vurdering af hvor stor en del af vanddata der bygger på primære kilder.',
    unit: '%',
  },
]

const EMPTY_E2: E2WaterInput = {
  totalWithdrawalM3: null,
  withdrawalInStressRegionsM3: null,
  dischargeM3: null,
  reusePercent: null,
  dataQualityPercent: null,
}

type TouchedMap = Partial<Record<FieldKey, boolean>>
type ErrorMap = Partial<Record<FieldKey, string>>

type ParsedValue = number | null

function parseNumber(value: string): ParsedValue {
  const normalised = value.replace(',', '.').trim()
  if (normalised === '') {
    return null
  }
  const parsed = Number.parseFloat(normalised)
  return Number.isFinite(parsed) ? parsed : null
}

export function E2WaterStep({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.E2Water as E2WaterInput | undefined) ?? EMPTY_E2
  const [touched, setTouched] = useState<TouchedMap>({})

  const preview = useMemo<ModuleResult>(() => {
    return runE2Water({ E2Water: current } as ModuleInput)
  }, [current])

  const handleBlur = (field: FieldKey) => (_event: FocusEvent<HTMLInputElement>) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const handleChange = (field: FieldKey) => (event: ChangeEvent<HTMLInputElement>) => {
    const parsed = parseNumber(event.target.value)
    const next: E2WaterInput = {
      ...current,
      [field]: parsed,
    }
    onChange('E2Water', next)
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

      if ((key === 'reusePercent' || key === 'dataQualityPercent') && value > 100) {
        nextErrors[key] = 'Procentværdien kan højst være 100.'
      }
    })

    if (
      current.withdrawalInStressRegionsM3 != null &&
      current.totalWithdrawalM3 != null &&
      current.withdrawalInStressRegionsM3 > current.totalWithdrawalM3
    ) {
      nextErrors.withdrawalInStressRegionsM3 =
        'Udtag i stressede områder kan ikke overstige samlet vandudtag.'
    }

    if (
      current.dischargeM3 != null &&
      current.totalWithdrawalM3 != null &&
      current.dischargeM3 > current.totalWithdrawalM3
    ) {
      nextErrors.dischargeM3 = 'Udledt vand kan ikke overstige samlet udtag.'
    }

    return nextErrors
  }, [current, touched])

  const hasData = Object.values(current).some((value) => value != null)

  return (
    <form className="ds-form" noValidate>
      <header className="ds-stack-sm">
        <h2 className="ds-heading-sm">E2 – Vandforbrug og vandstress</h2>
        <p className="ds-text-muted">
          Indtast vandforbrug pr. år for at følge udviklingen i vandstress og dokumentationskvalitet.
        </p>
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
                onChange={handleChange(field.key)}
                onBlur={handleBlur(field.key)}
                className="ds-input"
                data-invalid={isInvalid ? 'true' : 'false'}
                aria-invalid={isInvalid}
                aria-describedby={isInvalid ? `${field.key}-error` : undefined}
                min={0}
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

      {hasData && (
        <aside className="ds-card ds-stack-sm" aria-live="polite">
          <h3 className="ds-heading-xs">Forhåndsresultat</h3>
          <p className="ds-text-strong">
            {preview.value} {preview.unit}
          </p>
          <ul className="ds-stack-xs">
            {preview.warnings.length === 0 ? (
              <li className="ds-text-subtle">Ingen advarsler registreret.</li>
            ) : (
              preview.warnings.map((warning, index) => (
                <li key={index} className="ds-text-subtle">
                  {warning}
                </li>
              ))
            )}
          </ul>
        </aside>
      )}
    </form>
  )
}
