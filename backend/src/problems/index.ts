import { FastifyInstance } from 'fastify';
import { FastifyReplyTypeBox, FastifyRequestTypeBox, FastifyTypebox } from '../types/typebox.js';

import { registerProblemsService } from './service.js';
import * as schema from './schema.js';

export async function ProblemsController (fastify: FastifyTypebox) {
  registerProblemsService(fastify);

  fastify.get('/', { schema: schema.getAllProblemsSchema }, getProblems);
  fastify.get('/hot', { schema: schema.getHotProblemsSchema }, getHotProblems);
  fastify.get('/address-suggest', {
    schema: schema.getAddressSuggestionsSchema,
    preHandler: fastify.jwtHelpers.authenticate,
  }, getAddressSuggestions);

  fastify.register(async (authFastify) => {
    authFastify.addHook('preHandler', fastify.jwtHelpers.authenticate);

    authFastify.post('/', { schema: schema.createProblemSchema }, createProblem);
    authFastify.post('/images', { schema: schema.uploadProblemImageSchema }, uploadProblemImage);

    authFastify.post('/:id/moderation', { schema: schema.moderateProblemSchema }, moderateProblem);
    authFastify.post('/:id/comments', { schema: schema.addCommentSchema }, addComment);
    authFastify.post('/:id/vote', { schema: schema.voteSchema }, vote);
  });

  fastify.get('/:id', {
    schema: schema.getProblemSchema,
    preHandler: fastify.jwtHelpers.tryAuthenticate,
  }, getProblem);
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

async function getProblem (
  this: FastifyInstance,
  request: FastifyRequestTypeBox<schema.GetProblemSchema>,
  reply: FastifyReplyTypeBox<schema.GetProblemSchema>
) {
  const { id } = request.params;

  const problemResult = await this.problemService.getProblem(id, request.user);
  if (problemResult.isOk()) {
    await reply.status(200).send(problemResult.value);
    return;
  }

  if (problemResult.error === 'unknown_problem') {
    await reply.status(404).send();
    return;
  }

  await reply.status(500).send();
}

async function getHotProblems (
  this: FastifyInstance,
  request: FastifyRequestTypeBox<schema.GetHotProblemsSchema>,
  reply: FastifyReplyTypeBox<schema.GetHotProblemsSchema>
) {
  const result = await this.problemService.getHotProblems();
  if (result.isOk()) {
    await reply.status(200).send(result.value);
    return;
  }

  await reply.status(500).send();
}

async function getAddressSuggestions (
  this: FastifyInstance,
  request: FastifyRequestTypeBox<schema.GetAddressSuggestionsSchema>,
  reply: FastifyReplyTypeBox<schema.GetAddressSuggestionsSchema>
) {
  const { address } = request.query;

  const result = await this.problemService.getAddressSuggestions(address, request.user.userId);
  if (result.isOk()) {
    await reply.status(200).send(result.value);
    return;
  }

  await reply.status(500).send();
}

async function uploadProblemImage (
  this: FastifyInstance,
  request: FastifyRequestTypeBox<schema.UploadProblemImageSchema>,
  reply: FastifyReplyTypeBox<schema.UploadProblemImageSchema>
) {
  const image = await request.file();

  const result = await this.problemService.uploadProblemImage(image?.file, image?.mimetype);
  if (result.isOk()) {
    await reply.status(201).send(result.value);
    return;
  }

  if (result.error === 'unknown_error') {
    await reply.status(500).send();
    return;
  }

  reply.statusCode = 400;
  return {
    error: result.error,
  };
}

async function createProblem (
  this: FastifyInstance,
  request: FastifyRequestTypeBox<schema.CreateProblemSchema>,
  reply: FastifyReplyTypeBox<schema.CreateProblemSchema>
) {
  const { title, description, uri, images } = request.body;

  const result = await this.problemService.createProblem(
    { title, description, uri, images },
    request.user.userId
  );

  if (result.isOk()) {
    await reply.status(201).send(result.value);
    return;
  }

  if (result.error === 'unknown_error') {
    await reply.status(500).send();
    return;
  }

  reply.statusCode = 400;
  return {
    error: result.error,
  };
}

async function moderateProblem (
  this: FastifyInstance,
  request: FastifyRequestTypeBox<schema.ModerateProblemSchema>,
  reply: FastifyReplyTypeBox<schema.ModerateProblemSchema>
) {
  const { id } = request.params;
  const { decision } = request.body;

  const result = await this.problemService.moderateProblem(id, decision, request.user);
  if (result.isOk()) {
    await reply.status(204).send();
    return;
  }

  if (result.error === 'unknown_error') {
    await reply.status(500).send();
    return;
  }

  if (result.error === 'unknown_problem') {
    await reply.status(404).send();
    return;
  }

  if (result.error === 'forbidden') {
    await reply.status(403).send();
    return;
  }

  reply.statusCode = 400;
  return {
    error: result.error,
  };
}

async function addComment (
  this: FastifyInstance,
  request: FastifyRequestTypeBox<schema.AddCommentSchema>,
  reply: FastifyReplyTypeBox<schema.AddCommentSchema>
) {
  const { id } = request.params;
  const { content } = request.body;

  const result = await this.problemService.addComment(
    { content, problemId: id },
    request.user
  );

  if (result.isOk()) {
    await reply.status(201).send(result.value);
    return;
  }

  if (result.error === 'unknown_error') {
    await reply.status(500).send();
    return;
  }

  if (result.error === 'unknown_problem') {
    await reply.status(404).send();
    return;
  }

  if (result.error === 'forbidden') {
    await reply.status(403).send();
    return;
  }

  reply.statusCode = 400;
  return {
    error: result.error,
  };
}

async function vote (
  this: FastifyInstance,
  request: FastifyRequestTypeBox<schema.VoteSchema>,
  reply: FastifyReplyTypeBox<schema.VoteSchema>
) {
  const { id } = request.params;
  const { vote } = request.body;

  const result = await this.problemService.vote({
    problemId: id,
    voteValue: vote,
    userId: request.user.userId,
  });

  if (result.isOk()) {
    await reply.status(204).send();
    return;
  }

  if (result.error === 'unknown_error') {
    await reply.status(500).send();
    return;
  }

  if (result.error === 'unknown_problem') {
    await reply.status(404).send();
    return;
  }

  reply.statusCode = 400;
  return {
    error: result.error,
  };
}
