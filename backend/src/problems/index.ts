import { FastifyInstance } from 'fastify';
import { FastifyReplyTypeBox, FastifyRequestTypeBox, FastifyTypebox } from '../types/typebox';

import { registerProblemsService } from './service';
import * as schema from './schema.js';

export async function ProblemsController (fastify: FastifyTypebox) {
  registerProblemsService(fastify);

  fastify.get('/', { schema: schema.getAllProblemsSchema }, getProblems);
}

async function getProblems (
  this: FastifyInstance,
  request: FastifyRequestTypeBox<schema.GetAllProblemsSchema>,
  reply: FastifyReplyTypeBox<schema.GetAllProblemsSchema>
) {
  const { page, limit } = request.query;

  const result = await this.problemService.getProblems(page, limit);
  if (result.isOk()) {
    await reply.status(200).send({
      page: result.value.page,
      total: result.value.total,
      problems: result.value.problems,
    });

    return;
  }

  await reply.status(500).send();
}
