import { Resend } from 'resend';
import type { EmailProvider, SendEmailInput } from '../email-provider.js';

export class ResendProvider implements EmailProvider {
  readonly code = 'resend';
  private readonly client: Resend;

  constructor(apiKey: string, private readonly fromEmail: string) {
    this.client = new Resend(apiKey);
  }

  async send(input: SendEmailInput): Promise<void> {
    await this.client.emails.send({
      from: this.fromEmail,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
  }
}
