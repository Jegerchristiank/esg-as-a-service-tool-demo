/**
 * CLI-indgang der genererer schema og formel-map fra CSV.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { convertCsvToSchema } from './csv-to-schema'
import { convertCsvToFormulaMap } from './csv-to-formula-map'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function main(): Promise<void> {
  const csvPath = process.argv[2] ?? resolve(__dirname, '../data/modules.csv')
  const outputDir = resolve(__dirname, '../../shared/schema')

  const schema = await convertCsvToSchema(csvPath)
  const formulaMap = await convertCsvToFormulaMap(csvPath)

  await mkdir(outputDir, { recursive: true })
  await writeFile(resolve(outputDir, 'esg-input-schema.json'), JSON.stringify(schema, null, 2))
  await writeFile(resolve(outputDir, 'esg-formula-map.json'), JSON.stringify(formulaMap, null, 2))

  console.log(`Skema genereret fra ${csvPath}`)
}

void main()
