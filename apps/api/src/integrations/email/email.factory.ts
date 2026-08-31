import { logger } from '../../common/logger/logger.js';
import type { Env } from '../../config/env.js';
import type { EmailProvider, SendEmailInput } from './email-provider.js';
import { ResendProvider } from './providers/resend.provider.js';
import { EmailService } from './email.service.js';

class ConsoleEmailProvider implements EmailProvider {
  readonly code = 'console';

  async send(input: SendEmailInput): Promise<void> {
    logger.info(
      { to: input.to, subject: input.subject, text: input.text ?? input.html },
      'Email demo mode — message logged (not sent)',
    );
  }
}

export function createEmailService(env: Env): EmailService {
  const key = env.resendApiKey;
  const from = env.emailFrom;
  if (!env.emailDemoMode && key && !key.startsWith('replace-with') && from) {
    return new EmailService(new ResendProvider(key, from));
  }
  return new EmailService(new ConsoleEmailProvider());
}

export function buildVerifyEmailHtml(verifyUrl: string, code: string) {
  return `
    <p>Confirm your Niðavellir account.</p>
    <p><a href="${verifyUrl}">Verify email</a></p>
    <p>Or enter this code in the app: <strong>${code}</strong></p>
  `;
}

export function buildOrderEmailHtml(orderNumber: string, status: string, total: number) {
  return `
    <p>Your Niðavellir order <strong>${orderNumber}</strong> is now <strong>${status}</strong>.</p>
    <p>Total: ₹${total.toLocaleString('en-IN')}</p>
  `;
}

export function buildResetPasswordHtml(code: string) {
  return `
    <p>Your Niðavellir password reset code is <strong>${code}</strong>.</p>
    <p>It expires in 10 minutes.</p>
  `;
}
