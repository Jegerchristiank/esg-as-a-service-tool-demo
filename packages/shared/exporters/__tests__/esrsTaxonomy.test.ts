import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { esrsEmissionConceptList, getEsrsConceptDefinition, type EsrsConceptKey } from '../esrsTaxonomy'

function loadFile(path: string): string {
  return readFileSync(new URL(path, import.meta.url), 'utf-8')
}

const esrsXsd = loadFile('../taxonomy/esrs/2023-12-22/common/esrs_cor.xsd')
const utrXml = loadFile('../taxonomy/utr.xml')

const elementDeclarations = buildElementMap(esrsXsd)
const unitIds = buildUnitIdSet(utrXml)

describe('ESRS taksonomi reference', () => {
  it('indeholder alle koncepter og de korrekte periodetyper', () => {
    for (const { definition } of esrsEmissionConceptList) {
      const localName = definition.qname.split(':')[1] ?? definition.qname
      const declaration = elementDeclarations.get(localName)
      expect(declaration, `Konceptet ${definition.qname} findes ikke i esrs_cor.xsd`).toBeTruthy()

      if (declaration) {
        expect(declaration).toContain(`xbrli:periodType="${definition.periodType}"`)
      }

      if (typeof definition.unitId === 'string') {
        expect(unitIds.has(definition.unitId)).toBe(true)
      }
    }
  })

  it('mappe ekstra sociale og governance datapunkter', () => {
    const expectations: Array<{ key: EsrsConceptKey; periodType: string; unitId: string | null }> = [
      { key: 'S1AverageWeeklyHours', periodType: 'duration', unitId: 'hour' },
      { key: 'S1SegmentHeadcountTotal', periodType: 'instant', unitId: 'pure' },
      { key: 'S2SocialDialogueNarrative', periodType: 'duration', unitId: null },
      { key: 'S3RemedyNarrative', periodType: 'duration', unitId: null },
      { key: 'S4ConsumerEngagementNarrative', periodType: 'duration', unitId: null },
      { key: 'G1GovernanceNarrative', periodType: 'duration', unitId: null }
    ]

    for (const { key, periodType, unitId } of expectations) {
      const definition = getEsrsConceptDefinition(key)
      expect(definition.periodType).toBe(periodType)
      if (unitId === null) {
        expect(definition.unitId ?? null).toBeNull()
      } else {
        expect(definition.unitId).toBe(unitId)
      }
    }
  })
})

function buildElementMap(xml: string): Map<string, string> {
  const map = new Map<string, string>()
  const elementRegex = /<xsd:element\b[^>]*name="([^"]+)"[^>]*>/g
  let match: RegExpExecArray | null
  while ((match = elementRegex.exec(xml)) !== null) {
    const name = match[1]
    const element = match[0]
    if (!name || !element) continue
    map.set(name, element)
  }
  return map
}

function buildUnitIdSet(xml: string): Set<string> {
  const set = new Set<string>()
  const unitRegex = /<unitId>([^<]+)<\/unitId>/g
  let match: RegExpExecArray | null
  while ((match = unitRegex.exec(xml)) !== null) {
    const unitId = match[1]
    if (!unitId) continue
    set.add(unitId)
  }
  return set
}

