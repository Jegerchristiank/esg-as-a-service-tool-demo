import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { convertCsvToSchema } from '../csv-to-schema'

describe('convertCsvToSchema', () => {
  const tempDirs: string[] = []

  afterEach(async () => {
    await Promise.all(
      tempDirs.splice(0).map(async (dir) => {
        await rm(dir, { recursive: true, force: true })
      }),
    )
  })

  it('mapper primitive typer og arrays til standard JSON Schema', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'tooling-schema-'))
    tempDirs.push(dir)
    const csvPath = join(dir, 'modules.csv')
    await writeFile(
      csvPath,
      ['module,value_type', 'FooString,string', 'BarArray,array', 'BazFlag,boolean'].join('\n'),
      'utf-8',
    )

    const schema = (await convertCsvToSchema(csvPath)) as {
      properties: Record<string, unknown>
    }
    const properties = schema.properties

    expect(properties['FooString']).toEqual({ type: 'string' })
    expect(properties['BarArray']).toEqual({ type: 'array' })
    expect(properties['BazFlag']).toEqual({ type: 'boolean' })
  })
})
