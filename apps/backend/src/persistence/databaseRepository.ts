import { asc, sql } from 'drizzle-orm'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'

import * as schema from './schema'

import type { WizardPersistenceDocument } from './document'
import type { WizardPersistenceRepository } from './wizardService'
import type { PersistedWizardProfile, WizardAuditLogEntry } from '@org/shared/wizard/persistence'
import type { Pool } from 'pg'

type WizardProfileRow = typeof schema.wizardProfiles.$inferSelect
type WizardProfileInsert = typeof schema.wizardProfiles.$inferInsert
type WizardAuditRow = typeof schema.wizardAuditLog.$inferSelect
type ReadClient = Pick<NodePgDatabase<typeof schema>, 'select'>
type WriteClient = Pick<NodePgDatabase<typeof schema>, 'select' | 'insert' | 'delete'>

export class DatabaseRepository implements WizardPersistenceRepository {
  private readonly db: NodePgDatabase<typeof schema>

  constructor(private readonly pool: Pool) {
    this.db = drizzle(pool, { schema })
  }

  async read(): Promise<WizardPersistenceDocument> {
    return this.readDocument(this.db)
  }

  async update(
    mutator: (document: WizardPersistenceDocument) =>
      | WizardPersistenceDocument
      | Promise<WizardPersistenceDocument>,
  ): Promise<WizardPersistenceDocument> {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`select id from ${schema.wizardStorage} where id = 1 for update`)
      const currentDocument = await this.readDocument(tx)
      const nextDocument = await mutator(currentDocument)
      await this.writeDocument(tx, nextDocument)
      return nextDocument
    })
  }

  async write(document: WizardPersistenceDocument): Promise<void> {
    await this.db.transaction(async (tx) => {
      await this.writeDocument(tx, document)
    })
  }

  async dispose(): Promise<void> {
    await this.pool.end()
  }

  private async readDocument(client: ReadClient): Promise<WizardPersistenceDocument> {
    const [storageRow] = await client.select().from(schema.wizardStorage).limit(1)
    const profileRows = await client.select().from(schema.wizardProfiles)
    const auditRows = await client
      .select()
      .from(schema.wizardAuditLog)
      .orderBy(asc(schema.wizardAuditLog.timestamp), asc(schema.wizardAuditLog.id))

    const profiles: Record<string, PersistedWizardProfile> = Object.fromEntries(
      profileRows.map((row) => [row.id, this.mapProfile(row)]),
    )

    const activeProfileId =
      storageRow?.activeProfileId ?? Object.keys(profiles)[0] ?? 'default'

    const auditLog: WizardAuditLogEntry[] = auditRows.map((row) => this.mapAuditRow(row))

    return {
      storage: {
        activeProfileId,
        profiles,
      },
      auditLog,
    }
  }

  private async writeDocument(client: WriteClient, document: WizardPersistenceDocument): Promise<void> {
    await client.delete(schema.wizardProfiles)

    const profileValues: WizardProfileInsert[] = Object.values(document.storage.profiles).map(
      (profile) => ({
        id: profile.id,
        name: profile.name,
        state: profile.state,
        profile: profile.profile,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        history: profile.history,
        responsibilities: profile.responsibilities,
        version: profile.version ?? 1,
      }),
    )

    if (profileValues.length > 0) {
      await client.insert(schema.wizardProfiles).values(profileValues)
    }

    const now = new Date()

    await client
      .insert(schema.wizardStorage)
      .values({
        id: 1,
        activeProfileId: document.storage.activeProfileId,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: schema.wizardStorage.id,
        set: {
          activeProfileId: document.storage.activeProfileId,
          updatedAt: now,
        },
      })

    const existingAuditIds = await client
      .select({ id: schema.wizardAuditLog.id })
      .from(schema.wizardAuditLog)
    const knownIds = new Set(existingAuditIds.map((entry) => entry.id))

    const newEntries = document.auditLog.filter((entry) => !knownIds.has(entry.id))
    if (newEntries.length > 0) {
      await client.insert(schema.wizardAuditLog).values(
        newEntries.map((entry) => ({
          id: entry.id,
          profileId: entry.profileId,
          timestamp: new Date(entry.timestamp),
          userId: entry.userId,
          version: entry.version,
          changes: entry.changes,
        })),
      )
    }
  }

  private mapProfile(row: WizardProfileRow): PersistedWizardProfile {
    return {
      id: row.id,
      name: row.name,
      state: row.state as PersistedWizardProfile['state'],
      profile: row.profile as PersistedWizardProfile['profile'],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      history: row.history as PersistedWizardProfile['history'],
      responsibilities: row.responsibilities as PersistedWizardProfile['responsibilities'],
      version: row.version,
    }
  }

  private mapAuditRow(row: WizardAuditRow): WizardAuditLogEntry {
    return {
      id: row.id,
      profileId: row.profileId,
      timestamp: row.timestamp.toISOString(),
      userId: row.userId,
      version: row.version,
      changes: row.changes,
    }
  }
}
