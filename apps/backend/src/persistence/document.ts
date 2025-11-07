import type { PersistedWizardStorage, WizardAuditLogEntry } from '@org/shared/wizard/persistence'

export type WizardPersistenceDocument = {
  storage: PersistedWizardStorage
  auditLog: WizardAuditLogEntry[]
}
