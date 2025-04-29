import { Static } from '@fastify/type-provider-typebox';
import { EnvironmentSchema } from '../schema';

import { Drizzle } from '../db';

declare module 'fastify' {
  interface FastifyInstance {
    drizzle: Drizzle;
    config: Static<typeof EnvironmentSchema>;
  }
}
