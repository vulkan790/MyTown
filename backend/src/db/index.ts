import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';

export const setupDrizzle = (connection: string) => drizzle(connection, {
  casing: 'snake_case',
  schema,
});

export type Drizzle = ReturnType<typeof setupDrizzle>;
