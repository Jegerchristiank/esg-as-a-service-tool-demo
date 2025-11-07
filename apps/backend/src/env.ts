import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import type { WizardPersistenceDocument } from './persistence/document'

type TokenDescriptor = {
  token: string
  userId: string
  roles: string[]
}

export type Environment = {
  port: number
  databaseUrl: string
  dataFile: string
  tokens: TokenDescriptor[]
}

function parseTokenDescriptor(value: string): TokenDescriptor | null {
  const [token, userId, roles] = value.split(':')
  if (!token || !userId) {
    return null
  }
  const parsedRoles = roles ? roles.split('|').map((role) => role.trim()).filter(Boolean) : []
  return { token, userId, roles: parsedRoles }
}

function loadTokenRegistry(raw: string | undefined): TokenDescriptor[] {
  if (!raw) {
    return [
      { token: 'local-dev-token', userId: 'local-developer', roles: ['admin', 'editor'] },
    ]
  }
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map(parseTokenDescriptor)
    .filter((descriptor): descriptor is TokenDescriptor => descriptor !== null)
}

const INITIAL_DOCUMENT: WizardPersistenceDocument = {
  storage: {
    activeProfileId: 'default',
    profiles: {},
  },
  auditLog: [],
}

export function loadEnvironment(): Environment {
  const port = Number.parseInt(process.env['PERSISTENCE_PORT'] ?? '4010', 10)
  const databaseUrl = process.env['PERSISTENCE_DATABASE_URL']
  if (!databaseUrl) {
    throw new Error('PERSISTENCE_DATABASE_URL skal være sat')
  }
  const dataFile = resolve(
    process.cwd(),
    process.env['PERSISTENCE_DATA_FILE'] ?? './data/wizard-store.json',
  )
  const tokens = loadTokenRegistry(process.env['PERSISTENCE_TOKENS'])

  return { port, databaseUrl, dataFile, tokens }
}

export function ensureDataFileExists(path: string): void {
  try {
    readFileSync(path)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(path, JSON.stringify(INITIAL_DOCUMENT, null, 2), { encoding: 'utf-8' })
      return
    }
    throw error
  }
}
