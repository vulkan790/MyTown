import { FastifySchema } from 'fastify';
import { Type } from '@sinclair/typebox';

const UserProblem = Type.Object({
  id: Type.Number(),
  title: Type.String(),
  description: Type.String(),
  latitude: Type.Number(),
  longitude: Type.Number(),
  images: Type.Array(Type.String()),
  status: Type.String(),
  votes: Type.Number(),
  createdAt: Type.String(),
});

const User = Type.Object({
  id: Type.Number(),
  email: Type.String(),

  firstName: Type.String(),
  lastName: Type.String(),
  middleName: Type.String(),
  gender: Type.String(),

  role: Type.String(),
  problems: Type.Array(UserProblem),
});

// get current user
const getCurrentUserResponse = User;

export const getCurrentUserSchema = {
  response: {
    200: getCurrentUserResponse,
  },
} satisfies FastifySchema;

export type GetCurrentUserSchema = typeof getCurrentUserSchema;
