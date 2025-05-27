import { Type } from '@sinclair/typebox';

export const EnvironmentSchema = Type.Object({
  DATABASE_CONNECTION: Type.String(),
  PORT: Type.Number({ default: 3000 }),
  JWT_SECRET: Type.String(),
  YANDEX_SUGGEST_API_KEY: Type.String(),
  YANDEX_GEOCODER_API_KEY: Type.String(),

  EMAIL_FROM: Type.String(),
  MAILER_TOKEN: Type.String(),
});
