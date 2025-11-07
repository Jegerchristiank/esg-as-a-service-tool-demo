import { asc } from 'drizzle-orm'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import type { WizardPersistenceDocument } from './document'
import * as schema from './schema'
import type { PersistedWizardProfile, WizardAuditLogEntry } from '@org/shared/wizard/persistence'
import type { WizardPersistenceRepository } from './wizardService'

type WizardProfileRow = typeof schema.wizardProfiles.$inferSelect
type WizardProfileInsert = typeof schema.wizardProfiles.$inferInsert
type WizardAuditRow = typeof schema.wizardAuditLog.$inferSelect

export class DatabaseRepository implements WizardPersistenceRepository {
  private readonly db: NodePgDatabase<typeof schema>

  constructor(private readonly pool: Pool) {
    this.db = drizzle(pool, { schema })
  }

  async read(): Promise<WizardPersistenceDocument> {
    const [storageRow] = await this.db.select().from(schema.wizardStorage).limit(1)
    const profileRows = await this.db.select().from(schema.wizardProfiles)
    const auditRows = await this.db
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

  async write(document: WizardPersistenceDocument): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.delete(schema.wizardProfiles)

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
        await tx.insert(schema.wizardProfiles).values(profileValues)
      }

      const now = new Date()

      await tx
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

      const existingAuditIds = await tx
        .select({ id: schema.wizardAuditLog.id })
        .from(schema.wizardAuditLog)
      const knownIds = new Set(existingAuditIds.map((entry) => entry.id))

      const newEntries = document.auditLog.filter((entry) => !knownIds.has(entry.id))
      if (newEntries.length > 0) {
        await tx.insert(schema.wizardAuditLog).values(
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
    })
  }

  async dispose(): Promise<void> {
    await this.pool.end()
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
