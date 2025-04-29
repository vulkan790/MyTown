import { FastifyInstance } from 'fastify';
import { FastifyReplyTypeBox, FastifyRequestTypeBox, FastifyTypebox } from '../types/typebox';

import { reigsterAuthService } from './service';
import * as schemas from './schemas';

export async function AuthController (fastify: FastifyTypebox) {
  await reigsterAuthService(fastify);

  fastify.post('/register', { schema: schemas.registerSchema }, registerEndpoint);
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
