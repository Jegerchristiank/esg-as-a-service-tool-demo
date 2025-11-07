/**
 * Helper til at strukturere beregnede resultater i ESRS-sektioner.
 */
import type { CalculatedModuleResult } from '../types'

export type EsrsMetricSection = {
  id: string
  title: string
  description: string
  modules: CalculatedModuleResult[]
}

export type EsrsLayout = {
  general: CalculatedModuleResult[]
  policies: CalculatedModuleResult[]
  targets: CalculatedModuleResult[]
  metrics: EsrsMetricSection[]
  doubleMateriality: CalculatedModuleResult | null
}

const generalSectionIds = ['SBM', 'GOV', 'IRO', 'D1'] as const
const policySectionIds = ['G1', 'S4'] as const
const targetSectionIds = ['MR', 'E1Targets'] as const

const metricDefinitions = [
  {
    id: 'environment',
    title: 'Miljø (ESRS E)',
    description: 'Scope 1-3 og miljøstandarder for klima, vand, forurening, biodiversitet og ressourcer.',
    matchers: [/^A/, /^B/, /^C/, /^E/],
  },
  {
    id: 'social',
    title: 'Social (ESRS S)',
    description: 'Arbejdsstyrke, diversitet, arbejdsmiljø og menneskerettigheder.',
    matchers: [/^S/],
  },
  {
    id: 'governance',
    title: 'Governance (ESRS G)',
    description: 'Kontrolmiljø, politikker og styringsprocesser.',
    matchers: [/^G/],
  },
] as const

function takeByIds(
  map: Map<string, CalculatedModuleResult>,
  ids: readonly string[],
  consumed: Set<string>,
): CalculatedModuleResult[] {
  return ids
    .map((id) => {
      const entry = map.get(id)
      if (!entry) {
        return null
      }
      consumed.add(id)
      return entry
    })
    .filter((entry): entry is CalculatedModuleResult => entry !== null)
}

export function groupResultsByEsrs(results: CalculatedModuleResult[]): EsrsLayout {
  const byId = new Map(results.map((entry) => [entry.moduleId, entry]))
  const consumed = new Set<string>()

  const general = takeByIds(byId, generalSectionIds, consumed)
  const policies = takeByIds(byId, policySectionIds, consumed)
  const targets = takeByIds(byId, targetSectionIds, consumed)

  const remaining = results.filter((entry) => !consumed.has(entry.moduleId))

  const sections: EsrsMetricSection[] = metricDefinitions.map((definition) => ({
    id: definition.id,
    title: definition.title,
    description: definition.description,
    modules: [],
  }))

  const fallback: EsrsMetricSection = {
    id: 'other',
    title: 'Øvrige moduler',
    description: 'Resultater som ikke passer i en klassisk ESRS-kategori.',
    modules: [],
  }

  remaining.forEach((entry) => {
    const targetSection = sections.find((section, index) => {
      const matcherSet = metricDefinitions[index]?.matchers ?? []
      return matcherSet.some((matcher) => matcher.test(entry.moduleId))
    })

    if (targetSection) {
      targetSection.modules.push(entry)
      return
    }

    fallback.modules.push(entry)
  })

  const filteredSections = [...sections, fallback].filter((section) => section.modules.length > 0)

  return {
    general,
    policies,
    targets,
    metrics: filteredSections,
    doubleMateriality: byId.get('D2') ?? null,
  }
}
