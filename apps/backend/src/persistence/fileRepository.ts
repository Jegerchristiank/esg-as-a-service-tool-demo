import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

import type { WizardPersistenceDocument } from './document'

export class FileRepository {
  constructor(private readonly filePath: string) {}

  async read(): Promise<WizardPersistenceDocument> {
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

  async write(document: WizardPersistenceDocument): Promise<void> {
    try {
      mkdirSync(dirname(this.filePath), { recursive: true })
      writeFileSync(this.filePath, JSON.stringify(document, null, 2), 'utf-8')
    } catch (error) {
      throw new Error(`Kunne ikke skrive persistence-fil: ${(error as Error).message}`)
    }
  }

  async update(
    mutator: (document: WizardPersistenceDocument) =>
      | WizardPersistenceDocument
      | Promise<WizardPersistenceDocument>,
  ): Promise<WizardPersistenceDocument> {
    const current = await this.read()
    const next = await mutator(current)
    await this.write(next)
    return next
  }
}
