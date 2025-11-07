/**
 * Wizardtrin for modul E4 – påvirkning af biodiversitet.
 */
'use client'

import { useMemo, useState } from 'react'
import type { ChangeEvent, FocusEvent } from 'react'

import type { E4BiodiversityInput, ModuleInput, ModuleResult } from '@org/shared'
import { runE4Biodiversity } from '@org/shared'

import type { WizardStepProps } from './StepTemplate'

type FieldKey = keyof E4BiodiversityInput

type FieldConfig = {
  key: FieldKey
  label: string
  description: string
  unit: string
  step?: string
  required?: boolean
}

const FIELD_CONFIG: FieldConfig[] = [
  {
    key: 'sitesInOrNearProtectedAreas',
    label: 'Lokaliteter i/nær beskyttet natur',
    description: 'Antal driftssteder der overlapper Natura 2000 eller nationalt beskyttede områder.',
    unit: 'antal',
    step: '1',
  },
  {
    key: 'protectedAreaHectares',
    label: 'Påvirket areal',
    description: 'Samlet areal med påvirkning fra drift eller forsyningskæde.',
    unit: 'ha',
  },
  {
    key: 'restorationHectares',
    label: 'Restaureret areal',
    description: 'Areal hvor virksomheden gennemfører genopretning eller kompensation.',
    unit: 'ha',
  },
  {
    key: 'significantIncidents',
    label: 'Væsentlige hændelser',
    description: 'Antal større biodiversitetshændelser registreret i året.',
    unit: 'antal',
    step: '1',
  },
  {
    key: 'documentationQualityPercent',
    label: 'Dokumentationskvalitet',
    description: 'Andel af data med feltstudier eller tredjepartsverifikation.',
    unit: '%',
  },
]

const EMPTY_E4: E4BiodiversityInput = {
  sitesInOrNearProtectedAreas: null,
  protectedAreaHectares: null,
  restorationHectares: null,
  significantIncidents: null,
  documentationQualityPercent: null,
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

export function E4BiodiversityStep({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.E4Biodiversity as E4BiodiversityInput | undefined) ?? EMPTY_E4
  const [touched, setTouched] = useState<TouchedMap>({})

  const preview = useMemo<ModuleResult>(() => {
    return runE4Biodiversity({ E4Biodiversity: current } as ModuleInput)
  }, [current])

  const handleBlur = (field: FieldKey) => (_event: FocusEvent<HTMLInputElement>) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const handleChange = (field: FieldKey) => (event: ChangeEvent<HTMLInputElement>) => {
    const parsed = parseNumber(event.target.value)
    const next: E4BiodiversityInput = {
      ...current,
      [field]: parsed,
    }
    onChange('E4Biodiversity', next)
  }

  const errors = useMemo<ErrorMap>(() => {
    const nextErrors: ErrorMap = {}

    FIELD_CONFIG.forEach(({ key }) => {
      const value = current[key]
      if (value == null) {
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

      if (key === 'documentationQualityPercent' && value > 100) {
        nextErrors[key] = 'Procentværdien kan højst være 100.'
      }
    })

    if (
      current.restorationHectares != null &&
      current.protectedAreaHectares != null &&
      current.restorationHectares > current.protectedAreaHectares
    ) {
      nextErrors.restorationHectares = 'Restaureret areal kan ikke overstige påvirket areal.'
    }

    return nextErrors
  }, [current])

  const hasData = Object.values(current).some((value) => value != null)

  return (
    <form className="ds-form" noValidate>
      <header className="ds-stack-sm">
        <h2 className="ds-heading-sm">E4 – Påvirkning af biodiversitet</h2>
        <p className="ds-text-muted">
          Opgør påvirkede arealer og hændelser for at prioritere biodiversitetstiltag.
        </p>
      </header>

      <section className="ds-grid ds-grid-2">
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
                step={field.step ?? 'any'}
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
              preview.warnings.slice(0, 5).map((warning, index) => (
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
