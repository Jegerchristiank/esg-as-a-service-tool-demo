import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/persistence/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.PERSISTENCE_DATABASE_URL ?? '',
  },
})
