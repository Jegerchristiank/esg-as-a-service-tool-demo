/**
 * Fabrikfunktion til at skabe simple wizard-trin med tekstfelter.
 */
'use client'

import type { ChangeEvent } from 'react'
import type { WizardState } from '../useWizard'

export type WizardStepProps = {
  state: WizardState
  onChange: (key: string, value: unknown) => void
}

export type WizardStepComponent = (props: WizardStepProps) => JSX.Element

export function createWizardStep(fieldKey: string, heading: string): WizardStepComponent {
  return function WizardStep({ state, onChange }: WizardStepProps): JSX.Element {
    const value = state[fieldKey] ?? ''

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      onChange(fieldKey, event.target.value)
    }

    return (
      <form style={{ display: 'grid', gap: '1rem', maxWidth: '32rem' }}>
        <h2>{heading}</h2>
        <label style={{ display: 'grid', gap: '0.5rem' }}>
          <span>Indtast værdi</span>
          <input value={String(value)} onChange={handleChange} />
        </label>
      </form>
    )
  }
}
