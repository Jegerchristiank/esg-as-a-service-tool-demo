import { act, render, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFallbackStorage } from '../../../lib/storage/localStorage'
import type { PersistedWizardStorage, WizardPersistenceSnapshot } from '@org/shared'

vi.mock('../../wizard/steps', () => ({
  wizardSteps: [
    {
      id: 'B1',
      label: 'B1 – Scope 2 elforbrug',
      component: () => null,
      scope: 'Scope 2',
      status: 'ready' as const,
    },
  ],
}))

import { WizardProvider, type WizardHook, useWizardContext } from '../../wizard/useWizard'
import { useLiveResults } from '../useLiveResults'

function TestHarness({
  onUpdate,
  wizardRef,
}: {
  onUpdate: (snapshot: {
    activeProfileId: string
    b1Value: number | null
  }) => void
  wizardRef: { current: WizardHook | null }
}): JSX.Element {
  const wizard = useWizardContext()
  const { results, activeProfileId } = useLiveResults()

  const b1Result = results.find((entry) => entry.moduleId === 'B1')
  const b1Value = b1Result?.result.value ?? null

  if (wizardRef.current !== wizard) {
    wizardRef.current = wizard
  }

  useEffect(() => {
    onUpdate({ activeProfileId, b1Value })
  }, [activeProfileId, b1Value, onUpdate])

  return <></>
}

describe('useLiveResults', () => {
beforeEach(() => {
    const storage = createFallbackStorage()
    const snapshot: WizardPersistenceSnapshot = {
      storage,
      auditLog: [],
      permissions: { canEdit: true, canPublish: false },
      user: { id: 'tester', roles: ['editor'] },
    }

    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
      if (!url.endsWith('/wizard/snapshot')) {
        return new Response('Not Found', { status: 404 })
      }

      if (!init || !init.method || init.method.toUpperCase() === 'GET') {
        return new Response(JSON.stringify(snapshot), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const body = init.body
      if (typeof body === 'string') {
        const parsed = JSON.parse(body) as { storage: PersistedWizardStorage }
        snapshot.storage = parsed.storage
      }

      return new Response(JSON.stringify(snapshot), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllTimers()
  })

  it('recomputes results when switching between profiles', async () => {
    const wizardRef: { current: WizardHook | null } = { current: null }
    const updates: Array<{ activeProfileId: string; b1Value: number | null }> = []

    render(
      <WizardProvider>
        <TestHarness
          wizardRef={wizardRef}
          onUpdate={(snapshot) => {
            updates.push(snapshot)
          }}
        />
      </WizardProvider>
    )

    await waitFor(() => {
      expect(wizardRef.current?.isReady).toBe(true)
    })

    const wizard = wizardRef.current!

    await waitFor(() => {
      expect(updates.at(-1)?.b1Value).not.toBeNull()
    })

    const initialProfileId = updates.at(-1)!.activeProfileId

    // Profil 1: indtastning for B1
    await act(async () => {
      wizard.updateField('B1', {
        electricityConsumptionKwh: 1000,
        emissionFactorKgPerKwh: 0.3,
        renewableSharePercent: 0,
      })
    })

    await waitFor(() => {
      expect(updates.at(-1)?.b1Value).not.toBeNull()
    })

    const profileOneValue = updates.at(-1)!.b1Value

    // Opret og skift til profil 2
    await act(async () => {
      wizard.createProfile('Profil 2')
    })

    await waitFor(() => {
      expect(updates.at(-1)?.activeProfileId).not.toBe(initialProfileId)
    })

    const secondProfileId = updates.at(-1)!.activeProfileId

    // Profil 2: anden indtastning for B1
    await act(async () => {
      wizard.updateField('B1', {
        electricityConsumptionKwh: 500,
        emissionFactorKgPerKwh: 0.4,
        renewableSharePercent: 50,
      })
    })

    await waitFor(() => {
      const latestValue = updates.at(-1)?.b1Value
      expect(latestValue).not.toBeNull()
      expect(latestValue).not.toBe(profileOneValue)
    })

    const profileTwoValue = updates.at(-1)!.b1Value

    // Skift tilbage til profil 1
    await act(async () => {
      wizard.switchProfile(initialProfileId)
    })

    await waitFor(() => {
      const snapshot = updates.at(-1)
      expect(snapshot?.activeProfileId).toBe(initialProfileId)
      expect(snapshot?.b1Value).toBeCloseTo(profileOneValue ?? 0, 3)
    })

    // Skift igen til profil 2 og verificer resultaterne
    await act(async () => {
      wizard.switchProfile(secondProfileId)
    })

    await waitFor(() => {
      const snapshot = updates.at(-1)
      expect(snapshot?.activeProfileId).toBe(secondProfileId)
      expect(snapshot?.b1Value).toBeCloseTo(profileTwoValue ?? 0, 3)
    })
  })
})
