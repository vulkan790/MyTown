import { FastifyInstance } from 'fastify';
import { FastifyReplyTypeBox, FastifyRequestTypeBox, FastifyTypebox } from '../types/typebox';

import { reigsterAuthService } from './service.js';
import * as schemas from './schemas.js';

export async function AuthController (fastify: FastifyTypebox) {
  await reigsterAuthService(fastify);

  fastify.post('/login', { schema: schemas.loginSchema }, loginEndpoint);
  fastify.post('/register', { schema: schemas.registerSchema }, registerEndpoint);
  fastify.post('/verify', { schema: schemas.verifyEmailSchema }, verifyEmail);
  fastify.post('/password-reset/request', { schema: schemas.passwordResetRequestSchema }, requestPasswordReset);
}

async function registerEndpoint (
  this: FastifyInstance,
  request: FastifyRequestTypeBox<schemas.RegisterSchema>,
  reply: FastifyReplyTypeBox<schemas.RegisterSchema>
) {
  const registrationResult = await this.authService.register(request.body);
  if (registrationResult.isOk()) {
    await reply.status(200).send({
      accessToken: registrationResult.value,
    });

    return;
  }

  if (registrationResult.error === 'unknown_error') {
    await reply.status(500).send();

    return;
  }

  reply.statusCode = 400;
  return {
    error: registrationResult.error,
  };
}

async function loginEndpoint (
  this: FastifyInstance,
  request: FastifyRequestTypeBox<schemas.LoginSchema>,
  reply: FastifyReplyTypeBox<schemas.LoginSchema>
) {
  const loginResult = await this.authService.login(request.body.email, request.body.password);

  if (loginResult.isOk()) {
    await reply.status(200).send({
      accessToken: loginResult.value,
    });

    return;
  }

  if (loginResult.error === 'unknown_error') {
    await reply.status(500).send();

    return;
  }

  reply.statusCode = 400;
  return {
    error: loginResult.error,
  };
}

async function verifyEmail (
  this: FastifyInstance,
  request: FastifyRequestTypeBox<schemas.VerifyEmailSchema>,
  reply: FastifyReplyTypeBox<schemas.VerifyEmailSchema>
) {
  const { token } = request.body;

  const verificationResult = await this.authService.verifyEmail(token);
  if (verificationResult.isOk()) {
    await reply.status(204).send();
    return;
  }

  if (verificationResult.error === 'unknown_error') {
    await reply.status(500).send();
    return;
  }

  reply.statusCode = 400;
  return {
    error: verificationResult.error,
  };
}

async function requestPasswordReset (
  this: FastifyInstance,
  request: FastifyRequestTypeBox<schemas.PasswordResetRequestSchema>,
  reply: FastifyReplyTypeBox<schemas.PasswordResetRequestSchema>
) {
  const { email } = request.body;

  const resetRequestResult = await this.authService.requestPasswordReset(email);
  if (resetRequestResult.isOk()) {
    await reply.status(204).send();
    return;
  }

  if (resetRequestResult.error === 'unknown_error') {
    await reply.status(500).send();
    return;
  }

  reply.statusCode = 400;
  return {
    error: resetRequestResult.error,
  };
}
