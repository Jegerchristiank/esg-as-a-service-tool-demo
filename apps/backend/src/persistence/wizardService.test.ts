import { describe, expect, it } from 'vitest'

import { WizardPersistenceService, type WizardPersistenceRepository } from './wizardService'
import type { WizardPersistenceDocument } from './document'
import type { PersistedWizardProfile, PersistedWizardStorage } from '@org/shared/wizard/persistence'

class InMemoryRepository implements WizardPersistenceRepository {
  private document: WizardPersistenceDocument

  constructor(initial?: WizardPersistenceDocument) {
    this.document = initial ?? {
      storage: {
        activeProfileId: 'default',
        profiles: {},
      },
      auditLog: [],
    }
  }

  async read(): Promise<WizardPersistenceDocument> {
    return JSON.parse(JSON.stringify(this.document))
  }

  async write(document: WizardPersistenceDocument): Promise<void> {
    this.document = JSON.parse(JSON.stringify(document))
  }
}

describe('WizardPersistenceService', () => {
  it('gemmer nye profiler med versionsnummer og audit-log', async () => {
    const repository: WizardPersistenceRepository = new InMemoryRepository()
    const service = new WizardPersistenceService(repository)

    const profile: PersistedWizardProfile = {
      id: 'profile-1',
      name: 'Profil 1',
      state: {
        B1: {
          electricityConsumptionKwh: 100,
          emissionFactorKgPerKwh: null,
          renewableSharePercent: null,
        },
      },
      profile: { governance: true },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      history: {
        B1: [
          {
            id: 'B1-1',
            field: 'B1',
            timestamp: Date.now(),
            summary: '100 kWh',
            updatedBy: null,
          },
        ],
      },
      responsibilities: {
        B1: [
          {
            path: 'B1.owner',
            value: 'Jane Doe',
          },
        ],
      },
    }

    const storage: PersistedWizardStorage = {
      activeProfileId: 'profile-1',
      profiles: {
        'profile-1': profile,
      },
    }

    const result = await service.save(storage, 'tester')

    expect(result.storage.profiles['profile-1']?.version).toBe(1)
    expect(result.storage.profiles['profile-1']?.history['B1']?.[0]?.updatedBy).toBe('tester')
    expect(result.auditLog).toHaveLength(1)
    const entry = result.auditLog[0]!
    expect(entry.userId).toBe('tester')
    expect(entry.version).toBe(1)
    expect(entry.changes.some((change) => change.field === '__created__')).toBe(true)
  })

  it('registrerer ændringer i audit-loggen ved opdateringer', async () => {
    const createdAt = Date.now() - 1000
    const baseProfile: PersistedWizardProfile = {
      id: 'profile-1',
      name: 'Profil 1',
      state: {
        B1: {
          electricityConsumptionKwh: 100,
          emissionFactorKgPerKwh: null,
          renewableSharePercent: null,
        },
      },
      profile: { governance: true },
      createdAt,
      updatedAt: createdAt,
      history: {},
      responsibilities: {},
      version: 1,
    }

    const repository: WizardPersistenceRepository = new InMemoryRepository({
      storage: {
        activeProfileId: 'profile-1',
        profiles: { 'profile-1': baseProfile },
      },
      auditLog: [],
    })
    const service = new WizardPersistenceService(repository)

    const updatedProfile: PersistedWizardProfile = {
      ...baseProfile,
      state: {
        B1: {
          electricityConsumptionKwh: 250,
          emissionFactorKgPerKwh: null,
          renewableSharePercent: null,
        },
      },
      updatedAt: Date.now(),
      history: {
        B1: [
          {
            id: 'B1-2',
            field: 'B1',
            timestamp: Date.now(),
            summary: '250 kWh',
            updatedBy: null,
          },
        ],
      },
    }

    const storage: PersistedWizardStorage = {
      activeProfileId: 'profile-1',
      profiles: { 'profile-1': updatedProfile },
    }

    const result = await service.save(storage, 'auditor')

    expect(result.auditLog).toHaveLength(1)
    const entry = result.auditLog[0]!
    expect(entry.version).toBe(2)
    expect(entry.changes.some((change) => change.field === 'state.B1')).toBe(true)
    expect(entry.userId).toBe('auditor')
    expect(result.storage.profiles['profile-1']?.version).toBe(2)
    expect(result.storage.profiles['profile-1']?.history['B1']?.[0]?.updatedBy).toBe('auditor')
  })
})
