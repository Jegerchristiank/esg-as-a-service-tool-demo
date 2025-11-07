import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

type RedirectInput = string | null | undefined

export const PASSWORD_GATE_COOKIE_NAME = 'eaas-password-access'
export const PASSWORD_GATE_COOKIE_VALUE = 'granted'
export const PASSWORD_GATE_EXPECTED_SECRET = 'esg-as-a-service'

const ONE_DAY_IN_SECONDS = 60 * 60 * 24

export const PASSWORD_GATE_COOKIE_OPTIONS: Omit<ResponseCookie, 'name' | 'value'> = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 30 * ONE_DAY_IN_SECONDS,
}

export function getPasswordFromFormData(formData: FormData): string | null {
  const value = formData.get('password')
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  return trimmed
}

export function getRedirectFromFormData(formData: FormData): string | undefined {
  const redirect = formData.get('redirect')
  if (typeof redirect !== 'string') {
    return undefined
  }

  return sanitizeRedirectPath(redirect)
}

export function sanitizeRedirectPath(input: RedirectInput): string {
  if (typeof input !== 'string') {
    return '/'
  }

  const trimmed = input.trim()
  if (!trimmed) {
    return '/'
  }

  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return '/'
  }

  return trimmed
}

export function isPasswordCorrect(candidate: string): boolean {
  return candidate === PASSWORD_GATE_EXPECTED_SECRET
}

export function isPasswordCookieValid(value: string | undefined): boolean {
  return value === PASSWORD_GATE_COOKIE_VALUE
}
