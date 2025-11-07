/**
 * Wizardtrin for modul E3 – emissioner til luft, vand og jord.
 */
'use client'

import { useMemo, useState } from 'react'
import type { ChangeEvent, FocusEvent } from 'react'

import type { E3PollutionInput, ModuleInput, ModuleResult } from '@org/shared'
import { runE3Pollution } from '@org/shared'

import type { WizardStepProps } from './StepTemplate'

type FieldKey = keyof E3PollutionInput

type FieldConfig = {
  key: FieldKey
  label: string
  description: string
  unit: string
  required?: boolean
  step?: string
}

const FIELD_CONFIG: FieldConfig[] = [
  {
    key: 'airEmissionsTonnes',
    label: 'Emissioner til luft',
    description: 'Årlige udledninger til atmosfæren.',
    unit: 'ton',
  },
  {
    key: 'airEmissionLimitTonnes',
    label: 'Tilladt grænse – luft',
    description: 'Myndighedskrav eller tilladelse for udledning til luft.',
    unit: 'ton',
  },
  {
    key: 'waterDischargesTonnes',
    label: 'Udledninger til vand',
    description: 'Total mængde for processpildevand.',
    unit: 'ton',
  },
  {
    key: 'waterDischargeLimitTonnes',
    label: 'Tilladt grænse – vand',
    description: 'Myndighedskrav for udledning til vandmiljø.',
    unit: 'ton',
  },
  {
    key: 'soilEmissionsTonnes',
    label: 'Udledninger til jord',
    description: 'Registreret forurening til jord.',
    unit: 'ton',
  },
  {
    key: 'soilEmissionLimitTonnes',
    label: 'Tilladt grænse – jord',
    description: 'Tilladt udledning eller nedsivning til jord.',
    unit: 'ton',
  },
  {
    key: 'reportableIncidents',
    label: 'Rapporterbare hændelser',
    description: 'Antal hændelser som er anmeldt til myndigheder.',
    unit: 'antal',
    step: '1',
  },
  {
    key: 'documentationQualityPercent',
    label: 'Dokumentationskvalitet',
    description: 'Andel af data med revisionsspor eller målinger.',
    unit: '%',
  },
]

const EMPTY_E3: E3PollutionInput = {
  airEmissionsTonnes: null,
  airEmissionLimitTonnes: null,
  waterDischargesTonnes: null,
  waterDischargeLimitTonnes: null,
  soilEmissionsTonnes: null,
  soilEmissionLimitTonnes: null,
  reportableIncidents: null,
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

export function E3PollutionStep({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.E3Pollution as E3PollutionInput | undefined) ?? EMPTY_E3
  const [touched, setTouched] = useState<TouchedMap>({})

  const preview = useMemo<ModuleResult>(() => {
    return runE3Pollution({ E3Pollution: current } as ModuleInput)
  }, [current])

  const handleBlur = (field: FieldKey) => (_event: FocusEvent<HTMLInputElement>) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const handleChange = (field: FieldKey) => (event: ChangeEvent<HTMLInputElement>) => {
    const parsed = parseNumber(event.target.value)
    const next: E3PollutionInput = {
      ...current,
      [field]: parsed,
    }
    onChange('E3Pollution', next)
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

    return nextErrors
  }, [current])

  const hasData = Object.values(current).some((value) => value != null)

  return (
    <form className="ds-form" noValidate>
      <header className="ds-stack-sm">
        <h2 className="ds-heading-sm">E3 – Emissioner til luft, vand og jord</h2>
        <p className="ds-text-muted">
          Registrer emissionsmængder og myndighedsgrænser for at overvåge compliance-scoren.
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
