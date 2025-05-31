import { FastifyInstance } from 'fastify';

import { fromPromise, Result } from 'neverthrow';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';

export const registerEmail = async (fastify: FastifyInstance) => {
  const {
    MAILER_TOKEN,
    EMAIL_FROM,
    VERIFY_EMAIL_TEMPLATE,
    RESET_PASSWORD_TEMPLATE,
  } = fastify.config;

  const mailerSend = new MailerSend({
    apiKey: MAILER_TOKEN,
  });
  const sender = new Sender(EMAIL_FROM);

  const sendVerificationEmail = async (email: string, link: string) => {
    const recipients = [new Recipient(email)];

    const personalization = [
      {
        email: recipients[0].email,
        data: {
          link,
        },
      },
    ];

    const emailParams = new EmailParams()
      .setFrom(sender)
      .setTo(recipients)
      .setReplyTo(sender)
      .setSubject('Регистрация')
      .setTemplateId(VERIFY_EMAIL_TEMPLATE)
      .setPersonalization(personalization);

    const result = await fromPromise(
      mailerSend.email.send(emailParams),
      (e) => e
    );

    if (result.isErr()) {
      console.error('Email sending error:', result.error);
    }

    return result;
  };

  const sendResetPasswordEmail = async (email: string, link: string) => {
    const recipients = [new Recipient(email)];
    const personalization = [{
      email,
      data: { link },
    }];

    const emailParams = new EmailParams()
      .setFrom(sender)
      .setTo(recipients)
      .setReplyTo(sender)
      .setSubject('Сброс пароля')
      .setTemplateId(RESET_PASSWORD_TEMPLATE)
      .setPersonalization(personalization);

    const result = await fromPromise(
      mailerSend.email.send(emailParams),
      (e) => e
    );

    if (result.isErr()) {
      console.error('Email sending error:', result.error);
    }

    return result;
  };

  fastify.decorate('email', {
    sendVerificationEmail,
    sendResetPasswordEmail,
  });
};

declare module 'fastify' {
  interface FastifyInstance {
    email: {
      sendVerificationEmail: (email: string, link: string) => Promise<Result<unknown, unknown>>;
      sendResetPasswordEmail: (email: string, link: string) => Promise<Result<unknown, unknown>>;
    };
  }
}
