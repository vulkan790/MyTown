import Fastify, { type FastifyInstance } from 'fastify';

import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import fastifyEnv from '@fastify/env';
import fastifyMultipart from '@fastify/multipart';
import fastifyCors from '@fastify/cors';

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

const registerMultipartFormData = (fastify: FastifyInstance) => {
  fastify.register(fastifyMultipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      fieldNameSize: 100,
      files: 1,
    },
  });
};

const registerCors = (fastify: FastifyInstance) => {
  fastify.register(fastifyCors, {
    origin: '*',
    methods: ['GET', 'POST'],
  });
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
  registerMultipartFormData(fastify);
  registerCors(fastify);
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
