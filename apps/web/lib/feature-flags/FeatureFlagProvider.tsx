'use client'

import { useSearchParams } from 'next/navigation'
import { createContext, useContext, useMemo, type ReactNode } from 'react'

import {
  FEATURE_FLAG_COOKIE_PREFIX,
  FEATURE_FLAG_SEARCH_PARAM_PREFIX,
  createInitialFeatureState,
  normaliseFlagValue,
  type FeatureFlagKey,
  type FeatureFlagState,
} from './config'

const FeatureFlagContext = createContext<FeatureFlagState>(createInitialFeatureState())

type FeatureFlagProviderProps = {
  initialFlags?: FeatureFlagState
  children: ReactNode
}

export function FeatureFlagProvider({ initialFlags, children }: FeatureFlagProviderProps): JSX.Element {
  const searchParams = useSearchParams()

  const value = useMemo<FeatureFlagState>(() => {
    const baseState = createInitialFeatureState(initialFlags)

    if (!searchParams) {
      return baseState
    }

    const entries = Array.from(searchParams.entries())
    const nextState: FeatureFlagState = { ...baseState }

    for (const [key, paramValue] of entries) {
      if (!key.startsWith(FEATURE_FLAG_SEARCH_PARAM_PREFIX)) {
        continue
      }
      const flagKey = key.replace(FEATURE_FLAG_SEARCH_PARAM_PREFIX, '') as FeatureFlagKey
      if (!(flagKey in nextState)) {
        continue
      }
      const parsed = normaliseFlagValue(paramValue)
      if (parsed === null) {
        continue
      }
      nextState[flagKey] = parsed
    }

    return nextState
  }, [initialFlags, searchParams])

  return <FeatureFlagContext.Provider value={value}>{children}</FeatureFlagContext.Provider>
}

export function useFeatureFlags(): FeatureFlagState {
  return useContext(FeatureFlagContext)
}

export function useFeatureFlag(key: FeatureFlagKey): boolean {
  const flags = useFeatureFlags()
  return flags[key]
}

export function getFeatureFlagCookieName(key: FeatureFlagKey): string {
  return `${FEATURE_FLAG_COOKIE_PREFIX}${key}`
}
