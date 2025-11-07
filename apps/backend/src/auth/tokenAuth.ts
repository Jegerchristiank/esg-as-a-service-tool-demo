import type { Environment } from '../env'
import type { WizardPermissions, WizardUser } from '@org/shared/wizard/persistence'
import type { IncomingHttpHeaders } from 'node:http'

export type AuthenticatedRequest = {
  user: WizardUser
  permissions: WizardPermissions
}

const ROLE_PERMISSIONS: Record<string, WizardPermissions> = {
  admin: { canEdit: true, canPublish: true },
  editor: { canEdit: true, canPublish: false },
  reviewer: { canEdit: false, canPublish: true },
  viewer: { canEdit: false, canPublish: false },
}

function mergePermissions(roles: string[]): WizardPermissions {
  return roles.reduce<WizardPermissions>(
    (acc, role) => {
      const permissions = ROLE_PERMISSIONS[role]
      if (!permissions) {
        return acc
      }
      return {
        canEdit: acc.canEdit || permissions.canEdit,
        canPublish: acc.canPublish || permissions.canPublish,
      }
    },
    { canEdit: false, canPublish: false },
  )
}

export class TokenAuthenticator {
  private readonly registry: Map<string, { userId: string; roles: string[] }>

  constructor(environment: Environment) {
    this.registry = new Map(environment.tokens.map((entry) => [entry.token, { userId: entry.userId, roles: entry.roles }]))
  }

  authenticate(headers: IncomingHttpHeaders): AuthenticatedRequest | null {
    const header = headers['authorization']
    if (!header || Array.isArray(header)) {
      return null
    }

    const token = header.replace(/^Bearer\s+/i, '').trim()
    if (!token) {
      return null
    }

    const entry = this.registry.get(token)
    if (!entry) {
      return null
    }

    const permissions = mergePermissions(entry.roles)
    const user: WizardUser = { id: entry.userId, roles: entry.roles }

    return { user, permissions }
  }
}
