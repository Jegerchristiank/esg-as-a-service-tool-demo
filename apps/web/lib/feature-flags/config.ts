export type FeatureFlagKey = 'wizardRedesign'

export type FeatureFlagState = Record<FeatureFlagKey, boolean>

export const DEFAULT_FEATURE_FLAGS: FeatureFlagState = {
  wizardRedesign: true,
}

export const FEATURE_FLAG_SEARCH_PARAM_PREFIX = 'ff_'
export const FEATURE_FLAG_COOKIE_PREFIX = 'ff_'

export function normaliseFlagValue(raw: string | null | undefined): boolean | null {
  if (!raw) {
    return null
  }

  const value = raw.trim().toLowerCase()
  if (['1', 'true', 'on', 'yes', 'enable', 'enabled', 'beta', 'treatment'].includes(value)) {
    return true
  }

  if (['0', 'false', 'off', 'no', 'disable', 'disabled', 'control'].includes(value)) {
    return false
  }

  return null
}

export function createInitialFeatureState(overrides: Partial<FeatureFlagState> = {}): FeatureFlagState {
  return {
    ...DEFAULT_FEATURE_FLAGS,
    ...overrides,
  }
}
