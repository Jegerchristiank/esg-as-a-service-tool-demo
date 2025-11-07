'use client'

import { useMemo } from 'react'

import {
  ALL_PROFILE_KEYS,
  countAnsweredQuestions,
  countPositiveAnswers,
  type WizardProfile,
  wizardProfileSections,
} from './profile'

import type { WizardScope } from '../../../features/wizard/steps'

type StepStatus = 'not-started' | 'in-progress' | 'complete'

export type StepIdentifier = 'profile' | WizardScope

type StepData = {
  id: StepIdentifier
  label: string
  total: number
  answered: number
  positives: number
  status: StepStatus
}

type ProfileProgressStepperProps = {
  profile: WizardProfile
  activeStep?: StepIdentifier
  onSelectStep?: (step: StepIdentifier) => void
}

const sectionScopeMap: Record<string, WizardScope> = {
  'scope-1': 'Scope 1',
  'scope-2': 'Scope 2',
  'scope-3-upstream': 'Scope 3',
  'scope-3-downstream': 'Scope 3',
  environment: 'Environment',
  'double-materiality': 'Governance',
  governance: 'Governance',
}

const orderedScopes: WizardScope[] = ['Scope 1', 'Scope 2', 'Scope 3', 'Environment', 'Social', 'Governance']

const statusLabels: Record<StepStatus, string> = {
  'not-started': 'Ikke startet',
  'in-progress': 'I gang',
  complete: 'Færdig',
}

function resolveStatus(answered: number, total: number): StepStatus {
  if (answered === 0) {
    return 'not-started'
  }
  if (answered >= total) {
    return 'complete'
  }
  return 'in-progress'
}

export function ProfileProgressStepper({
  profile,
  activeStep = 'profile',
  onSelectStep,
}: ProfileProgressStepperProps): JSX.Element {
  const steps = useMemo<StepData[]>(() => {
    const scopeBuckets = orderedScopes.map<StepData>((scope) => {
      const scopedSections = wizardProfileSections.filter(
        (section) => sectionScopeMap[section.id] === scope
      )
      const questionIds = scopedSections.flatMap((section) => section.questions.map((question) => question.id))
      const total = questionIds.length
      const answered = questionIds.reduce((count, questionId) => {
        return profile[questionId] !== null ? count + 1 : count
      }, 0)
      const positives = questionIds.reduce((count, questionId) => {
        return profile[questionId] ? count + 1 : count
      }, 0)

      return {
        id: scope,
        label: scope,
        total,
        answered,
        positives,
        status: resolveStatus(answered, total),
      }
    })

    const totalAnswered = countAnsweredQuestions(profile)
    const totalPositives = countPositiveAnswers(profile)

    return [
      {
        id: 'profile',
        label: 'Trin 0 · Virksomhedsprofil',
        total: ALL_PROFILE_KEYS.length,
        answered: totalAnswered,
        positives: totalPositives,
        status: resolveStatus(totalAnswered, ALL_PROFILE_KEYS.length),
      },
      ...scopeBuckets,
    ]
  }, [profile])

  return (
    <ol className="ds-stepper" role="list" aria-label="Fremdrift for ESG-profilscope">
      {steps.map((step) => {
        const handleClick = () => {
          onSelectStep?.(step.id)
        }

        return (
          <li
            key={step.id}
            className="ds-stepper__step"
            data-status={step.status}
            data-active={step.id === activeStep ? 'true' : undefined}
          >
            <button
              type="button"
              className="ds-stepper__trigger"
              onClick={handleClick}
              aria-current={step.id === activeStep ? 'step' : undefined}
            >
              <div className="ds-stepper__header">
                <span className="ds-stepper__label">{step.label}</span>
                <span className="ds-stepper__status">{statusLabels[step.status]}</span>
              </div>
              <p className="ds-stepper__meta">
                {step.id === 'profile'
                  ? `${step.positives} relevante valg`
                  : `${step.positives} relevante aktiviteter`}
                <span aria-hidden="true"> · </span>
                {step.answered}/{step.total} besvaret
              </p>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

