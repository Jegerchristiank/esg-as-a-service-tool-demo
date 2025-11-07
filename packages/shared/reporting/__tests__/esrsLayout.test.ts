import { describe, expect, it } from 'vitest'

import { groupResultsByEsrs } from '../esrsLayout'
import type { CalculatedModuleResult, ModuleId } from '../../types'

type PartialResult = Omit<CalculatedModuleResult, 'moduleId'>

const baseResult: PartialResult = {
  title: 'Stub',
  result: {
    value: 1,
    unit: 'pt',
    assumptions: [],
    trace: [],
    warnings: [],
  },
}

function makeResult(moduleId: ModuleId, title = moduleId): CalculatedModuleResult {
  return {
    moduleId,
    title,
    result: {
      ...baseResult.result,
      value: baseResult.result.value + moduleId.charCodeAt(0),
    },
  }
}

describe('groupResultsByEsrs', () => {
  it('grupperer resultater efter ESRS-struktur og genbruger D2 til dobbelt væsentlighed', () => {
    const layout = groupResultsByEsrs([
      makeResult('SBM'),
      makeResult('GOV'),
      makeResult('IRO'),
      makeResult('D1'),
      makeResult('D2'),
      makeResult('MR'),
      makeResult('G1'),
      makeResult('S4'),
      makeResult('E1Targets'),
      makeResult('E2Water'),
      makeResult('S1'),
    ])

    expect(layout.general.map((entry) => entry.moduleId)).toEqual(['SBM', 'GOV', 'IRO', 'D1'])
    expect(layout.general.at(-1)?.moduleId).toBe('D1')
    expect(layout.doubleMateriality?.moduleId).toBe('D2')

    expect(layout.policies.map((entry) => entry.moduleId)).toEqual(['G1', 'S4'])
    expect(layout.targets.map((entry) => entry.moduleId)).toEqual(['MR', 'E1Targets'])

    const environment = layout.metrics.find((section) => section.id === 'environment')
    const social = layout.metrics.find((section) => section.id === 'social')

    expect(environment?.modules.map((entry) => entry.moduleId)).toEqual(['E2Water'])
    expect(social?.modules.map((entry) => entry.moduleId)).toEqual(['S1'])
  })

  it('returnerer tomme sektioner, når enkelte kategorier mangler', () => {
    const layout = groupResultsByEsrs([makeResult('G1')])

    expect(layout.general).toEqual([])
    expect(layout.targets).toEqual([])
    expect(layout.policies.map((entry) => entry.moduleId)).toEqual(['G1'])
    expect(layout.metrics).toEqual([])
    expect(layout.doubleMateriality).toBeNull()
  })
})
