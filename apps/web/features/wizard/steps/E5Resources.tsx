/**
 * Wizardtrin for modul E5 – ressourcer og materialeforbrug.
 */
'use client'

import { useMemo, useState } from 'react'
import type { ChangeEvent, FocusEvent } from 'react'

import type { E5ResourcesInput, ModuleInput, ModuleResult } from '@org/shared'
import { runE5Resources } from '@org/shared'

import type { WizardStepProps } from './StepTemplate'

type FieldKey = keyof E5ResourcesInput

type FieldConfig = {
  key: FieldKey
  label: string
  description: string
  unit: string
  required?: boolean
}

const FIELD_CONFIG: FieldConfig[] = [
  {
    key: 'primaryMaterialConsumptionTonnes',
    label: 'Primært materialeforbrug',
    description: 'Årligt forbrug af jomfruelige materialer.',
    unit: 'ton',
  },
  {
    key: 'secondaryMaterialConsumptionTonnes',
    label: 'Sekundært materialeforbrug',
    description: 'Årligt forbrug af genanvendte materialer.',
    unit: 'ton',
  },
  {
    key: 'recycledContentPercent',
    label: 'Genanvendt indhold',
    description: 'Andel af produkter med genanvendte input.',
    unit: '%',
  },
  {
    key: 'renewableMaterialSharePercent',
    label: 'Fornybare materialer',
    description: 'Andel af forbruget som stammer fra fornybare ressourcer.',
    unit: '%',
  },
  {
    key: 'criticalMaterialsSharePercent',
    label: 'Kritiske materialer',
    description: 'Andel af materialer på EU’s liste over kritiske råstoffer.',
    unit: '%',
  },
  {
    key: 'circularityTargetPercent',
    label: 'Cirkularitetsmål',
    description: 'Intern målsætning for genanvendt indhold.',
    unit: '%',
  },
  {
    key: 'documentationQualityPercent',
    label: 'Dokumentationskvalitet',
    description: 'Andel af data med leverandørcertifikater eller tredjepartsrevision.',
    unit: '%',
  },
]

const EMPTY_E5: E5ResourcesInput = {
  primaryMaterialConsumptionTonnes: null,
  secondaryMaterialConsumptionTonnes: null,
  recycledContentPercent: null,
  renewableMaterialSharePercent: null,
  criticalMaterialsSharePercent: null,
  circularityTargetPercent: null,
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

export function E5ResourcesStep({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.E5Resources as E5ResourcesInput | undefined) ?? EMPTY_E5
  const [touched, setTouched] = useState<TouchedMap>({})

  const preview = useMemo<ModuleResult>(() => {
    return runE5Resources({ E5Resources: current } as ModuleInput)
  }, [current])

  const handleBlur = (field: FieldKey) => (_event: FocusEvent<HTMLInputElement>) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const handleChange = (field: FieldKey) => (event: ChangeEvent<HTMLInputElement>) => {
    const parsed = parseNumber(event.target.value)
    const next: E5ResourcesInput = {
      ...current,
      [field]: parsed,
    }
    onChange('E5Resources', next)
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

      if (
        (key === 'recycledContentPercent' ||
          key === 'renewableMaterialSharePercent' ||
          key === 'criticalMaterialsSharePercent' ||
          key === 'circularityTargetPercent' ||
          key === 'documentationQualityPercent') &&
        value > 100
      ) {
        nextErrors[key] = 'Procentværdien kan højst være 100.'
      }
    })

    if (
      current.secondaryMaterialConsumptionTonnes != null &&
      current.primaryMaterialConsumptionTonnes != null &&
      current.secondaryMaterialConsumptionTonnes > current.primaryMaterialConsumptionTonnes
    ) {
      nextErrors.secondaryMaterialConsumptionTonnes =
        'Sekundært forbrug kan ikke overstige primært forbrug.'
    }

    return nextErrors
  }, [current])

  const hasData = Object.values(current).some((value) => value != null)

  return (
    <form className="ds-form" noValidate>
      <header className="ds-stack-sm">
        <h2 className="ds-heading-sm">E5 – Ressourcer og materialeforbrug</h2>
        <p className="ds-text-muted">
          Kortlæg materialeforbrug, kritiske materialer og genanvendelse for at styrke cirkulariteten.
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
