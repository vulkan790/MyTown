import { FastifySchema } from 'fastify';
import { Type } from '@sinclair/typebox';

const Comment = Type.Object({
  id: Type.Number(),
  author: Type.Object({
    firstName: Type.String(),
    lastName: Type.String(),
    middleName: Type.String(),
    avatarUrl: Type.String(),
  }),

  content: Type.String(),
  createdAt: Type.String(),
});

const Problem = Type.Object({
  id: Type.Number(),
  title: Type.String(),
  description: Type.String(),
  address: Type.String(),
  images: Type.Array(Type.String()),
  status: Type.String(),
  votes: Type.Number(),
  author: Type.Object({
    id: Type.Number(),
    firstName: Type.String(),
    avatarUrl: Type.String(),
  }),
  createdAt: Type.String(),
});

const RichProblem = Type.Composite([Problem, Type.Object({
  comments: Type.Array(Comment),
})]);

// get problems
const getAllProblemsQuery = Type.Object({
  page: Type.Integer({ minimum: 1, default: 1 }),
  limit: Type.Integer({ minimum: 1, maximum: 25, default: 10 }),
});

const getAllProblemsResponse = Type.Object({
  page: Type.Integer(),
  total: Type.Integer(),
  problems: Type.Array(Problem),
});

export const getAllProblemsSchema = {
  querystring: getAllProblemsQuery,
  response: {
    200: getAllProblemsResponse,
  },
} satisfies FastifySchema;

export type GetAllProblemsSchema = typeof getAllProblemsSchema;

// get problem
const getProblemParams = Type.Object({
  id: Type.Integer(),
});
const getProblemResponse = RichProblem;

export const getProblemSchema = {
  params: getProblemParams,
  response: {
    200: getProblemResponse,
  },
} satisfies FastifySchema;

export type GetProblemSchema = typeof getProblemSchema;

// get hot problems
const getHotProblemsResponse = Type.Array(Problem);

export const getHotProblemsSchema = {
  response: {
    200: getHotProblemsResponse,
  },
} satisfies FastifySchema;

export type GetHotProblemsSchema = typeof getHotProblemsSchema;
