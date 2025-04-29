import { FastifyInstance } from 'fastify';
import { fastifyJwt } from '@fastify/jwt';

export type JwtPayload = {
  userId: number;
  email: string;
  role: string;
};

export const registerJwt = (fastify: FastifyInstance) => {
  fastify.register(fastifyJwt, {
    secret: fastify.config.JWT_SECRET,
  });

  const sign = (payload: JwtPayload) => {
    return '';
  };

  const verify = (token: string) => {
    return false;
  };

  fastify.decorate('jwtHelpers', {
    sign,
    verify,
  });
};

declare module 'fastify' {
  interface FastifyInstance {
    jwtHelpers: {
      sign: (payload: JwtPayload) => string;
      verify: (token: string) => boolean;
    };
  }
}
