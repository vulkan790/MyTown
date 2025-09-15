import { FastifyInstance } from 'fastify';
import { fastifyBcrypt } from 'fastify-bcrypt';

import { randomUUID } from 'crypto';
import { ok, err, fromPromise, type Result } from 'neverthrow';

import { desc, eq } from 'drizzle-orm';
import { emailVerifications, passwordResets, users } from '../db/schema.js';

import {
  LoginErrors,
  RegisterBody,
  RegisterErrors,
  VerifyEmailErrors,
  RequestPasswordResetErrors,
} from './schemas';

type RegisterResult = Result<
  string,
  RegisterErrors | 'unknown_error'
>;

export const reigsterAuthService = async (fastify: FastifyInstance) => {
  const { drizzle } = fastify;
  const { DOMAIN } = fastify.config;

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

      const emailVerifyToken = fastify.jwt.sign({
        userId: user.id,
        email: user.email,
      }, {
        expiresIn: '1d',
      });

      const verifyEmailUrl = new URL('/verify-email', DOMAIN);
      verifyEmailUrl.searchParams.set('token', emailVerifyToken);

      fastify.email.sendVerificationEmail(user.email, verifyEmailUrl.toString());

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

  const login = async (email: string, password: string): Promise<Result<string, LoginErrors | 'unknown_error'>> => {
    const userSelect = drizzle.select({
      id: users.id,
      email: users.email,
      password: users.password,
      role: users.role,
    })
      .from(users)
      .where(eq(users.email, email))
      .then((users) => users.at(0));

    const userResult = await fromPromise(
      userSelect,
      (e) => e
    );

    if (userResult.isErr()) {
      console.error('Error while selecting user', userResult.error);
      return err('unknown_error');
    }

    const user = userResult.value;
    if (!user) {
      return err('invalid_credentials');
    }

    const passwordMatch = await fastify.bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return err('invalid_credentials');
    }

    const token = fastify.jwtHelpers.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return ok(token);
  };

  const verifyEmail = async (token: string): Promise<Result<void, VerifyEmailErrors | 'unknown_error'>> => {
    const tokenPayload = fastify.jwt.decode<{ email: string; userId: number; }>(token);
    if (tokenPayload === null) {
      return err('invalid_token');
    }

    try {
      fastify.jwt.verify(token);
    } catch {
      return err('token_expired');
    }

    const transaction = drizzle.transaction(async (tx) => {
      const usersList = await tx.select({
        email: users.email,
      })
        .from(users)
        .where(eq(users.id, tokenPayload.userId))
        .limit(1);

      if (!usersList.at(0) || usersList.at(0)?.email !== tokenPayload.email) {
        return err('invalid_token');
      }

      await tx.insert(emailVerifications).values({
        email: tokenPayload.email,
        userId: tokenPayload.userId,
      });

      return ok();
    }).catch((e) => {
      console.error('Unknown error during email verification', e);
      return err('unknown_error');
    });

    return await transaction;
  };

  const requestPasswordReset = async (email: string) => {
    const user = await drizzle.select().from(users).where(eq(users.email, email)).then((u) => u.at(0));
    if (!user) {
      return err('email_not_found');
    }

    const resetRequest = await drizzle
      .select()
      .from(passwordResets)
      .where(eq(passwordResets.userId, user.id))
      .orderBy(desc(passwordResets.createdAt))
      .then((r) => r.at(0));

    if (resetRequest) {
      const now = new Date();
      const diff = (now.getTime() - resetRequest.createdAt.getTime()) / 1000 / 60;

      if (diff < 15) {
        return ok();
      }
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1_000);

    const createRequestResult = await fromPromise(
      drizzle.insert(passwordResets).values({
        userId: user.id,
        token,
        expiresAt,
      }),
      (e) => e
    );

    if (createRequestResult.isErr()) {
      console.error('Error while creating password reset request', createRequestResult.error);
      return err('unknown_error');
    }

    const resetPasswordUrl = new URL('/reset-password', DOMAIN);
    resetPasswordUrl.searchParams.set('token', token);

    fastify.email.sendResetPasswordEmail(user.email, resetPasswordUrl.toString());

    return ok();
  };

  fastify.decorate('authService', {
    register,
    login,
    verifyEmail,
    requestPasswordReset,
  });
};

declare module 'fastify' {
  interface FastifyInstance {
    authService: {
      register: (registerPayload: RegisterBody) => Promise<Result<string, RegisterErrors | 'unknown_error'>>;
      login: (email: string, password: string) => Promise<Result<string, LoginErrors | 'unknown_error'>>;
      verifyEmail: (token: string) => Promise<Result<void, VerifyEmailErrors | 'unknown_error'>>;
      requestPasswordReset: (email: string) => Promise<Result<void, RequestPasswordResetErrors | 'unknown_error'>>;
    };
  }
}
