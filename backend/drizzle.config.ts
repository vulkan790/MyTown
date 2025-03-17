import { defineConfig } from 'drizzle-kit';

import { envSchema } from 'env-schema';
import { type Static, Type } from '@sinclair/typebox';

import { EnvironmentSchema } from './src/schema';

const dbConnectionSchema = Type.Pick(EnvironmentSchema, ['DATABASE_CONNECTION']);
type DbConnectionSchema = Static<typeof dbConnectionSchema>;

const env = envSchema<DbConnectionSchema>({
  schema: dbConnectionSchema,
  dotenv: true,
});

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  casing: 'snake_case',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_CONNECTION,
  },
});
