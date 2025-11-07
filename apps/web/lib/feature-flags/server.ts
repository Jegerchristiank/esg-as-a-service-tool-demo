import { cookies } from 'next/headers'

import {
  FEATURE_FLAG_COOKIE_PREFIX,
  createInitialFeatureState,
  normaliseFlagValue,
  type FeatureFlagKey,
  type FeatureFlagState,
} from './config'

type CookieStore = ReturnType<typeof cookies>

export function readFeatureFlagCookies(store: CookieStore = cookies()): FeatureFlagState {
  const baseState = createInitialFeatureState()
  const entries = store.getAll?.() ?? []
  const overrides: Partial<FeatureFlagState> = {}

  for (const entry of entries) {
    if (!entry || typeof entry.name !== 'string') {
      continue
    }
    if (!entry.name.startsWith(FEATURE_FLAG_COOKIE_PREFIX)) {
      continue
    }
    const flagKey = entry.name.replace(FEATURE_FLAG_COOKIE_PREFIX, '') as FeatureFlagKey
    if (!(flagKey in baseState)) {
      continue
    }
    const parsed = normaliseFlagValue(entry.value)
    if (parsed === null) {
      continue
    }
    overrides[flagKey] = parsed
  }

  return createInitialFeatureState(overrides)
}
