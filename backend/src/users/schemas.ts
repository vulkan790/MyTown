/* eslint-disable @typescript-eslint/no-unused-vars */
import { FastifySchema } from 'fastify';
import { Static, Type } from '@sinclair/typebox';

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

// edit current user
const editCurrentUserBody = Type.Composite([
  Type.Pick(User, ['firstName', 'lastName', 'middleName', 'gender']),
  Type.Object({
    password: Type.Optional(Type.String({ minLength: 6 })),
  }),
]);

export const editCurrentUserSchema = {
  body: editCurrentUserBody,
  response: {
    204: Type.Null(),
  },
} satisfies FastifySchema;

export type EditCurrentUserSchema = typeof editCurrentUserSchema;
export type EditCurrentUserBody = Static<typeof editCurrentUserBody>;

// upload avatar
const uploadUserAvatarErrors = Type.Union([
  Type.Literal('too_large_file'),
  Type.Literal('no_image'),
  Type.Literal('invalid_mime'),
]);

const uploadUserAvatarResponse = Type.Object({
  avatarUrl: Type.String(),
});

export const uploadUserAvatarSchema = {
  // @ts-ignore: ts(2353)
  consumes: ['multipart/form-data'],
  response: {
    201: uploadUserAvatarResponse,
  },
} satisfies FastifySchema;

export type UploadUserAvatarSchema = typeof uploadUserAvatarSchema;
export type UploadUserAvatarErrors = Static<typeof uploadUserAvatarErrors>;
