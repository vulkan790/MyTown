import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
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
    const token = fastify.jwt.sign(payload, {
      expiresIn: '7d',
    });
    return token;
  };

  const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify<JwtPayload>();
    } catch {
      await reply.status(401).send({
        message: 'Unauthorized',
      });
    }
  };

  const tryAuthenticate = async (request: FastifyRequest) => {
    try {
      await request.jwtVerify<JwtPayload>();
    } catch {}
  };

  fastify.decorate('jwtHelpers', {
    sign,
    authenticate,
    tryAuthenticate,
  });
};

declare module 'fastify' {
  interface FastifyInstance {
    jwtHelpers: {
      sign: (payload: JwtPayload) => string;
      authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
      tryAuthenticate: (request: FastifyRequest) => Promise<void>;
    };
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: JwtPayload;
  }
}
