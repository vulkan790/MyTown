import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export const setupDrizzle = (connection: string) => drizzle(connection, {
  casing: 'snake_case',
  schema,
});

export type Drizzle = ReturnType<typeof setupDrizzle>;
