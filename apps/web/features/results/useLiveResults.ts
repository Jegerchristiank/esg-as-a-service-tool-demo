/**
 * Hook der eksponerer de beregnede resultater for review-siden.
 */
'use client'

import { useMemo } from 'react'
import { aggregateResults, moduleIds, type CalculatedModuleResult } from '@org/shared'
import { useWizardContext, type WizardProfileId } from '../wizard/useWizard'

type UseLiveResultsValue = {
  results: CalculatedModuleResult[]
  activeProfileId: WizardProfileId
}

export function useLiveResults(): UseLiveResultsValue {
  const { activeState, activeProfileId } = useWizardContext()

  return useMemo(() => {
    const aggregated = aggregateResults(activeState)
    const priorityOrder = new Map(moduleIds.map((moduleId, index) => [moduleId, index]))
    const sorted = [...aggregated].sort((a, b) => {
      const priorityA = priorityOrder.get(a.moduleId) ?? Number.POSITIVE_INFINITY
      const priorityB = priorityOrder.get(b.moduleId) ?? Number.POSITIVE_INFINITY
      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }
      return a.moduleId.localeCompare(b.moduleId)
    })

    return { results: sorted, activeProfileId }
  }, [activeProfileId, activeState])
}
