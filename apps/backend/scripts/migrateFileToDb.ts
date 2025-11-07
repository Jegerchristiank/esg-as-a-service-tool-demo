import { loadEnvironment, ensureDataFileExists } from '../src/env'
import { FileRepository } from '../src/persistence/fileRepository'
import { DatabaseRepository } from '../src/persistence/databaseRepository'
import { Pool } from 'pg'

async function main(): Promise<void> {
  const environment = loadEnvironment()
  ensureDataFileExists(environment.dataFile)

  const fileRepository = new FileRepository(environment.dataFile)
  const document = await fileRepository.read()

  const pool = new Pool({ connectionString: environment.databaseUrl })
  const repository = new DatabaseRepository(pool)

  await repository.write(document)
  await repository.dispose()

  console.log('Migrering gennemført: data er kopieret fra fil til PostgreSQL')
}

void main().catch((error) => {
  console.error('Migreringen fejlede:', error)
  process.exitCode = 1
})
