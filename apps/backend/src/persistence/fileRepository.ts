import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

import type { PersistedWizardStorage, WizardAuditLogEntry } from '@org/shared/wizard/persistence'

export type WizardPersistenceDocument = {
  storage: PersistedWizardStorage
  auditLog: WizardAuditLogEntry[]
}

export class FileRepository {
  constructor(private readonly filePath: string) {}

  read(): WizardPersistenceDocument {
    try {
      const raw = readFileSync(this.filePath, 'utf-8')
      const parsed = JSON.parse(raw) as WizardPersistenceDocument
      if (!parsed.storage) {
        throw new Error('Persisted storage mangler i dokumentet')
      }
      return parsed
    } catch (error) {
      throw new Error(`Kunne ikke læse persistence-fil: ${(error as Error).message}`)
    }
  }

  write(document: WizardPersistenceDocument): void {
    try {
      mkdirSync(dirname(this.filePath), { recursive: true })
      writeFileSync(this.filePath, JSON.stringify(document, null, 2), 'utf-8')
    } catch (error) {
      throw new Error(`Kunne ikke skrive persistence-fil: ${(error as Error).message}`)
    }
  }
}
