import Fastify, { type FastifyInstance } from 'fastify';

import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import fastifyEnv from '@fastify/env';

import { EnvironmentSchema } from './schema';
import { setupDrizzle } from './db';
import { registerJwt } from './auth/jwt';

const registerEnv = async (fastify: FastifyInstance) => {
  await fastify.register(fastifyEnv, {
    schema: EnvironmentSchema,
    dotenv: true,
  });
};

const registerDrizzle = (fastify: FastifyInstance) => {
  const drizzle = setupDrizzle(fastify.config.DATABASE_CONNECTION);
  fastify.decorate('drizzle', drizzle);
};

const main = async () => {
  const fastify = Fastify().withTypeProvider<TypeBoxTypeProvider>();

  await registerEnv(fastify);
  registerDrizzle(fastify);
  registerJwt(fastify);

  // register controllers
  fastify.get('/', () => 'Hello world');

  await fastify.ready();

  await fastify.listen({
    port: fastify.config.PORT,
  });
};

await main();
