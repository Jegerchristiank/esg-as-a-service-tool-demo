import { render, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createFallbackStorage,
  type PersistMetadata,
} from '../../../lib/storage/localStorage'
import type { PersistedWizardProfile, PersistedWizardStorage, WizardPersistenceSnapshot } from '@org/shared'
import { WizardProvider, useWizardContext, type WizardHook } from '../useWizard'
import { countPositiveAnswers, isModuleRelevant } from '../../../src/modules/wizard/profile'

function ProfileObserver({ onReady }: { onReady: (wizard: WizardHook) => void }): JSX.Element {
  const wizard = useWizardContext()

  useEffect(() => {
    if (wizard.isReady) {
      onReady(wizard)
    }
  }, [onReady, wizard])

  return <></>
}

describe('useWizard profile normalisation', () => {
  let snapshot: WizardPersistenceSnapshot

  beforeEach(() => {
    const storage = createFallbackStorage()
    const activeProfileId = storage.activeProfileId
    const activeProfile = storage.profiles[activeProfileId]
    if (!activeProfile) {
      throw new Error('Expected fallback profile to exist in storage snapshot')
    }

    const mutatedProfile = { ...activeProfile.profile } as Record<string, unknown>
    mutatedProfile['usesElectricity'] = ' true '
    mutatedProfile['hasVehicles'] = 1
    mutatedProfile['hasHeating'] = 'false'
    mutatedProfile['usesDistrictHeating'] = '0'
    mutatedProfile['leasesWithOwnMeter'] = 'FALSE'
    mutatedProfile['hasLabGas'] = 'yep'

    activeProfile.profile = mutatedProfile as PersistedWizardProfile['profile']

    snapshot = {
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
        const parsed = JSON.parse(body) as { storage: PersistedWizardStorage; metadata: PersistMetadata }
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

  it('coerces persisted profile values to booleans before exposure', async () => {
    const onReady = vi.fn()

    render(
      <WizardProvider>
        <ProfileObserver onReady={onReady} />
      </WizardProvider>,
    )

    await waitFor(() => {
      expect(onReady).toHaveBeenCalled()
    })

    const wizard: WizardHook = onReady.mock.calls.at(-1)![0]
    const { profile, profiles, activeProfileId } = wizard

    expect(profile.usesElectricity).toBe(true)
    expect(typeof profile.usesElectricity).toBe('boolean')
    expect(profile.hasVehicles).toBe(true)
    expect(typeof profile.hasVehicles).toBe('boolean')
    expect(profile.hasHeating).toBe(false)
    expect(typeof profile.hasHeating).toBe('boolean')
    expect(profile.usesDistrictHeating).toBe(false)
    expect(typeof profile.usesDistrictHeating).toBe('boolean')
    expect(profile.leasesWithOwnMeter).toBe(false)
    expect(typeof profile.leasesWithOwnMeter).toBe('boolean')
    expect(profile.hasLabGas).toBeNull()

    const hydratedActiveProfile = profiles[activeProfileId]
    expect(hydratedActiveProfile?.profile.usesElectricity).toBe(true)
    expect(hydratedActiveProfile?.profile.hasVehicles).toBe(true)
    expect(hydratedActiveProfile?.profile.hasLabGas).toBeNull()

    expect(isModuleRelevant(profile, 'B1')).toBe(true)
    expect(isModuleRelevant(profile, 'B2')).toBe(false)
    expect(countPositiveAnswers(profile)).toBe(2)
  })
})
