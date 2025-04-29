import { FastifySchema } from 'fastify';
import { Static, Type } from '@sinclair/typebox';

// регистрация
const registerErrors = Type.Union([
  Type.Literal('email_in_use'),
]);

const registerBody = Type.Object({
  email: Type.String({
    format: 'email',
  }),
  password: Type.String({
    minLength: 6,
  }),

  firstName: Type.String(),
  lastName: Type.String(),
  middleName: Type.Optional(Type.String()),

  gender: Type.Union([
    Type.Literal('male'),
    Type.Literal('female'),
  ]),
});

const registerResponse = Type.Object({
  accessToken: Type.String(),
});

export const registerSchema = {
  body: registerBody,
  response: {
    200: registerResponse,
  },
} satisfies FastifySchema;

export type RegisterErrors = Static<typeof registerErrors>;
export type RegisterBody = Static<typeof registerBody>;
export type RegisterSchema = typeof registerSchema;

// вход
const loginErrors = Type.Union([
  Type.Literal('invalid_credentials'),
]);

const loginBody = Type.Object({
  email: Type.String({
    format: 'email',
  }),
  password: Type.String({
    minLength: 6,
  }),
});

const loginResponse = Type.Object({
  accessToken: Type.String(),
});

export const loginSchema = {
  body: loginBody,
  response: {
    200: loginResponse,
  },
} satisfies FastifySchema;

export type LoginErrors = Static<typeof loginErrors>;
export type LoginBody = Static<typeof loginBody>;
export type LoginSchema = typeof loginSchema;
