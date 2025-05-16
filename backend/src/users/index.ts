import { FastifyInstance } from 'fastify';
import { FastifyReplyTypeBox, FastifyRequestTypeBox, FastifyTypebox } from '../types/typebox';

import { registerUserService } from './service.js';
import * as schemas from './schemas.js';

export async function UsersController (fastify: FastifyTypebox) {
  registerUserService(fastify);
  fastify.addHook('onRequest', fastify.jwtHelpers.authenticate);

  fastify.get('/me', { schema: schemas.getCurrentUserSchema }, getCurrentUser);
}

async function getCurrentUser (
  this: FastifyInstance,
  request: FastifyRequestTypeBox<schemas.GetCurrentUserSchema>,
  reply: FastifyReplyTypeBox<schemas.GetCurrentUserSchema>
) {
  const userId = request.user.userId;

  const userResult = await this.userService.getCurrentUser(userId);
  if (userResult.isOk()) {
    await reply.status(200).send(userResult.value);
    return;
  }

  if (userResult.error === 'user_not_found') {
    await reply.status(404).send();
    return;
  }

  await reply.status(500).send();
}
