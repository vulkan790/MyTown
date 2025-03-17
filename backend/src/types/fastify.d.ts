import { Static } from '@fastify/type-provider-typebox';
import { EnvironmentSchema } from '../schema';

declare module 'fastify' {
  interface FastifyInstance {
    config: Static<EnvironmentSchema>;
  }
}
