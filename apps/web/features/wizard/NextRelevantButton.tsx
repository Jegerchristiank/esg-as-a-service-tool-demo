'use client'

import { useMemo } from 'react'

import { PrimaryButton } from '../../components/ui/PrimaryButton'
import { isModuleRelevant } from '../../src/modules/wizard/profile'
import { wizardSteps, type WizardStep } from './steps'
import { useWizardContext } from './useWizard'

type NextRelevantStep = { index: number; step: WizardStep }

function findNextRelevantStep(
  currentIndex: number,
  profile: Parameters<typeof isModuleRelevant>[0],
): NextRelevantStep | null {
  for (let index = currentIndex + 1; index < wizardSteps.length; index += 1) {
    const candidate = wizardSteps[index]
    if (!candidate || candidate.status !== 'ready') {
      continue
    }
    if (isModuleRelevant(profile, candidate.id)) {
      return { index, step: candidate }
    }
  }
  return null
}

type NextRelevantButtonProps = {
  className?: string
}

export function NextRelevantButton({ className }: NextRelevantButtonProps): JSX.Element | null {
  const { currentStep, goToStep, profile } = useWizardContext()

  const nextRelevant = useMemo<NextRelevantStep | null>(() => {
    if (currentStep < 0 || currentStep >= wizardSteps.length) {
      return null
    }
    return findNextRelevantStep(currentStep, profile)
  }, [currentStep, profile])

  if (!nextRelevant) {
    return null
  }

  const handleClick = () => {
    goToStep(nextRelevant.index)
  }

  return (
    <div className={['ds-next-relevant', className].filter(Boolean).join(' ')}>
      <PrimaryButton variant="secondary" size="sm" onClick={handleClick}>
        Næste relevante modul: {nextRelevant.step.label}
      </PrimaryButton>
    </div>
  )
}
