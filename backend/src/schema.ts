import { Type } from '@sinclair/typebox';

export const EnvironmentSchema = Type.Object({
  DATABASE_CONNECTION: Type.String(),
  PORT: Type.Number({ default: 3000 }),
});
