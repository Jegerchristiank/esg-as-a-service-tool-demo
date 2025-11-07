import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'

type TokenDescriptor = {
  token: string
  userId: string
  roles: string[]
}

export type Environment = {
  port: number
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

export function loadEnvironment(): Environment {
  const port = Number.parseInt(process.env['PERSISTENCE_PORT'] ?? '4010', 10)
  const dataFile = resolve(process.cwd(), process.env['PERSISTENCE_DATA_FILE'] ?? './data/wizard-store.json')
  const tokens = loadTokenRegistry(process.env['PERSISTENCE_TOKENS'])

  return { port, dataFile, tokens }
}

export function ensureDataFileExists(path: string): void {
  try {
    readFileSync(path)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      const initialPayload = JSON.stringify(
        {
          storage: {
            activeProfileId: 'default',
            profiles: {},
          },
          auditLog: [],
        },
        null,
        2,
      )
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(path, initialPayload, { encoding: 'utf-8' })
      return
    }
    throw error
  }
}
