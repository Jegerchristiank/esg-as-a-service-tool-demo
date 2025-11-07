import { bigint, index, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import type { ModuleInput } from '@org/shared/types'
import type {
  WizardAuditChange,
  WizardFieldHistory,
  WizardResponsibilityIndex,
} from '@org/shared/wizard/persistence'

export const wizardStorage = pgTable('wizard_storage', {
  id: integer('id').primaryKey().default(1),
  activeProfileId: text('active_profile_id').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const wizardProfiles = pgTable('wizard_profiles', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  state: jsonb('state').$type<ModuleInput>().notNull(),
  profile: jsonb('profile').$type<Record<string, boolean | null>>().notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
  history: jsonb('history').$type<WizardFieldHistory>().notNull(),
  responsibilities: jsonb('responsibilities').$type<WizardResponsibilityIndex>().notNull(),
  version: integer('version').notNull(),
})

export const wizardAuditLog = pgTable(
  'wizard_audit_log',
  {
    id: text('id').primaryKey(),
    profileId: text('profile_id').notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
    userId: text('user_id').notNull(),
    version: integer('version').notNull(),
    changes: jsonb('changes').$type<WizardAuditChange[]>().notNull(),
  },
  (table) => ({
    profileIdx: index('wizard_audit_log_profile_idx').on(table.profileId),
    timestampIdx: index('wizard_audit_log_timestamp_idx').on(table.timestamp),
  }),
)
