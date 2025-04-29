import { FastifyInstance } from 'fastify';
import { fastifyBcrypt } from 'fastify-bcrypt';

import { ok, err, type Result } from 'neverthrow';

import { eq } from 'drizzle-orm';
import { users } from '../db/schema';

import {
  RegisterBody,
  RegisterErrors,
} from './schemas';

type RegisterResult = Result<
  string,
  RegisterErrors | 'unknown_error'
>;

export const reigsterAuthService = async (fastify: FastifyInstance) => {
  const { drizzle } = fastify;
  await fastify.register(fastifyBcrypt, {
    saltWorkFactor: 10,
  });

  const register = async (registerPayload: RegisterBody) => {
    const registerResult = await drizzle.transaction(async (tx): Promise<RegisterResult> => {
      const userWithEmail = await tx.select({
        email: users.email,
      })
        .from(users)
        .where(eq(users.email, registerPayload.email));

      if (userWithEmail.length > 0) {
        return err('email_in_use');
      }

      const hashedPassword = await fastify.bcrypt.hash(registerPayload.password);

      const user = await tx.insert(users).values({
        email: registerPayload.email,
        password: hashedPassword,

        firstName: registerPayload.firstName,
        lastName: registerPayload.lastName,
        middleName: registerPayload.middleName ?? '',
        gender: registerPayload.gender,

        role: 'user',
      }).returning().then((users) => users[0]);

      const token = fastify.jwtHelpers.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return ok(token);
    }).catch((e): RegisterResult => {
      console.error('Error while registering user', e);
      return err('unknown_error');
    });

    return registerResult;
  };

  const login = async (email: string, password: string) => {};

  fastify.decorate('authService', {
    register,
    login,
  });
};

declare module 'fastify' {
  interface FastifyInstance {
    authService: {
      register: (registerPayload: RegisterBody) => Promise<Result<string, RegisterErrors | 'unknown_error'>>;
      login: (email: string, password: string) => Promise<unknown>;
    };
  }
}
