import { describe, it, expectTypeOf } from 'vitest'

import type {
  ActiveProfileState,
  WizardProfileEntry,
  WizardProfileId,
  WizardProfileMap,
  WizardProfileSummary,
  WizardState,
} from '../useWizard'
import type { WizardProfile } from '../../../src/modules/wizard/profile'
import type { ModuleInput } from '@org/shared'

describe('useWizard type exports', () => {
  it('exposes WizardProfileId as a string alias', () => {
    expectTypeOf<WizardProfileId>().toMatchTypeOf<string>()
  })

  it('describes WizardProfileEntry shape with state and profile', () => {
    expectTypeOf<WizardProfileEntry['state']>().toMatchTypeOf<ModuleInput>()
    expectTypeOf<WizardProfileEntry['profile']>().toMatchTypeOf<WizardProfile>()
  })

  it('maps WizardProfileMap ids to entries', () => {
    expectTypeOf<WizardProfileMap>().toMatchTypeOf<Record<string, WizardProfileEntry>>()
  })

  it('ActiveProfileState combines id, state and profile', () => {
    expectTypeOf<ActiveProfileState>().toMatchTypeOf<{
      id: string
      name: string
      state: WizardState
      profile: WizardProfile
    }>()
  })

  it('WizardProfileSummary exposes summary data', () => {
    expectTypeOf<WizardProfileSummary>().toMatchTypeOf<{
      id: string
      name: string
      isActive: boolean
    }>()
  })
})
