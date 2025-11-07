/**
 * Grundlayout for Next.js appen og globale wrappers.
 */
import './globals.css'
import '../styles/design-system.css'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { cookies } from 'next/headers'

import AnalyticsProvider from './analytics-provider'
import { PASSWORD_GATE_COOKIE_NAME, isPasswordCookieValid } from '../lib/auth/password-gate'
import { FeatureFlagProvider } from '../lib/feature-flags/FeatureFlagProvider'
import { readFeatureFlagCookies } from '../lib/feature-flags/server'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ESG-rapportering',
  description: 'Start ESG-beregninger direkte i browseren',
  icons: {
    icon: '/icon.svg'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  const initialFlags = readFeatureFlagCookies()
  const cookieStore = cookies()
  const passwordCookie = cookieStore.get(PASSWORD_GATE_COOKIE_NAME)?.value
  const hasPasswordAccess = isPasswordCookieValid(passwordCookie)

  return (
    <html lang="da">
      <body data-password-access={hasPasswordAccess ? 'granted' : 'pending'}>
        <FeatureFlagProvider initialFlags={initialFlags}>{children}</FeatureFlagProvider>
        <AnalyticsProvider />
        <SpeedInsights />
      </body>
    </html>
  )
}
