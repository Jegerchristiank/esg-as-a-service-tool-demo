import type { ModuleInput } from '../types'

export type WizardFieldRevision = {
  id: string
  field: string
  timestamp: number
  summary: string
  updatedBy: string | null
}

export type WizardFieldHistory = Record<string, WizardFieldRevision[]>

export type WizardResponsibilityEntry = {
  path: string
  value: string
}

export type WizardResponsibilityIndex = Record<string, WizardResponsibilityEntry[]>

export type PersistedWizardProfile = {
  id: string
  name: string
  state: ModuleInput
  profile: Record<string, boolean | null>
  createdAt: number
  updatedAt: number
  history: WizardFieldHistory
  responsibilities: WizardResponsibilityIndex
  version?: number
}

export type PersistedWizardStorage = {
  activeProfileId: string
  profiles: Record<string, PersistedWizardProfile>
}

export type WizardAuditChange = {
  field: string
  previous: unknown
  next: unknown
}

export type WizardAuditLogEntry = {
  id: string
  profileId: string
  timestamp: string
  userId: string
  version: number
  changes: WizardAuditChange[]
}

export type WizardPermissions = {
  canEdit: boolean
  canPublish: boolean
}

export type WizardUser = {
  id: string
  roles: string[]
}

export type WizardPersistenceSnapshot = {
  storage: PersistedWizardStorage
  auditLog: WizardAuditLogEntry[]
  permissions: WizardPermissions
  user: WizardUser
}
