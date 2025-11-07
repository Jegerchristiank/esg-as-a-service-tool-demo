'use client'

import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { useFormState, useFormStatus } from 'react-dom'

import { verifyPasswordAccess, type PasswordGateFormState } from './actions'
import { PrimaryButton } from '../../components/ui/PrimaryButton'
import { sanitizeRedirectPath } from '../../lib/auth/password-gate'

const INITIAL_FORM_STATE: PasswordGateFormState = { status: 'idle' }

export default function AccessPage(): JSX.Element {
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get('redirect')

  const redirectValue = useMemo(() => sanitizeRedirectPath(redirectParam ?? undefined), [redirectParam])
  const [formState, formAction] = useFormState(verifyPasswordAccess, INITIAL_FORM_STATE)

  return (
    <main className="ds-stack" style={{ minHeight: '100vh', justifyContent: 'center' }}>
      <div className="ds-stack ds-constrain" style={{ gap: 'var(--space-2xl)', maxWidth: '32rem', padding: 'var(--space-xl)' }}>
        <header className="ds-stack" style={{ gap: 'var(--space-md)' }}>
          <h1 className="ds-heading-lg">Beskyttet adgang</h1>
          <p className="ds-text-md" style={{ color: 'var(--color-fg-muted)' }}>
            Indtast adgangskoden for at åbne beregningsværktøjet. Kontakt ESG-teamet hvis du mangler legitimationsoplysninger.
          </p>
        </header>

        <form action={formAction} className="ds-stack" style={{ gap: 'var(--space-lg)' }}>
          {redirectParam ? <input type="hidden" name="redirect" value={redirectValue} /> : null}

          <div className="ds-stack" style={{ gap: 'var(--space-sm)' }}>
            <label className="ds-label" htmlFor="password">
              Adgangskode
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              className="ds-input"
              aria-invalid={formState.status === 'error'}
              required
            />
            {formState.status === 'error' ? (
              <p role="alert" className="ds-text-sm" style={{ color: 'var(--color-danger-600)' }}>
                {formState.message}
              </p>
            ) : null}
          </div>

          <SubmitButton />
        </form>
      </div>
    </main>
  )
}

function SubmitButton(): JSX.Element {
  const { pending } = useFormStatus()

  return (
    <PrimaryButton type="submit" loading={pending}>
      Fortsæt
    </PrimaryButton>
  )
}
