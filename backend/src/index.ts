import Fastify, { type FastifyInstance } from 'fastify';

import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import fastifyEnv from '@fastify/env';
import fastifyMultipart from '@fastify/multipart';
import fastifyCors from '@fastify/cors';

import { EnvironmentSchema } from './schema.js';
import { setupDrizzle } from './db/index.js';
import { registerJwt } from './auth/jwt.js';

import { AuthController } from './auth/index.js';
import { UsersController } from './users/index.js';
import { ProblemsController } from './problems/index.js';
import { registerYandexMaps } from './services/yandex-maps.js';

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
