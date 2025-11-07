import { randomUUID } from 'node:crypto'

import type { WizardPersistenceDocument } from './document'
import type {
  PersistedWizardProfile,
  PersistedWizardStorage,
  WizardAuditChange,
  WizardAuditLogEntry,
  WizardFieldHistory,
} from '@org/shared/wizard/persistence'

export interface WizardPersistenceRepository {
  read(): Promise<WizardPersistenceDocument>
  update(
    mutator: (document: WizardPersistenceDocument) =>
      | WizardPersistenceDocument
      | Promise<WizardPersistenceDocument>,
  ): Promise<WizardPersistenceDocument>
}

function cloneHistory(history: WizardFieldHistory | undefined, userId: string): WizardFieldHistory {
  if (!history) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(history).map(([field, revisions]): [string, WizardFieldHistory[string]] => {
      const normalisedRevisions = (revisions ?? []).map((revision) => ({
        ...revision,
        updatedBy: revision.updatedBy ?? userId,
      }))

      return [field, normalisedRevisions]
    }),
  )
}

function computeStateChanges(previous: PersistedWizardProfile | undefined, next: PersistedWizardProfile): WizardAuditChange[] {
  if (!previous) {
    return [
      {
        field: '__created__',
        previous: null,
        next,
      },
    ]
  }

  const changes: WizardAuditChange[] = []

  if (previous.name !== next.name) {
    changes.push({ field: 'name', previous: previous.name, next: next.name })
  }

  const prevState = previous.state ?? {}
  const nextState = next.state ?? {}
  const stateKeys = new Set([...Object.keys(prevState), ...Object.keys(nextState)])
  for (const key of stateKeys) {
    const prevValue = prevState[key]
    const nextValue = nextState[key]
    if (JSON.stringify(prevValue) !== JSON.stringify(nextValue)) {
      changes.push({ field: `state.${key}`, previous: prevValue ?? null, next: nextValue ?? null })
    }
  }

  const prevProfile = previous.profile ?? {}
  const nextProfile = next.profile ?? {}
  const profileKeys = new Set([...Object.keys(prevProfile), ...Object.keys(nextProfile)])
  for (const key of profileKeys) {
    const prevValue = prevProfile[key]
    const nextValue = nextProfile[key]
    if (prevValue !== nextValue) {
      changes.push({ field: `profile.${key}`, previous: prevValue ?? null, next: nextValue ?? null })
    }
  }

  const prevResponsibilities = previous.responsibilities ?? {}
  const nextResponsibilities = next.responsibilities ?? {}
  const responsibilityKeys = new Set([...Object.keys(prevResponsibilities), ...Object.keys(nextResponsibilities)])
  for (const key of responsibilityKeys) {
    const prevValue = prevResponsibilities[key]
    const nextValue = nextResponsibilities[key]
    if (JSON.stringify(prevValue) !== JSON.stringify(nextValue)) {
      changes.push({ field: `responsibilities.${key}`, previous: prevValue ?? null, next: nextValue ?? null })
    }
  }

  return changes
}

function nextVersion(previous: PersistedWizardProfile | undefined, hasChanges: boolean): number {
  if (!previous) {
    return 1
  }
  const baseVersion = previous.version ?? 0
  return hasChanges ? baseVersion + 1 : baseVersion
}

function createAuditEntry(
  profileId: string,
  userId: string,
  version: number,
  changes: WizardAuditChange[],
): WizardAuditLogEntry {
  return {
    id: `${profileId}-${randomUUID()}`,
    profileId,
    timestamp: new Date().toISOString(),
    userId,
    version,
    changes,
  }
}

export class WizardPersistenceService {
  constructor(private readonly repository: WizardPersistenceRepository) {}

  async load(): Promise<WizardPersistenceDocument> {
    return this.repository.read()
  }

  async save(nextStorage: PersistedWizardStorage, userId: string): Promise<WizardPersistenceDocument> {
    return this.repository.update(async (document) => {
      const previousProfiles: Record<string, PersistedWizardProfile> = document.storage.profiles
      const nextProfiles: Record<string, PersistedWizardProfile> = {}
      const auditEntries: WizardAuditLogEntry[] = []

      const nextProfileEntries = Object.entries(nextStorage.profiles) as [
        string,
        PersistedWizardProfile,
      ][]

      for (const [profileId, profile] of nextProfileEntries) {
        const previous = previousProfiles[profileId]
        const changes = computeStateChanges(previous, profile)
        const hasChanges = changes.length > 0
        const version = nextVersion(previous, hasChanges)

        const normalised: PersistedWizardProfile = {
          ...profile,
          version,
          history: cloneHistory(profile.history, userId),
        }

        nextProfiles[profileId] = normalised

        if (hasChanges) {
          auditEntries.push(createAuditEntry(profileId, userId, version, changes))
        }
      }

      for (const [profileId, previous] of Object.entries(previousProfiles) as [
        string,
        PersistedWizardProfile,
      ][]) {
        if (!nextProfiles[profileId]) {
          const version = (previous.version ?? 0) + 1
          auditEntries.push(
            createAuditEntry(profileId, userId, version, [
              {
                field: '__deleted__',
                previous,
                next: null,
              },
            ]),
          )
        }
      }

      const activeProfileId =
        nextProfiles[nextStorage.activeProfileId] !== undefined
          ? nextStorage.activeProfileId
          : Object.keys(nextProfiles)[0] ?? document.storage.activeProfileId

      return {
        storage: {
          activeProfileId,
          profiles: nextProfiles,
        },
        auditLog: [...document.auditLog, ...auditEntries],
      }
    })
  }
}
