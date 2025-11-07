/**
 * Hook der styrer wizardens tilstand og navigation.
 */
'use client'


import type { ModuleInput } from '@org/shared'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  createFallbackStorage,
  createProfileEntry,
  fetchWizardSnapshot,
  PersistenceRequestError,
  persistWizardStorage,
  type PersistMetadata,
} from '../../lib/storage/localStorage'
import type {
  PersistedWizardProfile,
  PersistedWizardStorage,
  WizardAuditLogEntry,
  WizardFieldHistory,
  WizardFieldRevision,
  WizardPermissions,
  WizardResponsibilityIndex,
  WizardUser,
} from '@org/shared'
import { wizardSteps } from './steps'
import type { WizardProfileKey } from '../../src/modules/wizard/profile'
import { createInitialWizardProfile, type WizardProfile } from '../../src/modules/wizard/profile'

export type WizardState = ModuleInput

export type WizardProfileId = string

export type WizardProfileEntry = PersistedWizardProfile & { profile: WizardProfile }

export type WizardProfileMap = Record<WizardProfileId, WizardProfileEntry>

export type ActiveProfileState = {
  id: WizardProfileId
  name: string
  state: WizardState
  profile: WizardProfile
  history: WizardFieldHistory
  responsibilities: WizardResponsibilityIndex
}

export type WizardProfileSummary = {
  id: WizardProfileId
  name: string
  isActive: boolean
}

export type WizardHook = {
  currentStep: number
  state: WizardState
  activeState: WizardState
  profile: WizardProfile
  activeProfile: ActiveProfileState
  profiles: WizardProfileMap
  profileSummaries: WizardProfileSummary[]
  activeProfileId: WizardProfileId
  auditTrail: WizardFieldHistory
  responsibilityIndex: WizardResponsibilityIndex
  auditLog: WizardAuditLogEntry[]
  permissions: WizardPermissions
  currentUser: WizardUser
  isReady: boolean
  isOffline: boolean
  remoteError: PersistenceRequestError | null
  goToStep: (index: number) => void
  updateField: (key: string, value: unknown) => void
  updateProfile: (key: WizardProfileKey, value: boolean | null) => void
  createProfile: (name?: string) => void
  switchProfile: (profileId: WizardProfileId) => void
  renameProfile: (profileId: WizardProfileId, name: string) => void
  duplicateProfile: (profileId: WizardProfileId) => void
  deleteProfile: (profileId: WizardProfileId) => void
}

const AUTOSAVE_DELAY = 800
const DEFAULT_STEP_INDEX = wizardSteps.findIndex((step) => step.status === 'ready')
const INITIAL_STEP = DEFAULT_STEP_INDEX === -1 ? 0 : DEFAULT_STEP_INDEX
const HISTORY_LIMIT = 50

type WizardSessionState = {
  storage: PersistedWizardStorage
  permissions: WizardPermissions
  user: WizardUser
  auditLog: WizardAuditLogEntry[]
}

function createInitialSession(): WizardSessionState {
  return {
    storage: createFallbackStorage(),
    permissions: { canEdit: true, canPublish: false },
    user: { id: 'anonymous', roles: [] },
    auditLog: [],
  }
}

function coerceProfileValue(value: unknown): boolean | null {
  if (value === true || value === false) {
    return value
  }

  if (value === null || value === undefined) {
    return null
  }

  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase()
    if (normalised === 'true' || normalised === '1') {
      return true
    }
    if (normalised === 'false' || normalised === '0') {
      return false
    }
    return null
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value === 1) {
      return true
    }
    if (value === 0) {
      return false
    }
  }

  return null
}

function normaliseWizardProfile(
  profile: PersistedWizardProfile['profile'] | Record<string, unknown> | null | undefined,
): WizardProfile {
  const normalised = createInitialWizardProfile()

  if (!isRecord(profile)) {
    return normalised
  }

  const persisted = profile as Record<string, unknown>

  for (const key of Object.keys(normalised) as WizardProfileKey[]) {
    normalised[key] = coerceProfileValue(persisted[key])
  }

  return normalised
}

function generateProfileId(): WizardProfileId {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `profile-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function cloneModuleInput(input: ModuleInput): ModuleInput {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(input)
    } catch (error) {
      console.warn('Kunne ikke structuredClone wizard-state, falder tilbage til JSON-clone', error)
    }
  }

  try {
    return JSON.parse(JSON.stringify(input)) as ModuleInput
  } catch (error) {
    console.warn('Kunne ikke JSON-clone wizard-state, genbruger eksisterende reference', error)
    return input
  }
}

function summariseValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null'
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 140 ? `${trimmed.slice(0, 137)}…` : trimmed
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  try {
    const serialised = JSON.stringify(value)
    return serialised.length > 160 ? `${serialised.slice(0, 157)}…` : serialised
  } catch (error) {
    console.warn('Kunne ikke serialisere værdi til historik', error)
    return '[ukendt]'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function extractResponsibilities(value: unknown, basePath: string): WizardResponsibilityIndex[string] {
  const entries: { path: string; value: string }[] = []

  const collect = (current: unknown, path: string) => {
    if (Array.isArray(current)) {
      current.forEach((item, index) => {
        collect(item, `${path}[${index}]`)
      })
      return
    }

    if (!isRecord(current)) {
      return
    }

    Object.entries(current).forEach(([key, rawValue]) => {
      const nextPath = path ? `${path}.${key}` : key
      const lowered = key.toLowerCase()
      if ((lowered.includes('responsible') || lowered.includes('owner')) && typeof rawValue === 'string') {
        const trimmed = rawValue.trim()
        if (trimmed.length > 0) {
          entries.push({ path: nextPath, value: trimmed })
        }
      }

      if (typeof rawValue === 'object' && rawValue !== null) {
        collect(rawValue, nextPath)
      }
    })
  }

  collect(value, basePath)
  return entries
}


export function useWizard(): WizardHook {
  const [currentStep, setCurrentStep] = useState(INITIAL_STEP)
  const [session, setSession] = useState<WizardSessionState>(() => createInitialSession())
  const [isReady, setIsReady] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [remoteError, setRemoteError] = useState<PersistenceRequestError | null>(null)

  const storageRef = useRef(session.storage)
  const userRef = useRef(session.user)
  const persistTimerRef = useRef<number | null>(null)
  const lastMetadataRef = useRef<PersistMetadata | null>(null)
  const hasPendingSyncRef = useRef(false)
  const persistSequenceRef = useRef(0)

  useEffect(() => {
    storageRef.current = session.storage
  }, [session.storage])

  useEffect(() => {
    userRef.current = session.user
  }, [session.user])

  const syncWithServer = useCallback(
    async (metadata: PersistMetadata) => {
      const requestId = persistSequenceRef.current + 1
      persistSequenceRef.current = requestId
      const persistedStorage = storageRef.current
      try {
        const snapshot = await persistWizardStorage(persistedStorage, metadata)
        if (requestId !== persistSequenceRef.current) {
          return
        }
        const storageChangedSinceRequest = storageRef.current !== persistedStorage
        setSession((prev) => ({
          ...prev,
          storage: storageChangedSinceRequest ? prev.storage : snapshot.storage,
          permissions: snapshot.permissions,
          user: snapshot.user,
          auditLog: snapshot.auditLog,
        }))
        setIsOffline(false)
        setRemoteError(null)
        if (!storageChangedSinceRequest) {
          storageRef.current = snapshot.storage
          hasPendingSyncRef.current = false
        }
        userRef.current = snapshot.user
      } catch (error) {
        console.error('Kunne ikke gemme wizard-data', error)
        if (requestId === persistSequenceRef.current) {
          hasPendingSyncRef.current = false
          if (error instanceof PersistenceRequestError) {
            const shouldShowOffline = error.isNetworkError || error.isServerError
            setIsOffline(shouldShowOffline)
            setRemoteError(shouldShowOffline ? null : error)
          } else {
            setIsOffline(true)
            setRemoteError(null)
          }
        }
      }
    },
    [],
  )

  const queuePersist = useCallback(
    (metadata: PersistMetadata) => {
      if (!isReady) {
        return
      }
      lastMetadataRef.current = metadata
      hasPendingSyncRef.current = true
      if (persistTimerRef.current !== null) {
        window.clearTimeout(persistTimerRef.current)
      }
      persistTimerRef.current = window.setTimeout(() => {
        persistTimerRef.current = null
        const payload = lastMetadataRef.current ?? { userId: userRef.current.id, reason: 'autosave' }
        lastMetadataRef.current = null
        void syncWithServer(payload)
      }, AUTOSAVE_DELAY)
    },
    [isReady, syncWithServer],
  )

  useEffect(() => {
    let isCancelled = false
    ;(async () => {
      try {
        const snapshot = await fetchWizardSnapshot()
        if (isCancelled) {
          return
        }
        setSession({
          storage: snapshot.storage,
          permissions: snapshot.permissions,
          user: snapshot.user,
          auditLog: snapshot.auditLog,
        })
        storageRef.current = snapshot.storage
        userRef.current = snapshot.user
        setIsOffline(false)
        setRemoteError(null)
      } catch (error) {
        console.error('Kunne ikke hente wizard-data', error)
        if (error instanceof PersistenceRequestError) {
          const shouldShowOffline = error.isNetworkError || error.isServerError
          setIsOffline(shouldShowOffline)
          setRemoteError(shouldShowOffline ? null : error)
        } else {
          setIsOffline(true)
          setRemoteError(null)
        }
      } finally {
        if (!isCancelled) {
          setIsReady(true)
        }
      }
    })()
    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isReady) {
      return
    }
    const handleBeforeUnload = () => {
      if (persistTimerRef.current !== null) {
        window.clearTimeout(persistTimerRef.current)
        persistTimerRef.current = null
      }
      if (!hasPendingSyncRef.current && !lastMetadataRef.current) {
        return
      }
      const payload = lastMetadataRef.current ?? { userId: userRef.current.id, reason: 'before-unload' }
      lastMetadataRef.current = null
      hasPendingSyncRef.current = false
      void syncWithServer(payload)
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isReady, syncWithServer])

  useEffect(() => {
    return () => {
      if (persistTimerRef.current !== null) {
        window.clearTimeout(persistTimerRef.current)
        persistTimerRef.current = null
      }
      if (!isReady) {
        return
      }
      if (!hasPendingSyncRef.current && !lastMetadataRef.current) {
        return
      }
      const payload = lastMetadataRef.current ?? { userId: userRef.current.id, reason: 'cleanup' }
      lastMetadataRef.current = null
      hasPendingSyncRef.current = false
      void syncWithServer(payload)
    }
  }, [isReady, syncWithServer])

  const goToStep = useCallback((index: number) => {
    setCurrentStep(Math.max(0, Math.min(index, wizardSteps.length - 1)))
  }, [])

  const updateField = useCallback(
    (key: string, value: unknown) => {
      let metadata: PersistMetadata | null = null
      setSession((prev) => {
        const active = prev.storage.profiles[prev.storage.activeProfileId]
        if (!active) {
          return prev
        }
        if (!prev.permissions.canEdit) {
          console.warn('Brugeren har ikke rettigheder til at redigere data')
          return prev
        }

        const now = Date.now()
        const revision: WizardFieldRevision = {
          id: `${key}-${now}`,
          field: key,
          timestamp: now,
          summary: summariseValue(value),
          updatedBy: prev.user.id,
        }

        const nextHistoryForField = [...(active.history[key] ?? []), revision].slice(-HISTORY_LIMIT)
        const nextHistory: WizardFieldHistory = {
          ...active.history,
          [key]: nextHistoryForField,
        }

        const responsibilityEntries = extractResponsibilities(value, key)
        const nextResponsibilities: WizardResponsibilityIndex = { ...active.responsibilities }

        if (responsibilityEntries.length > 0) {
          nextResponsibilities[key] = responsibilityEntries
        } else if (nextResponsibilities[key]) {
          delete nextResponsibilities[key]
        }

        const nextProfile: PersistedWizardProfile = {
          ...active,
          state: { ...active.state, [key]: value },
          updatedAt: now,
          history: nextHistory,
          responsibilities: nextResponsibilities,
          version: (active.version ?? 1) + 1,
        }

        const nextStorage: PersistedWizardStorage = {
          ...prev.storage,
          profiles: {
            ...prev.storage.profiles,
            [prev.storage.activeProfileId]: nextProfile,
          },
        }
        storageRef.current = nextStorage
        metadata = { userId: prev.user.id, reason: `field:${key}` }
        return {
          ...prev,
          storage: nextStorage,
        }
      })
      if (metadata) {
        queuePersist(metadata)
      }
    },
    [queuePersist],
  )

  const updateProfile = useCallback(
    (key: WizardProfileKey, value: boolean | null) => {
      let metadata: PersistMetadata | null = null
      setSession((prev) => {
        const active = prev.storage.profiles[prev.storage.activeProfileId]
        if (!active) {
          return prev
        }
        if (!prev.permissions.canEdit) {
          console.warn('Brugeren har ikke rettigheder til at redigere profilindstillinger')
          return prev
        }
        const now = Date.now()
        const nextProfile: PersistedWizardProfile = {
          ...active,
          profile: { ...active.profile, [key]: value },
          updatedAt: now,
          version: (active.version ?? 1) + 1,
        }
        const nextStorage: PersistedWizardStorage = {
          ...prev.storage,
          profiles: {
            ...prev.storage.profiles,
            [prev.storage.activeProfileId]: nextProfile,
          },
        }
        storageRef.current = nextStorage
        metadata = { userId: prev.user.id, reason: `profile:${String(key)}` }
        return {
          ...prev,
          storage: nextStorage,
        }
      })
      if (metadata) {
        queuePersist(metadata)
      }
    },
    [queuePersist],
  )

  const createProfile = useCallback(
    (name?: string) => {
      setCurrentStep(0)
      let metadata: PersistMetadata | null = null
      setSession((prev) => {
        if (!prev.permissions.canEdit) {
          console.warn('Brugeren har ikke rettigheder til at oprette profiler')
          return prev
        }
        const id = generateProfileId()
        const profileName = name?.trim() || `Profil ${Object.keys(prev.storage.profiles).length + 1}`
        const newProfile = createProfileEntry(id, profileName)
        const nextStorage: PersistedWizardStorage = {
          activeProfileId: id,
          profiles: { ...prev.storage.profiles, [id]: newProfile },
        }
        storageRef.current = nextStorage
        metadata = { userId: prev.user.id, reason: 'profile:create' }
        return {
          ...prev,
          storage: nextStorage,
        }
      })
      if (metadata) {
        queuePersist(metadata)
      }
    },
    [queuePersist],
  )

  const switchProfile = useCallback((profileId: WizardProfileId) => {
    setSession((prev) => {
      if (!prev.storage.profiles[profileId] || prev.storage.activeProfileId === profileId) {
        return prev
      }
      const nextStorage: PersistedWizardStorage = {
        ...prev.storage,
        activeProfileId: profileId,
      }
      storageRef.current = nextStorage
      return {
        ...prev,
        storage: nextStorage,
      }
    })
  }, [])

  const renameProfile = useCallback(
    (profileId: WizardProfileId, name: string) => {
      let metadata: PersistMetadata | null = null
      setSession((prev) => {
        const target = prev.storage.profiles[profileId]
        if (!target) {
          return prev
        }
        if (!prev.permissions.canEdit) {
          console.warn('Brugeren har ikke rettigheder til at omdøbe profiler')
          return prev
        }
        const trimmed = name.trim()
        if (trimmed.length === 0 || trimmed === target.name) {
          return prev
        }
        const nextProfile: PersistedWizardProfile = {
          ...target,
          name: trimmed,
          updatedAt: Date.now(),
          version: (target.version ?? 1) + 1,
        }
        const nextStorage: PersistedWizardStorage = {
          ...prev.storage,
          profiles: {
            ...prev.storage.profiles,
            [profileId]: nextProfile,
          },
        }
        storageRef.current = nextStorage
        metadata = { userId: prev.user.id, reason: 'profile:rename' }
        return {
          ...prev,
          storage: nextStorage,
        }
      })
      if (metadata) {
        queuePersist(metadata)
      }
    },
    [queuePersist],
  )

  const duplicateProfile = useCallback(
    (profileId: WizardProfileId) => {
      let metadata: PersistMetadata | null = null
      setSession((prev) => {
        const target = prev.storage.profiles[profileId]
        if (!target) {
          return prev
        }
        if (!prev.permissions.canEdit) {
          console.warn('Brugeren har ikke rettigheder til at duplikere profiler')
          return prev
        }
        const id = generateProfileId()
        const now = Date.now()
        const clone: PersistedWizardProfile = {
          id,
          name: `${target.name} (kopi)`,
          state: cloneModuleInput(target.state),
          profile: normaliseWizardProfile(target.profile),
          createdAt: now,
          updatedAt: now,
          history: Object.entries(target.history).reduce<WizardFieldHistory>((acc, [field, revisions]) => {
            acc[field] = revisions.map((revision) => ({ ...revision, updatedBy: prev.user.id }))
            return acc
          }, {}),
          responsibilities: Object.entries(target.responsibilities).reduce<WizardResponsibilityIndex>((acc, [field, entries]) => {
            acc[field] = entries.map((entry) => ({ ...entry }))
            return acc
          }, {}),
          version: 1,
        }
        const nextStorage: PersistedWizardStorage = {
          activeProfileId: id,
          profiles: { ...prev.storage.profiles, [id]: clone },
        }
        storageRef.current = nextStorage
        metadata = { userId: prev.user.id, reason: 'profile:duplicate' }
        return {
          ...prev,
          storage: nextStorage,
        }
      })
      if (metadata) {
        queuePersist(metadata)
      }
    },
    [queuePersist],
  )

  const deleteProfile = useCallback(
    (profileId: WizardProfileId) => {
      let metadata: PersistMetadata | null = null
      setSession((prev) => {
        if (!prev.permissions.canEdit) {
          console.warn('Brugeren har ikke rettigheder til at slette profiler')
          return prev
        }
        if (!prev.storage.profiles[profileId]) {
          return prev
        }

        const nextProfiles = { ...prev.storage.profiles }
        delete nextProfiles[profileId]

        if (Object.keys(nextProfiles).length === 0) {
          const id = generateProfileId()
          const fallback = createProfileEntry(id, 'Profil 1')
          const nextStorage: PersistedWizardStorage = {
            activeProfileId: id,
            profiles: { [id]: fallback },
          }
          storageRef.current = nextStorage
          metadata = { userId: prev.user.id, reason: 'profile:reset' }
          return {
            ...prev,
            storage: nextStorage,
          }
        }

        const fallbackId = Object.keys(nextProfiles)[0] ?? prev.storage.activeProfileId
        const nextActiveId = profileId === prev.storage.activeProfileId ? fallbackId : prev.storage.activeProfileId

        const nextStorage: PersistedWizardStorage = {
          activeProfileId: nextActiveId,
          profiles: nextProfiles,
        }
        storageRef.current = nextStorage
        metadata = { userId: prev.user.id, reason: 'profile:delete' }
        return {
          ...prev,
          storage: nextStorage,
        }
      })
      if (metadata) {
        queuePersist(metadata)
      }
    },
    [queuePersist],
  )

  const value = useMemo(() => {
    const normalisedProfiles = Object.entries(session.storage.profiles).reduce<WizardProfileMap>((acc, [id, entry]) => {
      acc[id] = { ...entry, profile: normaliseWizardProfile(entry.profile) }
      return acc
    }, {} as WizardProfileMap)

    let fallbackProfile = normalisedProfiles[session.storage.activeProfileId]
    if (!fallbackProfile) {
      fallbackProfile = {
        id: session.storage.activeProfileId,
        name: 'Profil 1',
        state: {},
        profile: createInitialWizardProfile(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        history: {},
        responsibilities: {},
        version: 1,
      }
      normalisedProfiles[session.storage.activeProfileId] = fallbackProfile
    }

    const active: ActiveProfileState = {
      id: fallbackProfile.id,
      name: fallbackProfile.name,
      state: fallbackProfile.state,
      profile: fallbackProfile.profile,
      history: fallbackProfile.history ?? {},
      responsibilities: fallbackProfile.responsibilities ?? {},
    }

    const summaries: WizardProfileSummary[] = Object.values(normalisedProfiles).map((entry) => ({
      id: entry.id,
      name: entry.name,
      isActive: entry.id === fallbackProfile.id,
    }))

    return {
      currentStep,
      state: active.state,
      activeState: active.state,
      goToStep,
      updateField,
      profile: active.profile,
      auditTrail: active.history,
      responsibilityIndex: active.responsibilities,
      updateProfile,
      activeProfile: active,
      profiles: normalisedProfiles,
      profileSummaries: summaries,
      activeProfileId: active.id,
      createProfile,
      switchProfile,
      renameProfile,
      duplicateProfile,
      deleteProfile,
      auditLog: session.auditLog,
      permissions: session.permissions,
      currentUser: session.user,
      isReady,
      isOffline,
      remoteError,
    }
  }, [
    createProfile,
    currentStep,
    deleteProfile,
    duplicateProfile,
    goToStep,
    renameProfile,
    session.auditLog,
    session.permissions,
    session.storage.profiles,
    session.storage.activeProfileId,
    session.user,
    switchProfile,
    updateField,
    updateProfile,
    isReady,
    isOffline,
    remoteError,
  ])

  return value
}

const WizardContext = createContext<WizardHook | undefined>(undefined)

type WizardProviderProps = {
  children: ReactNode
}

export function WizardProvider({ children }: WizardProviderProps): JSX.Element {
  const value = useWizard()
  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
}

export function useWizardContext(): WizardHook
export function useWizardContext<T>(selector: (context: WizardHook) => T): T
export function useWizardContext<T>(selector?: (context: WizardHook) => T): WizardHook | T {
  const context = useContext(WizardContext)
  if (!context) {
    throw new Error('useWizardContext skal anvendes inden for en WizardProvider')
  }

  if (!selector) {
    return context
  }

  return useMemo(() => selector(context), [context, selector])
}
