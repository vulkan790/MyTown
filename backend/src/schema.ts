import { Type } from '@sinclair/typebox';

export const EnvironmentSchema = Type.Object({
  DATABASE_CONNECTION: Type.String(),
  PORT: Type.Number({ default: 3000 }),
  DOMAIN: Type.String(),
  JWT_SECRET: Type.String(),
  YANDEX_SUGGEST_API_KEY: Type.String(),
  YANDEX_GEOCODER_API_KEY: Type.String(),

  EMAIL_FROM: Type.String(),
  MAILER_TOKEN: Type.String(),
  VERIFY_EMAIL_TEMPLATE: Type.String(),
  RESET_PASSWORD_TEMPLATE: Type.String(),
});
