import Fastify, { type FastifyInstance } from 'fastify';

import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import fastifyEnv from '@fastify/env';

import { EnvironmentSchema } from './schema';
import { setupDrizzle } from './db';
import { registerJwt } from './auth/jwt';

import { AuthController } from './auth';
import { UsersController } from './users';
import { ProblemsController } from './problems';
import { registerYandexMaps } from './services/yandex-maps';

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
  const fastify = Fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  }).withTypeProvider<TypeBoxTypeProvider>();

  await registerEnv(fastify);
  registerDrizzle(fastify);
  registerJwt(fastify);
  registerYandexMaps(fastify);

  // register controllers
  await fastify.register(AuthController, {
    prefix: '/api/auth',
  });
  await fastify.register(UsersController, {
    prefix: '/api/users',
  });
  await fastify.register(ProblemsController, {
    prefix: '/api/problems',
  });

  await fastify.ready();

  await fastify.listen({
    port: fastify.config.PORT,
  });
};

await main();
