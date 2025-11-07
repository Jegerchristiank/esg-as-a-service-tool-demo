'use client'

import { useMemo } from 'react'

import { isModuleRelevant, type WizardProfile } from './profile'
import { WizardSegmentedControl } from '../../../features/wizard/components/WizardSegmentedControl'

import type { WizardScope, WizardStep } from '../../../features/wizard/steps'

type WizardOverviewProps = {
  steps: WizardStep[]
  currentStep: number
  onSelect: (index: number) => void
  profile: WizardProfile
  profileComplete: boolean
}

const scopeOrder: WizardScope[] = ['Scope 1', 'Scope 2', 'Scope 3', 'Environment', 'Social', 'Governance']

type StepGroup = {
  scope: WizardScope
  steps: WizardStep[]
}

function groupStepsByScope(stepList: WizardStep[]): StepGroup[] {
  return scopeOrder
    .map((scope) => ({ scope, steps: stepList.filter((step) => step.scope === scope) }))
    .filter((entry) => entry.steps.length > 0)
}

export function WizardOverview({
  steps,
  currentStep,
  onSelect,
  profile,
  profileComplete,
}: WizardOverviewProps): JSX.Element {
  const { relevantGroups, notRelevantGroups, plannedSteps } = useMemo(() => {
    const relevant = steps.filter(
      (step) => step.status === 'ready' && isModuleRelevant(profile, step.id)
    )
    const notRelevant = steps.filter(
      (step) => step.status === 'ready' && !isModuleRelevant(profile, step.id)
    )
    const planned = steps.filter((step) => step.status === 'planned')

    return {
      relevantGroups: groupStepsByScope(relevant),
      notRelevantGroups: groupStepsByScope(notRelevant),
      plannedSteps: planned,
    }
  }, [profile, steps])

  const relevantCount = relevantGroups.reduce((count, group) => count + group.steps.length, 0)

  const summaryMessage = !profileComplete
    ? 'Afslut virksomhedsprofilen for at låse op for modulnavigation.'
    : relevantCount > 0
      ? `${relevantCount} moduler markeret som relevante.`
      : 'Ingen moduler markeret som relevante endnu.'

  const activeStepId = steps[currentStep]?.id ?? null

  const handleSelect = (stepId: WizardStep['id']) => {
    const index = steps.findIndex((candidate) => candidate.id === stepId)
    if (index !== -1) {
      onSelect(index)
    }
  }

  return (
    <nav className="ds-stack" aria-label="ESG-moduler">
      <section className="ds-panel ds-stack-sm" aria-label="Relevante moduler">
        <header className="ds-stack-xs">
          <h2 className="ds-heading-sm">Relevante moduler</h2>
          <p className="ds-text-subtle">{summaryMessage}</p>
        </header>

        {relevantGroups.length > 0 && (
          <div className="ds-stack-sm">
            {relevantGroups.map((group) => (
              <section key={group.scope} className="ds-stack-xs">
                <p className="ds-text-subtle">{group.scope}</p>
                <WizardSegmentedControl
                  scope={group.scope}
                  steps={group.steps}
                  activeStepId={activeStepId}
                  onSelect={handleSelect}
                  profileComplete={profileComplete}
                />
              </section>
            ))}
          </div>
        )}
      </section>

      {notRelevantGroups.length > 0 && (
        <details className="ds-foldout" aria-label="Ikke relevante moduler">
          <summary className="ds-foldout__summary">Ikke relevante</summary>
          <div className="ds-foldout__content ds-stack-sm">
            {notRelevantGroups.map((group) => (
              <section key={group.scope} className="ds-stack-xs">
                <p className="ds-text-subtle">{group.scope}</p>
                <div className="ds-pill-group" role="list">
                  {group.steps.map((step) => (
                    <span key={step.id} className="ds-pill" data-relevant="false">
                      {step.label}
                    </span>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </details>
      )}

      {plannedSteps.length > 0 && (
        <section className="ds-panel ds-stack-sm" aria-label="Planlagte moduler">
          <header className="ds-stack-xs">
            <h2 className="ds-heading-sm">Planlagte</h2>
            <p className="ds-text-subtle">Følgende moduler er på roadmap og bliver tilføjet senere.</p>
          </header>
          <ul className="ds-plan-list" role="list">
            {plannedSteps.map((step) => (
              <li key={step.id} className="ds-plan-list__item">
                <span className="ds-pill" data-planned="true">
                  {step.label}
                </span>
                <span className="ds-status-badge" data-status="planned">
                  Planlagt
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </nav>
  )
}
