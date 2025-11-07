import { SegmentedControl, type SegmentedControlOption } from '../../../components/ui/SegmentedControl'
import type { WizardScope, WizardStep } from '../steps'

type WizardSegmentedControlProps = {
  scope: WizardScope
  steps: WizardStep[]
  activeStepId: WizardStep['id'] | null
  onSelect: (stepId: WizardStep['id']) => void
  profileComplete: boolean
}

export function WizardSegmentedControl({
  scope,
  steps,
  activeStepId,
  onSelect,
  profileComplete,
}: WizardSegmentedControlProps): JSX.Element {
  const options: SegmentedControlOption[] = steps.map((step) => ({
    id: step.id,
    label: step.label,
    active: step.id === activeStepId,
    disabled: !profileComplete,
    title: !profileComplete ? 'Afslut virksomhedsprofilen for at aktivere modulet.' : undefined,
    ariaLabel: step.label,
  }))

  return (
    <SegmentedControl
      options={options}
      onSelect={(stepId) => onSelect(stepId as WizardStep['id'])}
      ariaLabel={`Relevante moduler i ${scope}`}
      role="tablist"
      size="sm"
    />
  )
}
