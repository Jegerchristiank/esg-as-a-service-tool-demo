import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { convertCsvToFormulaMap } from '../csv-to-formula-map'

describe('convertCsvToFormulaMap', () => {
  const createdPaths: string[] = []

  afterEach(async () => {
    await Promise.all(
      createdPaths.splice(0).map(async (dir) => {
        await rm(dir, { recursive: true, force: true })
      })
    )
  })

  it('bevarer overrides for moduler med specialformler', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'tooling-formula-map-'))
    createdPaths.push(dir)
    const csvPath = join(dir, 'modules.csv')
    await writeFile(csvPath, 'module,value_type\nB4,object\nB4,string\nB7,object\nB8,number')

    const map = await convertCsvToFormulaMap(csvPath)

    expect(map['B4']).toContain('steamConsumptionKwh')
    expect(map['B4']).not.toBe('B4 = input')
    expect(map['B7']).toContain('documentationQualityPercent/100')
    expect(map['B8']).toContain('onSiteRenewableKwh')
  })
})
