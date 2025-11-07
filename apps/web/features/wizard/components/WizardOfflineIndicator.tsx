'use client'

import { useWizardContext } from '../useWizard'

type OfflineIndicatorSnapshot = {
  isOffline: boolean
  isReady: boolean
}

export function WizardOfflineIndicator(): JSX.Element | null {
  const { isOffline, isReady } = useWizardContext<OfflineIndicatorSnapshot>((context) => ({
    isOffline: context.isOffline,
    isReady: context.isReady,
  }))

  if (!isReady || !isOffline) {
    return null
  }

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="wizard-offline-indicator"
      className="wizard-shell__offline-indicator"
    >
      <strong>Ingen forbindelse.</strong>{' '}
      Dine ændringer er gemt lokalt og bliver synkroniseret, så snart forbindelsen er gendannet.
    </div>
  )
}
