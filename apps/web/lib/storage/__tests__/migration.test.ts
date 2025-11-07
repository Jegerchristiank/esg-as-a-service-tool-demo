import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createFallbackStorage,
  fetchWizardSnapshot,
  persistWizardStorage,
  type PersistMetadata,
} from '../localStorage'

import type { PersistedWizardStorage, WizardPersistenceSnapshot } from '@org/shared/wizard/persistence'

describe('wizard persistence client', () => {
  let snapshot: WizardPersistenceSnapshot
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    snapshot = {
      storage: createFallbackStorage(),
      auditLog: [],
      permissions: { canEdit: true, canPublish: false },
      user: { id: 'tester', roles: ['editor'] },
    }

    fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
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

      const body =
        typeof init.body === 'string'
          ? JSON.parse(init.body)
          : ((init.body as unknown) as { storage: PersistedWizardStorage })
      snapshot = {
        storage: body.storage,
        auditLog: [
          {
            id: 'audit-1',
            profileId: body.storage.activeProfileId,
            timestamp: new Date().toISOString(),
            userId: 'tester',
            version: 2,
            changes: [
              {
                field: 'state.B1',
                previous: null,
                next: body.storage.profiles[body.storage.activeProfileId]?.state?.['B1'] ?? null,
              },
            ],
          },
        ],
        permissions: snapshot.permissions,
        user: snapshot.user,
      }

      return new Response(JSON.stringify(snapshot), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    vi.stubGlobal('fetch', fetchMock as typeof fetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetchWizardSnapshot henter data med autorisationsheader', async () => {
    const result = await fetchWizardSnapshot()
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:4010/wizard/snapshot', {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer local-dev-token',
      },
    })
    expect(result.storage.activeProfileId).toBe(snapshot.storage.activeProfileId)
    expect(result.permissions.canEdit).toBe(true)
  })

  it('persistWizardStorage sender metadata og returnerer audit-log fra serveren', async () => {
    const storage = createFallbackStorage()
    const metadata: PersistMetadata = { userId: 'tester', reason: 'unit-test' }

    const result = await persistWizardStorage(storage, metadata)

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:4010/wizard/snapshot', {
      method: 'PUT',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer local-dev-token',
      },
      body: JSON.stringify({ storage, metadata }),
    })

    expect(result.auditLog).toHaveLength(1)
    expect(result.auditLog[0]?.userId).toBe('tester')
    expect(result.auditLog[0]?.changes[0]?.field).toBe('state.B1')
  })

  it('createFallbackStorage genererer standardprofil med gyldigt id', () => {
    const storage = createFallbackStorage()
    expect(storage.activeProfileId).toBeTruthy()
    const active = storage.profiles[storage.activeProfileId]
    expect(active).toBeDefined()
    expect(active?.profile).toBeDefined()
  })
})
