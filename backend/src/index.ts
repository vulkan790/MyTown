import Fastify, { type FastifyInstance } from 'fastify';

import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import fastifyEnv from '@fastify/env';

import { EnvironmentSchema } from './schema';

const registerEnv = async (fastify: FastifyInstance) => {
  await fastify.register(fastifyEnv, {
    schema: EnvironmentSchema,
    dotenv: true,
  });
};

const main = async () => {
  const fastify = Fastify().withTypeProvider<TypeBoxTypeProvider>();

  await registerEnv(fastify);

  // register controllers
  fastify.get('/', () => 'Hello world');

  await fastify.ready();

  await fastify.listen({
    port: fastify.config.PORT,
  });
};

await main();
