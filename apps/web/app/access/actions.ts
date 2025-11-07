'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import {
  PASSWORD_GATE_COOKIE_NAME,
  PASSWORD_GATE_COOKIE_OPTIONS,
  PASSWORD_GATE_COOKIE_VALUE,
  getPasswordFromFormData,
  getRedirectFromFormData,
  isPasswordCorrect,
} from '../../lib/auth/password-gate'

export type PasswordGateFormState =
  | { status: 'idle'; message?: undefined }
  | { status: 'error'; message: string }

const INVALID_PASSWORD_STATE: PasswordGateFormState = {
  status: 'error',
  message: 'Adgangskoden er forkert. Prøv igen.',
}

const MISSING_PASSWORD_STATE: PasswordGateFormState = {
  status: 'error',
  message: 'Indtast adgangskoden for at fortsætte.',
}

export async function verifyPasswordAccess(
  _prevState: PasswordGateFormState,
  formData: FormData,
): Promise<PasswordGateFormState> {
  const password = getPasswordFromFormData(formData)
  if (!password) {
    return MISSING_PASSWORD_STATE
  }

  if (!isPasswordCorrect(password)) {
    return INVALID_PASSWORD_STATE
  }

  const redirectTarget = getRedirectFromFormData(formData) ?? '/'
  const cookieStore = cookies()
  cookieStore.set(PASSWORD_GATE_COOKIE_NAME, PASSWORD_GATE_COOKIE_VALUE, PASSWORD_GATE_COOKIE_OPTIONS)

  redirect(redirectTarget)
}
