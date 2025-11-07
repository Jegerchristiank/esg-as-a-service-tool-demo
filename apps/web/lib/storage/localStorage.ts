'use client'

import { createInitialWizardProfile } from '../../src/modules/wizard/profile'

import type {
  PersistedWizardProfile,
  PersistedWizardStorage,
  WizardPersistenceSnapshot,
} from '@org/shared/wizard/persistence'

type PersistenceRequestErrorOptions = {
  status?: number | null
  bodyText?: string
  cause?: unknown
  isNetworkError?: boolean
}

export class PersistenceRequestError extends Error {
  readonly status: number | null
  readonly bodyText: string | null
  readonly isNetworkError: boolean

  constructor(message: string, options: PersistenceRequestErrorOptions = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined)
    this.name = 'PersistenceRequestError'
    this.status = options.status ?? null
    this.bodyText = options.bodyText ?? null
    this.isNetworkError = options.isNetworkError ?? false
  }

  get isServerError(): boolean {
    return typeof this.status === 'number' && this.status >= 500 && this.status < 600
  }
}

export type PersistMetadata = {
  userId: string
  reason?: string
}

const API_BASE_URL = process.env['NEXT_PUBLIC_PERSISTENCE_BASE_URL'] ?? 'http://localhost:4010'
const API_TOKEN = process.env['NEXT_PUBLIC_PERSISTENCE_TOKEN'] ?? 'local-dev-token'

const DEFAULT_PROFILE_ID = 'default'
const DEFAULT_PROFILE_NAME = 'Profil 1'

export function createProfileEntry(
  id: string,
  name: string,
  state: Record<string, unknown> = {},
): PersistedWizardProfile {
  const now = Date.now()
  return {
    id,
    name,
    state,
    profile: createInitialWizardProfile(),
    createdAt: now,
    updatedAt: now,
    history: {},
    responsibilities: {},
    version: 1,
  }
}

export function createFallbackStorage(): PersistedWizardStorage {
  const profile = createProfileEntry(DEFAULT_PROFILE_ID, DEFAULT_PROFILE_NAME)
  return {
    activeProfileId: profile.id,
    profiles: { [profile.id]: profile },
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
        ...(init?.headers ?? {}),
      },
      cache: 'no-store',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected network error'
    throw new PersistenceRequestError(message, {
      cause: error,
      isNetworkError: true,
    })
  }

  if (!response.ok) {
    const bodyText = await response.text()
    const message = bodyText || `Persistence request failed with status ${response.status}`
    throw new PersistenceRequestError(message, {
      status: response.status,
      bodyText,
      cause: { status: response.status, bodyText },
    })
  }

  return (await response.json()) as T
}

export async function fetchWizardSnapshot(): Promise<WizardPersistenceSnapshot> {
  return request<WizardPersistenceSnapshot>('/wizard/snapshot')
}

export async function persistWizardStorage(
  storage: PersistedWizardStorage,
  metadata: PersistMetadata,
): Promise<WizardPersistenceSnapshot> {
  return request<WizardPersistenceSnapshot>('/wizard/snapshot', {
    method: 'PUT',
    body: JSON.stringify({ storage, metadata }),
  })
}
