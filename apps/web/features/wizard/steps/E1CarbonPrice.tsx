/**
 * Wizardtrin for modul E1 – interne CO₂-priser.
 */
'use client'

import { useCallback, useMemo } from 'react'
import type { ChangeEvent } from 'react'

import type {
  E1CarbonPriceInput,
  E1TargetScope,
  ModuleInput,
  ModuleResult,
} from '@org/shared'
import { e1TargetScopeOptions, runE1CarbonPrice } from '@org/shared'

import type { WizardStepProps } from './StepTemplate'

const EMPTY_INPUT: E1CarbonPriceInput = {
  carbonPrices: [],
  methodologyNarrative: null,
}

const SCOPE_LABELS: Record<E1TargetScope, string> = {
  scope1: 'Scope 1',
  scope2: 'Scope 2',
  scope3: 'Scope 3',
  combined: 'Samlet (scope 1-3)',
}

const createEmptyScheme = (): NonNullable<E1CarbonPriceInput['carbonPrices']>[number] => ({
  scheme: null,
  scope: 'combined',
  priceDkkPerTonne: null,
  coveragePercent: null,
  appliesToCapex: null,
  appliesToOpex: null,
  appliesToInvestmentDecisions: null,
  alignedWithFinancialStatements: null,
  description: null,
})

const toScheme = (
  scheme?: NonNullable<E1CarbonPriceInput['carbonPrices']>[number],
): NonNullable<E1CarbonPriceInput['carbonPrices']>[number] => ({
  ...createEmptyScheme(),
  ...(scheme ?? {}),
})

const parseNumber = (value: string): number | null => {
  const trimmed = value.trim()
  if (trimmed === '') {
    return null
  }
  const parsed = Number.parseFloat(trimmed.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

export function E1CarbonPriceStep({ state, onChange }: WizardStepProps): JSX.Element {
  const current = (state.E1CarbonPrice as E1CarbonPriceInput | undefined) ?? EMPTY_INPUT

  const preview = useMemo<ModuleResult>(() => {
    return runE1CarbonPrice({ E1CarbonPrice: current } as ModuleInput)
  }, [current])

  const setSchemes = useCallback(
    (updater: (schemes: NonNullable<E1CarbonPriceInput['carbonPrices']>) => NonNullable<E1CarbonPriceInput['carbonPrices']>) => {
      const previous = (current.carbonPrices ?? []).map((scheme) => toScheme(scheme))
      const next = updater(previous)
      onChange('E1CarbonPrice', { ...current, carbonPrices: next })
    },
    [current, onChange],
  )

  const handleSchemeChange = useCallback(
    (
      index: number,
      field: keyof ReturnType<typeof createEmptyScheme>,
    ) =>
      (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setSchemes((schemes) => {
          const next = schemes.map((scheme, idx) => (idx === index ? { ...scheme } : scheme))
          const scheme = next[index]
          if (!scheme) {
            return next
          }
          if (field === 'priceDkkPerTonne' || field === 'coveragePercent') {
            scheme[field] = parseNumber(event.target.value)
          } else if (field === 'scope') {
            scheme.scope = (event.target.value as E1TargetScope) || null
          } else if (
            field === 'appliesToCapex' ||
            field === 'appliesToOpex' ||
            field === 'appliesToInvestmentDecisions' ||
            field === 'alignedWithFinancialStatements'
          ) {
            scheme[field] = event.target instanceof HTMLInputElement ? event.target.checked : null
          } else {
            const value = event.target.value.trim()
            scheme[field] = value.length > 0 ? value : null
          }
          return next
        })
      },
    [setSchemes],
  )

  const handleAddScheme = useCallback(() => {
    setSchemes((schemes) => [...schemes, createEmptyScheme()])
  }, [setSchemes])

  const handleRemoveScheme = useCallback(
    (index: number) => () => {
      setSchemes((schemes) => schemes.filter((_, idx) => idx !== index))
    },
    [setSchemes],
  )

  const handleNarrativeChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const text = event.target.value.trim()
      onChange('E1CarbonPrice', { ...current, methodologyNarrative: text.length > 0 ? text : null })
    },
    [current, onChange],
  )

  const schemes = (current.carbonPrices ?? []).map((scheme) => toScheme(scheme))
  const hasData = schemes.length > 0 || (current.methodologyNarrative ?? '').trim().length > 0

  return (
    <form className="ds-form ds-stack" noValidate>
      <header className="ds-stack-sm">
        <h2 className="ds-heading-sm">E1 – Interne CO₂-priser</h2>
        <p className="ds-text-muted">
          Dokumentér de interne prissætningsmekanismer der anvendes til investeringer, omkostningsstyring og risikovurdering.
        </p>
      </header>

      <section className="ds-stack">
        <button type="button" className="ds-button ds-button-secondary" onClick={handleAddScheme}>
          Tilføj CO₂-pris
        </button>
        {schemes.length === 0 && <p>Ingen CO₂-priser registreret endnu.</p>}
        {schemes.map((scheme, index) => (
          <fieldset key={index} className="ds-card ds-stack" style={{ padding: '1rem' }}>
            <legend className="ds-heading-xs">Ordning #{index + 1}</legend>
            <div className="ds-grid-two">
              <label className="ds-field">
                <span>Navn</span>
                <input
                  type="text"
                  value={scheme.scheme ?? ''}
                  onChange={handleSchemeChange(index, 'scheme')}
                  placeholder="Intern CO₂-pris"
                />
              </label>
              <label className="ds-field">
                <span>Scope</span>
                <select value={scheme.scope ?? ''} onChange={handleSchemeChange(index, 'scope')}>
                  <option value="">Vælg…</option>
                  {e1TargetScopeOptions.map((scope) => (
                    <option key={scope} value={scope}>
                      {SCOPE_LABELS[scope]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="ds-grid-two">
              <label className="ds-field">
                <span>Pris (DKK/tCO₂e)</span>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={scheme.priceDkkPerTonne ?? ''}
                  onChange={handleSchemeChange(index, 'priceDkkPerTonne')}
                />
              </label>
              <label className="ds-field">
                <span>Dækningsgrad (%)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={scheme.coveragePercent ?? ''}
                  onChange={handleSchemeChange(index, 'coveragePercent')}
                />
              </label>
            </div>
            <div className="ds-grid-two">
              <label className="ds-field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={scheme.appliesToCapex ?? false}
                  onChange={handleSchemeChange(index, 'appliesToCapex')}
                />
                <span>Anvendes til capex</span>
              </label>
              <label className="ds-field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={scheme.appliesToOpex ?? false}
                  onChange={handleSchemeChange(index, 'appliesToOpex')}
                />
                <span>Anvendes til opex</span>
              </label>
              <label className="ds-field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={scheme.appliesToInvestmentDecisions ?? false}
                  onChange={handleSchemeChange(index, 'appliesToInvestmentDecisions')}
                />
                <span>Anvendes i investeringsbeslutninger</span>
              </label>
              <label className="ds-field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={scheme.alignedWithFinancialStatements ?? false}
                  onChange={handleSchemeChange(index, 'alignedWithFinancialStatements')}
                />
                <span>Afstemt med regnskab</span>
              </label>
            </div>
            <label className="ds-field">
              <span>Beskrivelse</span>
              <textarea
                rows={3}
                value={scheme.description ?? ''}
                onChange={handleSchemeChange(index, 'description')}
              />
            </label>
            <button type="button" className="ds-button ds-button-tertiary" onClick={handleRemoveScheme(index)}>
              Fjern CO₂-pris
            </button>
          </fieldset>
        ))}
      </section>

      <section className="ds-stack">
        <label className="ds-field">
          <span>Metodebeskrivelse</span>
          <textarea rows={4} value={current.methodologyNarrative ?? ''} onChange={handleNarrativeChange} />
        </label>
      </section>

      <section className="ds-card ds-stack" style={{ padding: '1rem' }}>
        <h3 className="ds-heading-xs">Forhåndsvisning</h3>
        {hasData ? (
          <div className="ds-stack-sm">
            <div>
              <span className="ds-text-muted">Antal ordninger</span>
              <p className="ds-heading-md" style={{ margin: 0 }}>
                {preview.value} {preview.unit}
              </p>
            </div>
            {preview.metrics && preview.metrics.length > 0 && (
              <ul className="ds-list-plain">
                {preview.metrics.map((metric) => (
                  <li key={metric.label}>
                    <strong>{metric.label}:</strong> {metric.value}
                    {metric.unit ? ` ${metric.unit}` : ''}
                  </li>
                ))}
              </ul>
            )}
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
          </div>
        ) : (
          <p className="ds-text-muted">Udfyld en ordning for at se beregningen.</p>
        )}
      </section>
    </form>
  )
}
