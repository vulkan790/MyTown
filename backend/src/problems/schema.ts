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
  latitude: Type.Number(),
  longitude: Type.Number(),
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
  vote: Type.Integer(),
})]);

const Address = Type.Object({
  title: Type.String(),
  subtitle: Type.String(),
  uri: Type.String(),
});

// get problems
const getAllProblemsQuery = Type.Object({
  page: Type.Integer({ minimum: 1, default: 1 }),
  limit: Type.Integer({ minimum: 1, maximum: 25, default: 10 }),
  type: Type.Optional(Type.String()),
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

// get address suggestions
const getAddressSuggestionsQuery = Type.Object({
  address: Type.String(),
});

const getAddressSuggestionsResponse = Type.Array(Address);

export const getAddressSuggestionsSchema = {
  querystring: getAddressSuggestionsQuery,
  response: {
    200: getAddressSuggestionsResponse,
  },
} satisfies FastifySchema;

export type GetAddressSuggestionsSchema = typeof getAddressSuggestionsSchema;

// upload problem image
const uploadProblemImageResponse = Type.Object({
  id: Type.Integer(),
  url: Type.String(),
});

export const uploadProblemImageSchema = {
  // @ts-ignore: ts(2353)
  consumes: ['multipart/form-data'],
  response: {
    201: uploadProblemImageResponse,
  },
} satisfies FastifySchema;

export type UploadProblemImageSchema = typeof uploadProblemImageSchema;

// create problem
const createProblemBody = Type.Object({
  title: Type.String({
    minLength: 1,
    maxLength: 100,
  }),
  description: Type.String({
    minLength: 1,
    maxLength: 4000,
  }),
  address: Type.String({
    minLength: 1,
  }),
  images: Type.Array(Type.Integer()),
});

const createProblemResponse = Type.Object({
  id: Type.Integer(),
});

export const createProblemSchema = {
  body: createProblemBody,
  response: {
    201: createProblemResponse,
  },
} satisfies FastifySchema;

export type CreateProblemSchema = typeof createProblemSchema;

// moderate problem
const moderateProblemParams = Type.Object({
  id: Type.Integer(),
});

const moderateProblemBody = Type.Object({
  decision: Type.Union([
    Type.Literal('approve'),
    Type.Literal('reject'),
  ]),
});

export const moderateProblemSchema = {
  params: moderateProblemParams,
  body: moderateProblemBody,
  response: {
    204: Type.Null(),
  },
} satisfies FastifySchema;

export type ModerateProblemSchema = typeof moderateProblemSchema;

// add comment schema
const addCommentParams = Type.Object({
  id: Type.Integer(),
});

const addSchemaBody = Type.Object({
  content: Type.String({
    minLength: 1,
    maxLength: 2000,
  }),
});

export const addCommentSchema = {
  params: addCommentParams,
  body: addSchemaBody,

  response: {
    201: Comment,
  },
} satisfies FastifySchema;

export type AddCommentSchema = typeof addCommentSchema;

// vote
const voteParams = Type.Object({
  id: Type.Integer(),
});

const voteBody = Type.Object({
  vote: Type.Integer({ minimum: -1, maximum: 1 }),
});

export const voteSchema = {
  params: voteParams,
  body: voteBody,

  response: {
    204: Type.Null(),
  },
} satisfies FastifySchema;

export type VoteSchema = typeof voteSchema;

// solve problem
const solveProblemParams = Type.Object({
  id: Type.Integer(),
});

const solveProblemBody = Type.Object({
  action: Type.Union([
    Type.Literal('claim'),
    Type.Literal('resolve'),
  ]),
});

export const solveProblemSchema = {
  params: solveProblemParams,
  body: solveProblemBody,

  response: {
    204: Type.Null(),
  },
} satisfies FastifySchema;

export type SolveProblemSchema = typeof solveProblemSchema;
